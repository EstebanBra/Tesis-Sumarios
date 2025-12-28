// src/socket/socket.js
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { JWT_SECRET, COOKIE_NAME } from "../config/auth.config.js";

let ioInstance = null;

/**
 * Inicializa Socket.io y configura autenticación
 */
export function initializeSocket(server) {
  ioInstance = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  // Middleware de autenticación para Socket.io
  ioInstance.use((socket, next) => {
    // Intentar obtener token de diferentes fuentes
    let token = socket.handshake.auth.token || 
                socket.handshake.headers.authorization?.replace("Bearer ", "");
    
    // Si no está en auth, buscar en cookies
    if (!token && socket.handshake.headers.cookie) {
      const cookies = socket.handshake.headers.cookie.split(';');
      const tokenCookie = cookies.find(c => c.trim().startsWith(`${COOKIE_NAME}=`));
      if (tokenCookie) {
        token = tokenCookie.split('=')[1]?.trim();
      }
    }

    if (!token) {
      return next(new Error("No se proporcionó token de autenticación"));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRoles = decoded.roles || [];
      next();
    } catch (error) {
      console.error("Error verificando token en socket:", error.message);
      next(new Error("Token inválido"));
    }
  });

  ioInstance.on("connection", (socket) => {
    console.log(`🔌 Usuario conectado: ${socket.userId}`);

    // Unirse a la sala del usuario para recibir notificaciones personalizadas
    socket.join(`user_${socket.userId}`);

    // Evento para marcar notificación como leída
    socket.on("marcar_leida", async (data) => {
      try {
        const { notificacionId } = data;
        // Aquí podrías llamar al servicio para marcar como leída
        // Por ahora solo confirmamos
        socket.emit("notificacion_leida", { notificacionId });
      } catch (error) {
        socket.emit("error", { message: "Error al marcar notificación como leída" });
      }
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Usuario desconectado: ${socket.userId}`);
    });
  });

  return ioInstance;
}

/**
 * Obtiene la instancia de Socket.io
 */
export function getIO() {
  if (!ioInstance) {
    throw new Error("Socket.io no ha sido inicializado. Llama a initializeSocket primero.");
  }
  return ioInstance;
}

