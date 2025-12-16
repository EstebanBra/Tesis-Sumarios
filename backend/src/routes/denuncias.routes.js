import { Router } from "express";
import {
  listDenuncias,
  getDenunciaById,
  createDenuncia,
  updateDenuncia,
  deleteDenuncia,
  changeEstado,
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

const router = Router();

router.use(verifyToken);


router.get("/", listDenunciasRules, listDenuncias);

router.get("/:id", idParamRule, getDenunciaById);


router.post("/", createDenunciaRules, createDenuncia);

router.put("/:id", updateDenunciaRules, updateDenuncia);

// esto es para el cambio de estado 
router.patch("/:id/estado", verifyToken, hasRole(['Autoridad', 'Fiscal', 'Dirgegen','VRA','VRAE' ]),
 changeEstadoRules, changeEstado
);
// ver bien esto
router.delete("/:id", hasRole(['Admin']), idParamRule, deleteDenuncia);

export default router;