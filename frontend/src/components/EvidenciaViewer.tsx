import { useState, useEffect } from 'react';
import { http } from '@/services/api';

interface EvidenciaViewerProps {
  archivo: {
    ID_Archivo: number;
    MinIO_Key?: string;
    Nombre_Original?: string;
    Tipo_Archivo?: string;
    Tamaño?: bigint | number | string;
  };
}

export default function EvidenciaViewer({ archivo }: EvidenciaViewerProps) {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const objectKey = archivo.MinIO_Key || archivo.Nombre_Original;
  const mimeType = archivo.Tipo_Archivo || 'application/octet-stream';
  const fileName = archivo.Nombre_Original || `archivo-${archivo.ID_Archivo}`;

  useEffect(() => {
    if (!objectKey) {
      setError('No se encontró la clave del archivo');
      setLoading(false);
      return;
    }

    // Solo obtener la URL cuando se necesite (para descargar o previsualizar)
    // Si ya tenemos la URL, no la obtenemos de nuevo
    if (showPreview && !downloadUrl) {
      const fetchDownloadUrl = async () => {
        try {
          const response = await http(`/storage/presigned-download/${encodeURIComponent(objectKey)}`, {
            method: 'GET',
          });

          if (response && response.data && response.data.downloadUrl) {
            setDownloadUrl(response.data.downloadUrl);
          } else {
            setError('No se pudo obtener la URL del archivo');
          }
        } catch (err: any) {
          console.error('Error obteniendo URL del archivo:', err);
          setError(err.message || 'Error al cargar el archivo');
        } finally {
          setLoading(false);
        }
      };

      fetchDownloadUrl();
    } else if (!showPreview) {
      setLoading(false);
    }
  }, [objectKey, showPreview, downloadUrl]);

  const formatFileSize = (bytes: bigint | number | string | undefined): string => {
    if (!bytes) return 'Tamaño desconocido';
    const numBytes = typeof bytes === 'bigint' ? Number(bytes) : typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
    if (numBytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(numBytes) / Math.log(k));
    return Math.round(numBytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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

  const isImage = mimeType.startsWith('image/');
  const isVideo = mimeType.startsWith('video/');
  const isAudio = mimeType.startsWith('audio/');
  const isPDF = mimeType === 'application/pdf';
  const canPreview = isImage || isVideo || isAudio || isPDF;

  const handlePreviewClick = () => {
    setShowPreview(true);
  };

  if (loading && showPreview) {
    return (
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (error && showPreview) {
    return (
      <div className="border border-red-200 rounded-lg p-4 bg-red-50">
        <p className="text-sm text-red-700">
          {error || 'No se pudo cargar el archivo'}
        </p>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Header del archivo */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-xl">{getFileIcon(mimeType)}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{fileName}</p>
            <p className="text-xs text-gray-500">{formatFileSize(archivo.Tamaño)} • {mimeType}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-3">
          {canPreview && !showPreview && (
            <button
              onClick={handlePreviewClick}
              className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded hover:bg-green-100 transition-colors"
            >
              👁️ Previsualizar
            </button>
          )}
          {showPreview && (
            <button
              onClick={() => setShowPreview(false)}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 transition-colors"
            >
              ⬆️ Ocultar
            </button>
          )}
          {showPreview && downloadUrl && (
            <a
              href={downloadUrl}
              download={fileName}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
            >
              Descargar
            </a>
          )}
          {!showPreview && (
            <a
              href={downloadUrl || '#'}
              download={fileName}
              target="_blank"
              rel="noreferrer"
              onClick={async (e) => {
                if (!downloadUrl && objectKey) {
                  e.preventDefault();
                  try {
                    setLoading(true);
                    const response = await http(`/storage/presigned-download/${encodeURIComponent(objectKey)}`, {
                      method: 'GET',
                    });
                    if (response && response.data && response.data.downloadUrl) {
                      setDownloadUrl(response.data.downloadUrl);
                      window.open(response.data.downloadUrl, '_blank');
                    }
                  } catch (err: any) {
                    console.error('Error obteniendo URL del archivo:', err);
                    setError(err.message || 'Error al cargar el archivo');
                  } finally {
                    setLoading(false);
                  }
                }
              }}
              className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
            >
              Descargar
            </a>
          )}
        </div>
      </div>

      {/* Previsualización según tipo (solo si showPreview es true) */}
      {showPreview && downloadUrl && (
        <div className="p-4">
          {isImage && (
            <div className="rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
              <img
                src={downloadUrl}
                alt={fileName}
                className="w-full h-auto max-h-96 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = '<p class="text-sm text-gray-500 p-4 text-center">No se pudo cargar la imagen</p>';
                  }
                }}
              />
            </div>
          )}

          {isVideo && (
            <div className="rounded-lg overflow-hidden border border-gray-200 bg-black">
              <video
                src={downloadUrl}
                controls
                className="w-full h-auto max-h-96"
                preload="metadata"
              >
                Tu navegador no soporta la reproducción de video.
              </video>
            </div>
          )}

          {isAudio && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🎵</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 mb-2">{fileName}</p>
                  <audio
                    src={downloadUrl}
                    controls
                    className="w-full"
                    preload="metadata"
                  >
                    Tu navegador no soporta la reproducción de audio.
                  </audio>
                </div>
              </div>
            </div>
          )}

          {isPDF && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="flex flex-col items-center gap-3">
                <span className="text-5xl">📄</span>
                <p className="text-sm font-medium text-gray-900 text-center">{fileName}</p>
                <iframe
                  src={downloadUrl}
                  className="w-full h-96 border border-gray-300 rounded"
                  title={fileName}
                />
              </div>
            </div>
          )}

          {!isImage && !isVideo && !isAudio && !isPDF && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
              <span className="text-4xl block mb-2">{getFileIcon(mimeType)}</span>
              <p className="text-sm font-medium text-gray-900 mb-1">{fileName}</p>
              <p className="text-xs text-gray-500 mb-4">{mimeType}</p>
              <a
                href={downloadUrl}
                download={fileName}
                target="_blank"
                rel="noreferrer"
                className="inline-block px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
              >
                Abrir archivo
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

