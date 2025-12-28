// src/routes/notificaciones.routes.js
import { Router } from "express";
import {
  getNotificaciones,
  getContadorNoLeidas,
  marcarLeida,
  marcarTodasLeidas,
} from "../controllers/notificacion.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { param } from "express-validator";

const router = Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Obtener notificaciones del usuario
router.get("/", getNotificaciones);

// Obtener contador de no leídas
router.get("/contador", getContadorNoLeidas);

// Marcar una notificación como leída
router.patch("/:id/leida", [param("id").isInt({ min: 1 })], marcarLeida);

// Marcar todas como leídas
router.patch("/marcar-todas", marcarTodasLeidas);

export default router;

