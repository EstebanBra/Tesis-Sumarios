// src/routes/index.js
import { Router } from "express";
import { probarConexion } from "../config/db.js";
import denunciaRouter from "./denuncias.routes.js";

const router = Router();

// Endpoint para probar conexión con la BD
router.get("/db", async (req, res) => {
  try {
    const db = await probarConexion();
    res.json({ connected: true, db });
  } catch (error) {
    res.status(500).json({ connected: false, error: error.message });
  }
});


router.use("/denuncias", denunciaRouter);



export default router;
