import { createInforme, getInformeByDenunciaId,updateInforme } from "../services/informTecnico.service.js"; 

export const crearInformeTecnico = async (req, res) => {
  try {
    // CORRECCIÓN: Llamamos directo a la función, sin "informeService."
    const nuevoInforme = await createInforme(req.body);

    return res.status(201).json({
      mensaje: "Informe técnico guardado exitosamente",
      informe: nuevoInforme
    });

  } catch (error) {
    console.error("Error en controller:", error.message);

    if (error.message === "DENUNCIA_NO_ENCONTRADA") {
      return res.status(404).json({ error: "La denuncia especificada no existe." });
    }
    
    if (error.message === "INFORME_YA_EXISTE") {
      return res.status(400).json({ error: "Ya existe un informe técnico para esta denuncia." });
    }

    return res.status(500).json({ error: "Error interno del servidor." });
  }
};

export const obtenerInforme = async (req, res) => {
  try {
    const { idDenuncia } = req.params;
    
    // CORRECCIÓN: Llamamos directo a la función
    const informe = await getInformeByDenunciaId(idDenuncia);

    if (!informe) {
      return res.status(404).json({ error: "Informe no encontrado" });
    }

    return res.json(informe);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error al obtener el informe" });
  }
};

export const actualizarInformeTecnico = async (req, res) => {
  try {
    const { idDenuncia } = req.params;
    const datosActualizados = await updateInforme(idDenuncia, req.body);

    return res.json({
      mensaje: "Informe técnico actualizado correctamente",
      informe: datosActualizados
    });
  } catch (error) {
    console.error("Error actualizando:", error);
    // Prisma lanza error código P2025 si no encuentra el registro
    if (error.code === 'P2025') {
        return res.status(404).json({ error: "No existe un informe para actualizar." });
    }
    return res.status(500).json({ error: "Error al actualizar el informe." });
  }
};