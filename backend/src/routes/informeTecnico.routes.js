import { Router } from "express";
import { crearInformeTecnico, obtenerInforme,actualizarInformeTecnico } from "../controllers/informeTecnico.controller.js";

const router = Router();

router.post('/', crearInformeTecnico);
router.get('/:idDenuncia', obtenerInforme);
router.put('/:idDenuncia', actualizarInformeTecnico);

export default router;