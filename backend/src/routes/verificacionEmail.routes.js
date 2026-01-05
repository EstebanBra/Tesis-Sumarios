import { Router } from "express";
import {
  solicitarCodigoVerificacion,
  verificarCodigoEmail,
} from "../controllers/verificacionEmail.controller.js";
import {
  validateSolicitudCodigo,
  validateVerificacionCodigo,
} from "../validations/verificacionEmail.validations.js";

const router = Router();

// POST /api/verificacion-email/solicitar - Solicitar código de verificación
router.post("/solicitar", validateSolicitudCodigo, solicitarCodigoVerificacion);

// POST /api/verificacion-email/verificar - Verificar código
router.post("/verificar", validateVerificacionCodigo, verificarCodigoEmail);

export default router;
