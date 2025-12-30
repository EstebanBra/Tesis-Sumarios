import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listarDenuncias, type DenunciaListado } from '@/services/denuncias.api'
import { useAuth } from '@/context/AuthContext'

export default function BandejaAutoridad() {
    const [denuncias, setDenuncias] = useState<DenunciaListado[]>([])
    const [loading, setLoading] = useState(true)
    const { user, hasRole } = useAuth()
    const navigate = useNavigate()

    // Determinar si es VRA o VRAE según el rol del usuario
    const autoridad = hasRole('VRA') ? 'VRA' : 'VRAE'
    const nombreCompleto = autoridad === 'VRA'
        ? 'Vicerrectoría Académica'
        : 'Vicerrectoría de Asuntos Estudiantiles'

    useEffect(() => {
        async function loadData() {
            try {
                setLoading(true)
                // El Backend filtra automáticamente según el rol (VRA o VRAE)
                const res = await listarDenuncias({ page: 1, pageSize: 50 })
                setDenuncias(res.data)
            } catch (error) {
                console.error('Error cargando bandeja', error)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [])

    if (loading) return (
        <div className="flex items-center justify-center h-64 text-ubb-blue font-medium animate-pulse">
            Cargando denuncias asignadas...
        </div>
    )

    return (
        <section className="space-y-6 max-w-7xl mx-auto py-8 px-4">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="font-condensed text-3xl font-bold tracking-tight text-gray-900">
                        Bandeja de Entrada {autoridad}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {nombreCompleto} - Gestión de denuncias de su competencia
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Bienvenido(a), {user?.nombre || 'Autoridad'}
                    </span>
                    <div className="bg-ubb-blue text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm">
                        {denuncias.length} Casos Pendientes
                    </div>
                </div>
            </header>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-gray-200">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        <tr>
                            <th className="px-6 py-4">ID / Fecha</th>
                            <th className="px-6 py-4">Tipo de Denuncia</th>
                            <th className="px-6 py-4">Denunciante</th>
                            <th className="px-6 py-4">Estado</th>
                            <th className="px-6 py-4 text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {denuncias.map((d) => (
                            <tr key={d.ID_Denuncia} className="group hover:bg-blue-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-mono font-bold text-gray-900">#{d.ID_Denuncia}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">
                                        {d.Fecha_Fin ? (
                                            <span>
                                                {new Date(d.Fecha_Inicio).toLocaleDateString()} - {new Date(d.Fecha_Fin).toLocaleDateString()}
                                            </span>
                                        ) : (
                                            new Date(d.Fecha_Inicio).toLocaleDateString()
                                        )}
                                    </div>
                                </td>

                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-gray-900">
                                            {d.tipo_denuncia?.Nombre || 'Sin Clasificar'}
                                        </span>
                                    </div>
                                </td>

                                <td className="px-6 py-4">
                                    <span className="font-mono text-sm font-semibold text-gray-900">{d.denunciante?.Rut || 'N/A'}</span>
                                </td>

                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border
                    ${d.estado_denuncia?.Tipo_Estado === 'Recibida' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                            d.estado_denuncia?.Tipo_Estado === 'Derivada' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                d.estado_denuncia?.Tipo_Estado === 'En Investigación' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                    'bg-green-50 text-green-700 border-green-200'}`}>
                                        {d.estado_denuncia?.Tipo_Estado || 'Recibida'}
                                    </span>
                                </td>

                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => navigate(`/autoridad/denuncia/${d.ID_Denuncia}`)}
                                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md bg-white border border-gray-300 px-4 py-2 text-xs font-bold uppercase tracking-wide text-gray-700 shadow-sm transition-all hover:bg-ubb-blue hover:text-white hover:border-ubb-blue group-hover:border-blue-300"
                                    >
                                        Revisar y Gestionar
                                    </button>
                                </td>
                            </tr>
                        ))}

                        {denuncias.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-16 text-center">
                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
                                        <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900">¡Todo al día!</h3>
                                    <p className="mt-1 text-sm text-gray-500">No hay denuncias pendientes de revisión en tu bandeja.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    )
}
