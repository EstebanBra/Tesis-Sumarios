import prisma from "../config/prisma.js"; // Asegúrate que esta ruta es correcta en tu proyecto

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


    await tx.denuncia.update({
        where: { ID_Denuncia: Number(idDenuncia) },
        data: { ID_EstadoDe: 3 } 
    });
    

    return informe;
  });

  return nuevoInforme;
};

export const updateInforme = async (idDenuncia, data) => {
  const { 
    antecedentes, 
    analisisSocial, 
    analisisPsico, 
    analisisJuridico, 
    sugerencias 
  } = data;

  // Actualizamos buscando por ID_Denuncia (ya que es relación 1 a 1)
  const informeActualizado = await prisma.informeTecnico.update({
    where: { ID_Denuncia: Number(idDenuncia) },
    data: {
      Antecedentes: antecedentes,
      Analisis_Social: analisisSocial,
      Analisis_Psico: analisisPsico,
      Analisis_Juridico: analisisJuridico,
      Sugerencias: sugerencias
      // No actualizamos autor ni denuncia, esos vínculos son fijos
    }
  });

  return informeActualizado;
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
