import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import prisma from "./src/config/prisma.js";
import routes from "./src/routes/index.routes.js";
import authRoutes from "./src/routes/auth.routes.js";
import { runInitialSetup } from "./prisma/seed.js";
import { initializeSocket } from "./src/socket/socket.js";

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL;

// Inicializar Socket.io
const io = initializeSocket(server);

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
// Solo mostrar errores en producción, en desarrollo mostrar todo
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : (tokens, req, res) => {
  // Solo mostrar errores (status >= 400)
  const status = res.statusCode;
  if (status >= 400) {
    return [
      tokens.method(req, res),
      tokens.url(req, res),
      tokens.status(req, res),
      tokens.res(req, res, 'content-length'), '-',
      tokens['response-time'](req, res), 'ms'
    ].join(' ');
  }
  return null;
}));

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

  server.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
    console.log(`CORS habilitado`);
    console.log(`🔌 WebSocket habilitado`);
  });
})();
