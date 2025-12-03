import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import prisma from "./src/config/prisma.js";
import routes from "./src/routes/index.routes.js";
import authRoutes from "./src/routes/auth.routes.js";
import { runInitialSetup } from "./prisma/seed.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.VITE_API_URL;

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

app.get("/", (req, res) => res.send("Servidor backend operativo 🚀"));
app.use("/api/auth", authRoutes);
app.use("/api", routes);

app.use((err, req, res, next) => {
  console.error("Error:", err);
  const status = err.status || 500;
  res.status(status).json({
    ok: false,
    message: err.message || "Error interno del servidor",
    ...(err.details ? { details: err.details } : {}),
  });
});

(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`; // ping a la BD
    console.log("✅ Prisma conectado a SQL Server");

    // 🚀 Ejecutar seed inicial automáticamente
    await runInitialSetup();
  } catch (e) {
    console.error("❌ Error al conectar o inicializar datos:", e.message);
  }

  app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
    console.log(`CORS habilitado para: ${FRONTEND_URL}`);
  });
})();
