import { validationResult } from "express-validator";
import { obtenerDatosUnificados } from "../services/datosExternos.service.js";
import {
  enviarCodigoVerificacion,
  verificarCodigo,
} from "../services/verificacionEmail.service.js";

/**
 * Envía un código de verificación al email del usuario
 */
export const solicitarCodigoVerificacion = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Error de validación",
        errors: errors.array(),
      });
    }

    const { rut } = req.body;

    // Obtener datos del usuario desde la BD externa
    const datos = await obtenerDatosUnificados(rut);

    if (!datos) {
      return res.status(404).json({
        message: "No se encontraron datos para el RUT proporcionado",
      });
    }

    // Verificar que el usuario tenga email
    if (!datos.email) {
      return res.status(400).json({
        message: "El usuario no tiene un correo electrónico registrado",
      });
    }

    // Enviar código de verificación
    const resultado = await enviarCodigoVerificacion(
      rut,
      datos.email,
      datos.nombre_completo
    );

    res.status(200).json({
      message: resultado.message,
      emailEnmascarado: resultado.emailEnmascarado,
    });
  } catch (error) {
    console.error("Error en solicitarCodigoVerificacion:", error);
    res.status(500).json({
      message: "Error al enviar el código de verificación",
    });
  }
};

/**
 * Verifica el código ingresado por el usuario
 */
export const verificarCodigoEmail = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Error de validación",
        errors: errors.array(),
      });
    }

    const { rut, codigo } = req.body;

    const resultado = verificarCodigo(rut, codigo);

    if (!resultado.success) {
      return res.status(400).json({
        message: resultado.error,
        intentosRestantes: resultado.intentosRestantes,
      });
    }

    // Si el código es correcto, obtener datos completos del usuario
    const datos = await obtenerDatosUnificados(rut);

    res.status(200).json({
      message: resultado.message,
      data: datos,
    });
  } catch (error) {
    console.error("Error en verificarCodigoEmail:", error);
    res.status(500).json({
      message: "Error al verificar el código",
    });
  }
};
