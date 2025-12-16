import { useState } from 'react'

interface Props {
    isOpen: boolean
    onClose: () => void
    onConfirm: (fiscalDesignado: string, observaciones: string) => void
    isProcessing: boolean
}

export default function InstruirInvestigacionModal({
    isOpen,
    onClose,
    onConfirm,
    isProcessing
}: Props) {
    const [fiscalDesignado, setFiscalDesignado] = useState('')
    const [observaciones, setObservaciones] = useState('')

    if (!isOpen) return null

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!fiscalDesignado.trim()) {
            alert("Debes designar el fiscal para la investigación.")
            return
        }
        onConfirm(fiscalDesignado, observaciones)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Instruir Investigación Sumaria
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                    Designa al fiscal recomendado por Fiscalía para llevar a cabo la investigación sumaria.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Fiscal Designado *
                        </label>
                        <input
                            type="text"
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm p-3 border"
                            placeholder="Nombre completo del fiscal designado"
                            value={fiscalDesignado}
                            onChange={(e) => setFiscalDesignado(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Observaciones (Opcional)
                        </label>
                        <textarea
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm h-24 p-3 border"
                            placeholder="Instrucciones adicionales o consideraciones especiales..."
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
                        />
                    </div>

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
                            disabled={isProcessing || !fiscalDesignado.trim()}
                            className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                        >
                            {isProcessing ? 'Procesando...' : 'Confirmar Instrucción'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
