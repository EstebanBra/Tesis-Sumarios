import { defineConfig, env } from "prisma/config";

// Cargar variables de entorno nativamente (Solo Node.js 21.7+)
// El try-catch evita que falle en producción si no existe el archivo .env
try {
  process.loadEnvFile();
} catch (e) {
  // En producción (Docker/Nube) el archivo .env no suele existir,
  // así que ignoramos el error y confiamos en las variables del sistema.
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
