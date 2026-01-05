import { Router } from "express";
import { buscarPorRut } from "../controllers/datosExternos.controller.js";
import { validateRutParam } from "../validations/datosExternos.validations.js";

const router = Router();

router.get("/:rut", validateRutParam, buscarPorRut);

export default router;
