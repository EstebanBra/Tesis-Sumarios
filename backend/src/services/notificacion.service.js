// src/services/notificacion.service.js
import prisma from "../config/prisma.js";
import { enviarCorreo } from "../config/email.config.js";

/**
 * Crea una notificación y la envía por WebSocket y opcionalmente por email
 * @param {object} datos - { ID_Usuario, Tipo, Titulo, Mensaje, ID_Denuncia?, enviarEmail? }
 * @param {object} io - Instancia de Socket.io para emitir en tiempo real
 */
export async function crearNotificacion(datos, io = null) {
  const {
    ID_Usuario,
    Tipo,
    Titulo,
    Mensaje,
    ID_Denuncia = null,
    enviarEmail = false,
  } = datos;

  try {
    // 1️⃣ Crear notificación en BD
    const notificacion = await prisma.notificacion.create({
      data: {
        ID_Usuario: Number(ID_Usuario),
        Tipo: String(Tipo),
        Titulo: String(Titulo),
        Mensaje: String(Mensaje),
        ID_Denuncia: ID_Denuncia ? Number(ID_Denuncia) : null,
        Enviado_Email: false,
      },
      include: {
        usuario: true,
        denuncia: {
          include: {
            tipo_denuncia: true,
          },
        },
      },
    });

    // 2️⃣ Emitir por WebSocket si está disponible
    if (io) {
      io.to(`user_${ID_Usuario}`).emit("nueva_notificacion", {
        id: notificacion.ID_Notificacion,
        tipo: notificacion.Tipo,
        titulo: notificacion.Titulo,
        mensaje: notificacion.Mensaje,
        fecha: notificacion.Fecha_Creacion,
        leida: notificacion.Leida,
        denunciaId: notificacion.ID_Denuncia,
      });
    }

    // 3️⃣ Enviar correo si se solicita
    if (enviarEmail && notificacion.usuario.Correo) {
      const resultadoEmail = await enviarCorreo({
        to: notificacion.usuario.Correo,
        subject: Titulo,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e40af;">${Titulo}</h2>
            <p style="color: #374151; line-height: 1.6;">${Mensaje}</p>
            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">Por favor, accede al sistema para revisar la denuncia.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px;">Sistema de Denuncias - Universidad del Bío-Bío</p>
          </div>
        `,
        text: `${Titulo}\n\n${Mensaje}\n\nPor favor, accede al sistema para revisar la denuncia.`,
      });

      if (resultadoEmail.success) {
        // Actualizar flag de email enviado
        await prisma.notificacion.update({
          where: { ID_Notificacion: notificacion.ID_Notificacion },
          data: { Enviado_Email: true },
        });
      }
    }

    return notificacion;
  } catch (error) {
    console.error("Error creando notificación:", error);
    throw error;
  }
}

/**
 * Obtiene las notificaciones de un usuario
 */
export async function obtenerNotificacionesUsuario(ID_Usuario, { leidas = null, limit = 50 } = {}) {
  const where = { ID_Usuario: Number(ID_Usuario) };
  if (leidas !== null) {
    where.Leida = leidas === true;
  }

  return prisma.notificacion.findMany({
    where,
    include: {
      denuncia: {
        include: {
          tipo_denuncia: true,
        },
      },
    },
    orderBy: { Fecha_Creacion: "desc" },
    take: limit,
  });
}

/**
 * Marca una notificación como leída
 */
export async function marcarComoLeida(ID_Notificacion, ID_Usuario) {
  return prisma.notificacion.updateMany({
    where: {
      ID_Notificacion: Number(ID_Notificacion),
      ID_Usuario: Number(ID_Usuario), // Seguridad: solo el dueño puede marcar como leída
    },
    data: { Leida: true },
  });
}

/**
 * Marca todas las notificaciones de un usuario como leídas
 */
export async function marcarTodasComoLeidas(ID_Usuario) {
  return prisma.notificacion.updateMany({
    where: {
      ID_Usuario: Number(ID_Usuario),
      Leida: false,
    },
    data: { Leida: true },
  });
}

/**
 * Cuenta las notificaciones no leídas de un usuario
 */
export async function contarNoLeidas(ID_Usuario) {
  return prisma.notificacion.count({
    where: {
      ID_Usuario: Number(ID_Usuario),
      Leida: false,
    },
  });
}

/**
 * Notifica a todos los usuarios DIRGEGEN sobre una nueva denuncia
 */
export async function notificarNuevaDenuncia(ID_Denuncia, io = null) {
  try {
    // Obtener todos los usuarios con rol DIRGEGEN
    // Buscar por diferentes variantes del nombre del rol
    const usuariosDirgegen = await prisma.participante_Caso.findMany({
      where: {
        Tipo_PC: {
          in: ["Dirgegen", "Dirgergen", "DIRGEGEN", "DIRGERGEN"]
        },
      },
      include: {
        persona: true,
      },
    });

    if (usuariosDirgegen.length === 0) {
      console.log("⚠️ No se encontraron usuarios DIRGEGEN para notificar");
      return;
    }

    // Obtener datos de la denuncia
    const denuncia = await prisma.denuncia.findUnique({
      where: { ID_Denuncia: Number(ID_Denuncia) },
      include: {
        tipo_denuncia: true,
        denunciante: true,
      },
    });

    if (!denuncia) {
      throw new Error("Denuncia no encontrada");
    }

    // Crear notificaciones para cada usuario DIRGEGEN
    const promesas = usuariosDirgegen.map((pc) =>
      crearNotificacion(
        {
          ID_Usuario: pc.ID_Persona,
          Tipo: "NUEVA_DENUNCIA",
          Titulo: "Nueva Denuncia Recibida",
          Mensaje: `Se ha recibido una nueva denuncia de tipo "${denuncia.tipo_denuncia?.Nombre || "No especificado"}" que requiere tu revisión.`,
          ID_Denuncia: ID_Denuncia,
          enviarEmail: true, // Enviar correo a DIRGEGEN
        },
        io
      )
    );

    await Promise.all(promesas);
    console.log(`✅ Notificaciones enviadas a ${usuariosDirgegen.length} usuario(s) DIRGEGEN`);
  } catch (error) {
    console.error("Error notificando nueva denuncia:", error);
    throw error;
  }
}

