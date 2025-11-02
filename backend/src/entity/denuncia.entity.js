// src/entities/denuncia.entity.js

/**
 * Transforma la entrada de una denuncia para Prisma
 */
export function buildDenunciaPayload(input) {
  return {
    Rut: String(input.Rut).trim(),
    ID_TipoDe: Number(input.ID_TipoDe),
    ID_EstadoDe: Number(input.ID_EstadoDe),
    Fecha_Inicio: new Date(input.Fecha_Inicio),
    Relato_Hechos: String(input.Relato_Hechos).trim(),
    Ubicacion: input.Ubicacion ? String(input.Ubicacion).trim() : null,
  };
}

/**
 * Formatea la salida de una denuncia con sus relaciones
 */
export function mapDenunciaResponse(row) {
  if (!row) return null;
  return {
    id: row.ID_Denuncia,
    rut: row.Rut,
    tipo: row.tipo_denuncia
      ? {
          id: row.tipo_denuncia.ID_TipoDe,
          nombre: row.tipo_denuncia.Nombre,
          area: row.tipo_denuncia.Area,
        }
      : null,
    estado: row.estado_denuncia
      ? {
          id: row.estado_denuncia.ID_EstadoDe,
          nombre: row.estado_denuncia.Tipo_Estado,
        }
      : null,
    fechaInicio: row.Fecha_Inicio,
    relato: row.Relato_Hechos,
    ubicacion: row.Ubicacion,
    historialEstado:
      row.historial_estado?.map((h) => ({
        estadoId: h.ID_EstadoDe,
        fecha: h.Fecha,
      })) ?? [],
    participantes:
      row.participante_denuncia?.map((p) => ({
        id: p.ID_PD,
        rut: p.Rut,
        nombre: p.Nombre_PD,
      })) ?? [],
    medidas:
      row.medidas_cautelares?.map((m) => ({
        id: m.ID_MC,
        desde: m.Fecha_Inicio,
        hasta: m.Fecha_Fin,
        detalle: m.Detalle,
        tipos: m.tipos_cautelar?.map((t) => t.Nombre) ?? [],
      })) ?? [],
  };
}
