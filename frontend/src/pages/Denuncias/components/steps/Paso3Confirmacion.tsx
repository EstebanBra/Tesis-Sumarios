import type { Paso3Props } from '@/types/step-props';
import { FaUser, FaCalendarAlt, FaMapMarkerAlt, FaFileAlt, FaUsers, FaEye } from 'react-icons/fa';
import { useState } from 'react';

export default function Paso3Confirmacion({
  formulario,
  tipoSeleccionado,
  involucrados,
  testigos,
  archivosEvidencia,
}: Paso3Props) {
  const [relatoExpandido, setRelatoExpandido] = useState(false);
  const MAX_RELATO_LENGTH = 300;

  // Función para formatear el tamaño de archivos
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // Formatear fecha
  const formatearFecha = (fecha: string | undefined): string => {
    if (!fecha) return 'No indicada';
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-CL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return fecha;
    }
  };

  // Determinar ubicación según tipo de denuncia
  const esCampoClinico = formulario.tipoId === 3;
  const ubicacionTexto = esCampoClinico
    ? [
        formulario.nombreEstablecimiento,
        formulario.regionEstablecimiento,
        formulario.comunaEstablecimiento,
        formulario.unidadServicio,
      ]
        .filter(Boolean)
        .join(', ') || 'No especificada'
    : [formulario.sedeHecho, formulario.lugarHecho, formulario.detalleHecho]
        .filter(Boolean)
        .join(' - ') || 'No especificada';

  const relatoTruncado =
    formulario.relato && formulario.relato.length > MAX_RELATO_LENGTH
      ? formulario.relato.substring(0, MAX_RELATO_LENGTH) + '...'
      : formulario.relato;

  return (
    <div className="space-y-4">
      {/* HEADER CON TÍTULO */}
      <div className="border-b border-gray-200 pb-3">
        <h2 className="text-lg font-bold text-gray-900">Resumen de la Denuncia</h2>
        <p className="text-xs text-gray-500 mt-1">Revisa toda la información antes de enviar</p>
      </div>

      {/* FILA 1: Grid 2 columnas - Denunciante y Tipo/Contexto */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* TARJETA: Datos del Denunciante */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <FaUser className="h-4 w-4 text-ubb-blue" />
            <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wide">Denunciante</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-xs text-gray-500 block">Nombre</span>
              <span className="font-medium text-gray-900">
                {formulario.nombre || 'No indicado'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div>
                <span className="text-xs text-gray-500 block">RUT</span>
                <span className="font-medium text-gray-900">{formulario.rut || '—'}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Carrera/Cargo</span>
                <span className="font-medium text-gray-900">{formulario.carreraCargo || '—'}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Correo</span>
                <span className="font-medium text-gray-900 text-xs break-all">
                  {formulario.correo || '—'}
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Teléfono</span>
                <span className="font-medium text-gray-900">{formulario.telefono || '—'}</span>
              </div>
            </div>
            {formulario.reservaIdentidad && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <span className="inline-flex items-center gap-1 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded font-medium">
                  🔒 Solicita reserva de identidad
                </span>
              </div>
            )}
          </div>
        </div>

        {/* TARJETA: Tipo de Denuncia y Contexto */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <FaMapMarkerAlt className="h-4 w-4 text-ubb-blue" />
            <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wide">Contexto</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-xs text-gray-500 block">Tipo de Denuncia</span>
              <span className="font-semibold text-ubb-blue text-sm">
                {tipoSeleccionado?.nombre || 'No seleccionado'}
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Ubicación</span>
              <span className="font-medium text-gray-900 text-xs">{ubicacionTexto}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <FaCalendarAlt className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-xs text-gray-500">Fecha del hecho</span>
              </div>
              <span className="font-medium text-gray-900 text-xs ml-5 block">
                {formulario.tipoFecha === 'rango' && formulario.fechaHechoFin
                  ? `${formatearFecha(formulario.fechaHecho)} - ${formatearFecha(
                      formulario.fechaHechoFin
                    )}`
                  : formatearFecha(formulario.fechaHecho)}
              </span>
            </div>
            {formulario.esVictima === 'no' && formulario.victimaNombre && (
              <div className="pt-2 border-t border-gray-200">
                <span className="text-xs text-gray-500 block">Víctima</span>
                <span className="font-medium text-gray-900 text-xs">
                  {formulario.victimaNombre}
                  {formulario.victimaRut && ` (${formulario.victimaRut})`}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FILA 2: Relato de los Hechos (Full Width) */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <FaFileAlt className="h-4 w-4 text-ubb-blue" />
          <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wide">
            Relato de los Hechos
          </h3>
        </div>
        <div className="text-sm">
          {formulario.relato ? (
            <>
              <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                {relatoExpandido ? formulario.relato : relatoTruncado}
              </p>
              {formulario.relato.length > MAX_RELATO_LENGTH && (
                <button
                  type="button"
                  onClick={() => setRelatoExpandido(!relatoExpandido)}
                  className="mt-2 text-xs text-ubb-blue hover:underline font-medium"
                >
                  {relatoExpandido ? 'Ver menos' : 'Ver más'}
                </button>
              )}
            </>
          ) : (
            <p className="text-gray-500 italic">No se ha ingresado un relato.</p>
          )}
        </div>
      </div>

      {/* FILA 3: Grid 2 columnas - Denunciados y Testigos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* COLUMNA IZQ: Denunciados */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <FaUsers className="h-4 w-4 text-ubb-blue" />
            <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wide">
              Denunciados ({involucrados.length})
            </h3>
          </div>
          {involucrados.length > 0 ? (
            <div className="space-y-2">
              {involucrados.map((inv, idx) => (
                <div key={idx} className="bg-white border border-gray-200 rounded p-2 text-xs">
                  <div className="font-medium text-gray-900">{inv.nombre || 'Sin nombre'}</div>
                  <div className="mt-1 space-y-0.5 text-gray-600">
                    {inv.vinculacion && (
                      <div>
                        <span className="text-gray-500">Vinculación:</span> {inv.vinculacion}
                      </div>
                    )}
                    {inv.rut && (
                      <div>
                        <span className="text-gray-500">RUT:</span> {inv.rut}
                      </div>
                    )}
                    {inv.unidadCarrera && (
                      <div>
                        <span className="text-gray-500">Unidad:</span> {inv.unidadCarrera}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 italic">No se registraron denunciados.</p>
          )}
        </div>

        {/* COLUMNA DER: Testigos */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <FaEye className="h-4 w-4 text-ubb-blue" />
            <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wide">
              Testigos ({testigos.length})
            </h3>
          </div>
          {testigos.length > 0 ? (
            <div className="space-y-2">
              {testigos.map((testigo, idx) => (
                <div key={idx} className="bg-white border border-gray-200 rounded p-2 text-xs">
                  <div className="font-medium text-gray-900">
                    {testigo.nombreCompleto || 'Sin nombre'}
                  </div>
                  <div className="mt-1 space-y-0.5 text-gray-600">
                    {testigo.contacto && (
                      <div>
                        <span className="text-gray-500">Contacto:</span> {testigo.contacto}
                      </div>
                    )}
                    {testigo.rut && (
                      <div>
                        <span className="text-gray-500">RUT:</span> {testigo.rut}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 italic">No hay testigos registrados.</p>
          )}
        </div>
      </div>

      {/* FILA 4: Archivos Adjuntos */}
      {archivosEvidencia.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <FaFileAlt className="h-4 w-4 text-ubb-blue" />
            <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wide">
              Archivos Adjuntos ({archivosEvidencia.length})
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {archivosEvidencia.map((archivo, idx) => (
              <div
                key={idx}
                className="bg-white border border-gray-200 rounded p-2 text-xs flex items-start gap-2"
              >
                <span className="text-gray-400 mt-0.5">📎</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate" title={archivo.fileName}>
                    {archivo.fileName}
                  </div>
                  <div className="text-gray-500 text-[10px] mt-0.5">
                    {formatFileSize(archivo.size)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DECLARACIÓN */}
      <div className="border-t border-gray-200 pt-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-justify text-gray-700 leading-relaxed">
            <strong className="font-semibold">Declaración:</strong> Declaro que la información
            entregada en este formulario es verídica y entiendo que será utilizada para iniciar un
            proceso de investigación según la normativa universitaria vigente.
          </p>
        </div>
      </div>
    </div>
  );
}
