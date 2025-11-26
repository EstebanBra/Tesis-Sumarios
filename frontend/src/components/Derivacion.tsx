import { useState } from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
  onConfirm: (tipoId: number) => void 
  isProcessing: boolean
}

export default function DerivacionModal({ isOpen, onClose, onConfirm, isProcessing }: Props) {
  
  const [tipoDestino, setTipoDestino] = useState('4') 

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <h2 className="font-condensed text-xl font-bold text-gray-900">Derivar a otra unidad</h2>
        
        <div className="mt-4 space-y-4">
          <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800">
            Al derivar, la denuncia cambiará de competencia y su estado se reiniciará a <strong>"Recibida"</strong>.
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nueva Clasificación
            </label>
            <select
              value={tipoDestino}
              onChange={(e) => setTipoDestino(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-ubb-blue focus:outline-none focus:ring-1 focus:ring-ubb-blue"
            >
              
              <option value="4">Falta a la Convivencia (VRA)</option>
              <option value="5">Falta Académica (VRA)</option>
            </select>
          </div>
          
         
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(Number(tipoDestino))}
            disabled={isProcessing}
            className="rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
          >
            {isProcessing ? 'Procesando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}