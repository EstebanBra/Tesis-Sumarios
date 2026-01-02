# 🏗️ Guía Completa: Arquitectura de Contenedores Docker

## 📚 Índice

1. [Explicación Conceptual](#1-explicación-conceptual)
2. [Guía Paso a Paso para Windows](#2-guía-paso-a-paso-para-windows)
3. [Flujo de Datos Completo](#3-flujo-de-datos-completo)

---

## 1. Explicación Conceptual

### 🍳 Los Dockerfiles: "Recetas de Cocina" para Aplicaciones

Imagina que un Dockerfile es como una **receta de cocina** que le dice a Docker exactamente cómo preparar un "plato" (tu aplicación) desde cero. Cada paso es una instrucción que Docker ejecuta en orden.

#### 📦 Dockerfile del Backend

```1:48:backend/Dockerfile
# Node 24 en Alpine Linux 3.23 para una imagen ligera y segura, ademas es la ultima version LTS
# En esta etapa se instalan todas las dependencias, incluyendo las de desarrollo necesarias para generar
# los artefactos de Prisma y que el compose pueda ejecutar las migraciones
FROM node:24-alpine3.23 AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

RUN npx prisma generate

# De la etapa builder, borramos todas las dependencias de desarrollo. Esto se hace para reducir el tamaño de la
# imagen final y mejorar la seguridad.
FROM builder AS production-deps
RUN npm prune --production && \
    npm cache clean --force

# Desde una imagen limpia, se usa un usuario no root para mejorar la seguridad
# Se copian las dependencias instaladas en la paso anterior con permisos para el usuario no root
# Esto evita hacer npm install en la imagen de produccion. Esto reduce el tamaño de la imagen y mejora la seguridad
# Se setea un healtchek y se inicia con dumb-init para manejar correctamente las señales
FROM node:24-alpine3.23 AS production

RUN apk add --no-cache dumb-init

WORKDIR /app

COPY --from=production-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=production-deps --chown=node:node /app/prisma ./prisma

COPY --chown=node:node . .

ENV NODE_ENV=production \
    PORT=3000

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "index.js"]
```

**Analogía de la Receta:**

1. **Etapa 1 - "Preparar los ingredientes" (builder)**:

   - `FROM node:24-alpine3.23` → "Usa una cocina base con Node.js 24"
   - `COPY package*.json` → "Trae la lista de ingredientes (dependencias)"
   - `RUN npm ci` → "Compra e instala todos los ingredientes exactos"
   - `RUN npx prisma generate` → "Prepara las herramientas especiales de Prisma"

2. **Etapa 2 - "Limpiar la cocina" (production-deps)**:

   - `RUN npm prune --production` → "Elimina los ingredientes de desarrollo que no necesitas en producción (como herramientas de testing)"

3. **Etapa 3 - "Servir el plato final" (production)**:
   - `COPY --from=production-deps` → "Copia solo los ingredientes necesarios de la etapa anterior"
   - `COPY . .` → "Copia todo tu código fuente"
   - `USER node` → "Cambia al usuario 'node' (no root) por seguridad"
   - `CMD ["node", "index.js"]` → "¡Sirve el plato! Ejecuta tu aplicación"

**¿Por qué múltiples etapas?** Es como preparar un plato complejo: primero preparas todo, luego limpias lo que no necesitas, y finalmente sirves solo lo esencial. Esto hace la imagen final más pequeña y segura.

#### 🎨 Dockerfile del Frontend

```1:39:frontend/Dockerfile
FROM node:24-alpine3.23 AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci && npm cache clean --force

COPY . .

RUN npm run build

FROM nginx:1.27-alpine AS production

RUN apk add --no-cache dumb-init

COPY nginx.conf /etc/nginx/nginx.conf

COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html

RUN mkdir -p /var/cache/nginx /var/log/nginx /var/run && \
    chown -R nginx:nginx /var/cache/nginx /var/log/nginx /var/run && \
    chmod -R 755 /var/cache/nginx /var/log/nginx /var/run

RUN rm -rf /etc/nginx/conf.d/default.conf

RUN ln -sf /dev/stdout /tmp/access.log && \
    ln -sf /dev/stderr /tmp/error.log

USER nginx

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

ENTRYPOINT ["dumb-init", "--"]

CMD ["nginx", "-g", "daemon off;"]
```

**Analogía de la Receta:**

1. **Etapa 1 - "Cocinar la aplicación" (builder)**:

   - `FROM node:24-alpine3.23` → "Usa la cocina con Node.js"
   - `RUN npm ci` → "Instala ingredientes (dependencias)"
   - `RUN npm run build` → "¡Cocina! Compila React/Vite en archivos estáticos (HTML, CSS, JS)"

2. **Etapa 2 - "Servir en un plato elegante" (production)**:
   - `FROM nginx:1.27-alpine` → "Usa un plato elegante (Nginx) para servir"
   - `COPY --from=builder /app/dist` → "Copia los archivos compilados del paso anterior"
   - `COPY nginx.conf` → "Configura cómo servir el plato (reglas de proxy, seguridad, etc.)"
   - `CMD ["nginx"]` → "¡Sirve! Nginx entrega los archivos estáticos"

**Diferencia clave**: El frontend se "cocina" una vez (build) y luego se sirve como archivos estáticos. El backend se "cocina" cada vez que se ejecuta (es código que corre en tiempo real).

---

### 🎭 docker-compose.prod.yml: El "Director de Orquesta"

Imagina que `docker-compose.prod.yml` es como un **director de orquesta** que coordina a todos los músicos (servicios) para que toquen en armonía. Define quién toca primero, quién espera a quién, y cómo se comunican entre sí.

```6:173:docker-compose.prod.yml
services:
  # Servicio de almacenamiento de objetos S3 compatible con MinIO
  minio:
    image: quay.io/minio/minio:RELEASE.2025-09-07T16-13-09Z
    container_name: app-minio
    restart: unless-stopped
    command: server /data
    expose:
      - "9000"
    environment:
      - MINIO_ROOT_USER=${MINIO_ROOT_USER}
      - MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASSWORD}
      - MINIO_BROWSER=off
    volumes:
      - minio_data:/data
    networks:
      - app-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3

  # Servicio para inicializar MinIO y crear el bucket privado para guardar archivos
  # TODO: Configurar un usuario no root para este servicio es lo ideal.
  minio-init:
    image: quay.io/minio/mc:RELEASE.2025-08-13T08-35-41Z
    container_name: app-minio-init
    depends_on:
      minio:
        condition: service_healthy
    environment:
      MINIO_HOST: minio
      MINIO_PORT: 9000
      MINIO_ALIAS: localminio
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
      BUCKET_NAME: ${MINIO_BUCKET_NAME}
    entrypoint: >-
      /bin/sh -c "
      echo 'Esperando a que MinIO responda...' &&
      until (mc alias set $$MINIO_ALIAS http://$$MINIO_HOST:$$MINIO_PORT $$MINIO_ROOT_USER $$MINIO_ROOT_PASSWORD); do
        echo '...esperando al servidor MinIO...'
        sleep 5
      done &&
      echo 'MinIO detectado.' &&
      echo 'Creando bucket $$BUCKET_NAME si no existe...' &&
      mc mb --ignore-existing $$MINIO_ALIAS/$$BUCKET_NAME &&
      echo 'Configurando bucket como PRIVADO (access: none)...' &&
      mc anonymous set none $$MINIO_ALIAS/$$BUCKET_NAME &&
      echo 'Configuración de MinIO completada exitosamente.'"
    networks:
      - app-network

  # Servicio para ejecutar migraciones de base de datos antes de iniciar el backend
  # Usa el primer stage del Dockerfile del backend para tener todas las dependencias de desarrollo
  # necesarias para ejecutar las migraciones de Prisma.
  migrator:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: builder
    container_name: app-migrator
    restart: "no"
    environment:
      - DATABASE_URL=${DATABASE_URL}
    command: npx prisma migrate deploy
    networks:
      - app-network

  # Servicio del backend de la aplicación
  # En el que debemos tener mas cuidado, ya que maneja los datos sensibles y tiene las claves de acceso a MinIO, base de datos, etc.
  # Para mayor seguridad, el contenedor se ejecuta en modo de solo lectura y con un usuario no root.
  # Además, se limitan las capacidades del contenedor para reducir la superficie de ataque.
  # Aun asi podria ser vulenerable si hay fallos en las dependencias o en el propio codigo de la aplicacion.
  # Por eso es importante mantener las dependencias al minimo y actualizadas, y revisar el codigo regularmente.
  # Nunca se exponen puertos directamente al exterior, solo se comunica con el frontend y otros servicios internos.
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: app-backend
    read_only: true
    tmpfs:
      - /tmp
    restart: unless-stopped
    expose:
      - "3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATABASE_URL=${DATABASE_URL}
      - MINIO_ENDPOINT=${MINIO_ENDPOINT:-minio}
      - MINIO_PORT=${MINIO_PORT:-9000}
      - MINIO_USE_SSL=${MINIO_USE_SSL:-false}
      - MINIO_ACCESS_KEY=${MINIO_ROOT_USER}
      - MINIO_SECRET_KEY=${MINIO_ROOT_PASSWORD}
      - MINIO_BUCKET_NAME=${MINIO_BUCKET_NAME}
    networks:
      - app-network
    depends_on:
      migrator:
        condition: service_completed_successfully
      minio-init:
        condition: service_completed_successfully
      minio:
        condition: service_healthy
    user: "node"
    cap_drop:
      - ALL
    deploy:
      resources:
        limits:
          cpus: "0.50"
          memory: 512M

  # Servicio del frontend de la aplicación
  # Similar al backend, se ejecuta en modo de solo lectura y con un usuario no root.
  # Se limitan las capacidades del contenedor para mayor seguridad.
  # Es el unico que expone un puerto (80) para que los usuarios puedan acceder a la aplicacion web.
  # TODO: Habilitar HTTPS con un proxy inverso como Traefik o Nginx con el certificado SSL adecuado.
  # Al igual que backend puede ser vulnerable si hay fallos en las dependencias o en el propio codigo.
  # Pero eso no es tan critico como en backend, ya que no maneja datos sensibles ni claves de acceso.
  # Se comunica por proxy con el backend para obtener los datos necesarios.
  # En la practica solo se expone un puerto al exterior, lo que reduce mucho la superficie de ataque.
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: app-frontend
    read_only: true
    tmpfs:
      - /tmp:rw,noexec,nosuid,size=256m
    restart: unless-stopped
    ports:
      - "80:8080"
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - app-network
    cap_drop:
      - ALL
    cap_add:
      - CHOWN
      - SETGID
      - SETUID
    logging:
      driver: "json-file"
      options:
        max-size: "10m"

# Se utiliza una red de tipo bridge para la comunicacion entre los servicios
# TODO: Lo ideal en esta arquitectura seria usar una base de datos gestionada aqui adentro, asi podriamos tener distintas
# TODO: redes con internal true para evitar que se conecten a internet directamente.
# TODO: Pero no se si nos veremos obligados a usar una base de datos externa msqlserver.
networks:
  app-network:
    driver: bridge

volumes:
  minio_data:
```

**¿Cómo coordina todo?**

1. **Orden de inicio (dependencias)**:

   - Primero: `minio` (almacenamiento) debe estar "saludable"
   - Segundo: `minio-init` espera a que `minio` esté listo, luego crea el bucket
   - Tercero: `migrator` ejecuta las migraciones de la base de datos
   - Cuarto: `backend` espera a que `migrator` termine y `minio-init` termine
   - Quinto: `frontend` espera a que `backend` esté saludable

2. **Red interna (`app-network`)**:

   - Todos los servicios están en la misma red privada
   - Se comunican usando los nombres de los servicios (ej: `http://backend:3000`)
   - Solo el `frontend` expone un puerto al exterior (80)

3. **Seguridad**:
   - `read_only: true` → El sistema de archivos es de solo lectura
   - `cap_drop: ALL` → Elimina todas las capacidades del sistema operativo
   - `user: "node"` → No ejecuta como root

---

### 🚪 Nginx: El "Recepcionista Inteligente"

Nginx actúa como el **recepcionista de un hotel elegante**. Recibe a todos los visitantes (peticiones HTTP) y los dirige al lugar correcto según lo que necesiten.

```54:108:frontend/nginx.conf
    server {
        listen 8080;
        server_name _;

        root /usr/share/nginx/html;
        index index.html;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' ws: wss:; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';" always;

        add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), usb=(), payment=()" always;

        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        location /api/ {
            proxy_pass http://backend:3000;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_redirect off;
        }

        location /storage/ {
            rewrite ^/storage/(.*) /$1 break;
            proxy_pass http://minio_storage;
            proxy_set_header Host $http_host;
            proxy_http_version 1.1;
            proxy_set_header Connection "";
            proxy_buffering off;
        }

        location ~* \.(?:css|js|jpg|jpeg|gif|png|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            access_log off;
        }

        location / {
            try_files $uri $uri/ /index.html;
            location = /index.html {
                add_header Cache-Control "no-cache, no-store, must-revalidate";
                add_header Pragma "no-cache";
            }
        }
    }
```

**¿Por qué es el "recepcionista"?**

1. **Recibe todas las visitas**: El puerto 80 (mapeado desde 8080) es el único punto de entrada público
2. **Decide a dónde dirigir cada petición**:

   - Si viene a `/api/*` → Lo envía al backend (`http://backend:3000`)
   - Si viene a `/storage/*` → Lo envía a MinIO (`http://minio:9000`)
   - Si viene a archivos estáticos (`.css`, `.js`, imágenes) → Los sirve directamente desde `/usr/share/nginx/html`
   - Si viene a cualquier otra ruta → Sirve `index.html` (para que React Router funcione)

3. **Añade seguridad**: Headers de seguridad (CSP, X-Frame-Options, etc.) en todas las respuestas

4. **Optimiza**: Comprime archivos (gzip), cachea recursos estáticos, etc.

**Ventajas de esta arquitectura**:

- El backend nunca se expone directamente al internet (más seguro)
- Un solo punto de entrada simplifica la configuración de firewall
- Nginx es muy eficiente sirviendo archivos estáticos
- El frontend puede hacer peticiones a `/api/...` sin problemas de CORS (mismo origen)

---

## 2. Guía Paso a Paso para Windows

### 📋 Prerrequisitos

1. **Docker Desktop para Windows** instalado y corriendo
2. **PowerShell** (viene con Windows)
3. Acceso a la VPN para conectarse a SQL Server (si es necesario)

### 🔧 Paso 1: Preparar los archivos .env

Necesitas crear un archivo `.env` en la raíz del proyecto con las siguientes variables:

```powershell
# Navega a la raíz del proyecto
cd C:\Users\esteb\Documents\Tesis-Sumarios\Tesis-Sumarios

# Crea el archivo .env (si no existe)
if (-not (Test-Path .env)) {
    New-Item -Path .env -ItemType File
}
```

Abre el archivo `.env` y agrega estas variables (ajusta los valores según tu entorno):

```env
# Base de datos SQL Server (a través de VPN)
DATABASE_URL="sqlserver://usuario:contraseña@servidor:puerto;database=nombre_bd;encrypt=true;trustServerCertificate=true"

# MinIO - Credenciales de acceso
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin_seguro_cambiar
MINIO_BUCKET_NAME=evidencia-denuncias

# MinIO - Configuración de conexión (el backend se conecta internamente)
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_USE_SSL=false

# Frontend URL (para CORS, si es necesario)
FRONTEND_URL=http://localhost
```

**⚠️ Importante**:

- Cambia `MINIO_ROOT_PASSWORD` por una contraseña segura
- Ajusta `DATABASE_URL` con tus credenciales reales de SQL Server
- Si tu SQL Server está en la VPN, asegúrate de estar conectado antes de levantar los contenedores

### 🗄️ Paso 2: Entender MinIO en Producción

**¿Qué es MinIO?**
MinIO es como un "Dropbox privado" para tu aplicación. Almacena archivos (evidencias, documentos) de forma similar a Amazon S3, pero corriendo en tus propios servidores.

**Flujo de MinIO en docker-compose.prod.yml:**

1. **Servicio `minio`**:

   - Inicia el servidor MinIO en el puerto 9000 (solo expuesto internamente)
   - Almacena archivos en el volumen `minio_data`
   - Tiene un healthcheck que verifica que esté funcionando

2. **Servicio `minio-init`**:

   - Espera a que `minio` esté saludable
   - Se conecta usando las credenciales (`MINIO_ROOT_USER` y `MINIO_ROOT_PASSWORD`)
   - Crea el bucket `evidencia-denuncias` si no existe
   - Configura el bucket como **PRIVADO** (solo accesible con credenciales)

3. **Backend se conecta a MinIO**:

   - El backend usa el SDK de MinIO para subir/descargar archivos
   - Se conecta usando `MINIO_ENDPOINT=minio` (nombre del servicio en Docker)
   - Genera URLs "presigned" (temporales) para que el frontend pueda subir/descargar archivos sin exponer las credenciales

4. **Frontend accede a MinIO a través de Nginx**:
   - Cuando el frontend necesita un archivo, hace una petición a `/storage/nombre-archivo`
   - Nginx reescribe la URL y la envía a MinIO
   - MinIO valida la petición y devuelve el archivo

**Flujo completo de subida de archivo:**

```
Usuario selecciona archivo
    ↓
Frontend → POST /api/storage/upload → Backend
    ↓
Backend genera URL presigned de MinIO
    ↓
Backend → Devuelve URL presigned al Frontend
    ↓
Frontend → PUT [URL presigned] → MinIO (directamente)
    ↓
MinIO almacena el archivo
    ↓
Frontend → POST /api/storage/confirm → Backend (guarda referencia en BD)
```

### 🚀 Paso 3: Comandos PowerShell para Levantar el Sistema

```powershell
# 1. Navega a la raíz del proyecto
cd C:\Users\esteb\Documents\Tesis-Sumarios\Tesis-Sumarios

# 2. Verifica que Docker Desktop esté corriendo
docker ps

# 3. (Opcional) Si tienes contenedores corriendo, detén todo
docker-compose -f docker-compose.prod.yml down

# 4. Construye las imágenes (esto puede tardar varios minutos la primera vez)
docker-compose -f docker-compose.prod.yml build

# 5. Levanta todos los servicios
docker-compose -f docker-compose.prod.yml up -d

# 6. Verifica que todos los servicios estén corriendo
docker-compose -f docker-compose.prod.yml ps

# 7. (Opcional) Ver los logs en tiempo real
docker-compose -f docker-compose.prod.yml logs -f

# 8. (Opcional) Ver logs de un servicio específico
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f minio
```

**Comandos útiles adicionales:**

```powershell
# Detener todos los servicios
docker-compose -f docker-compose.prod.yml down

# Detener y eliminar volúmenes (⚠️ esto borra los datos de MinIO)
docker-compose -f docker-compose.prod.yml down -v

# Reconstruir solo un servicio específico
docker-compose -f docker-compose.prod.yml build backend

# Reiniciar un servicio específico
docker-compose -f docker-compose.prod.yml restart backend

# Ver el estado de salud de los servicios
docker-compose -f docker-compose.prod.yml ps
```

### 🖥️ Paso 4: Verificar en Docker Desktop

1. **Abre Docker Desktop**
2. **Ve a la pestaña "Containers"**
3. **Deberías ver estos contenedores corriendo**:

   - `app-minio` (estado: Running, puerto: 9000)
   - `app-minio-init` (estado: Exited - esto es normal, solo se ejecuta una vez)
   - `app-migrator` (estado: Exited - esto es normal, solo se ejecuta una vez)
   - `app-backend` (estado: Running, puerto: 3000 interno)
   - `app-frontend` (estado: Running, puerto: 80:8080)

4. **Verifica los logs**:
   - Haz clic en cada contenedor para ver sus logs
   - `app-backend` debería mostrar: "✅ Prisma conectado a SQL Server"
   - `app-frontend` debería estar escuchando en el puerto 8080

### 🌐 Paso 5: Probar en el Navegador

1. **Abre tu navegador** y ve a: `http://localhost`

2. **Verifica que el frontend carga**:

   - Deberías ver la página de login o la aplicación
   - Abre las herramientas de desarrollador (F12)
   - Ve a la pestaña "Network" (Red)
   - Recarga la página
   - Deberías ver peticiones a archivos estáticos (`.js`, `.css`, etc.) con status 200

3. **Prueba la comunicación con el backend**:

   - Intenta hacer login o cualquier acción que requiera el backend
   - En la pestaña "Network", busca peticiones a `/api/...`
   - Deberían tener status 200 (éxito) o 401/403 (si no estás autenticado)
   - Si ves errores de conexión, verifica los logs del backend

4. **Prueba el healthcheck**:

   - Ve a: `http://localhost/health`
   - Deberías ver: "healthy"
   - Ve a: `http://localhost/api/health` (si existe)
   - Debería responder con el healthcheck del backend

5. **Verifica que Nginx está funcionando como proxy**:
   - En las herramientas de desarrollador, ve a "Network"
   - Haz una petición que vaya al backend (ej: login)
   - Inspecciona la petición: debería ir a `http://localhost/api/auth/login`
   - El backend nunca se expone directamente, todo pasa por Nginx

---

## 2.5. Guía Paso a Paso para macOS

### 📋 Prerrequisitos

1. **Docker Desktop para Mac** instalado y corriendo
2. **Terminal** (Terminal.app o iTerm2) con bash o zsh
3. Acceso a la VPN para conectarse a SQL Server (si es necesario)

### 🔧 Paso 1: Preparar los archivos .env

Necesitas crear un archivo `.env` en la raíz del proyecto con las siguientes variables:

```bash
# Navega a la raíz del proyecto (ajusta la ruta según tu ubicación)
cd ~/Documents/Tesis-Sumarios/Tesis-Sumarios

# Crea el archivo .env (si no existe)
if [ ! -f .env ]; then
    touch .env
fi

# Abre el archivo en tu editor favorito
open -e .env
# O si prefieres usar nano:
# nano .env
# O si prefieres usar vim:
# vim .env
```

Abre el archivo `.env` y agrega estas variables (ajusta los valores según tu entorno):

```env
# Base de datos SQL Server (a través de VPN)
DATABASE_URL="sqlserver://usuario:contraseña@servidor:puerto;database=nombre_bd;encrypt=true;trustServerCertificate=true"

# MinIO - Credenciales de acceso
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin_seguro_cambiar
MINIO_BUCKET_NAME=evidencia-denuncias

# MinIO - Configuración de conexión (el backend se conecta internamente)
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_USE_SSL=false

# Frontend URL (para CORS, si es necesario)
FRONTEND_URL=http://localhost
```

**⚠️ Importante**:

- Cambia `MINIO_ROOT_PASSWORD` por una contraseña segura
- Ajusta `DATABASE_URL` con tus credenciales reales de SQL Server
- Si tu SQL Server está en la VPN, asegúrate de estar conectado antes de levantar los contenedores
- En Mac, las rutas de archivos usan `/` en lugar de `\`

### 🗄️ Paso 2: Entender MinIO en Producción

_(La explicación de MinIO es idéntica a Windows - ver sección anterior)_

### 🚀 Paso 3: Comandos de Terminal para Levantar el Sistema

```bash
# 1. Navega a la raíz del proyecto (ajusta la ruta según tu ubicación)
cd ~/Documents/Tesis-Sumarios/Tesis-Sumarios

# 2. Verifica que Docker Desktop esté corriendo
docker ps

# 3. (Opcional) Si tienes contenedores corriendo, detén todo
docker-compose -f docker-compose.prod.yml down

# 4. Construye las imágenes (esto puede tardar varios minutos la primera vez)
docker-compose -f docker-compose.prod.yml build

# 5. Levanta todos los servicios
docker-compose -f docker-compose.prod.yml up -d

# 6. Verifica que todos los servicios estén corriendo
docker-compose -f docker-compose.prod.yml ps

# 7. (Opcional) Ver los logs en tiempo real
docker-compose -f docker-compose.prod.yml logs -f

# 8. (Opcional) Ver logs de un servicio específico
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f minio
```

**Comandos útiles adicionales:**

```bash
# Detener todos los servicios
docker-compose -f docker-compose.prod.yml down

# Detener y eliminar volúmenes (⚠️ esto borra los datos de MinIO)
docker-compose -f docker-compose.prod.yml down -v

# Reconstruir solo un servicio específico
docker-compose -f docker-compose.prod.yml build backend

# Reiniciar un servicio específico
docker-compose -f docker-compose.prod.yml restart backend

# Ver el estado de salud de los servicios
docker-compose -f docker-compose.prod.yml ps

# Ver el uso de recursos
docker stats

# Limpiar imágenes y contenedores no utilizados (liberar espacio)
docker system prune -a
```

**💡 Tip para Mac**: Si tienes problemas con permisos en el puerto 80, puedes:

- Usar `sudo` (no recomendado para desarrollo)
- Cambiar el puerto en `docker-compose.prod.yml` de `80:8080` a `8080:8080` y acceder a `http://localhost:8080`

### 🖥️ Paso 4: Verificar en Docker Desktop

1. **Abre Docker Desktop** (debería estar en tu barra de menú o Aplicaciones)
2. **Ve a la pestaña "Containers"**
3. **Deberías ver estos contenedores corriendo**:

   - `app-minio` (estado: Running, puerto: 9000)
   - `app-minio-init` (estado: Exited - esto es normal, solo se ejecuta una vez)
   - `app-migrator` (estado: Exited - esto es normal, solo se ejecuta una vez)
   - `app-backend` (estado: Running, puerto: 3000 interno)
   - `app-frontend` (estado: Running, puerto: 80:8080)

4. **Verifica los logs**:
   - Haz clic en cada contenedor para ver sus logs
   - `app-backend` debería mostrar: "✅ Prisma conectado a SQL Server"
   - `app-frontend` debería estar escuchando en el puerto 8080

### 🌐 Paso 5: Probar en el Navegador

_(Las instrucciones son idénticas a Windows - ver sección anterior)_

### 🔍 Diferencias Clave entre Windows y macOS

| Aspecto             | Windows                  | macOS                                    |
| ------------------- | ------------------------ | ---------------------------------------- |
| **Terminal**        | PowerShell               | Terminal.app / iTerm2 (bash/zsh)         |
| **Rutas**           | `C:\Users\...`           | `~/Documents/...` o `/Users/...`         |
| **Crear archivo**   | `New-Item -Path .env`    | `touch .env`                             |
| **Editor de texto** | Notepad                  | `open -e .env` o `nano .env`             |
| **Puerto 80**       | Generalmente accesible   | Puede requerir `sudo` o cambio de puerto |
| **VPN**             | Configuración de Windows | Configuración de macOS (similar)         |
| **Docker Desktop**  | Versión para Windows     | Versión para Mac (Intel o Apple Silicon) |

**⚠️ Nota sobre Apple Silicon (M1/M2/M3)**:

- Docker Desktop para Mac funciona perfectamente en Macs con chip Apple Silicon
- Las imágenes de Docker se ejecutan sin problemas (Docker usa emulación automática si es necesario)
- El rendimiento es excelente, incluso con emulación

**⚠️ Nota sobre el puerto 80 en macOS**:

- En macOS, el puerto 80 puede estar restringido o en uso
- Si tienes problemas, puedes modificar `docker-compose.prod.yml`:
  ```yaml
  ports:
    - '8080:8080' # En lugar de "80:8080"
  ```
- Luego accede a `http://localhost:8080` en lugar de `http://localhost`

---

## 3. Flujo de Datos Completo

### 🔄 Ejemplo: "Identificar un Denunciado"

Imagina que estás en el formulario de nueva denuncia y haces clic en "Agregar Denunciado". Este es el camino que sigue la petición:

#### **Paso 1: El Clic en el Frontend**

```
Usuario hace clic en "Agregar Denunciado"
    ↓
React ejecuta la función handleSubmit()
    ↓
Frontend valida los datos localmente
    ↓
Frontend hace: POST http://localhost/api/denuncias/.../denunciados
```

**Código relevante** (simplificado):

```typescript
// frontend/src/services/denuncias.api.ts
const response = await http('/api/denuncias/123/denunciados', {
  method: 'POST',
  body: { nombre: 'Juan Pérez', rut: '12345678-9' },
});
```

#### **Paso 2: Nginx Recibe la Petición**

```
Petición llega a: http://localhost/api/denuncias/.../denunciados
    ↓
Nginx (puerto 80) recibe la petición
    ↓
Nginx ve que la ruta empieza con /api/
    ↓
Nginx reescribe y envía a: http://backend:3000/denuncias/.../denunciados
```

**Configuración de Nginx**:

```74:84:frontend/nginx.conf
        location /api/ {
            proxy_pass http://backend:3000;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_redirect off;
        }
```

**Nota importante**: `backend:3000` es el nombre del servicio en Docker. Docker resuelve este nombre a la IP interna del contenedor automáticamente.

#### **Paso 3: Backend Procesa la Petición**

```
Backend (Node.js/Express) recibe la petición
    ↓
Middleware de autenticación verifica el token (cookie/session)
    ↓
Middleware de validación valida los datos
    ↓
Controller llama al Service
    ↓
Service usa Prisma para interactuar con la base de datos
```

**Código relevante** (simplificado):

```javascript
// backend/src/controllers/denuncia.controller.js
export async function addDenunciado(req, res, next) {
  // Validación y autenticación ya pasaron
  const result = await denunciaService.addDenunciado(req.params.id, req.body);
  res.json(result);
}
```

#### **Paso 4: Prisma se Conecta a SQL Server**

```
Prisma Client ejecuta la query
    ↓
Prisma usa DATABASE_URL del .env
    ↓
Conexión sale del contenedor backend
    ↓
Atraviesa la red de Docker
    ↓
Sale por la interfaz de red de tu PC
    ↓
Atraviesa la VPN (si está configurada)
    ↓
Llega al servidor SQL Server
    ↓
SQL Server ejecuta: INSERT INTO Datos_Denunciado ...
    ↓
SQL Server devuelve el resultado
    ↓
Prisma recibe los datos
```

**Configuración de Prisma**:

```1:24:backend/src/config/prisma.js
import { PrismaClient } from "@prisma/client";

// Se crea una única instancia del cliente Prisma
const prisma = new PrismaClient({
  // Configuración de logs
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "info", "warn", "error"]
      : ["error"],

  // 👇 Añadido: opciones de transacción más amplias
  transactionOptions: {
    maxWait: 10000,  // espera máxima antes de iniciar (10 s)
    timeout: 15000,  // duración máxima permitida de la transacción (15 s)
    isolationLevel: "ReadCommitted",
  },
});

// Cierra el cliente de forma segura cuando se termina la app
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

export default prisma;
```

**⚠️ Importante sobre la VPN**:

- El contenedor Docker usa la red de tu PC
- Si SQL Server está en una VPN, tu PC debe estar conectado a la VPN
- Docker no maneja la VPN directamente, usa la conexión de red de Windows

#### **Paso 5: Respuesta de Vuelta**

```
SQL Server → Prisma → Service → Controller
    ↓
Controller genera respuesta JSON
    ↓
Express envía respuesta HTTP
    ↓
Nginx recibe la respuesta del backend
    ↓
Nginx añade headers de seguridad
    ↓
Nginx envía respuesta al navegador
    ↓
Frontend recibe la respuesta
    ↓
React actualiza el estado y la UI
```

### 📊 Diagrama Visual del Flujo

```
┌─────────────┐
│   Usuario   │
│  (Navegador)│
└──────┬──────┘
       │ 1. POST /api/denuncias/.../denunciados
       │    { nombre: "Juan", rut: "123..." }
       ↓
┌─────────────────────────────────────┐
│         Nginx (Puerto 80)           │
│  "Recepcionista" - Recibe todo      │
└──────┬──────────────────────────────┘
       │ 2. Reenvía a backend:3000
       │    (mismo path, sin /api/)
       ↓
┌─────────────────────────────────────┐
│      Backend (Puerto 3000)          │
│  - Auth Middleware                  │
│  - Validation                       │
│  - Controller                       │
│  - Service                          │
└──────┬──────────────────────────────┘
       │ 3. Prisma Client
       │    INSERT INTO Datos_Denunciado...
       ↓
┌─────────────────────────────────────┐
│   Red de Windows + VPN              │
│   (si SQL Server está en VPN)      │
└──────┬──────────────────────────────┘
       │ 4. Conexión TCP/IP
       │    sqlserver://usuario:pass@servidor:puerto
       ↓
┌─────────────────────────────────────┐
│      SQL Server (Externo)           │
│  - Ejecuta query                    │
│  - Devuelve resultado               │
└─────────────────────────────────────┘
       │ 5. Respuesta JSON
       │    { ok: true, data: {...} }
       ↓
┌─────────────────────────────────────┐
│      Backend → Nginx → Navegador    │
│  (mismo camino de vuelta)            │
└─────────────────────────────────────┘
```

### 🔐 Consideraciones de Seguridad

1. **Backend nunca expuesto directamente**: Solo Nginx habla con el internet
2. **MinIO privado**: Solo el backend tiene credenciales, el frontend usa URLs presigned temporales
3. **Base de datos externa**: SQL Server está fuera de Docker, accesible solo a través de VPN
4. **Contenedores en modo solo lectura**: Reducen el riesgo si alguien compromete un contenedor
5. **Usuario no root**: Los contenedores corren con usuarios limitados

---

## 🎓 Resumen de Conceptos Clave

1. **Dockerfile**: Receta que define cómo construir una imagen (como preparar un plato)
2. **docker-compose**: Director que coordina múltiples contenedores (como un director de orquesta)
3. **Nginx**: Recepcionista que recibe todas las peticiones y las dirige correctamente
4. **MinIO**: Almacenamiento de archivos privado (como Dropbox interno)
5. **Red Docker**: Red privada donde los contenedores se comunican usando nombres de servicio
6. **Healthchecks**: Verificaciones automáticas de que los servicios están funcionando
7. **Dependencias**: Docker Compose espera a que los servicios estén listos antes de iniciar otros

---

## 🆘 Troubleshooting Común

### Problema: "Cannot connect to SQL Server"

**Solución**: Verifica que:

- Estás conectado a la VPN
- La `DATABASE_URL` en `.env` es correcta
- El servidor SQL Server permite conexiones desde tu IP

### Problema: "MinIO connection refused"

**Solución**: Verifica que:

- El servicio `minio` está corriendo: `docker ps | grep minio`
- Las credenciales en `.env` coinciden con las de `minio-init`

### Problema: "Frontend no carga"

**Solución**: Verifica que:

- El puerto 80 no está ocupado por otro servicio
- Los logs del frontend: `docker-compose -f docker-compose.prod.yml logs frontend`

### Problema: "Backend no responde"

**Solución**: Verifica que:

- El backend está saludable: `docker-compose -f docker-compose.prod.yml ps`
- Los logs del backend: `docker-compose -f docker-compose.prod.yml logs backend`
- El migrator terminó exitosamente: `docker-compose -f docker-compose.prod.yml logs migrator`

---

¡Espero que esta guía te haya ayudado a entender la arquitectura! Si tienes dudas, no dudes en preguntar. 🚀
