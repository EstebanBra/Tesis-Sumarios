#!/bin/bash

# Script para formatear y validar todo el proyecto
# Uso: ./format-all.sh [--check]

set -e

CHECK_MODE=false
if [ "$1" = "--check" ]; then
  CHECK_MODE=true
fi

echo "🔍 Formateando y validando proyecto..."

# Frontend
echo ""
echo "📦 Frontend..."
cd frontend
if [ "$CHECK_MODE" = true ]; then
  npm run format:check
  npm run lint
else
  npm run format
  npm run lint:fix
fi
cd ..

# Backend
echo ""
echo "📦 Backend..."
cd backend
if [ "$CHECK_MODE" = true ]; then
  npm run format:check
  npm run lint
else
  npm run format
  npm run lint:fix
fi
cd ..

echo ""
echo "✅ ¡Proyecto formateado y validado exitosamente!"

