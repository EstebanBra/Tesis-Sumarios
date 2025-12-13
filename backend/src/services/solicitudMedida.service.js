import prisma from "../config/prisma.js";

// Estado inicial para todas las solicitudes creadas por la víctima en casos de género
const ESTADO_INICIAL_DIRGEGEN = 'Pendiente Informe';

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
    idSolicitante,
    tipoMedida,
    observacion,
}) {
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
                }
            },
            persona: {
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
            persona: {
                select: { Nombre: true, Correo: true }
            }
        }
    });
}