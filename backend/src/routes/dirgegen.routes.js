// routes/gestion.routes.js
import { Router } from "express";
import { body, param } from "express-validator";
import { derivarDenuncia } from "../controllers/dirgegen.controller.js";
import { verifyToken, hasRole } from "../middlewares/auth.middleware.js";

const router = Router();

// aca esta por mientras despues colocar en el validation.js
const derivarRules = [
  param("id").isInt().withMessage("El ID debe ser un número entero"),
  body("nuevoTipoId").isInt().withMessage("Debe indicar el nuevo tipo de denuncia"),
  body("nuevoEstadoId").isInt().withMessage("Debe indicar el estado inicial de la nueva unidad"),
 
];

// solo esto por ahora despues vendria el formulario y eso creo !!!!! no olvidar preguntar 
router.patch("/denuncias/:id/derivar", verifyToken, hasRole(['Dirgegen']), derivarRules, derivarDenuncia);
export default router;