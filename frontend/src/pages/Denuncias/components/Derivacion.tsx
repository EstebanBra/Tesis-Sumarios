import { useState } from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
  // ✅ CORRECCIÓN AQUÍ: Antes era (id: number) => void
  onConfirm: (observacion: string) => void 
  isProcessing: boolean
}

export default function DerivacionModal({ isOpen, onClose, onConfirm, isProcessing }: Props) {
  const [observacion, setObservacion] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!observacion.trim()) {
      alert("Debes escribir el Informe Técnico para derivar.")
      return
    }
    // Enviamos el texto al padre
    onConfirm(observacion) 
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Derivar Caso a VRA</h2>
        <p className="text-sm text-gray-500 mb-4">
          Es obligatorio adjuntar el <strong>Informe Técnico</strong> de Dirgegen.
        </p>

        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Informe Técnico / Observación *
          </label>
          <textarea
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-ubb-blue focus:ring-ubb-blue text-sm h-32 p-3 border"
            placeholder="Escribe aquí las conclusiones técnicas..."
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