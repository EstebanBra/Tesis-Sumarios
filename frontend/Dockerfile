# --- ETAPA 1: "Builder" (Node.js + Vite) ---
# Usamos la misma versión de node para consistencia
FROM node:18-alpine AS builder

# Establecer el directorio de trabajo
WORKDIR /app/frontend

# Copiar archivos de dependencias y optimizar caché
COPY package.json package-lock.json* ./
RUN npm install

# Copiar todo el resto del código fuente
# (src, public, vite.config.ts, tsconfig.json, etc.)
COPY . .

# Ejecutar el build de Vite para generar los archivos estáticos
RUN npm run build
# Ahora, existe una carpeta /app/frontend/dist con nuestro sitio

# --- ETAPA 2: "Producción" (Servidor Nginx) ---
# Nginx es un servidor web muy ligero y de alto rendimiento
FROM nginx:stable-alpine

# Eliminar la configuración por defecto de Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copiar nuestro archivo de configuración personalizado (que crearemos abajo)
# Este archivo es el que habilita el enrutamiento de React (SPA)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los archivos estáticos construidos desde la etapa "builder"
# al directorio web raíz por defecto de Nginx
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Exponer el puerto 80 (puerto estándar en el que Nginx escucha)
EXPOSE 80

# El CMD por defecto de la imagen de Nginx se encarga de arrancar el servidor