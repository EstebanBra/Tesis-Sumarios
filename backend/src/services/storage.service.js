import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
  HeadObjectCommand
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from 'node:crypto';
import path from 'path';

// Configuración de MinIO desde variables de entorno
const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || 'localhost';
const MINIO_PORT = process.env.MINIO_PORT || '9000';
const PROTOCOL = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || 'minioadmin';
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || 'minioadmin';
const MINIO_PUBLIC_ENDPOINT = process.env.MINIO_PUBLIC_ENDPOINT || null;

const s3Client = new S3Client({
  region: "us-east-1",
  endpoint: `${PROTOCOL}://${MINIO_ENDPOINT}:${MINIO_PORT}`,
  credentials: {
    accessKeyId: MINIO_ACCESS_KEY,
    secretAccessKey: MINIO_SECRET_KEY,
  },
  forcePathStyle: true,
});

const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'evidencia-denuncias';

// Tipos de archivo permitidos
const ALLOWED_MIME_TYPES = {
  // Imágenes
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'image/bmp': ['.bmp'],
  // Videos
  'video/mp4': ['.mp4'],
  'video/mpeg': ['.mpeg', '.mpg'],
  'video/quicktime': ['.mov'],
  'video/x-msvideo': ['.avi'],
  'video/webm': ['.webm'],
  // Audio
  'audio/mpeg': ['.mp3'],
  'audio/wav': ['.wav'],
  'audio/ogg': ['.ogg'],
  'audio/webm': ['.webm'],
  // Documentos
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-powerpoint': ['.ppt'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'text/plain': ['.txt'],
};

// Tamaño máximo: 200MB
const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB en bytes

/**
 * Inicializa el bucket si no existe
 */
export async function initializeBucket() {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
    console.log(`✅ Bucket "${BUCKET_NAME}" ya existe`);
  } catch (error) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET_NAME }));
      console.log(`✅ Bucket "${BUCKET_NAME}" creado exitosamente`);
    } else {
      console.error('❌ Error inicializando bucket:', error);
    }
  }
}

/**
 * Valida el tipo de archivo
 * @param {string} mimeType - MIME type del archivo
 * @param {string} originalName - Nombre original del archivo
 * @returns {boolean} - true si es válido
 */
export function validateFileType(mimeType, originalName) {
  if (!mimeType) return false;

  const extension = path.extname(originalName).toLowerCase();
  const allowedExtensions = ALLOWED_MIME_TYPES[mimeType];

  if (!allowedExtensions) return false;

  return allowedExtensions.includes(extension);
}

/**
 * Valida el tamaño del archivo
 * @param {number} size - Tamaño en bytes
 * @returns {boolean} - true si es válido
 */
export function validateFileSize(size) {
  return size > 0 && size <= MAX_FILE_SIZE;
}

/**
 * Genera un nombre único para el archivo en MinIO
 * @param {string} originalName - Nombre original del archivo
 * @returns {string} - Nombre único (UUID-nombre)
 */
export function generateUniqueFileName(originalName) {
  const extension = path.extname(originalName);
  const baseName = path.basename(originalName, extension);
  const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_');
  const uuid = crypto.randomUUID();
  return `${uuid}-${sanitizedBaseName}${extension}`;
}

/**
 * Reemplaza el endpoint en una URL presigned con el endpoint público si está configurado
 * @param {string} url - URL presigned generada por MinIO
 * @returns {string} - URL con endpoint público si está configurado
 */
function replacePresignedUrlEndpoint(url) {
  if (!MINIO_PUBLIC_ENDPOINT) return url;
  try {
    const urlObj = new URL(url);
    const publicUrlObj = new URL(MINIO_PUBLIC_ENDPOINT);
    urlObj.host = publicUrlObj.host;
    urlObj.port = publicUrlObj.port;
    urlObj.protocol = publicUrlObj.protocol;
    return urlObj.toString();
  } catch (error) {
    console.log(error);
  }
}

/**
 * Genera una URL firmada (presigned) para subir un archivo
 * @param {string} fileName - Nombre del archivo (debe ser único)
 * @param {string} mimeType - MIME type del archivo
 * @param {number} expiresIn - Tiempo de expiración en segundos (default: 1 hora)
 * @returns {Promise<string>} - URL firmada para PUT (con endpoint público si está configurado)
 */
export async function getPresignedUploadUrl(fileName, mimeType, expiresIn = 3600) {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName,
    ContentType: mimeType,
  });
  // Firma de S3
  const url = await getSignedUrl(s3Client, command, { expiresIn });
  return replacePresignedUrlEndpoint(url);
}

/**
 * Genera una URL firmada (presigned) para descargar/ver un archivo
 * @param {string} objectKey - Clave del objeto en MinIO
 * @param {number} expiresIn - Tiempo de expiración en segundos (default: 1 hora)
 * @returns {Promise<string>} - URL firmada para GET (con endpoint público si está configurado)
 */
export async function getPresignedDownloadUrl(objectKey, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: objectKey,
  });
  const url = await getSignedUrl(s3Client, command, { expiresIn });
  return replacePresignedUrlEndpoint(url);
}

/**
 * Elimina un archivo de MinIO
 * @param {string} objectKey - Clave del objeto en MinIO
 * @returns {Promise<void>}
 */
export async function deleteFile(objectKey) {
  await s3Client.send(new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: objectKey,
  }));
}

/**
 * Verifica si un archivo existe en MinIO
 * @param {string} objectKey - Clave del objeto en MinIO
 * @returns {Promise<boolean>}
 */
export async function fileExists(objectKey) {
  try {
    await s3Client.send(new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: objectKey,
    }));
    return true;
  } catch (error) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw error;
  }
}

/**
 * Obtiene metadatos de un archivo
 * @param {string} objectKey - Clave del objeto en MinIO
 * @returns {Promise<Object>} - Metadatos del archivo
 */
export async function getFileMetadata(objectKey) {
  try {
    const response = await s3Client.send(new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: objectKey,
    }));

    return {
      size: response.ContentLength,
      etag: response.ETag,
      lastModified: response.LastModified,
      contentType: response.ContentType || 'application/octet-stream',
    };
  } catch (error) {
    console.error('Error obteniendo metadatos del archivo:', error);
    throw new Error('No se pudieron obtener los metadatos del archivo');
  }
}

/**
 * Sube un archivo directamente a MinIO desde un buffer
 * @param {Buffer} fileBuffer - Buffer del archivo
 * @param {string} objectKey - Clave del objeto en MinIO (debe ser único)
 * @param {string} mimeType - MIME type del archivo
 * @returns {Promise<void>}
 */
export async function uploadFileToMinIO(fileBuffer, objectKey, mimeType) {
  try {
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: objectKey,
      Body: fileBuffer,
      ContentType: mimeType,
    }));
  } catch (error) {
    console.error('Error subiendo archivo a MinIO:', error);
    throw new Error('No se pudo subir el archivo a MinIO');
  }
}

// Exportar tipos permitidos para validación en otros módulos
export { ALLOWED_MIME_TYPES, MAX_FILE_SIZE, BUCKET_NAME };

