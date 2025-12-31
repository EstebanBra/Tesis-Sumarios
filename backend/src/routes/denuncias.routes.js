import { Router } from "express";
import {
  listDenuncias,
  getDenunciaById,
  createDenuncia,
  updateDenuncia,
  deleteDenuncia,
  changeEstado,
  subirEvidenciaDenuncia,
} from "../controllers/denuncia.controller.js";

import {
  createDenunciaRules,
  updateDenunciaRules,
  idParamRule,
  listDenunciasRules,
  changeEstadoRules,
} from "../validations/denuncia.validation.js";


// IMPORTANTE: Traer los middlewares de seguridad
import { verifyToken, hasRole } from "../middlewares/auth.middleware.js";
import { uploadMultipleFiles } from "../middlewares/upload.middleware.js";
import { parseFormDataJson } from "../middlewares/parseFormData.middleware.js";

const router = Router();

router.use(verifyToken);


router.get("/", listDenunciasRules, listDenuncias);

router.get("/:id", idParamRule, getDenunciaById);


// Ruta para crear denuncia con soporte para archivos adjuntos
// Orden de middlewares:
// 1. uploadMultipleFiles: procesa archivos y los deja en req.files
// 2. parseFormDataJson: parsea el JSON del campo 'data' si viene FormData
// 3. createDenunciaRules: valida los datos parseados
// 4. createDenuncia: crea la denuncia
router.post("/", uploadMultipleFiles, parseFormDataJson, createDenunciaRules, createDenuncia);

// Ruta para subir evidencias a una denuncia existente
router.post("/:id/evidencia", idParamRule, subirEvidenciaDenuncia);

router.put("/:id", updateDenunciaRules, updateDenuncia);

// esto es para el cambio de estado 
router.patch("/:id/estado", verifyToken, hasRole(['Autoridad', 'Fiscal', 'Dirgegen','VRA','VRAE' ]),
 changeEstadoRules, changeEstado
);
// Ruta de gestión (usada por Dirgegen y VRA para derivar)
router.patch("/:id/gestionar", verifyToken, hasRole(['Dirgegen', 'VRA', 'VRAE']), idParamRule, updateDenuncia);
// ver bien esto
router.delete("/:id", hasRole(['Admin']), idParamRule, deleteDenuncia);

export default router;