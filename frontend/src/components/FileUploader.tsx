import { useState, useRef, type ChangeEvent } from 'react';
//import { http } from '@/services/api';

export interface FileMetadata {
  objectKey: string;
  fileName: string;
  mimeType: string;
  size: number;
  file: File; // Referencia al archivo original
}

interface FileUploaderProps {
  onFilesChange: (files: FileMetadata[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  disabled?: boolean;
}

const DEFAULT_MAX_SIZE_MB = 200;

export default function FileUploader({
  onFilesChange,
  maxFiles = 10,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  acceptedTypes,
  disabled = false,
}: FileUploaderProps) {
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Tipos MIME permitidos por defecto
  const defaultAcceptedTypes = [
    // Imágenes
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    // Videos
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/webm',
    // Audio
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    // Documentos
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ];

  const allowedTypes = acceptedTypes || defaultAcceptedTypes;

  const validateFile = (file: File): string | null => {
    // Validar tipo
    if (!allowedTypes.includes(file.type)) {
      return `Tipo de archivo no permitido: ${file.type}`;
    }

    // Validar tamaño
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `El archivo excede el tamaño máximo de ${maxSizeMB}MB`;
    }

    // Validar cantidad máxima
    if (files.length >= maxFiles) {
      return `Solo se permiten ${maxFiles} archivos como máximo`;
    }

    return null;
  };

  // Ya no subimos directamente a MinIO - el backend se encargará de eso
  // Solo preparamos los metadatos del archivo
  const prepareFileMetadata = (file: File): FileMetadata => {
    // Generar un ID temporal para el archivo (el backend generará el objectKey real)
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return {
      objectKey: tempId, // Temporal, el backend generará el real
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      file,
    };
  };

  const processFiles = async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setErrors({});

    const newFiles: FileMetadata[] = [];
    const newErrors: Record<string, string> = {};

    for (const file of selectedFiles) {
      // Validar archivo
      const validationError = validateFile(file);
      if (validationError) {
        newErrors[file.name] = validationError;
        continue;
      }

      // Verificar si ya existe
      if (files.some(f => f.file.name === file.name && f.file.size === file.size)) {
        newErrors[file.name] = 'Este archivo ya fue agregado';
        continue;
      }

      try {
        // Preparar metadata del archivo (sin subir a MinIO - el backend lo hará)
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

        const metadata = prepareFileMetadata(file);
        newFiles.push(metadata);

        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
      } catch (error: any) {
        newErrors[file.name] = error.message || 'Error al procesar el archivo';
      }
    }

    const updatedFiles = [...files, ...newFiles];
    setFiles(updatedFiles);
    setErrors(newErrors);
    setUploading(false);
    onFilesChange(updatedFiles);

    // Limpiar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList) return;
    const selectedFiles = Array.from(fileList) as File[];
    await processFiles(selectedFiles);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !uploading && files.length < maxFiles) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || uploading || files.length >= maxFiles) {
      return;
    }

    const droppedFiles = Array.from(e.dataTransfer.files) as File[];
    await processFiles(droppedFiles);
  };

  const handleRemoveFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    return '📎';
  };

  return (
    <div className="space-y-4">
      {/* Input de archivos con drag and drop */}
      <div
        ref={dropZoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : disabled || uploading || files.length >= maxFiles
            ? 'border-gray-300 opacity-50'
            : 'border-gray-300 hover:bg-gray-50 hover:border-gray-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={allowedTypes.join(',')}
          onChange={handleFileSelect}
          disabled={disabled || uploading || files.length >= maxFiles}
          className="hidden"
          id="file-upload-input"
        />
        <label
          htmlFor="file-upload-input"
          className={`flex flex-col items-center justify-center ${
            disabled || uploading || files.length >= maxFiles
              ? 'opacity-50 cursor-not-allowed'
              : 'cursor-pointer'
          }`}
        >
          <svg
            className="w-10 h-10 text-gray-400 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="text-sm text-gray-600 font-medium">
            {uploading
              ? 'Procesando archivos...'
              : files.length >= maxFiles
              ? `Máximo ${maxFiles} archivos alcanzado`
              : 'Haz clic para seleccionar archivos o arrástralos aquí'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Formatos permitidos: Imágenes, Videos, Audio, PDF, Documentos (Máx. {maxSizeMB}MB)
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {files.length} / {maxFiles} archivos
          </p>
        </label>
      </div>

      {/* Lista de archivos */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700">
            Archivos seleccionados ({files.length})
          </h4>
          <div className="space-y-2">
            {files.map((fileMetadata, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-2xl">{getFileIcon(fileMetadata.mimeType)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {fileMetadata.fileName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(fileMetadata.size)} • {fileMetadata.mimeType}
                    </p>
                    {uploadProgress[fileMetadata.fileName] !== undefined &&
                      uploadProgress[fileMetadata.fileName] < 100 && (
                        <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full transition-all"
                            style={{ width: `${uploadProgress[fileMetadata.fileName]}%` }}
                          />
                        </div>
                      )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(index)}
                  disabled={disabled}
                  className="ml-3 text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Eliminar archivo"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Errores */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm font-semibold text-red-800 mb-2">Errores:</p>
          <ul className="space-y-1">
            {Object.entries(errors).map(([fileName, error]) => (
              <li key={fileName} className="text-xs text-red-700">
                <span className="font-medium">{fileName}:</span> {error}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

