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


const router = Router();

// GET /api/denuncias?rut=&tipoId=&estadoId=&desde=YYYY-MM-DD&hasta=YYYY-MM-DD&page=1&pageSize=10
router.get("/", listDenunciasRules, listDenuncias);


router.get("/:id", idParamRule, getDenunciaById);


router.post("/", createDenunciaRules, createDenuncia);

router.put("/:id", updateDenunciaRules, updateDenuncia);

router.patch("/:id/estado", changeEstadoRules, changeEstado);

router.delete("/:id", idParamRule, deleteDenuncia);

export default router;