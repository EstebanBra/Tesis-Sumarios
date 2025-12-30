import * as MinIO from 'minio';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// Configuración de MinIO desde variables de entorno
const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || 'localhost';
const MINIO_PORT = parseInt(process.env.MINIO_PORT || '9000');
const MINIO_USE_SSL = process.env.MINIO_USE_SSL === 'true';
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || 'minioadmin';
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || 'minioadmin';

// Endpoint público para presigned URLs (accesible desde el navegador)
// Si no se define, se usa el endpoint interno
const MINIO_PUBLIC_ENDPOINT = process.env.MINIO_PUBLIC_ENDPOINT || null;

const minioClient = new MinIO.Client({
  endPoint: MINIO_ENDPOINT,
  port: MINIO_PORT,
  useSSL: MINIO_USE_SSL,
  accessKey: MINIO_ACCESS_KEY,
  secretKey: MINIO_SECRET_KEY,
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
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
      console.log(`✅ Bucket "${BUCKET_NAME}" creado exitosamente`);
    } else {
      console.log(`✅ Bucket "${BUCKET_NAME}" ya existe`);
    }
  } catch (error) {
    console.error('❌ Error inicializando bucket:', error);
    throw error;
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
  const uuid = uuidv4();
  return `${uuid}-${sanitizedBaseName}${extension}`;
}

/**
 * Reemplaza el endpoint en una URL presigned con el endpoint público si está configurado
 * @param {string} url - URL presigned generada por MinIO
 * @returns {string} - URL con endpoint público si está configurado
 */
function replacePresignedUrlEndpoint(url) {
  if (!MINIO_PUBLIC_ENDPOINT) {
    return url;
  }

  try {
    const urlObj = new URL(url);
    const publicUrlObj = new URL(MINIO_PUBLIC_ENDPOINT);
    
    // Reemplazar host y puerto con el endpoint público
    urlObj.host = publicUrlObj.host;
    urlObj.port = publicUrlObj.port;
    urlObj.protocol = publicUrlObj.protocol;
    
    return urlObj.toString();
  } catch (error) {
    console.warn('Error reemplazando endpoint en presigned URL, usando URL original:', error);
    return url;
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
  try {
    const url = await minioClient.presignedPutObject(
      BUCKET_NAME,
      fileName,
      expiresIn
    );
    
    // Reemplazar con endpoint público si está configurado
    return replacePresignedUrlEndpoint(url);
  } catch (error) {
    console.error('Error generando presigned URL para upload:', error);
    throw new Error('No se pudo generar la URL de carga');
  }
}

/**
 * Genera una URL firmada (presigned) para descargar/ver un archivo
 * @param {string} objectKey - Clave del objeto en MinIO
 * @param {number} expiresIn - Tiempo de expiración en segundos (default: 1 hora)
 * @returns {Promise<string>} - URL firmada para GET (con endpoint público si está configurado)
 */
export async function getPresignedDownloadUrl(objectKey, expiresIn = 3600) {
  try {
    const url = await minioClient.presignedGetObject(
      BUCKET_NAME,
      objectKey,
      expiresIn
    );
    
    // Reemplazar con endpoint público si está configurado
    return replacePresignedUrlEndpoint(url);
  } catch (error) {
    console.error('Error generando presigned URL para download:', error);
    throw new Error('No se pudo generar la URL de descarga');
  }
}

/**
 * Elimina un archivo de MinIO
 * @param {string} objectKey - Clave del objeto en MinIO
 * @returns {Promise<void>}
 */
export async function deleteFile(objectKey) {
  try {
    await minioClient.removeObject(BUCKET_NAME, objectKey);
  } catch (error) {
    console.error('Error eliminando archivo de MinIO:', error);
    throw new Error('No se pudo eliminar el archivo');
  }
}

/**
 * Verifica si un archivo existe en MinIO
 * @param {string} objectKey - Clave del objeto en MinIO
 * @returns {Promise<boolean>}
 */
export async function fileExists(objectKey) {
  try {
    await minioClient.statObject(BUCKET_NAME, objectKey);
    return true;
  } catch (error) {
    if (error.code === 'NotFound') {
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
    const stat = await minioClient.statObject(BUCKET_NAME, objectKey);
    return {
      size: stat.size,
      etag: stat.etag,
      lastModified: stat.lastModified,
      contentType: stat.metaData?.['content-type'] || 'application/octet-stream',
    };
  } catch (error) {
    console.error('Error obteniendo metadatos del archivo:', error);
    throw new Error('No se pudieron obtener los metadatos del archivo');
  }
}

// Exportar tipos permitidos para validación en otros módulos
export { ALLOWED_MIME_TYPES, MAX_FILE_SIZE, BUCKET_NAME };

