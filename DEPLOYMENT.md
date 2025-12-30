# Guía de Deployment - Sistema de Denuncias

Esta guía describe el proceso de despliegue del sistema en un servidor universitario **sin Docker**.

## Requisitos Previos

- Servidor Linux (Ubuntu 20.04+ recomendado)
- Node.js 18+ instalado
- SQL Server accesible
- Acceso root o sudo
- Puerto 9000 disponible para MinIO (o configurar proxy reverso)

## Estructura del Deployment

```
/srv/tesis-sumarios/
├── backend/          # Aplicación Node.js
├── frontend/         # Aplicación React (build)
├── scripts-infra/    # Scripts de infraestructura
└── minio-data/       # Datos de MinIO (creado por script)
```

## Paso 1: Instalación de MinIO

### Opción A: Usando el Script Automatizado (Recomendado)

1. Copia el script `scripts-infra/setup-minio-prod.sh` al servidor
2. Ejecuta como root:
   ```bash
   sudo bash setup-minio-prod.sh
   ```

3. Inicia el servicio:
   ```bash
   sudo systemctl start minio
   sudo systemctl enable minio  # Para iniciar automáticamente al reiniciar
   ```

4. Verifica que esté corriendo:
   ```bash
   sudo systemctl status minio
   ```

5. Crea el bucket inicial:
   ```bash
   sudo /opt/minio/create-bucket.sh localhost:9000 minioadmin minioadmin evidencia-denuncias
   ```

### Opción B: Instalación Manual

1. Descarga MinIO:
   ```bash
   wget https://dl.min.io/server/minio/release/linux-amd64/minio
   chmod +x minio
   sudo mv minio /usr/local/bin/
   ```

2. Crea usuario y directorios:
   ```bash
   sudo useradd -r -s /bin/false minio
   sudo mkdir -p /var/lib/minio/data
   sudo chown minio:minio /var/lib/minio/data
   ```

3. Crea archivo de configuración `/etc/minio/minio.env`:
   ```bash
   MINIO_ROOT_USER=minioadmin
   MINIO_ROOT_PASSWORD=tu_password_seguro_aqui
   MINIO_VOLUMES="/var/lib/minio/data"
   MINIO_OPTS="--console-address :9001"
   ```

4. Crea servicio systemd `/etc/systemd/system/minio.service`:
   ```ini
   [Unit]
   Description=MinIO Object Storage
   After=network.target

   [Service]
   Type=simple
   User=minio
   Group=minio
   EnvironmentFile=/etc/minio/minio.env
   ExecStart=/usr/local/bin/minio server $MINIO_VOLUMES $MINIO_OPTS
   Restart=always
   RestartSec=5
   LimitNOFILE=65536

   [Install]
   WantedBy=multi-user.target
   ```

5. Inicia el servicio:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable minio
   sudo systemctl start minio
   ```

## Paso 2: Configuración de Variables de Entorno

### Backend

Crea el archivo `backend/.env` basado en `backend/.env.example`:

```env
# Base de datos
DATABASE_URL="sqlserver://usuario:password@servidor:1433;database=nombre_bd;encrypt=true;trustServerCertificate=true"

# Servidor
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://tu-dominio.cl

# JWT
JWT_SECRET=tu_secret_jwt_muy_seguro
JWT_EXPIRES_IN=7d

# MinIO
MINIO_ENDPOINT=localhost          # Endpoint interno del servidor
MINIO_PORT=9000
MINIO_USE_SSL=false               # true si usas proxy con SSL
MINIO_ACCESS_KEY=minioadmin       # Cambiar por credenciales seguras
MINIO_SECRET_KEY=tu_password_seguro
MINIO_BUCKET_NAME=evidencia-denuncias

# IMPORTANTE: Si el puerto 9000 no es accesible desde internet,
# configura un proxy reverso o usa un dominio específico
MINIO_PUBLIC_ENDPOINT=http://tu-servidor:9000
# O si usas proxy con SSL:
# MINIO_PUBLIC_ENDPOINT=https://files.tu-dominio.cl
```

### Frontend

Crea el archivo `.env` en la carpeta `frontend`:

```env
VITE_API_URL=https://api.tu-dominio.cl/api
```

## Paso 3: Configuración de Proxy Reverso (Nginx)

Si el servidor no expone el puerto 9000 directamente, configura Nginx como proxy:

### Para MinIO (Opcional)

Crea `/etc/nginx/sites-available/minio`:

```nginx
server {
    listen 80;
    server_name files.tu-dominio.cl;

    # Redirigir a HTTPS si tienes SSL
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://localhost:9000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Para archivos grandes
        client_max_body_size 200M;
    }
}
```

Habilita el sitio:
```bash
sudo ln -s /etc/nginx/sites-available/minio /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Actualiza `MINIO_PUBLIC_ENDPOINT` en el `.env` del backend:
```env
MINIO_PUBLIC_ENDPOINT=http://files.tu-dominio.cl
```

## Paso 4: Despliegue del Backend

1. Clona o copia el código al servidor:
   ```bash
   cd /srv/tesis-sumarios/backend
   ```

2. Instala dependencias:
   ```bash
   npm install --production
   ```

3. Ejecuta migraciones de Prisma:
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

4. Crea servicio systemd `/etc/systemd/system/tesis-backend.service`:
   ```ini
   [Unit]
   Description=Tesis Sumarios Backend
   After=network.target

   [Service]
   Type=simple
   User=www-data
   WorkingDirectory=/srv/tesis-sumarios/backend
   Environment=NODE_ENV=production
   EnvironmentFile=/srv/tesis-sumarios/backend/.env
   ExecStart=/usr/bin/node index.js
   Restart=always
   RestartSec=10

   [Install]
   WantedBy=multi-user.target
   ```

5. Inicia el servicio:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable tesis-backend
   sudo systemctl start tesis-backend
   ```

6. Verifica logs:
   ```bash
   sudo journalctl -u tesis-backend -f
   ```

## Paso 5: Despliegue del Frontend

1. En tu máquina local, construye el frontend:
   ```bash
   cd frontend
   npm install
   npm run build
   ```

2. Copia la carpeta `dist` al servidor:
   ```bash
   scp -r dist/* usuario@servidor:/srv/tesis-sumarios/frontend/
   ```

3. Configura Nginx para servir el frontend `/etc/nginx/sites-available/tesis-frontend`:
   ```nginx
   server {
       listen 80;
       server_name tu-dominio.cl;

       root /srv/tesis-sumarios/frontend;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       location /api {
           proxy_pass http://localhost:3000/api;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       }
   }
   ```

4. Habilita y recarga:
   ```bash
   sudo ln -s /etc/nginx/sites-available/tesis-frontend /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

## Paso 6: Verificación

1. **MinIO Console**: Accede a `http://tu-servidor:9001` (o dominio configurado)
   - Verifica que el bucket `evidencia-denuncias` existe

2. **Backend API**: 
   ```bash
   curl http://localhost:3000/
   # Debe responder: "Servidor backend operativo 🚀"
   ```

3. **Frontend**: Accede a `http://tu-dominio.cl` y verifica que carga correctamente

4. **Prueba de carga de archivos**:
   - Crea una denuncia de prueba
   - Intenta subir un archivo
   - Verifica que se guarda en MinIO

## Seguridad en Producción

### MinIO

1. **Cambiar credenciales por defecto**:
   ```bash
   sudo nano /etc/minio/minio.env
   # Cambiar MINIO_ROOT_USER y MINIO_ROOT_PASSWORD
   sudo systemctl restart minio
   ```

2. **Configurar firewall** (si es necesario):
   ```bash
   sudo ufw allow 9000/tcp  # Solo si necesitas acceso directo
   sudo ufw allow 9001/tcp  # Console (restringir a IPs internas)
   ```

3. **Usar SSL/TLS** mediante proxy reverso con certificado Let's Encrypt

### Backend

1. **Variables de entorno seguras**: Nunca commitees el archivo `.env`
2. **JWT Secret**: Usa un secret fuerte y único
3. **CORS**: Configura `FRONTEND_URL` correctamente

## Mantenimiento

### Ver logs de MinIO
```bash
sudo journalctl -u minio -f
```

### Ver logs del Backend
```bash
sudo journalctl -u tesis-backend -f
```

### Reiniciar servicios
```bash
sudo systemctl restart minio
sudo systemctl restart tesis-backend
sudo systemctl restart nginx
```

### Backup de MinIO
```bash
# Los datos están en /var/lib/minio/data
# Realiza backup periódico de esta carpeta
tar -czf minio-backup-$(date +%Y%m%d).tar.gz /var/lib/minio/data
```

## Troubleshooting

### MinIO no inicia
- Verifica permisos: `sudo chown -R minio:minio /var/lib/minio/data`
- Revisa logs: `sudo journalctl -u minio -n 50`
- Verifica que el puerto 9000 no esté en uso: `sudo netstat -tulpn | grep 9000`

### Backend no se conecta a MinIO
- Verifica que MinIO esté corriendo: `sudo systemctl status minio`
- Verifica variables de entorno en `.env`
- Revisa logs del backend: `sudo journalctl -u tesis-backend -n 50`

### Archivos no se pueden subir desde el navegador
- Verifica que `MINIO_PUBLIC_ENDPOINT` esté configurado correctamente
- Verifica que el puerto/dominio sea accesible desde internet
- Revisa la consola del navegador para errores CORS

## Soporte

Para problemas adicionales, revisa:
- Logs de MinIO: `sudo journalctl -u minio`
- Logs del Backend: `sudo journalctl -u tesis-backend`
- Logs de Nginx: `sudo tail -f /var/log/nginx/error.log`

