import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { DatosExternosResponse } from '@/services/datosExternos.api'

export default function SeleccionRol() {
    const navigate = useNavigate()
    const [datos, setDatos] = useState<DatosExternosResponse | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const datosGuardados = sessionStorage.getItem('datosDenunciante')

        if (!datosGuardados) {
            navigate('/login')
            return
        }

        const datosParsed = JSON.parse(datosGuardados) as DatosExternosResponse
        setDatos(datosParsed)
    }, [navigate])

    const handleSeleccionarRol = (rol: 'Personal' | 'Alumno') => {
        if (!datos) return

        setLoading(true)

        const datosConRol = {
            ...datos,
            rolSeleccionado: rol
        }

        sessionStorage.setItem('datosDenunciante', JSON.stringify(datosConRol))
        navigate('/denuncias/nueva')
    }

    if (!datos) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-gray-500">Cargando...</div>
            </div>
        )
    }

    return (
        <div className="w-full max-w-2xl bg-white shadow-lg border border-gray-300">
            <div className="h-1.5 w-full bg-ubb-blue"></div>

            <div className="p-8">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">
                        Selecciona cómo deseas continuar
                    </h1>
                    <p className="text-gray-600 mb-6">
                        Detectamos que estás registrado(a) con múltiples roles. Por favor selecciona con cuál deseas realizar la denuncia.
                    </p>

                    <div className="mb-6 p-4 bg-gray-50 rounded border border-gray-200">
                        <p className="text-sm text-gray-600 mb-1">
                            <span className="font-semibold">Nombre:</span> {datos.nombre_completo}
                        </p>
                        <p className="text-sm text-gray-600">
                            <span className="font-semibold">RUT:</span> {datos.rut}-{datos.dv}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {datos.roles.includes('Personal') && (
                            <button
                                onClick={() => handleSeleccionarRol('Personal')}
                                disabled={loading}
                                className="p-6 border-2 border-gray-300 rounded hover:border-ubb-blue hover:bg-blue-50 transition-all disabled:opacity-50 text-left"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-lg font-bold text-gray-800">Personal</h3>
                                    <svg className="w-6 h-6 text-ubb-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                {datos.detalles.personal && (
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <p><span className="font-semibold">Cargo:</span> {datos.detalles.personal.cargo}</p>
                                        <p><span className="font-semibold">Unidad:</span> {datos.detalles.personal.unidad}</p>
                                    </div>
                                )}
                            </button>
                        )}

                        {datos.roles.includes('Alumno') && (
                            <button
                                onClick={() => handleSeleccionarRol('Alumno')}
                                disabled={loading}
                                className="p-6 border-2 border-gray-300 rounded hover:border-ubb-blue hover:bg-blue-50 transition-all disabled:opacity-50 text-left"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-lg font-bold text-gray-800">Alumno</h3>
                                    <svg className="w-6 h-6 text-ubb-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                                    </svg>
                                </div>
                                {datos.detalles.alumno && (
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <p><span className="font-semibold">Carrera:</span> {datos.detalles.alumno.carrera}</p>
                                        <p><span className="font-semibold">Sede:</span> {datos.detalles.alumno.sede}</p>
                                    </div>
                                )}
                            </button>
                        )}
                    </div>

                    <div className="mt-6">
                        <button
                            onClick={() => {
                                sessionStorage.removeItem('datosDenunciante')
                                navigate('/login')
                            }}
                            className="text-sm text-gray-600 hover:text-gray-800 underline"
                        >
                            ← Volver a ingresar RUT
                        </button>
                    </div>
                </div>
        </div>
    )
}
