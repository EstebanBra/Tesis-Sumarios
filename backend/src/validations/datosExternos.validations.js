import { param } from "express-validator";
export const validateRutParam = [
  param("rut")
    .matches(/^\d{1,8}$/)
    .withMessage("El RUT debe contener solo números (sin dígito verificador), entre 1 y 8 dígitos"),
];
