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
      where: { ID_Denuncia: Number(idDenuncia) }
    });
    
    if (!denuncia) throw new Error("Denuncia no encontrada");

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

    return denunciaActualizada;
  });
}