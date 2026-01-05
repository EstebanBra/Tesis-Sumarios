import { useState, type FormEvent } from 'react';

export type TipoDerivacionVRA = 'vra_general';

export type OpcionDestino = {
  id: number;
  nombre: string;
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  // Si se proporcionan opcionesDestino, se usa el selector dinámico
  // Si no, se usa el comportamiento legacy (derivarADirgegen o tipoDerivacion)
  onConfirm: (observacion: string, nuevoTipoId?: number, tipoDerivacion?: TipoDerivacionVRA) => void;
  isProcessing: boolean;
  derivarADirgegen?: boolean; // Legacy: Si es true, el modal es para derivar a Dirgegen
  opcionesDestino?: OpcionDestino[]; // Nuevo: Opciones dinámicas de destino
}

export default function DerivacionModal({
  isOpen,
  onClose,
  onConfirm,
  isProcessing,
  derivarADirgegen = false,
  opcionesDestino,
}: Props) {
  const [observacion, setObservacion] = useState('');
  const [tipoDerivacion, setTipoDerivacion] = useState<TipoDerivacionVRA>('vra_general');
  const [destinoSeleccionado, setDestinoSeleccionado] = useState<number | null>(
    opcionesDestino && opcionesDestino.length > 0 ? opcionesDestino[0].id : null
  );

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!observacion.trim()) {
      alert('Debes escribir la observación para derivar.');
      return;
    }

    // Si hay opciones de destino, usar el nuevo flujo
    if (opcionesDestino && opcionesDestino.length > 0) {
      if (!destinoSeleccionado) {
        alert('Debes seleccionar un destino para la derivación.');
        return;
      }
      onConfirm(observacion, destinoSeleccionado);
    } else {
      // Comportamiento legacy
      onConfirm(observacion, undefined, tipoDerivacion);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {derivarADirgegen ? 'Derivar Caso a Dirgegen' : 'Derivar Caso a VRA'}
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          {derivarADirgegen
            ? 'Completa la observación obligatoria para derivar el caso.'
            : 'Selecciona el tipo de derivación y completa la observación obligatoria.'}
        </p>

        <form onSubmit={handleSubmit}>
          {/* Selector dinámico de destino (nuevo flujo) */}
          {opcionesDestino && opcionesDestino.length > 0 ? (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Destino de la Derivación *
              </label>
              <div className="space-y-2">
                {opcionesDestino.map(opcion => (
                  <label
                    key={opcion.id}
                    className="flex items-center p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <input
                      type="radio"
                      name="destino"
                      value={opcion.id}
                      checked={destinoSeleccionado === opcion.id}
                      onChange={e => setDestinoSeleccionado(Number(e.target.value))}
                      className="mr-3 text-ubb-blue focus:ring-ubb-blue"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">{opcion.nombre}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ) : (
            /* Selector de tipo de derivación VRA o Dirgegen (legacy) */
            !derivarADirgegen ? (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tipo de Derivación a VRA *
                </label>
                <div className="space-y-2">
                  <label className="flex items-center p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="tipoDerivacion"
                      value="vra_general"
                      checked={tipoDerivacion === 'vra_general'}
                      onChange={e => setTipoDerivacion(e.target.value as TipoDerivacionVRA)}
                      className="mr-3 text-ubb-blue focus:ring-ubb-blue"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">VRA General</span>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Derivación a Vicerrectoría Académica General
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Destino de la Derivación *
                </label>
                <div className="p-3 border border-gray-300 rounded-md bg-gray-50">
                  <span className="text-sm font-medium text-gray-900">Dirgegen</span>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Derivar a Dirección de Género y Equidad
                  </p>
                </div>
              </div>
            )
          )}

          <label className="block text-sm font-semibold text-gray-700 mb-1">Observación *</label>
          <textarea
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-ubb-blue focus:ring-ubb-blue text-sm h-32 p-3 border"
            placeholder="Escribe aquí las observaciones y conclusiones técnicas para la derivación..."
            value={observacion}
            onChange={e => setObservacion(e.target.value)}
            required
            autoFocus
          />
          <p className="text-xs text-gray-500 mt-1">
            Este texto será incluido en la notificación enviada al receptor.
          </p>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              disabled={isProcessing}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isProcessing || !observacion.trim()}
              className="rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
            >
              {isProcessing ? 'Procesando...' : 'Confirmar Derivación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
