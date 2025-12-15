import { Router } from "express";
import { crearInformeTecnico, obtenerInforme } from "../controllers/informeTecnico.controller.js";

const router = Router();

router.post('/', crearInformeTecnico);
router.get('/:idDenuncia', obtenerInforme);

export default router;