import { body } from "express-validator";

export const validateSolicitudCodigo = [
  body("rut")
    .notEmpty()
    .withMessage("El RUT es obligatorio")
    .isString()
    .withMessage("El RUT debe ser una cadena de texto")
    .trim(),
];

export const validateVerificacionCodigo = [
  body("rut")
    .notEmpty()
    .withMessage("El RUT es obligatorio")
    .isString()
    .withMessage("El RUT debe ser una cadena de texto")
    .trim(),
  body("codigo")
    .notEmpty()
    .withMessage("El código es obligatorio")
    .isString()
    .withMessage("El código debe ser una cadena de texto")
    .isLength({ min: 6, max: 6 })
    .withMessage("El código debe tener 6 dígitos")
    .matches(/^\d{6}$/)
    .withMessage("El código debe contener solo números"),
];
