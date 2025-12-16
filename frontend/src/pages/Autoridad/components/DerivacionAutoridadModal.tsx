import { useState } from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
  onConfirm: (observacion: string, autoridadDestino: string) => void
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

  if (!isOpen) return null

  const autoridadDestino = autoridadActual === 'VRA' ? 'VRAE' : 'VRA'
  const motivoDerivacion = autoridadActual === 'VRA' 
    ? 'El denunciado es un funcionario o académico (competencia de VRAE)'
    : 'El denunciado es un estudiante (competencia de VRA)'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!observacion.trim()) {
      alert("Debes escribir la justificación de la derivación.")
      return
    }
    onConfirm(observacion, autoridadDestino)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Derivar Caso a {autoridadDestino}
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          {motivoDerivacion}
        </p>

        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Justificación de la Derivación *
          </label>
          <textarea
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-sm h-32 p-3 border"
            placeholder="Describe por qué este caso debe ser derivado a la otra autoridad..."
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
            autoFocus
          />

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
