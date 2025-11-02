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

// GET /api/denuncias/:id
router.get("/:id", idParamRule, getDenunciaById);

// POST /api/denuncias
router.post("/", createDenunciaRules, createDenuncia);

// PUT /api/denuncias/:id
router.put("/:id", updateDenunciaRules, updateDenuncia);

// PATCH /api/denuncias/:id/estado
router.patch("/:id/estado", changeEstadoRules, changeEstado);

// DELETE /api/denuncias/:id
router.delete("/:id", idParamRule, deleteDenuncia);

export default router;