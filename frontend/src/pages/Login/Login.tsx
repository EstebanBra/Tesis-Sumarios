import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'


export default function Login() {
    const { login } = useAuth()
    const [rut, setRut] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            await login(rut, password)
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al iniciar sesión')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex max-h-screen flex-col items-center justify-center bg-gray-50">
            {/* Tarjeta principal */}
            <div className="w-full max-w-[480px] bg-white shadow-lg border border-gray-300">
                {/* Encabezado con barra de colores (opcional, para dar toque institucional) */}
                <div className="h-1.5 w-full bg-ubb-blue"></div>

                <div className="p-10">
                    {/* Logo / Título */}
                    <div className="mb-8 text-center">
                        <div className="mb-4 flex justify-center">
                            {/* Aquí podría ir el logo si se desea, por ahora solo texto estilizado */}
                            <span className="font-condensed text-3xl font-bold text-gray-800 tracking-tight h-16">
                                Portal de Denuncias UBB
                            </span>
                        </div>
                    </div>

                    {/* Mensaje de error */}
                    {error && (
                        <div className="mb-6 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Input RUN */}
                        <div>
                            <input
                                type="text"
                                className="w-full rounded-none border border-gray-400 px-4 py-3 text-gray-700 placeholder-gray-500 focus:border-ubb-blue focus:outline-none focus:ring-1 focus:ring-ubb-blue"
                                placeholder="Ingresa tu RUN"
                                value={rut}
                                onChange={(e) => setRut(e.target.value)}
                                required
                            />
                        </div>

                        {/* Input Contraseña */}
                        <div>
                            <input
                                type="password"
                                className="w-full rounded-none border border-gray-400 px-4 py-3 text-gray-700 placeholder-gray-500 focus:border-ubb-blue focus:outline-none focus:ring-1 focus:ring-ubb-blue"
                                placeholder="Ingresa tu contraseña"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        {/* Botón Ingresar */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-ubb-blue px-4 py-3 text-sm font-bold text-white disabled:bg-ubb-blue/50 transition-colors uppercase tracking-wide"
                        >
                            {loading ? 'AUTENTICANDO...' : 'INGRESA'}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-xs text-gray-500 mt-6 text-center">
                            ¿Necesitas ayuda? comunícate con{' '}
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
