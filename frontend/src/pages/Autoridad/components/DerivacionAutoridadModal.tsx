import { useState, useEffect } from 'react'

export type DestinoDerivacion = 'VRA' | 'VRAE' | 'Dirgegen'

interface Props {
  isOpen: boolean
  onClose: () => void
  onConfirm: (observacion: string, destino: DestinoDerivacion) => void
  isProcessing: boolean
  autoridadActual: 'VRA' | 'VRAE'
}

export default function DerivacionAutoridadModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  isProcessing,
  autoridadActual 
}: Props) {
  const [observacion, setObservacion] = useState('')
  // Inicializar destino según autoridad actual (valor por defecto)
  const destinoDefault: DestinoDerivacion = autoridadActual === 'VRA' ? 'VRAE' : 'VRA'
  const [destino, setDestino] = useState<DestinoDerivacion>(destinoDefault)

  // Resetear estado cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setObservacion('')
      setDestino(destinoDefault)
    }
  }, [isOpen, destinoDefault])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!observacion.trim()) {
      alert("Debes escribir la justificación de la derivación.")
      return
    }
    onConfirm(observacion, destino)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Derivar Caso
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Selecciona el destino de la derivación y completa la observación obligatoria.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Selector de destino */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Destino de la Derivación *
            </label>
            <div className="space-y-2">
              {autoridadActual === 'VRA' && (
                <label className="flex items-center p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="destino"
                    value="VRAE"
                    checked={destino === 'VRAE'}
                    onChange={(e) => setDestino(e.target.value as DestinoDerivacion)}
                    className="mr-3 text-orange-500 focus:ring-orange-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">VRAE</span>
                    <p className="text-xs text-gray-500 mt-0.5">El denunciado es un funcionario o académico (competencia de VRAE)</p>
                  </div>
                </label>
              )}
              {autoridadActual === 'VRAE' && (
                <label className="flex items-center p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="destino"
                    value="VRA"
                    checked={destino === 'VRA'}
                    onChange={(e) => setDestino(e.target.value as DestinoDerivacion)}
                    className="mr-3 text-orange-500 focus:ring-orange-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">VRA</span>
                    <p className="text-xs text-gray-500 mt-0.5">El denunciado es un estudiante (competencia de VRA)</p>
                  </div>
                </label>
              )}
              <label className="flex items-center p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="destino"
                  value="Dirgegen"
                  checked={destino === 'Dirgegen'}
                  onChange={(e) => setDestino(e.target.value as DestinoDerivacion)}
                  className="mr-3 text-orange-500 focus:ring-orange-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Dirgegen</span>
                  <p className="text-xs text-gray-500 mt-0.5">Derivar a Dirección de Género y Equidad</p>
                </div>
              </label>
            </div>
          </div>

          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Observación / Justificación *
          </label>
          <textarea
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-sm h-32 p-3 border"
            placeholder="Describe por qué este caso debe ser derivado..."
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
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
  )
}
