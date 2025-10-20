// backend/index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { probarConexion } from "./src/config/db.js";  // conexión DB
import routes from "./src/routes/index.js";           // rutas API

dotenv.config(); // 🔹 Carga las variables del archivo .env

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales
app.use(cors({
  origin: "http://localhost:5173", // tu front con Vite
  credentials: true
}));
app.use(express.json());

// Ruta raíz (simple)
app.get("/", (req, res) => res.send("Servidor backend operativo 🚀"));

// Importa las rutas desde /src/routes/
app.use("/api", routes);

// Inicia servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor escuchando en http://localhost:${PORT}`);
});
