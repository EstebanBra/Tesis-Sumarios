@echo off
REM Script para formatear y validar todo el proyecto en Windows
REM Uso: format-all.bat [--check]

setlocal enabledelayedexpansion

set CHECK_MODE=false
if "%1"=="--check" set CHECK_MODE=true

echo 🔍 Formateando y validando proyecto...

REM Frontend
echo.
echo 📦 Frontend...
cd frontend
if "%CHECK_MODE%"=="true" (
  call npm run format:check
  call npm run lint
) else (
  call npm run format
  call npm run lint:fix
)
cd ..

REM Backend
echo.
echo 📦 Backend...
cd backend
if "%CHECK_MODE%"=="true" (
  call npm run format:check
  call npm run lint
) else (
  call npm run format
  call npm run lint:fix
)
cd ..

echo.
echo ✅ ¡Proyecto formateado y validado exitosamente!

endlocal

