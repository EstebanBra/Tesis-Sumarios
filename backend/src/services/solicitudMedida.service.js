import prisma from "../config/prisma.js";


/**
 * Crea una nueva solicitud de medida de resguardo (iniciada por la víctima).
 * El estado se fija en 'Pendiente Informe' para que DIRGEGEN actúe.
 * @param {number} idDenuncia - ID de la denuncia.
 * @param {string} rutSolicitante - RUT de la persona que solicita (víctima).
 * @param {string} tipoMedida - Tipo de medida solicitada (ej: 'Académica').
 * @param {string} observacion - Justificación de la víctima.
 */

export async function createSolicitudService({
  idDenuncia,
  rutSolicitante,
  tipoMedida,
  observacion,
}) {
  // 1. BUSCAR EL TIPO DE DENUNCIA PRIMERO
  const denuncia = await prisma.denuncia.findUnique({
    where: { ID_Denuncia: Number(idDenuncia) },
    select: { ID_TipoDe: true }
  });

  if (!denuncia) throw new Error("La denuncia asociada no existe.");

  // 2. DECIDIR EL DESTINO (Lógica de Tesis)
  let estadoInicial = '';
  
  if (denuncia.ID_TipoDe < 200) {
      // --- SERIE 100: GÉNERO (DUE 4560) ---
      // Va a Dirgegen para Informe Técnico obligatorio
      estadoInicial = 'Pendiente Informe'; 
  } else {
      // --- SERIE 200: CONVIVENCIA (DUE 5415) ---
      // Va directo a la Autoridad/Fiscalía para revisión
      // (No requiere informe psicosocial obligatorio de Dirgegen)
      estadoInicial = 'Pendiente Resolución VRA'; 
  }

  // 3. CREAR LA SOLICITUD
    return prisma.solicitudMedida.create({
        data: {
            ID_Denuncia: Number(idDenuncia),
            ID_Solicitante: Number(idSolicitante),
            Tipo_Medida: tipoMedida,
            Observacion: observacion,
            Estado: ESTADO_INICIAL_DIRGEGEN,
        },
        include: {
            denuncia: {
                select: {
                    ID_Denuncia: true,
                    // Rut no existe en Denuncia, quitado.
                    ID_TipoDe: true,
                    ID_EstadoDe: true,
                    tipo_denuncia: { select: { Nombre: true } } // Útil para el frontend
                }
            },
            Persona: {
                select: {
                    Nombre: true,
                    Correo: true,
                    genero: true
                }
            }
        }
    });
}

/**
 * Obtiene todas las solicitudes en estado 'Pendiente Informe' para la bandeja de DIRGEGEN.
 */
export async function listPendientesDirgegenService() {
    return prisma.solicitudMedida.findMany({
        where: {
            Estado: ESTADO_INICIAL_DIRGEGEN,
        },
        orderBy: { Fecha_Solicitud: 'asc' },
        include: {
            denuncia: {
                select: {
                    ID_Denuncia: true,
                    Fecha_Inicio: true,
                    tipo_denuncia: { select: { Nombre: true } },
                }
            },
            Persona: {
                select: { Nombre: true, Correo: true }
            }
        }
    });
}