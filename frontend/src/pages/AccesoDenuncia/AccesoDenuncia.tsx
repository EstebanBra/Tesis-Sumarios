import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { buscarPorRut } from '@/services/datosExternos.api'
import { solicitarCodigoVerificacion } from '@/services/verificacionEmail.api'
import { limpiarRut } from '@/utils/validation.utils'

export default function AccesoDenuncia() {
    const navigate = useNavigate()
    const [rut, setRut] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const rutLimpio = limpiarRut(rut)

            if (!rutLimpio) {
                setError('Por favor ingresa un RUT válido')
                setLoading(false)
                return
            }

            // Verificar que el RUT existe en la base de datos
            const datos = await buscarPorRut(rutLimpio)

            if (!datos || !datos.email) {
                setError('El RUT no tiene un correo electrónico registrado')
                setLoading(false)
                return
            }

            // Solicitar código de verificación
            const resultado = await solicitarCodigoVerificacion(rutLimpio)

            // Guardar datos temporales para la verificación
            sessionStorage.setItem('datosTempDenunciante', JSON.stringify({
                rut: rutLimpio,
                emailEnmascarado: resultado.emailEnmascarado
            }))

            // Navegar a verificación de email
            navigate('/verificacion-email')
        } catch (err: any) {
            setError(err.response?.data?.message || 'No se encontraron datos para el RUT ingresado')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-full max-w-[480px] bg-white shadow-lg border border-gray-300">
            <div className="h-1.5 w-full bg-ubb-blue"></div>

            <div className="p-10">
                {/* Logo / Título */}
                <div className="mb-8 text-center">
                        <div className="mb-4 flex justify-center">
                            <span className="font-condensed text-3xl font-bold text-gray-800 tracking-tight">
                                Realizar una Denuncia
                            </span>
                        </div>
                        <p className="text-sm text-gray-600">
                            Ingresa tu RUT para continuar con el proceso de denuncia
                        </p>
                    </div>

                    {/* Mensaje de error */}
                    {error && (
                        <div className="mb-6 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Input RUT */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                RUT
                            </label>
                            <input
                                type="text"
                                className="w-full rounded-none border border-gray-400 px-4 py-3 text-gray-700 placeholder-gray-500 focus:border-ubb-blue focus:outline-none focus:ring-1 focus:ring-ubb-blue"
                                placeholder="12.345.678-9"
                                value={rut}
                                onChange={(e) => setRut(e.target.value)}
                                required
                            />
                            <p className="mt-2 text-xs text-gray-500">
                                Ingresa tu RUT sin puntos ni guión, o con el formato completo
                            </p>
                        </div>

                        {/* Botón Continuar */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-ubb-blue px-4 py-3 text-sm font-bold text-white disabled:bg-ubb-blue/50 transition-colors uppercase tracking-wide hover:bg-ubb-blue/90"
                        >
                            {loading ? 'VERIFICANDO...' : 'CONTINUAR'}
                        </button>
                    </form>

                    {/* Información adicional */}
                    <div className="mt-8 space-y-4">
                        <div className="border-t border-gray-200 pt-6">
                            <p className="text-xs text-gray-600 mb-3">
                                <strong>Nota:</strong> Este formulario es para realizar denuncias relacionadas con:
                            </p>
                            <ul className="text-xs text-gray-600 space-y-1 ml-4 list-disc">
                                <li>Género y Equidad</li>
                                <li>Convivencia Estudiantil</li>
                                <li>Campos Clínicos</li>
                            </ul>
                        </div>

                        <div className="border-t border-gray-200 pt-4">
                            <p className="text-xs text-gray-500 text-center">
                                ¿Eres parte del personal de la institución?{' '}
                                <a
                                    href="/login"
                                    className="text-ubb-blue hover:underline font-semibold transition-colors"
                                >
                                    Inicia sesión aquí
                                </a>
                            </p>
                        </div>

                        <div className="text-center">
                            <p className="text-xs text-gray-500">
                                ¿Necesitas ayuda? Comunícate con{' '}
                                <a
                                    href="mailto:desarrolloface@ubiobio.cl"
                                    className="text-ubb-blue hover:underline font-semibold transition-colors"
                                >
                                    desarrolloface@ubiobio.cl
                                </a>
                            </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
