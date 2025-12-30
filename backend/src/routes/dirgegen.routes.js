// routes/gestion.routes.js
import { Router } from "express";
import { derivarDenuncia, identificarDenunciado } from "../controllers/dirgegen.controller.js";
import { verifyToken, hasRole } from "../middlewares/auth.middleware.js";
import { derivarDenunciaRules, identificarDenunciadoRules } from "../validations/dirgegen.validation.js";

const router = Router();

// Rutas de DIRGEGEN
router.patch("/denuncias/:id/derivar", verifyToken, hasRole(['Dirgegen']), derivarDenunciaRules, derivarDenuncia);

// Ruta para identificar denunciados (Dirgegen y Revisor)
router.put(
  "/denunciados/:idDatosDenunciado/identificar", 
  verifyToken, 
  hasRole(['Dirgegen', 'REVISOR', 'Revisor']), 
  identificarDenunciadoRules, 
  identificarDenunciado
);

export default router;