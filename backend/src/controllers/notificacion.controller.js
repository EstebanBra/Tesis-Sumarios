// src/controllers/notificacion.controller.js
import {
  obtenerNotificacionesUsuario,
  marcarComoLeida,
  marcarTodasComoLeidas,
  contarNoLeidas,
} from "../services/notificacion.service.js";

/**
 * Obtener notificaciones del usuario autenticado
 */
export async function getNotificaciones(req, res, next) {
  try {
    const userId = req.user.id;
    const { leidas, limit } = req.query;

    const notificaciones = await obtenerNotificacionesUsuario(userId, {
      leidas: leidas === "true" ? true : leidas === "false" ? false : null,
      limit: limit ? Number(limit) : 50,
    });

    res.json({
      data: notificaciones,
      total: notificaciones.length,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Obtener contador de notificaciones no leídas
 */
export async function getContadorNoLeidas(req, res, next) {
  try {
    const userId = req.user.id;
    const count = await contarNoLeidas(userId);
    res.json({ count });
  } catch (err) {
    next(err);
  }
}

/**
 * Marcar una notificación como leída
 */
export async function marcarLeida(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await marcarComoLeida(Number(id), userId);

    if (result.count === 0) {
      return res.status(404).json({ message: "Notificación no encontrada" });
    }

    res.json({ message: "Notificación marcada como leída" });
  } catch (err) {
    next(err);
  }
}

/**
 * Marcar todas las notificaciones como leídas
 */
export async function marcarTodasLeidas(req, res, next) {
  try {
    const userId = req.user.id;
    const result = await marcarTodasComoLeidas(userId);
    res.json({
      message: "Todas las notificaciones marcadas como leídas",
      actualizadas: result.count,
    });
  } catch (err) {
    next(err);
  }
}

