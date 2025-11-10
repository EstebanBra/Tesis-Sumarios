import prisma from "../config/prisma.js";


// Esto es para incluir todas las relaciones 
const includeFull = {
  tipo_denuncia: true,
  estado_denuncia: true,
  historial_estado: true,
  participante_denuncia: true,
  medidas_cautelares: { include: { tipos_cautelar: true } },
};


// Lista con los filtros
export async function listDenunciasService(filters = {}, page = 1, pageSize = 10) {
  const where = {};

  if (filters.rut) where.Rut = filters.rut;
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
    include: includeFull,
  });
}


//que agonico este create
export async function createDenunciaService(payload, { historial = true } = {}) {
  const estadoInicial = payload.ID_EstadoDe ?? 1;

  return prisma.$transaction(async (tx) => {
    // 1) Crear denuncia
    const denuncia = await tx.denuncia.create({
      data: {
        Rut: payload.Rut,
        ID_TipoDe: payload.ID_TipoDe,
        ID_EstadoDe: estadoInicial,
        Fecha_Inicio: payload.Fecha_Inicio,
        Relato_Hechos: payload.Relato_Hechos,
        Ubicacion: payload.Ubicacion ?? null,
        historial_estado: historial
          ? { create: { ID_EstadoDe: estadoInicial, Fecha: new Date() } }
          : undefined,
      },
    });

    // 2) Participantes opcionales (denunciados + testigos) 
    const participantes = [];
    if (Array.isArray(payload.denunciados)) {
      for (const p of payload.denunciados) {
        if (p?.nombre || p?.rut) {
          participantes.push({
            ID_Denuncia: denuncia.ID_Denuncia,
            Rut: p.rut ?? "DESCONOCIDO", // si no hay rut es desconocido
            Nombre_PD: p.nombre ?? "Desconocido",// este igual con el nombre
          });
        }
      }
    }// lo mismo con los testigos
    if (Array.isArray(payload.testigos)) {
      for (const t of payload.testigos) {
        if (t?.nombre || t?.rut) {
          participantes.push({
            ID_Denuncia: denuncia.ID_Denuncia,
            Rut: t.rut ?? "DESCONOCIDO",
            Nombre_PD: t.nombre ?? "Desconocido",
          });
        }
      }
    }
    if (participantes.length) {
      await tx.participante_Denuncia.createMany({ data: participantes });
    }

    // 3) Evidencias opcionales
    // Tu modelo: Archivo -> Hitos -> Participante_Caso
    // Crearé (si hay evidencias) un Participante_Caso para el denunciante y un Hito "Evidencias"
    if (Array.isArray(payload.evidencias) && payload.evidencias.length) {
      // a) Participante_Caso del denunciante (si no existe ya, lo creamos “rápido”)
      const pc = await tx.participante_Caso.create({
        data: {
          Rut: payload.Rut,
          Tipo_PC: "DENUNCIANTE",
        },
      });

      // b) Hito “Evidencias” para ese participante
      const hitoEvid = await tx.hitos.create({
        data: {
          ID_PC: pc.ID_PC,
          Nombre: "Evidencias",
          Descripcion: payload.caracteristicasDenunciado ?? null, // opcional
        },
      });

      // c) Archivos
      const archivos = payload.evidencias
        .filter(e => e?.archivo)
        .map(e => ({ ID_Hitos: hitoEvid.ID_Hitos, Archivo: e.archivo }));

      if (archivos.length) {
        await tx.archivo.createMany({ data: archivos });
      }
    }

    // 4) Devolver con includes
    const createdFull = await tx.denuncia.findUnique({
      where: { ID_Denuncia: denuncia.ID_Denuncia },
      include: includeFull,
    });

    return createdFull;
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

    // 1️⃣ Actualizar los campos base
    const denunciaActualizada = await tx.denuncia.update({
      where: { ID_Denuncia: Number(id) },
      data: {
        Rut: data.Rut ?? prev.Rut,
        ID_TipoDe: data.ID_TipoDe ?? prev.ID_TipoDe,
        ID_EstadoDe: data.ID_EstadoDe ?? prev.ID_EstadoDe,
        Fecha_Inicio: data.Fecha_Inicio ?? prev.Fecha_Inicio,
        Relato_Hechos: data.Relato_Hechos ?? prev.Relato_Hechos,
        Ubicacion: data.Ubicacion ?? prev.Ubicacion,
      },
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

      const nuevosParticipantes = [];

      // denunciados
      if (Array.isArray(data.denunciados)) {
        for (const p of data.denunciados) {
          if (p?.nombre || p?.rut) {
            nuevosParticipantes.push({
              ID_Denuncia: Number(id),
              Rut: p.rut ?? "DESCONOCIDO",
              Nombre_PD: p.nombre ?? "Desconocido",
            });
          }
        }
      }

      // testigos
      if (Array.isArray(data.testigos)) {
        for (const t of data.testigos) {
          if (t?.nombre || t?.rut) {
            nuevosParticipantes.push({
              ID_Denuncia: Number(id),
              Rut: t.rut ?? "DESCONOCIDO",
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
      // Eliminamos evidencias antiguas vinculadas
      await tx.archivo.deleteMany({
        where: {
          hitos: { participante_caso: { Rut: denunciaActualizada.Rut } },
        },
      });

      // Creamos nueva relación de participante_caso e hito
      const pc = await tx.participante_Caso.create({
        data: {
          Rut: denunciaActualizada.Rut,
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

      const archivos = data.evidencias
        .filter(e => e?.archivo)
        .map(e => ({ ID_Hitos: hitoEvid.ID_Hitos, Archivo: e.archivo }));

      if (archivos.length) {
        await tx.archivo.createMany({ data: archivos });
      }
    }

    // 5️⃣ Devolver la denuncia final completa
    const updatedFull = await tx.denuncia.findUnique({
      where: { ID_Denuncia: Number(id) },
      include: {
        tipo_denuncia: true,
        estado_denuncia: true,
        historial_estado: true,
        participante_denuncia: true,
        medidas_cautelares: { include: { tipos_cautelar: true } },
      },
    });

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
