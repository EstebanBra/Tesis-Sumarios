import prisma from "../config/prisma.js";

// esto se hace por si se tiene que cambiar o no para vrae por error del denunciado 
export async function derivarDenunciaService(idDenuncia, { nuevoTipoId, nuevoEstadoId, observacion, usuarioId }) {
  return prisma.$transaction(async (tx) => {
    // validadcion default
    const denuncia = await tx.denuncia.findUnique({
      where: { ID_Denuncia: Number(idDenuncia) }
    });
    
    if (!denuncia) throw new Error("Denuncia no encontrada");

    // UPDATE de la denuncia solo estos campos (ID_TipoDe, ID_EstadoDe)
    const denunciaActualizada = await tx.denuncia.update({
      where: { ID_Denuncia: Number(idDenuncia) },
      data: {
        ID_TipoDe: Number(nuevoTipoId),     
        ID_EstadoDe: Number(nuevoEstadoId),
      },
      include: {
        tipo_denuncia: true,
        estado_denuncia: true
      }
    });

    // ver esto despues de actualizar el prisma
    
    /* await tx.historial_Estado.create({
      data: {
        ID_Denuncia: Number(idDenuncia),
        ID_EstadoDe: Number(nuevoEstadoId),
        Fecha: new Date(), // La fecha actual hace único el registro
      }
    });
    */

    return denunciaActualizada;
  });
}