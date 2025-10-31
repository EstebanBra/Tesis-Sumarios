import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import { probarConexion } from "./src/config/db.js";
import routes from "./src/routes/index.routes.js";       

dotenv.config(); 

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.VITE_API_URL || "http://localhost:5173";

// Middlewares globales
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
app.use(express.json());

app.use(morgan("dev"));

// Ruta raíz
app.get("/", (req, res) => res.send("Servidor backend operativo 🚀"));

// Monta las rutas principales bajo el prefijo /api
app.use("/api", routes);

// 🧪 Prueba de conexión a BD (opcional)
probarConexion();

//  inicio del servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor escuchando en http://localhost:${PORT}`);
  console.log(`🌐 CORS habilitado para: ${FRONTEND_URL}`);
});