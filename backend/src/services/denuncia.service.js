import prisma from "../config/prisma.js";


// Esto es para incluir todas las relaciones 
const includeFull = {
  tipo_denuncia: true,
  estado_denuncia: true,
  historial_estado: true,
  denunciante: {
    include: {
      participantes_caso: {
        include: {
          hitos: {
            include: {
              archivos: true // Incluir archivos a través de hitos (mantener para compatibilidad)
            }
          }
        }
      }
    }
  },
  archivos: true, // Relación directa: archivos vinculados a esta denuncia específica
  datos_denunciados: { 
    include: { 
      persona: true // Incluir la relación con Persona si fue identificado
    } 
  }, 
  participante_denuncia: { 
    include: { 
      persona: true // Incluir la relación con Persona si tiene RUT
    } 
  },
  medidas_cautelares: { include: { tipos_cautelar: true } },
  informe_tecnico: true,
  solicitudes_medidas: true,
  detalle_campo_clinico: true // Detalle específico para denuncias de campo clínico
};


// Lista con los filtros
export async function listDenunciasService(filters = {}, page = 1, pageSize = 10) {
  const where = {};

  // Filtrar por RUT del denunciante (a través de la relación)
  if (filters.rut) {
    where.denunciante = {
      Rut: filters.rut
    };
  }
  if (filters.tipoId) where.ID_TipoDe = Number(filters.tipoId);
  if (filters.estadoId) where.ID_EstadoDe = Number(filters.estadoId);
  if (filters.desde || filters.hasta) {
    where.Fecha_Inicio = {};
    if (filters.desde) where.Fecha_Inicio.gte = new Date(filters.desde);
    if (filters.hasta) where.Fecha_Inicio.lte = new Date(filters.hasta);
  }
  // Cuenta total y obtiene página
  const [total, rows] = await Promise.all([
    prisma.denuncia.count({ where }),
    prisma.denuncia.findMany({
      where,
      include: includeFull,
      orderBy: { ID_Denuncia: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return { total, rows, page, pageSize, pages: Math.ceil(total / pageSize) };
}

export async function getDenunciaByIdService(id) {
  return prisma.denuncia.findUnique({
    where: { ID_Denuncia: Number(id) },
    include: includeFull
  });
}

export async function createDenunciaService(payload, { historial = true } = {}) {

  const estadoInicial = 1;

  // Validar que el denunciante siempre tenga RUT
  if (!payload.Rut || !payload.Rut.trim()) {
    throw new Error("El RUT del denunciante es obligatorio");
  }

  return prisma.$transaction(async (tx) => {

    // 1️⃣ CREAR O ACTUALIZAR PERSONA DENUNCIANTE
    // El denunciante SIEMPRE debe tener RUT (es quien hace la denuncia)
    // Actualizar Carrera_Cargo si viene en el payload (para cualquier tipo de denuncia)
    const updateData = {
        // Si la persona ya existe, actualizamos su sexo, género y datos geográficos con el dato nuevo
        sexo: payload.sexo || undefined,
        genero: payload.genero || undefined,
        region: payload.regionDenunciante || undefined,
        comuna: payload.comunaDenunciante || undefined,
        direccion: payload.direccionDenunciante || undefined
    };
    
    // Si viene Carrera_Cargo y la persona no lo tenía, actualizarlo
    if (payload.carreraCargo && payload.carreraCargo.trim()) {
      updateData.Carrera_Cargo = payload.carreraCargo.trim();
    }
    
    const denunciante = await tx.persona.upsert({
      where: { Rut: payload.Rut.trim() },
      update: updateData,
      create: {
        Rut: payload.Rut,
        // Si es nueva, usamos los datos básicos. Ojo: nombre/correo deberían venir del auth o payload
        Nombre: payload.nombreDenunciante || '',
        Correo: payload.correoDenunciante || '',
        Telefono: payload.telefonoDenunciante || '',
        sexo: payload.sexo || null,
        genero: payload.genero || null,
        region: payload.regionDenunciante || null,
        comuna: payload.comunaDenunciante || null,
        direccion: payload.direccionDenunciante || null,
        Carrera_Cargo: payload.carreraCargo?.trim() || null
      }
    });

    // 2️⃣ CREAR LA DENUNCIA
    // Función helper para convertir fecha sin problemas de zona horaria
    // Usa UTC midnight para evitar cambios de día al almacenar
    const parsearFecha = (fechaStr) => {
      if (!fechaStr) return null;
      // Si viene en formato YYYY-MM-DD, crear fecha en UTC midnight para evitar cambio de día
      if (typeof fechaStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) {
        // Crear fecha en UTC midnight para que se almacene como la fecha correcta
        // independientemente de la zona horaria del servidor
        return new Date(Date.UTC(
          parseInt(fechaStr.split('-')[0], 10), // year
          parseInt(fechaStr.split('-')[1], 10) - 1, // month (0-indexed)
          parseInt(fechaStr.split('-')[2], 10) // day
        ));
      }
      // Si viene con hora, parsear y extraer solo la parte de fecha
      const fecha = new Date(fechaStr);
      // Si es una fecha válida, normalizar a UTC midnight
      if (!isNaN(fecha.getTime())) {
        return new Date(Date.UTC(
          fecha.getUTCFullYear(),
          fecha.getUTCMonth(),
          fecha.getUTCDate()
        ));
      }
      return fecha;
    };

    // Determinar si es denuncia de campo clínico (verificar si viene detalleCampoClinico en el payload)
    const esCampoClinico = !!payload.detalleCampoClinico;

    const denuncia = await tx.denuncia.create({
      data: {
        ID_Denunciante: denunciante.ID,  // Usamos el ID de la persona
        ID_TipoDe: Number(payload.ID_TipoDe), // ID específico (ej: 101, 201, 301)
        ID_EstadoDe: estadoInicial,
        Fecha_Ingreso: new Date(), // Fecha de ingreso al sistema (ahora)
        Fecha_Inicio: parsearFecha(payload.Fecha_Inicio) || new Date(), // Fecha de los hechos
        Fecha_Fin: parsearFecha(payload.Fecha_Fin), // Fecha fin del rango (opcional)
        Relato_Hechos: payload.Relato_Hechos,
        Ubicacion: payload.Ubicacion ?? null,
        Reserva_Identidad: payload.reservaIdentidad ?? false,

        // Historial inicial
        historial_estado: historial
          ? { create: { ID_EstadoDe: estadoInicial, Fecha: new Date() } }
          : undefined,
      },
    });
    
    // 2.5️⃣ Si es denuncia de campo clínico, crear Detalle_Campo_Clinico
    if (esCampoClinico) {
      if (!payload.detalleCampoClinico) {
        throw new Error("Los datos de campo clínico son obligatorios para este tipo de denuncia");
      }
      
      await tx.detalle_Campo_Clinico.create({
        data: {
          ID_Denuncia: denuncia.ID_Denuncia,
          Nombre_Establecimiento: payload.detalleCampoClinico.nombreEstablecimiento,
          Unidad_Servicio: payload.detalleCampoClinico.unidadServicio,
          Tipo_Vinculacion_Denunciado: payload.detalleCampoClinico.tipoVinculacionDenunciado,
          Region: payload.detalleCampoClinico.region || null,
          Comuna: payload.detalleCampoClinico.comuna || null,
          Direccion_Establecimiento: payload.detalleCampoClinico.direccionEstablecimiento || null
        }
      });
    }

    // 3️⃣ PARTICIPANTES (Denunciados + Testigos + Víctima Externa)
    const participantes = [];

    // Agregar víctima externa como participante PRIMERO si existe y tiene RUT
    // Esto es importante para que la víctima esté disponible en la lista de participantes
    if (payload.victima && payload.victima.rut && typeof payload.victima.rut === 'string' && payload.victima.rut.trim().length > 0) {
      // Crear o actualizar la persona víctima
      const personaVictima = await tx.persona.upsert({
        where: { Rut: payload.victima.rut.trim() },
        update: {
          Nombre: payload.victima.nombre || undefined,
          Correo: payload.victima.correo || undefined,
          Telefono: payload.victima.telefono || undefined,
          sexo: payload.victima.sexo || undefined,
          genero: payload.victima.genero || undefined,
        },
        create: {
          Rut: payload.victima.rut.trim(),
          Nombre: payload.victima.nombre || "Sin nombre",
          Correo: payload.victima.correo || "",
          Telefono: payload.victima.telefono || "",
          sexo: payload.victima.sexo || null,
          genero: payload.victima.genero || null,
        }
      });
      
      // Agregar víctima como participante
      participantes.push({
        ID_Denuncia: denuncia.ID_Denuncia,
        ID_Persona: personaVictima.ID,
        Nombre_PD: payload.victima.nombre || "Sin nombre",
      });
    }

    // Denunciados
    if (Array.isArray(payload.denunciados)) {
      for (const p of payload.denunciados) {
        if (p?.nombre || p?.rut) {
          let personaId = null;

          if (p.rut) {
            // Si tiene RUT, buscar o crear la persona
            const persona = await tx.persona.upsert({
              where: { Rut: p.rut },
              update: {},
              create: {
                Rut: p.rut,
                Nombre: p.nombre ?? "Desconocido",
                Correo: "",
                Telefono: ""
              }
            });
            personaId = persona.ID;
          }

          // Crear registro en Datos_Denunciado (SIEMPRE para denunciados)
          // Aquí guardamos la información original del denunciante, incluso si no tiene RUT
          await tx.datos_Denunciado.create({
            data: {
              ID_Denuncia: denuncia.ID_Denuncia,
              Nombre_Ingresado: p.nombre ?? "Desconocido",
              Descripcion: p.descripcion ?? null,
              Ubicacion_Hechos: payload.Ubicacion ?? null, // Guardar ubicación del hecho
              ID_Persona: personaId // null si no tiene RUT, se actualizará cuando DIRGEGEN identifique
            }
          });

          participantes.push({
            ID_Denuncia: denuncia.ID_Denuncia,
            ID_Persona: personaId,
            Nombre_PD: p.nombre ?? "Desconocido",
          });
        }
      }
    }

    // Testigos
    if (Array.isArray(payload.testigos)) {
      for (const t of payload.testigos) {
        if (t?.nombre || t?.rut) {
          let personaId = null;

          if (t.rut) {
            // Si tiene RUT
            const persona = await tx.persona.upsert({
              where: { Rut: t.rut },
              update: {
                Correo: t.contacto?.includes('@') ? t.contacto : undefined,
                Telefono: t.contacto?.includes('@') ? undefined : (t.contacto || undefined)
              },
              create: {
                Rut: t.rut,
                Nombre: t.nombre ?? "Desconocido",
                Correo: t.contacto?.includes('@') ? t.contacto : "",
                Telefono: t.contacto?.includes('@') ? "" : (t.contacto || "")
              }
            });
            personaId = persona.ID;
          }

          participantes.push({
            ID_Denuncia: denuncia.ID_Denuncia,
            ID_Persona: personaId,
            Nombre_PD: t.nombre ?? "Desconocido",
          });
        }
      }
    }

    // Guardar todos los participantes (víctima + denunciados + testigos)
    if (participantes.length > 0) {
      await tx.participante_Denuncia.createMany({ data: participantes });
    }

    // 4️⃣ EVIDENCIAS Y CARACTERÍSTICAS
    // IMPORTANTE: Siempre crear Participante_Caso para poder guardar caracteristicasDenunciado
    // Esto es necesario incluso si no hay evidencias, para almacenar información de víctima
    const pc = await tx.participante_Caso.create({
      data: {
        ID_Persona: denunciante.ID,  // Usamos ID en vez de Rut
        Tipo_PC: "DENUNCIANTE",
      },
    });

    // Siempre crear el hito para guardar caracteristicasDenunciado (información de víctima)
    // Esto permite acceder a datos como "Denunciante es la víctima" o "Víctima: Nombre (RUT: ...)"
    const hitoEvid = await tx.hitos.create({
      data: {
        ID_PC: pc.ID_PC,
        Nombre: payload.caracteristicasDenunciado ? "Información Inicial" : "Evidencias Iniciales",
        Descripcion: payload.caracteristicasDenunciado ?? "Adjuntos al crear denuncia",
      },
    });

    // Guardar Archivos con metadatos de MinIO (si existen evidencias)
    if (payload.evidencias && Array.isArray(payload.evidencias) && payload.evidencias.length > 0) {
      const archivos = payload.evidencias
        .filter(e => e?.nombreArchivo) // Validar que tenga nombreArchivo (MinIO key)
        .map(e => ({
          ID_Hitos: hitoEvid.ID_Hitos,
          ID_Denuncia: denuncia.ID_Denuncia, // Vincular directamente a la denuncia
          Archivo: e.nombreArchivo, // Mantener para compatibilidad (deprecated)
          MinIO_Key: e.nombreArchivo, // Clave del objeto en MinIO
          Nombre_Original: e.nombreOriginal || e.nombreArchivo,
          Tipo_Archivo: e.tipoArchivo || 'application/octet-stream',
          Tamaño: e.tamaño ? BigInt(e.tamaño) : null,
        }));

      if (archivos.length > 0) {
        await tx.archivo.createMany({ data: archivos });
      }
    }

    // 5️⃣ Retornar denuncia completa
    const denunciaCompleta = await tx.denuncia.findUnique({
      where: { ID_Denuncia: denuncia.ID_Denuncia },
      include: includeFull,
    });

    // 6️⃣ Notificar a DIRGEGEN sobre la nueva denuncia (fuera de la transacción)
    // Importamos dinámicamente para evitar dependencias circulares
    try {
      const { notificarNuevaDenuncia } = await import("./notificacion.service.js");
      const { getIO } = await import("../socket/socket.js");
      const io = getIO();
      // Ejecutar notificación de forma asíncrona (no bloquea la respuesta)
      notificarNuevaDenuncia(denuncia.ID_Denuncia, io).catch(err => {
        console.error("Error al notificar nueva denuncia:", err);
      });
    } catch (err) {
      console.error("Error importando servicios de notificación:", err);
    }

    return denunciaCompleta;
  });
}
export async function updateDenunciaService(id, data) {
  return prisma.$transaction(async (tx) => {
    const prev = await tx.denuncia.findUnique({
      where: { ID_Denuncia: Number(id) },
      include: {
        participante_denuncia: true,
        medidas_cautelares: true,
        historial_estado: true,
      },
    });
    if (!prev) throw new Error("Denuncia no encontrada");

    // Función helper para parsear fechas sin problemas de zona horaria
    // Usa UTC midnight para evitar cambios de día al almacenar
    const parsearFecha = (fechaStr) => {
      if (!fechaStr) return null;
      if (typeof fechaStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) {
        // Crear fecha en UTC midnight para que se almacene como la fecha correcta
        return new Date(Date.UTC(
          parseInt(fechaStr.split('-')[0], 10), // year
          parseInt(fechaStr.split('-')[1], 10) - 1, // month (0-indexed)
          parseInt(fechaStr.split('-')[2], 10) // day
        ));
      }
      // Si viene con hora, normalizar a UTC midnight
      const fecha = new Date(fechaStr);
      if (!isNaN(fecha.getTime())) {
        return new Date(Date.UTC(
          fecha.getUTCFullYear(),
          fecha.getUTCMonth(),
          fecha.getUTCDate()
        ));
      }
      return fecha;
    };

    // 1️⃣ Actualizar los campos base
    const updateData = {
        ID_Denunciante: data.ID_Denunciante ?? prev.ID_Denunciante,
        ID_TipoDe: data.ID_TipoDe ?? prev.ID_TipoDe,
        ID_EstadoDe: data.ID_EstadoDe ?? prev.ID_EstadoDe,
        Fecha_Inicio: data.Fecha_Inicio ? parsearFecha(data.Fecha_Inicio) : prev.Fecha_Inicio,
        Fecha_Fin: data.Fecha_Fin !== undefined ? parsearFecha(data.Fecha_Fin) : prev.Fecha_Fin,
        Relato_Hechos: data.Relato_Hechos ?? prev.Relato_Hechos,
        Ubicacion: data.Ubicacion ?? prev.Ubicacion,
    };
    
    // Si se proporciona observación, actualizar observacionDirgegen
    if (data.observacion !== undefined) {
      updateData.observacionDirgegen = data.observacion ? String(data.observacion) : null;
    }
    
    const denunciaActualizada = await tx.denuncia.update({
      where: { ID_Denuncia: Number(id) },
      data: updateData,
      include: {
        tipo_denuncia: true,
        estado_denuncia: true,
        historial_estado: true,
        participante_denuncia: true,
        medidas_cautelares: { include: { tipos_cautelar: true } },
      },
    });

    // 2️⃣ Si cambia el estado, agregar registro al historial
    if (data.ID_EstadoDe && data.ID_EstadoDe !== prev.ID_EstadoDe) {
      await tx.historial_Estado.create({
        data: {
          ID_Denuncia: Number(id),
          ID_EstadoDe: Number(data.ID_EstadoDe),
          Fecha: new Date(),
        },
      });
    }

    // 3️⃣ Actualizar participantes (denunciados y testigos)
    if (Array.isArray(data.denunciados) || Array.isArray(data.testigos)) {
      // Eliminamos los participantes previos de esta denuncia
      await tx.participante_Denuncia.deleteMany({
        where: { ID_Denuncia: Number(id) },
      });
      // Eliminamos los registros de Datos_Denunciado previos
      await tx.datos_Denunciado.deleteMany({
        where: { ID_Denuncia: Number(id) },
      });

      const nuevosParticipantes = [];

      // denunciados
      if (Array.isArray(data.denunciados)) {
        for (const p of data.denunciados) {
          if (p?.nombre || p?.rut) {
            let personaId = null;

            if (p.rut) {
              const persona = await tx.persona.upsert({
                where: { Rut: p.rut },
                update: {},
                create: {
                  Rut: p.rut,
                  Nombre: p.nombre ?? "Desconocido",
                  Correo: "",
                  Telefono: ""
                }
              });
              personaId = persona.ID;
            }

            // Crear registro en Datos_Denunciado
            // Guardamos la información original, incluso si no tiene RUT
            await tx.datos_Denunciado.create({
              data: {
                ID_Denuncia: Number(id),
                Nombre_Ingresado: p.nombre ?? "Desconocido",
                Descripcion: p.descripcion ?? null,
                Ubicacion_Hechos: data.Ubicacion ?? null, // Guardar ubicación del hecho
                ID_Persona: personaId // null si no tiene RUT, se actualizará cuando DIRGEGEN identifique
              }
            });

            nuevosParticipantes.push({
              ID_Denuncia: Number(id),
              ID_Persona: personaId,
              Nombre_PD: p.nombre ?? "Desconocido",
            });
          }
        }
      }

      // testigos
      if (Array.isArray(data.testigos)) {
        for (const t of data.testigos) {
          if (t?.nombre || t?.rut) {
            let personaId = null;

            if (t.rut) {
              const persona = await tx.persona.upsert({
                where: { Rut: t.rut },
                update: {
                  Correo: t.contacto?.includes('@') ? t.contacto : undefined,
                  Telefono: t.contacto?.includes('@') ? undefined : (t.contacto || undefined)
                },
                create: {
                  Rut: t.rut,
                  Nombre: t.nombre ?? "Desconocido",
                  Correo: t.contacto?.includes('@') ? t.contacto : "",
                  Telefono: t.contacto?.includes('@') ? "" : (t.contacto || "")
                }
              });
              personaId = persona.ID;
            }

            nuevosParticipantes.push({
              ID_Denuncia: Number(id),
              ID_Persona: personaId,
              Nombre_PD: t.nombre ?? "Desconocido",
            });
          }
        }
      }

      if (nuevosParticipantes.length) {
        await tx.participante_Denuncia.createMany({ data: nuevosParticipantes });
      }
    }

    // 4️⃣ Actualizar evidencias (si se envían nuevas)
    if (Array.isArray(data.evidencias) && data.evidencias.length > 0) {
      // Eliminamos evidencias antiguas vinculadas directamente a esta denuncia
      await tx.archivo.deleteMany({
        where: {
          ID_Denuncia: Number(id), // Filtrar por denuncia específica
        },
      });

      // Creamos nueva relación de participante_caso e hito
      const pc = await tx.participante_Caso.create({
        data: {
          ID_Persona: denunciaActualizada.ID_Denunciante,
          Tipo_PC: "DENUNCIANTE",
        },
      });

      const hitoEvid = await tx.hitos.create({
        data: {
          ID_PC: pc.ID_PC,
          Nombre: "Evidencias Actualizadas",
          Descripcion: data.caracteristicasDenunciado ?? null,
        },
      });

      // Guardar archivos con metadatos de MinIO
      const archivos = data.evidencias
        .filter(e => e?.nombreArchivo) // Validar que tenga nombreArchivo (MinIO key)
        .map(e => ({
          ID_Hitos: hitoEvid.ID_Hitos,
          ID_Denuncia: Number(id), // Vincular directamente a la denuncia
          Archivo: e.nombreArchivo, // Mantener para compatibilidad (deprecated)
          MinIO_Key: e.nombreArchivo, // Clave del objeto en MinIO
          Nombre_Original: e.nombreOriginal || e.nombreArchivo,
          Tipo_Archivo: e.tipoArchivo || 'application/octet-stream',
          Tamaño: e.tamaño ? BigInt(e.tamaño) : null,
        }));

      if (archivos.length) {
        await tx.archivo.createMany({ data: archivos });
      }
    }

    // 5️⃣ Devolver la denuncia final completa
    const updatedFull = await tx.denuncia.findUnique({
      where: { ID_Denuncia: Number(id) },
      include: includeFull, // Usar includeFull para traer todos los datos
    });

    // 6️⃣ Si se cambió el tipo a VRA (301, 302) o Dirgegen (303) y hay observación, notificar
    const nuevoTipoId = data.ID_TipoDe ?? prev.ID_TipoDe;
    if ((nuevoTipoId === 301 || nuevoTipoId === 302 || nuevoTipoId === 303) && data.observacion) {
      try {
        const { crearNotificacion } = await import("./notificacion.service.js");
        const { getIO } = await import("../socket/socket.js");
        const io = getIO();

        // Determinar a quién notificar según el tipo de derivación
        if (nuevoTipoId === 303) {
          // Derivación a Dirgegen - notificar a usuarios Dirgegen
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

          if (usuariosDirgegen.length > 0) {
            const nuevoTipo = await prisma.tipo_Denuncia.findUnique({
              where: { ID_TipoDe: Number(nuevoTipoId) }
            });
            const tipoDestino = nuevoTipo?.Nombre || "Dirgegen";
            const mensajeNotificacion = `Una denuncia ha sido derivada a ${tipoDestino}.\n\nObservación de derivación:\n"${data.observacion}"`;
            
            const promesasNotificacion = usuariosDirgegen.map((pc) =>
              crearNotificacion(
                {
                  ID_Usuario: pc.ID_Persona,
                  Tipo: "DENUNCIA_DERIVADA",
                  Titulo: `Denuncia Derivada a ${tipoDestino}`,
                  Mensaje: mensajeNotificacion,
                  ID_Denuncia: Number(id),
                  enviarEmail: true,
                },
                io
              )
            );

            Promise.all(promesasNotificacion).catch(err => {
              console.error("Error al notificar derivación a Dirgegen:", err);
            });
          }
        } else if (nuevoTipoId === 301 || nuevoTipoId === 302) {
          // Derivación a VRA - notificar a usuarios VRA
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
            const nuevoTipo = await prisma.tipo_Denuncia.findUnique({
              where: { ID_TipoDe: Number(nuevoTipoId) }
            });
            const tipoDestino = nuevoTipo?.Nombre || "VRA";
            const mensajeNotificacion = `Una denuncia ha sido derivada a ${tipoDestino}.\n\nObservación de derivación:\n"${data.observacion}"`;
            
            const promesasNotificacion = usuariosVRA.map((pc) =>
              crearNotificacion(
                {
                  ID_Usuario: pc.ID_Persona,
                  Tipo: "DENUNCIA_DERIVADA",
                  Titulo: `Denuncia Derivada a ${tipoDestino}`,
                  Mensaje: mensajeNotificacion,
                  ID_Denuncia: Number(id),
                  enviarEmail: true,
                },
                io
              )
            );

            Promise.all(promesasNotificacion).catch(err => {
              console.error("Error al notificar derivación a VRA:", err);
            });
          }
        }
      } catch (err) {
        console.error("Error importando servicios de notificación:", err);
      }
    }

    return updatedFull;
  });
}

export async function deleteDenunciaService(id) {
  // Borrado físico (no hay soft delete en el esquema)
  return prisma.denuncia.delete({
    where: { ID_Denuncia: Number(id) },
  });
}

/**
 * Cambia el estado y registra en historial con fecha opcional (fecha opcional no puede ser ).
 */
export async function changeEstadoService(id, nuevoEstadoId, fecha = null) {
  return prisma.$transaction(async (tx) => {
    // 1) Actualiza estado en Denuncia
    const upd = await tx.denuncia.update({
      where: { ID_Denuncia: Number(id) },
      data: { ID_EstadoDe: Number(nuevoEstadoId) },
      include: includeFull,
    });

    // 2) Inserta en historial
    await tx.historial_Estado.create({
      data: {
        ID_Denuncia: Number(id),
        ID_EstadoDe: Number(nuevoEstadoId),
        Fecha: fecha ? new Date(fecha) : new Date(),
      },
    });

    return upd;
  });
}
