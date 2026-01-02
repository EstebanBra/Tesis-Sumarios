import multer from 'multer';
import { validateFileType, validateFileSize, MAX_FILE_SIZE } from '../services/storage.service.js';

// Configurar multer para usar memoria (buffer) en lugar de disco
const storage = multer.memoryStorage();

// Configurar multer con validaciones
const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE, // 200MB
  },
  fileFilter: (req, file, cb) => {
    // Validar tipo de archivo
    if (!validateFileType(file.mimetype, file.originalname)) {
      return cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`));
    }
    
    // Validar tamaño (ya se valida en limits, pero por si acaso)
    if (file.size && !validateFileSize(file.size)) {
      return cb(new Error(`El archivo excede el tamaño máximo permitido (200MB)`));
    }
    
    cb(null, true);
  },
});

// Middleware para múltiples archivos (máximo 10)
// No falla si no hay archivos (opcional)
export const uploadMultipleFiles = (req, res, next) => {
  upload.array('archivos', 10)(req, res, (err) => {
    // Si hay error de multer pero no es por falta de archivos, pasarlo
    if (err && err.code !== 'LIMIT_FILE_COUNT' && err.code !== 'LIMIT_UNEXPECTED_FILE') {
      return next(err);
    }
    // Si no hay archivos, está bien, continuar
    next();
  });
};

// Middleware para un solo archivo
export const uploadSingleFile = upload.single('archivo');

