// src/routes/index.js
import { Router } from "express";
import { probarConexion } from "../config/db.js";

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

export default router;
