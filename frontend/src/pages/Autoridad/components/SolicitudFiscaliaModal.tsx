import { useState } from 'react'

interface Props {
    isOpen: boolean
    onClose: () => void
    onConfirm: (fundamentos: string) => void
    isProcessing: boolean
}

export default function SolicitudFiscaliaModal({ isOpen, onClose, onConfirm, isProcessing }: Props) {
    const [fundamentos, setFundamentos] = useState('')

    if (!isOpen) return null

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!fundamentos.trim()) {
            alert("Debes escribir los fundamentos de la solicitud.")
            return
        }
        onConfirm(fundamentos)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Solicitar Recomendación a Fiscalía</h2>
                <p className="text-sm text-gray-500 mb-4">
                    Se remitirá el caso a Fiscalía para que emita su recomendación sobre el procedimiento a seguir.
                </p>

                <form onSubmit={handleSubmit}>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Fundamentos de la Solicitud *
                    </label>
                    <textarea
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-ubb-blue focus:ring-ubb-blue text-sm h-32 p-3 border"
                        placeholder="Describe los fundamentos y antecedentes relevantes del caso..."
                        value={fundamentos}
                        onChange={(e) => setFundamentos(e.target.value)}
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
                            disabled={isProcessing || !fundamentos.trim()}
                            className="rounded-md bg-ubb-blue px-4 py-2 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-50"
                        >
                            {isProcessing ? 'Enviando...' : 'Enviar Solicitud'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
