import type { Paso3Props } from "@/types/step-props";

export default function Paso3Confirmacion({
  formulario,
  tipoSeleccionado,
  archivosEvidencia,
}: Paso3Props) {
  const getFileIcon = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    return '📎';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-ubb-blue font-bold uppercase text-xs tracking-wider mb-4">
          Resumen General
        </h3>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4 text-sm">
          <div>
            <dt className="text-gray-500 text-xs uppercase font-bold">
              Tipo de Denuncia
            </dt>
            <dd>
              {tipoSeleccionado?.nombre}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500 text-xs uppercase font-bold">
              Víctima
            </dt>
            <dd>{formulario.victimaNombre || "No especificado"}</dd>
          </div>

          <div className="md:col-span-2">
            <dt className="text-gray-500 text-xs uppercase font-bold mb-1">
              Personas Denunciadas
            </dt>
            {formulario.involucrados.length > 0 ? (
              <ul className="list-disc pl-4 text-gray-700">
                {formulario.involucrados.map((inv, idx) => (
                  <li key={idx}>
                    {inv.nombre} ({inv.vinculacion})
                  </li>
                ))}
              </ul>
            ) : (
              <dd className="text-gray-500 italic">
                No se agregaron personas específicas
              </dd>
            )}
          </div>

          <div className="md:col-span-2">
            <dt className="text-gray-500 text-xs uppercase font-bold mb-1">
              Relato
            </dt>
            <dd className="bg-white p-3 rounded border text-gray-700 whitespace-pre-wrap">
              {formulario.relato}
            </dd>
          </div>

          <div className="md:col-span-2">
            <dt className="text-gray-500 text-xs uppercase font-bold mb-1">
              Evidencias Adjuntas
            </dt>
            {archivosEvidencia.length > 0 ? (
              <dd className="bg-white p-3 rounded border">
                <ul className="space-y-2">
                  {archivosEvidencia.map((archivo, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                      <span>{getFileIcon(archivo.mimeType)}</span>
                      <span className="font-medium">{archivo.fileName}</span>
                      <span className="text-gray-500">({formatFileSize(archivo.size)})</span>
                    </li>
                  ))}
                </ul>
              </dd>
            ) : (
              <dd className="text-gray-500 italic">No se adjuntaron archivos</dd>
            )}
          </div>
        </dl>
      </div>
      <div className="text-sm text-gray-500 text-center">
        <p>Al enviar, confirmas que los datos entregados son verídicos.</p>
      </div>
    </div>
  );
}

