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
  idSolicitante, // Corregido: recibimos ID, no RUT
  tipoMedida,
  observacion,
}) {
  
  // 1. BUSCAR EL TIPO DE DENUNCIA
  const denuncia = await prisma.denuncia.findUnique({
    where: { ID_Denuncia: Number(idDenuncia) },
    select: { ID_TipoDe: true }
  });

  if (!denuncia) throw new Error("La denuncia asociada no existe.");

  // 2. DECIDIR EL DESTINO (Lógica de Tesis)
  let estadoInicial = '';
  
  if (denuncia.ID_TipoDe < 200) {
      // --- SERIE 100: GÉNERO (DUE 4560) ---
      // Requiere Informe Técnico de Dirgegen
      estadoInicial = 'Pendiente Informe'; 
  } else {
      // --- SERIE 200: CONVIVENCIA (DUE 5415) ---
      // No pasa por Dirgegen, va directo a la Autoridad/Fiscal
      estadoInicial = 'Pendiente Resolución'; 
  }

  // 3. CREAR LA SOLICITUD
  return prisma.solicitudMedida.create({
      data: {
          ID_Denuncia: Number(idDenuncia),
          ID_Solicitante: Number(idSolicitante), // Usamos el ID correcto
          Tipo_Medida: tipoMedida,
          Observacion: observacion,
          Estado: estadoInicial, // ✅ AQUÍ USAMOS LA VARIABLE CALCULADA
      },
      include: {
          denuncia: {
              select: {
                  ID_Denuncia: true,
                  ID_TipoDe: true,
                  ID_EstadoDe: true,
                  tipo_denuncia: { select: { Nombre: true } }
              }
          },
          persona: { // ✅ OJO: 'persona' con minúscula (según tu schema)
              select: {
                  Nombre: true,
                  Correo: true,
                  genero: true
              }
          }
      }
  });
}

export async function listPendientesDirgegenService() {
    return prisma.solicitudMedida.findMany({
        where: {
            Estado: 'Pendiente Informe', 
        },
        orderBy: { Fecha_Solicitud: 'asc' },
        include: {
            denuncia: {
                select: {
                    ID_Denuncia: true,
                    Fecha_Inicio: true,
                    // ❌ ERROR ANTERIOR: Rut: true (No existe en tabla Denuncia)
                    
                    // ✅ CORRECCIÓN: Accedemos a la relación 'denunciante'
                    denunciante: {
                        select: {
                            Rut: true,
                            Nombre: true // Opcional, por si necesitas el nombre
                        }
                    },
                    
                    tipo_denuncia: { select: { Nombre: true } },
                }
            },
            persona: { // Datos de QUIEN SOLICITÓ la medida (víctima)
                select: { Nombre: true, Correo: true }
            }
        }
    });
}