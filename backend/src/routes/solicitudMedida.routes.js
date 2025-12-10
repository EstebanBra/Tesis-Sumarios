import { Router } from "express";
// Asegúrate de que el nombre del archivo del controlador sea correcto
import {
    createSolicitud,
    listPendientesDirgegen
} from "../controllers/solicitudMedida.controller.js";

// IMPORTANTE: Usamos 'verifyToken' (NO isAuthenticated) porque así se llama en tu auth.middleware.js
import { verifyToken, hasRole } from "../middlewares/auth.middleware.js"; 

const router = Router();

// Ruta para crear (Víctima) - Usa verifyToken
router.post("/medidas", verifyToken, createSolicitud);

// Ruta para listar (Dirgegen) - Usa verifyToken + Rol
router.get("/medidas/pendientes/dirgegen", 
    verifyToken, 
    hasRole(['Dirgegen']), 
    listPendientesDirgegen
);

export default router;