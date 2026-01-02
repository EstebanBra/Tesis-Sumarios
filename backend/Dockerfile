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
