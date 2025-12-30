import { Router } from 'express';
import {
  generatePresignedUploadUrl,
  generatePresignedDownloadUrl,
  deleteStorageFile,
} from '../controllers/storage.controller.js';
import { body, param } from 'express-validator';

const router = Router();

// Validaciones
const presignedUploadValidation = [
  body('fileName')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('El nombre del archivo es requerido'),
  body('mimeType')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('El tipo MIME es requerido'),
  body('size')
    .isInt({ min: 1 })
    .withMessage('El tamaño del archivo debe ser un número positivo'),
];

const objectKeyValidation = [
  param('objectKey')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('La clave del objeto es requerida'),
];

// Rutas
router.post(
  '/presigned-upload',
  presignedUploadValidation,
  generatePresignedUploadUrl
);

router.get(
  '/presigned-download/:objectKey',
  objectKeyValidation,
  generatePresignedDownloadUrl
);

router.delete(
  '/:objectKey',
  objectKeyValidation,
  deleteStorageFile
);

export default router;

