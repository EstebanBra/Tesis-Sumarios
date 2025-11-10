import { PrismaClient } from "@prisma/client";

// Se crea una única instancia del cliente Prisma
const prisma = new PrismaClient({
  // Configuración de logs
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "info", "warn", "error"]
      : ["error"],

  // 👇 Añadido: opciones de transacción más amplias
  transactionOptions: {
    maxWait: 10000,  // espera máxima antes de iniciar (10 s)
    timeout: 15000,  // duración máxima permitida de la transacción (15 s)
    isolationLevel: "ReadCommitted",
  },
});

// Cierra el cliente de forma segura cuando se termina la app
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

export default prisma;