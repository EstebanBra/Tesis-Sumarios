// src/services/informTecnico.service.js
import prisma from "../config/prisma.js"; // Asegúrate que esta ruta es correcta en tu proyecto

// CAMBIO: Usamos 'export const' en lugar de 'const' solo
export const createInforme = async (data) => {
  const { 
    idDenuncia, 
    idAutor, 
    antecedentes, 
    analisisSocial, 
    analisisPsico, 
    analisisJuridico, 
    sugerencias 
  } = data;

  // 1. Verificar denuncia
  const denuncia = await prisma.denuncia.findUnique({
    where: { ID_Denuncia: Number(idDenuncia) }
  });

  if (!denuncia) throw new Error("DENUNCIA_NO_ENCONTRADA");

  // 2. Verificar existencia
  const informeExistente = await prisma.informeTecnico.findUnique({
    where: { ID_Denuncia: Number(idDenuncia) }
  });

  if (informeExistente) throw new Error("INFORME_YA_EXISTE");

  // 3. Transacción
  const nuevoInforme = await prisma.$transaction(async (tx) => {
    const informe = await tx.informeTecnico.create({
      data: {
        Antecedentes: antecedentes,
        Analisis_Social: analisisSocial,
        Analisis_Psico: analisisPsico,
        Analisis_Juridico: analisisJuridico,
        Sugerencias: sugerencias,
        denuncia: { connect: { ID_Denuncia: Number(idDenuncia) } },
        autor: { connect: { ID: Number(idAutor) } }
      }
    });

    // Actualizar estado de la denuncia (Descomentar si tienes el ID de estado correcto)
    /*
    await tx.denuncia.update({
        where: { ID_Denuncia: Number(idDenuncia) },
        data: { ID_EstadoDe: 3 } 
    });
    */

    return informe;
  });

  return nuevoInforme;
};

// CAMBIO: Usamos 'export const'
export const getInformeByDenunciaId = async (idDenuncia) => {
  return await prisma.informeTecnico.findUnique({
    where: { ID_Denuncia: Number(idDenuncia) },
    include: {
      autor: true,
      denuncia: true
    }
  });
};

// ELIMINAR: module.exports = { ... } ya no es necesario con export const