import prisma from "../config/prisma.js";


// DESPUES HAY QUE ACTUALIZARLO CUANDO TENGAMOS EL INFORME TECNICO

export async function derivarDenunciaService(idDenuncia, { nuevoTipoId, nuevoEstadoId, observacion, usuarioId }) {
  return prisma.$transaction(async (tx) => {
    

    // --- 🔒 CAPA EXTRA DE SEGURIDAD (Validación en Servicio) ---
    // Buscamos al usuario que intenta hacer la acción en la base de datos
    const quienEjecuta = await tx.persona.findUnique({
      where: { Rut: usuarioId } // usuarioId viene del req.user.rut
    });

    // Verificamos si realmente tiene el rol (asumiendo que implementaste el campo 'rol' en Persona)
    // O verificamos en la tabla de participantes si es Dirgegen
    if (!quienEjecuta || quienEjecuta.rol !== 'Dirgergen') { 
       // Si usas la lógica antigua de roles, sería buscar en Participante_Caso
       throw new Error("ACCESO DENEGADO: No tiene permisos de Dirgegen para realizar esta acción.");
    }
    

    //Buscar la denuncia actual para comparar datos
    const denuncia = await tx.denuncia.findUnique({
      where: { ID_Denuncia: Number(idDenuncia) },
      include: {
        tipo_denuncia: true
      }
    });
    
    if (!denuncia) throw new Error("Denuncia no encontrada");

    // Validar que la observación sea obligatoria
    if (!observacion || !observacion.trim()) {
      throw new Error("La observación es obligatoria para derivar una denuncia");
    }

    // Obtener el nuevo tipo de denuncia para determinar el destino
    const nuevoTipo = await tx.tipo_Denuncia.findUnique({
      where: { ID_TipoDe: Number(nuevoTipoId) }
    });

    // UPDATE de la denuncia
    // Aquí actualizamos Tipo (si Dirgegen reclasificó), Estado y la Observación
    const denunciaActualizada = await tx.denuncia.update({
      where: { ID_Denuncia: Number(idDenuncia) },
      data: {
        ID_TipoDe: Number(nuevoTipoId),      // Dirgegen puede corregir el tipo
        ID_EstadoDe: Number(nuevoEstadoId),  // Ej: Cambia a "Derivada"
        observacionDirgegen: observacion ? String(observacion) : null // Se guarda la nota técnica
      },
      include: {
        tipo_denuncia: true,
        estado_denuncia: true,
        solicitudes_medidas: true,
        informe_tecnico: true
      }
    });

    // 3. Crear registro en Historial 
    if (Number(nuevoEstadoId) !== denuncia.ID_EstadoDe) {
      
      
      const existeHistorial = await tx.historial_Estado.findUnique({
        where: {
          ID_Denuncia_ID_EstadoDe: {
            ID_Denuncia: Number(idDenuncia),
            ID_EstadoDe: Number(nuevoEstadoId)
          }
        }
      });

      if (!existeHistorial) {
        await tx.historial_Estado.create({
          data: {
            ID_Denuncia: Number(idDenuncia),
            ID_EstadoDe: Number(nuevoEstadoId),
            Fecha: new Date(), 
          }
        });

        await tx.historial_Estado.update({
          where: {
            ID_Denuncia_ID_EstadoDe: {
              ID_Denuncia: Number(idDenuncia),
              ID_EstadoDe: Number(nuevoEstadoId)
            }
          },
          data: {
            Fecha: new Date()
          }
        });
      }
    }

    // 4. Notificar a los usuarios de VRA (fuera de la transacción)
    // Importamos dinámicamente para evitar dependencias circulares
    try {
      const { crearNotificacion } = await import("./notificacion.service.js");
      const { getIO } = await import("../socket/socket.js");
      const io = getIO();
      
      // Buscar usuarios VRA (similar a DIRGEGEN)
      const usuariosVRA = await prisma.participante_Caso.findMany({
        where: {
          Tipo_PC: {
            in: ["VRA", "vra", "Vicerrectoría Académica"]
          },
        },
        include: {
          persona: true,
        },
      });

      if (usuariosVRA.length > 0) {
        const tipoDestino = nuevoTipo?.Nombre || "VRA";
        const mensajeNotificacion = `Una denuncia ha sido derivada a ${tipoDestino}.\n\nObservación de derivación:\n"${observacion}"`;
        
        const promesasNotificacion = usuariosVRA.map((pc) =>
          crearNotificacion(
            {
              ID_Usuario: pc.ID_Persona,
              Tipo: "DENUNCIA_DERIVADA",
              Titulo: `Denuncia Derivada a ${tipoDestino}`,
              Mensaje: mensajeNotificacion,
              ID_Denuncia: Number(idDenuncia),
              enviarEmail: true,
            },
            io
          )
        );

        // Ejecutar notificaciones de forma asíncrona (no bloquea la respuesta)
        Promise.all(promesasNotificacion).catch(err => {
          console.error("Error al notificar derivación:", err);
        });
      }
    } catch (err) {
      console.error("Error importando servicios de notificación:", err);
    }

    return denunciaActualizada;
  });
}

/**
 * Identifica un denunciado: crea/actualiza Persona con datos reales y vincula a Datos_Denunciado
 * @param {number} idDatosDenunciado - ID de Datos_Denunciado a identificar
 * @param {object} datosPersona - Datos reales de la persona (RUT, Nombre, Correo, Telefono, etc.)
 * @param {number} idUsuarioDirgegen - ID del usuario DIRGEGEN que realiza la identificación
 */
export async function identificarDenunciadoService(idDatosDenunciado, datosPersona, idUsuarioDirgegen) {
  return prisma.$transaction(async (tx) => {
    
    // 1️⃣ Validar que el registro de Datos_Denunciado existe
    const datosDenunciado = await tx.datos_Denunciado.findUnique({
      where: { ID_Datos: Number(idDatosDenunciado) },
      include: {
        denuncia: {
          include: {
            participante_denuncia: true
          }
        }
      }
    });

    if (!datosDenunciado) {
      throw new Error("Registro de denunciado no encontrado");
    }

    // 2️⃣ Validar que el RUT sea obligatorio para identificar
    if (!datosPersona.Rut || !datosPersona.Rut.trim()) {
      throw new Error("El RUT es obligatorio para identificar a un denunciado");
    }

    // 3️⃣ Crear o actualizar Persona con los datos reales
    const persona = await tx.persona.upsert({
      where: { Rut: datosPersona.Rut.trim() },
      update: {
        // Si la persona ya existe, actualizamos con los datos reales proporcionados
        Nombre: datosPersona.Nombre || undefined,
        Correo: datosPersona.Correo || undefined,
        Telefono: datosPersona.Telefono || undefined,
        genero: datosPersona.genero || undefined,
        region: datosPersona.region || undefined,
        comuna: datosPersona.comuna || undefined,
        direccion: datosPersona.direccion || undefined,
      },
      create: {
        Rut: datosPersona.Rut.trim(),
        Nombre: datosPersona.Nombre || "Sin nombre",
        Correo: datosPersona.Correo || "",
        Telefono: datosPersona.Telefono || "",
        genero: datosPersona.genero || null,
        region: datosPersona.region || null,
        comuna: datosPersona.comuna || null,
        direccion: datosPersona.direccion || null,
      }
    });

    // 4️⃣ Actualizar Datos_Denunciado con el ID_Persona identificado
    await tx.datos_Denunciado.update({
      where: { ID_Datos: Number(idDatosDenunciado) },
      data: {
        ID_Persona: persona.ID, // Vincular con la persona identificada
        // Mantenemos Nombre_Ingresado y Descripcion originales (historial)
        // Solo actualizamos la vinculación con Persona
      }
    });

    // 5️⃣ Buscar y actualizar Participante_Denuncia correspondiente
    // Buscamos el participante que coincida con el nombre original del denunciado
    const participante = await tx.participante_Denuncia.findFirst({
      where: {
        ID_Denuncia: datosDenunciado.ID_Denuncia,
        Nombre_PD: datosDenunciado.Nombre_Ingresado,
        ID_Persona: null // Solo actualizamos los que aún no tienen persona vinculada
      }
    });

    if (participante) {
      await tx.participante_Denuncia.update({
        where: { ID_PD: participante.ID_PD },
        data: {
          ID_Persona: persona.ID, // Vincular participante con la persona identificada
          Nombre_PD: datosPersona.Nombre || participante.Nombre_PD // Actualizar nombre si se proporciona
        }
      });
    }

    // 6️⃣ Retornar los datos actualizados
    const datosActualizados = await tx.datos_Denunciado.findUnique({
      where: { ID_Datos: Number(idDatosDenunciado) },
      include: {
        persona: true,
        denuncia: {
          include: {
            participante_denuncia: {
              include: {
                persona: true
              }
            }
          }
        }
      }
    });

    return {
      message: "Denunciado identificado correctamente",
      datosDenunciado: datosActualizados,
      persona: persona
    };
  });
}