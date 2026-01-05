import { PrismaClient } from "@prisma/client";

const prismaExternal = new PrismaClient({
  datasources: {
    db: {
      url: process.env.EXTERNAL_DATABASE_URL,
    },
  },
  transactionOptions: {
    maxWait: 20000,
    timeout: 30000,
  },
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "error"]
      : ["error"],
});

export default prismaExternal;
