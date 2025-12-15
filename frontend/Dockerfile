

# --- ETAPA BASE (Común para Dev y Prod) ---
FROM node:22-alpine AS base
WORKDIR /app/frontend
COPY package.json package-lock.json* ./
RUN npm install
COPY . .

# --- ETAPA DE DESARROLLO (Dev) ---
# Esta etapa se detiene aquí y solo ejecuta el servidor de desarrollo
FROM base AS dev
# Exponemos el puerto de Vite
EXPOSE 5173
# Ejecutamos el servidor en modo host para que Docker lo vea
CMD ["npm", "run", "dev", "--", "--host"]

# --- ETAPA DE CONSTRUCCIÓN (Build) ---
# Esta etapa solo corre si vamos a producción
FROM base AS build
RUN npm run build

# --- ETAPA DE PRODUCCIÓN (Nginx) ---
FROM nginx:stable-alpine AS prod
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]