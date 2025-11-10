// src/validators/denuncia.validation.js
import { body, param, query } from "express-validator";

export const createDenunciaRules = [
  body("Rut").isString().trim().notEmpty(),
  body("ID_TipoDe").isInt({ min: 1 }),
  body("Fecha_Inicio").isISO8601(),
  body("Relato_Hechos").isString().trim().notEmpty(),
  body("Ubicacion").optional().isString().isLength({ max: 200 }),
];

export const updateDenunciaRules = [
  param("id").isInt({ min: 1 }),
  body("Rut").optional().isString().trim().notEmpty(),
  body("ID_TipoDe").optional().isInt({ min: 1 }),
  body("ID_EstadoDe").optional().isInt({ min: 1 }),
  body("Fecha_Inicio").optional().isISO8601(),
  body("Relato_Hechos").optional().isString().trim().notEmpty(),
  body("Ubicacion").optional().isString().isLength({ max: 200 }),
];

export const idParamRule = [param("id").isInt({ min: 1 })];

export const listDenunciasRules = [
  query("page").optional().isInt({ min: 1 }),
  query("pageSize").optional().isInt({ min: 1, max: 100 }),
  query("rut").optional().isString(),
  query("tipoId").optional().isInt({ min: 1 }),
  query("estadoId").optional().isInt({ min: 1 }),
  query("desde").optional().isISO8601(),
  query("hasta").optional().isISO8601(),
];

export const changeEstadoRules = [
  param("id").isInt({ min: 1 }),
  body("nuevoEstadoId").isInt({ min: 1 }),
  body("fecha").optional().isISO8601(),
];
