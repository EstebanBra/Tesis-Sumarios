import { validationResult } from "express-validator";
import { derivarDenunciaService, identificarDenunciadoService } from "../services/dirgegen.service.js";

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

/**
 * Identifica un denunciado con datos reales
 * Crea/actualiza Persona y vincula a Datos_Denunciado y Participante_Denuncia
 */
export async function identificarDenunciado(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: "Validación fallida",
        errors: errors.array() 
      });
    }

    const { idDatosDenunciado } = req.params;
    const { 
      Rut, 
      Nombre, 
      Correo, 
      Telefono, 
      genero, 
      region, 
      comuna, 
      direccion 
    } = req.body;

    // Validar que el RUT esté presente
    if (!Rut || !Rut.trim()) {
      return res.status(400).json({ 
        message: "El RUT es obligatorio para identificar a un denunciado" 
      });
    }

    // ID del usuario DIRGEGEN que realiza la acción
    const idUsuarioDirgegen = req.user.id;

    const datosPersona = {
      Rut: Rut.trim(),
      Nombre: Nombre || null,
      Correo: Correo || null,
      Telefono: Telefono || null,
      genero: genero || null,
      region: region || null,
      comuna: comuna || null,
      direccion: direccion || null,
    };

    const resultado = await identificarDenunciadoService(
      Number(idDatosDenunciado), 
      datosPersona, 
      idUsuarioDirgegen
    );

    res.json({
      message: "Denunciado identificado correctamente",
      data: resultado
    });

  } catch (err) {
    // Manejar errores específicos
    if (err.message === "Registro de denunciado no encontrado") {
      return res.status(404).json({ message: err.message });
    }
    if (err.message === "El RUT es obligatorio para identificar a un denunciado") {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
}