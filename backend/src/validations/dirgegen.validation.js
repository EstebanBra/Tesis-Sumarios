// src/validations/dirgegen.validation.js
import { body, param } from "express-validator";

// Validaciones para derivar denuncia
export const derivarDenunciaRules = [
  param("id").isInt().withMessage("El ID debe ser un número entero"),
  body("nuevoTipoId").isInt().withMessage("Debe indicar el nuevo tipo de denuncia"),
  body("nuevoEstadoId").isInt().withMessage("Debe indicar el estado inicial de la nueva unidad"),
  body("observacion").optional().isString().trim().isLength({ max: 2000 }).withMessage("La observación no puede exceder 2000 caracteres"),
];

// Validaciones para identificar denunciado
export const identificarDenunciadoRules = [
  param("idDatosDenunciado")
    .isInt({ min: 1 })
    .withMessage("El ID de datos del denunciado debe ser un número entero válido"),
  body("Rut")
    .notEmpty()
    .withMessage("El RUT es obligatorio")
    .isString()
    .trim()
    .isLength({ min: 8, max: 12 })
    .withMessage("El RUT debe tener entre 8 y 12 caracteres"),
  body("Nombre")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage("El nombre no puede exceder 100 caracteres"),
  body("Correo")
    .optional()
    .isEmail()
    .withMessage("El correo debe ser un email válido"),
  body("Telefono")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 20 })
    .withMessage("El teléfono no puede exceder 20 caracteres"),
  body("genero")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage("El género no puede exceder 50 caracteres"),
  body("region")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage("La región no puede exceder 100 caracteres"),
  body("comuna")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage("La comuna no puede exceder 100 caracteres"),
  body("direccion")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 200 })
    .withMessage("La dirección no puede exceder 200 caracteres"),
];

