import {
  getPresignedUploadUrl,
  getPresignedDownloadUrl,
  generateUniqueFileName,
  validateFileType,
  validateFileSize,
  deleteFile,
} from '../services/storage.service.js';
import { body, param } from 'express-validator';
import { validationResult } from 'express-validator';

/**
 * Genera una URL firmada para subir un archivo
 * POST /api/storage/presigned-upload
 * Body: { fileName: string, mimeType: string, size: number }
 */
export async function generatePresignedUploadUrl(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        ok: false,
        message: 'Validación fallida',
        details: errors.array(),
      });
    }

    const { fileName, mimeType, size } = req.body;

    // Validar tipo de archivo
    if (!validateFileType(mimeType, fileName)) {
      return res.status(400).json({
        ok: false,
        message: 'Tipo de archivo no permitido',
      });
    }

    // Validar tamaño
    if (!validateFileSize(size)) {
      return res.status(400).json({
        ok: false,
        message: `El archivo excede el tamaño máximo permitido (200MB)`,
      });
    }

    // Generar nombre único
    const uniqueFileName = generateUniqueFileName(fileName);

    // Generar URL firmada (válida por 1 hora)
    const presignedUrl = await getPresignedUploadUrl(uniqueFileName, mimeType, 3600);

    res.json({
      ok: true,
      data: {
        uploadUrl: presignedUrl,
        objectKey: uniqueFileName, // Clave para guardar en BD
        fileName: fileName, // Nombre original
        mimeType: mimeType,
        size: size,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Genera una URL firmada para descargar/ver un archivo
 * GET /api/storage/presigned-download/:objectKey
 */
export async function generatePresignedDownloadUrl(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        ok: false,
        message: 'Validación fallida',
        details: errors.array(),
      });
    }

    const { objectKey } = req.params;
    const expiresIn = parseInt(req.query.expiresIn) || 3600; // Default 1 hora

    // Generar URL firmada
    const presignedUrl = await getPresignedDownloadUrl(objectKey, expiresIn);

    res.json({
      ok: true,
      data: {
        downloadUrl: presignedUrl,
        expiresIn: expiresIn,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Elimina un archivo de MinIO
 * DELETE /api/storage/:objectKey
 */
export async function deleteStorageFile(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        ok: false,
        message: 'Validación fallida',
        details: errors.array(),
      });
    }

    const { objectKey } = req.params;

    await deleteFile(objectKey);

    res.json({
      ok: true,
      message: 'Archivo eliminado exitosamente',
    });
  } catch (error) {
    next(error);
  }
}

