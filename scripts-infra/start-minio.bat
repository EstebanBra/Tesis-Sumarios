@echo off
REM Script para iniciar MinIO en Windows (Desarrollo Local)
REM Este script configura e inicia el servidor MinIO apuntando a una carpeta local

echo ========================================
echo Iniciando MinIO - Servidor Local
echo ========================================

REM Configurar variables de entorno para MinIO
set MINIO_ROOT_USER=minioadmin
set MINIO_ROOT_PASSWORD=minioadmin

REM Crear carpeta de datos si no existe
if not exist "minio-data" (
    echo Creando carpeta de datos: minio-data
    mkdir minio-data
)

REM Verificar si MinIO está instalado
where minio >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: MinIO no se encuentra en el PATH
    echo.
    echo Por favor, descarga MinIO desde: https://min.io/download
    echo O ejecuta el script download-minio.bat para descargarlo automaticamente
    echo.
    pause
    exit /b 1
)

echo.
echo Configuracion:
echo   - Usuario: %MINIO_ROOT_USER%
echo   - Puerto API: 9000
echo   - Puerto Console: 9001
echo   - Carpeta de datos: %CD%\minio-data
echo.
echo Iniciando servidor MinIO...
echo.
echo Acceso:
echo   - API: http://localhost:9000
echo   - Console: http://localhost:9001
echo   - Usuario: %MINIO_ROOT_USER%
echo   - Password: %MINIO_ROOT_PASSWORD%
echo.
echo Presiona Ctrl+C para detener el servidor
echo.

REM Iniciar MinIO
minio server minio-data --console-address ":9001"

pause

