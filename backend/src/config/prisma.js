// src/config/prisma.js
import { PrismaClient } from "@prisma/client";

// Se crea una única instancia del cliente Prisma
const prisma = new PrismaClient({
  // Esto ayuda a ver las consultas SQL en desarrollo
  log: process.env.NODE_ENV === "development"
    ? ["query", "info", "warn", "error"]
    : ["error"],
});

// Cierra el cliente de forma segura cuando se termina la app
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

export default prisma;
