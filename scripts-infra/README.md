# Scripts de Infraestructura - MinIO

Scripts para configurar y ejecutar MinIO sin Docker en diferentes entornos.

## Estructura

- `start-minio.bat` - Inicia MinIO en Windows (desarrollo local)
- `download-minio.bat` - Descarga el binario de MinIO para Windows
- `setup-minio-prod.sh` - Configura MinIO en Linux (producción)

## Uso en Windows (Desarrollo Local)

### Opción 1: MinIO ya instalado

1. Asegúrate de que MinIO esté en tu PATH
2. Ejecuta `start-minio.bat`
3. Accede a:
   - API: http://localhost:9000
   - Console: http://localhost:9001
   - Usuario: minioadmin
   - Password: minioadmin

### Opción 2: Descargar MinIO primero

1. Ejecuta `download-minio.bat` para descargar el binario
2. Agrega MinIO a tu PATH o copia `minio.exe` a una carpeta en tu PATH
3. Ejecuta `start-minio.bat`

## Uso en Linux (Producción)

1. Ejecuta el script como root:
   ```bash
   sudo bash setup-minio-prod.sh
   ```

2. Inicia el servicio:
   ```bash
   sudo systemctl start minio
   ```

3. Verifica el estado:
   ```bash
   sudo systemctl status minio
   ```

4. Crea el bucket inicial:
   ```bash
   sudo /opt/minio/create-bucket.sh localhost:9000 minioadmin minioadmin evidencia-denuncias
   ```

5. **IMPORTANTE**: Cambia las credenciales por defecto en `/etc/minio/minio.env`

## Configuración de Variables de Entorno

Asegúrate de configurar las siguientes variables en tu `.env`:

```env
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=evidencia-denuncias
```

Para producción, ajusta `MINIO_ENDPOINT` al dominio o IP del servidor.

