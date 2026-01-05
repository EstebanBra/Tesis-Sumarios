import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    solicitarCodigoVerificacion,
    verificarCodigoEmail,
} from '@/services/verificacionEmail.api'

export default function VerificacionEmail() {
    const navigate = useNavigate()
    const [codigo, setCodigo] = useState(['', '', '', '', '', ''])
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [emailEnmascarado, setEmailEnmascarado] = useState('')
    const [rut, setRut] = useState('')
    const [intentosRestantes, setIntentosRestantes] = useState(3)
    const [reenviando, setReenviando] = useState(false)

    useEffect(() => {
        // Obtener datos de sessionStorage
        const datosTemp = sessionStorage.getItem('datosTempDenunciante')
        if (!datosTemp) {
            navigate('/acceso-denuncia')
            return
        }

        const datos = JSON.parse(datosTemp)
        setRut(datos.rut)
        setEmailEnmascarado(datos.emailEnmascarado)
    }, [navigate])

    const handleInputChange = (index: number, value: string) => {
        // Solo permitir números
        if (value && !/^\d$/.test(value)) return

        const newCodigo = [...codigo]
        newCodigo[index] = value

        setCodigo(newCodigo)
        setError('')

        // Auto-focus al siguiente input
        if (value && index < 5) {
            const nextInput = document.getElementById(`codigo-${index + 1}`)
            nextInput?.focus()
        }
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !codigo[index] && index > 0) {
            const prevInput = document.getElementById(`codigo-${index - 1}`)
            prevInput?.focus()
        }
    }

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault()
        const pastedData = e.clipboardData.getData('text').trim()

        if (/^\d{6}$/.test(pastedData)) {
            const newCodigo = pastedData.split('')
            setCodigo(newCodigo)
            setError('')

            // Focus en el último input
            const lastInput = document.getElementById('codigo-5')
            lastInput?.focus()
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const codigoCompleto = codigo.join('')
        if (codigoCompleto.length !== 6) {
            setError('Por favor ingresa los 6 dígitos del código')
            return
        }

        setError('')
        setLoading(true)

        try {
            const datos = await verificarCodigoEmail(rut, codigoCompleto)

            // Guardar datos verificados en sessionStorage
            sessionStorage.removeItem('datosTempDenunciante')
            sessionStorage.setItem('datosDenunciante', JSON.stringify(datos))

            // Navegar según roles
            if (datos.roles.length > 1) {
                navigate('/seleccion-rol')
            } else if (datos.roles.length === 1) {
                const datosConRol = { ...datos, rolSeleccionado: datos.roles[0] }
                sessionStorage.setItem(
                    'datosDenunciante',
                    JSON.stringify(datosConRol)
                )
                navigate('/denuncias/nueva')
            }
        } catch (err: any) {
            const errorMsg =
                err.response?.data?.message || 'Código incorrecto. Intenta nuevamente'
            setError(errorMsg)

            const restantes = err.response?.data?.intentosRestantes
            if (restantes !== undefined) {
                setIntentosRestantes(restantes)
            }

            // Limpiar código
            setCodigo(['', '', '', '', '', ''])
            document.getElementById('codigo-0')?.focus()
        } finally {
            setLoading(false)
        }
    }

    const handleReenviarCodigo = async () => {
        setReenviando(true)
        setError('')

        try {
            const resultado = await solicitarCodigoVerificacion(rut)
            setEmailEnmascarado(resultado.emailEnmascarado)
            setIntentosRestantes(3)
            setCodigo(['', '', '', '', '', ''])
            document.getElementById('codigo-0')?.focus()

            // Mostrar mensaje de éxito temporal
            setError('✓ Código reenviado exitosamente')
            setTimeout(() => setError(''), 3000)
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                    'Error al reenviar el código. Intenta nuevamente'
            )
        } finally {
            setReenviando(false)
        }
    }

    return (
        <div className="w-full max-w-[520px] bg-white shadow-lg border border-gray-300">
            <div className="h-1.5 w-full bg-ubb-blue"></div>

            <div className="p-10">
                    {/* Encabezado */}
                    <div className="mb-8 text-center">
                        <div className="mb-4 flex justify-center">
                            <span className="font-condensed text-3xl font-bold text-gray-800 tracking-tight">
                                Verificación de Correo
                            </span>
                        </div>
                        <p className="text-sm text-gray-600">
                            Hemos enviado un código de verificación a
                        </p>
                        <p className="text-base font-semibold text-ubb-blue mt-1">
                            {emailEnmascarado}
                        </p>
                    </div>

                    {/* Mensaje de error/éxito */}
                    {error && (
                        <div
                            className={`mb-6 rounded border p-3 text-sm ${
                                error.startsWith('✓')
                                    ? 'border-green-200 bg-green-50 text-green-700'
                                    : 'border-red-200 bg-red-50 text-red-700'
                            }`}
                        >
                            {error}
                            {intentosRestantes > 0 && !error.startsWith('✓') && (
                                <div className="mt-1 text-xs">
                                    Intentos restantes: {intentosRestantes}
                                </div>
                            )}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Inputs del código */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
                                Ingresa el código de 6 dígitos
                            </label>
                            <div className="flex justify-center gap-2">
                                {codigo.map((digit, index) => (
                                    <input
                                        key={index}
                                        id={`codigo-${index}`}
                                        type="text"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) =>
                                            handleInputChange(index, e.target.value)
                                        }
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        onPaste={handlePaste}
                                        className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded focus:border-ubb-blue focus:outline-none focus:ring-2 focus:ring-ubb-blue/20"
                                        disabled={loading}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Botón Verificar */}
                        <button
                            type="submit"
                            disabled={loading || codigo.join('').length !== 6}
                            className="w-full bg-ubb-blue px-4 py-3 text-sm font-bold text-white disabled:bg-ubb-blue/50 transition-colors uppercase tracking-wide hover:bg-ubb-blue/90"
                        >
                            {loading ? 'VERIFICANDO...' : 'VERIFICAR CÓDIGO'}
                        </button>
                    </form>

                    {/* Reenviar código */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600 mb-2">
                            ¿No recibiste el código?
                        </p>
                        <button
                            type="button"
                            onClick={handleReenviarCodigo}
                            disabled={reenviando}
                            className="text-sm text-ubb-blue hover:underline font-semibold disabled:text-gray-400 disabled:no-underline transition-colors"
                        >
                            {reenviando ? 'Reenviando...' : 'Reenviar código'}
                        </button>
                    </div>

                    {/* Información adicional */}
                    <div className="mt-8 space-y-4">
                        <div className="border-t border-gray-200 pt-6">
                            <p className="text-xs text-gray-600">
                                <strong>💡 Consejos:</strong>
                            </p>
                            <ul className="text-xs text-gray-600 space-y-1 ml-4 list-disc mt-2">
                                <li>Revisa tu bandeja de entrada y spam</li>
                                <li>El código expira en 5 minutos</li>
                                <li>Tienes 3 intentos para ingresar el código correcto</li>
                            </ul>
                        </div>

                        <div className="text-center border-t border-gray-200 pt-4">
                            <button
                                type="button"
                                onClick={() => {
                                    sessionStorage.removeItem('datosTempDenunciante')
                                    navigate('/acceso-denuncia')
                                }}
                                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                ← Volver al ingreso de RUT
                            </button>
                        </div>
                    </div>
                </div>
        </div>
    )
}
