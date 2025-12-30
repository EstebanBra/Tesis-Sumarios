@echo off
REM Script para descargar MinIO en Windows
REM Descarga el binario de MinIO y lo coloca en la carpeta scripts-infra

echo ========================================
echo Descargando MinIO para Windows
echo ========================================

set MINIO_VERSION=RELEASE.2024-12-13T18-00-19Z
set MINIO_URL=https://dl.min.io/server/minio/release/windows-amd64/archive/minio.%MINIO_VERSION%.exe
set MINIO_EXE=minio.exe
set TARGET_DIR=%~dp0

echo Descargando MinIO desde: %MINIO_URL%
echo.

REM Descargar usando PowerShell
powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%MINIO_URL%' -OutFile '%TARGET_DIR%%MINIO_EXE%'}"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: No se pudo descargar MinIO
    echo Por favor, descarga manualmente desde: https://min.io/download
    pause
    exit /b 1
)

echo.
echo MinIO descargado exitosamente en: %TARGET_DIR%%MINIO_EXE%
echo.
echo Para agregar MinIO al PATH, ejecuta:
echo   setx PATH "%PATH%;%TARGET_DIR%"
echo.
echo O copia minio.exe a una carpeta que ya este en tu PATH
echo.
pause

