# --- ETAPA 1: "Builder" ---
# Aquí instalamos todo (dev) y generamos el cliente Prisma
FROM node:18-alpine AS builder

# Establecer el directorio de trabajo
WORKDIR /app/backend

# Copiar los archivos de dependencias
COPY package.json package-lock.json* ./

# Instalar TODAS las dependencias (incl. devDependencies)
RUN npm install

# Copiar el esquema de Prisma
COPY prisma/ ./prisma/

# Generar el cliente de Prisma
RUN npx prisma generate

# --- ETAPA 2: "Producción" ---
# Esta es la imagen final que usaremos, es más ligera
FROM node:18-alpine

WORKDIR /app/backend

# Copiar los archivos de dependencias
COPY package.json package-lock.json* ./

# Instalar SOLO dependencias de producción
RUN npm install --omit=dev

# --- Copiar artefactos desde la etapa "builder" ---

# 1. Copiar el cliente Prisma generado y el esquema
COPY --from=builder /app/backend/prisma ./prisma

# 2. Copiar las dependencias instaladas (node_modules)
# (Opcional pero rápido) Si no, puedes descomentar el RUN npm install --omit=dev de arriba
# COPY --from=builder /app/backend/node_modules ./node_modules

# --- Fin de la copia de artefactos ---

# Copiar el resto del código fuente de la aplicación
# (Esto asume que index.js y src/ están en la raíz de /backend)
COPY src ./src
COPY index.js .

# Exponer el puerto en el que corre tu app
# (Asumo que es 3000, ¡ajusta esto si es diferente!)
EXPOSE 3000

# El comando para arrancar tu aplicación
CMD [ "node", "index.js" ]