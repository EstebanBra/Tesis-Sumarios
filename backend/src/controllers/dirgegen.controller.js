import { validationResult } from "express-validator";
import { derivarDenunciaService } from "../services/dirgegen.service.js";

export async function derivarDenuncia(req, res, next) {
  try {
    // Validacion
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { nuevoTipoId, nuevoEstadoId, observacion } = req.body; // lo de la observacion luego formulario
    
    const usuarioId = req.user.rut; 

    const resultado = await derivarDenunciaService(id, {
      nuevoTipoId,
      nuevoEstadoId,
      usuarioId,
      observacion
    });

    res.json({
      message: "Denuncia derivada correctamente a la nueva unidad",
      data: resultado
    });

  } catch (err) {
    next(err);
  }
}