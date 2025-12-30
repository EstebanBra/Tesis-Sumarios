import { useState } from 'react'

export type TipoDerivacionVRA = 'vra_general' | 'casos_clinicos'

interface Props {
  isOpen: boolean
  onClose: () => void
  // Ahora también enviamos el tipo de derivación VRA
  onConfirm: (observacion: string, tipoDerivacion?: TipoDerivacionVRA) => void 
  isProcessing: boolean
}

export default function DerivacionModal({ isOpen, onClose, onConfirm, isProcessing }: Props) {
  const [observacion, setObservacion] = useState('')
  const [tipoDerivacion, setTipoDerivacion] = useState<TipoDerivacionVRA>('vra_general')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!observacion.trim()) {
      alert("Debes escribir la observación para derivar.")
      return
    }
    // Enviamos el texto y el tipo de derivación al padre
    onConfirm(observacion, tipoDerivacion) 
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Derivar Caso a VRA</h2>
        <p className="text-sm text-gray-500 mb-4">
          Selecciona el tipo de derivación y completa la observación obligatoria.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Selector de tipo de derivación VRA */}
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
                  onChange={(e) => setTipoDerivacion(e.target.value as TipoDerivacionVRA)}
                  className="mr-3 text-ubb-blue focus:ring-ubb-blue"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">VRA General</span>
                  <p className="text-xs text-gray-500 mt-0.5">Derivación a Vicerrectoría Académica General</p>
                </div>
              </label>
              <label className="flex items-center p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="tipoDerivacion"
                  value="casos_clinicos"
                  checked={tipoDerivacion === 'casos_clinicos'}
                  onChange={(e) => setTipoDerivacion(e.target.value as TipoDerivacionVRA)}
                  className="mr-3 text-ubb-blue focus:ring-ubb-blue"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Casos Clínicos</span>
                  <p className="text-xs text-gray-500 mt-0.5">Derivación a área de Casos Clínicos</p>
                </div>
              </label>
            </div>
          </div>

          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Observación *
          </label>
          <textarea
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-ubb-blue focus:ring-ubb-blue text-sm h-32 p-3 border"
            placeholder="Escribe aquí las observaciones y conclusiones técnicas para la derivación..."
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