import { validationResult } from "express-validator";
import { obtenerDatosUnificados } from "../services/datosExternos.service.js";

export const buscarPorRut = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Error de validación",
        errors: errors.array(),
      });
    }

    const { rut } = req.params;

    if (!rut) {
      return res.status(400).json({
        message: "El RUT es obligatorio.",
      });
    }

    const datos = await obtenerDatosUnificados(rut);

    if (!datos) {
      return res.status(404).json({
        message: "No se encontraron datos para el RUT proporcionado",
      });
    }

    res.status(200).json({
      message: "Datos recuperados exitosamente.",
      data: datos,
    });
  } catch (error) {
    console.error("Error en buscarPorRut:", error);
    res.status(500).json({
      message: "Error interno al consultar datos externos.",
    });
  }
};
