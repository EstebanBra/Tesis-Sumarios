import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'

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
        <div className="flex min-h-screen flex-col items-center justify-center ">
            <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-2xl border border-gray-200">
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-bold text-gray-800">Clave Única</h1>
                    <p className="text-sm text-gray-500">Inicia sesión para continuar</p>
                </div>

                {error && (
                    <div className="mb-4 rounded bg-red-100 p-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">RUN</label>
                        <input
                            type="text"
                            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="12.345.678-9"
                            value={rut}
                            onChange={(e) => setRut(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Contraseña</label>
                        <input
                            type="password"
                            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:bg-blue-400"
                    >
                        {loading ? 'Autenticando...' : 'Ingresar'}
                    </button>
                </form>

                <div className="mt-6 text-center text-xs text-gray-500">
                    <p>Simulación de Clave Única para Tesis</p>
                </div>
            </div>
        </div>
    )
}
