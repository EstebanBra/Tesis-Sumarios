import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getDenunciaById, type DenunciaListado } from '@/services/denuncias.api'
import { useAuth } from '@/context/AuthContext'
import SolicitudFiscaliaModal from './components/SolicitudFiscaliaModal'
import DerivacionAutoridadModal from './components/DerivacionAutoridadModal'
import InstruirInvestigacionModal from './components/InstruirInvestigacionModal'

export default function DetalleAutoridad() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user, hasRole } = useAuth()

    const [denuncia, setDenuncia] = useState<DenunciaListado | null>(null)
    const [loading, setLoading] = useState(true)

    // Estados para los modales
    const [showSolicitudFiscalia, setShowSolicitudFiscalia] = useState(false)
    const [showDerivacion, setShowDerivacion] = useState(false)
    const [showInstruirInvestigacion, setShowInstruirInvestigacion] = useState(false)
    const [processing, setProcessing] = useState(false)

    // Determinar autoridad actual
    const autoridadActual = (hasRole('VRA') ? 'VRA' : 'VRAE') as 'VRA' | 'VRAE'

    useEffect(() => {
        if (!id) return
        cargarDatos()
    }, [id])

    async function cargarDatos() {
        try {
            const data = await getDenunciaById(Number(id))
            setDenuncia(data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    // Verificar si se puede instruir investigación (habilitado solo si ya tiene recomendación de fiscalía)
    const puedeInstruirInvestigacion = denuncia?.estado_denuncia?.Tipo_Estado === 'Recomendación Recibida' ||
        denuncia?.estado_denuncia?.Tipo_Estado === 'En Investigación'

    // Handler para solicitar recomendación a fiscalía
    const handleSolicitudFiscalia = async (fundamentos: string) => {
        if (!denuncia) return
        try {
            setProcessing(true)
            // TODO: Implementar llamada al backend
            console.log('Solicitar recomendación a fiscalía:', { id: denuncia.ID_Denuncia, fundamentos })

            setShowSolicitudFiscalia(false)
            alert('Solicitud enviada a Fiscalía exitosamente (funcionalidad pendiente)')
            navigate('/autoridad/bandeja')
        } catch (error) {
            console.error(error)
            alert('Error al enviar solicitud')
        } finally {
            setProcessing(false)
        }
    }

    // Handler para derivar a otra autoridad
    const handleDerivacion = async (observacion: string, autoridadDestino: string) => {
        if (!denuncia) return
        try {
            setProcessing(true)
            // TODO: Implementar llamada al backend
            console.log('Derivar a otra autoridad:', {
                id: denuncia.ID_Denuncia,
                observacion,
                destino: autoridadDestino
            })

            setShowDerivacion(false)
            alert(`Denuncia derivada exitosamente a ${autoridadDestino} (funcionalidad pendiente)`)
            navigate('/autoridad/bandeja')
        } catch (error) {
            console.error(error)
            alert('Error al derivar')
        } finally {
            setProcessing(false)
        }
    }

    // Handler para instruir investigación sumaria
    const handleInstruirInvestigacion = async (fiscalDesignado: string, observaciones: string) => {
        if (!denuncia) return
        try {
            setProcessing(true)
            // TODO: Implementar llamada al backend
            console.log('Instruir investigación sumaria:', {
                id: denuncia.ID_Denuncia,
                fiscalDesignado,
                observaciones
            })

            setShowInstruirInvestigacion(false)
            alert('Investigación sumaria instruida exitosamente (funcionalidad pendiente)')
            navigate('/autoridad/bandeja')
        } catch (error) {
            console.error(error)
            alert('Error al instruir investigación')
        } finally {
            setProcessing(false)
        }
    }

    if (loading) return <div className="p-10 text-center text-gray-500">Cargando caso...</div>
    if (!denuncia) return <div className="p-10 text-center text-red-600">Denuncia no encontrada.</div>

    return (
        <section className="mx-auto max-w-5xl pb-12 px-4 py-8">

            {/* HEADER TÍTULO */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="font-condensed text-3xl font-bold text-gray-900">
                    Gestión de Caso #{denuncia.ID_Denuncia}
                </h1>
                <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm font-medium text-gray-600">
                    Estado: {denuncia.estado_denuncia?.Tipo_Estado}
                </span>
            </div>

            {/* TARJETA RESUMEN */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">

                {/* Encabezado Tarjeta */}
                <div className="border-b border-gray-100 px-6 py-4 bg-white">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-ubb-blue">
                        Resumen General
                    </h2>
                </div>

                <div className="p-6 space-y-6">

                    {/* Fila 1: TIPO */}
                    <div>
                        <dt className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">
                            Tipo
                        </dt>
                        <dd className="text-sm font-semibold text-gray-900">
                            {denuncia.tipo_denuncia?.Nombre}
                        </dd>
                    </div>

                    {/* Fila 2: DENUNCIANTE y FECHA */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <dt className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">
                                Denunciante
                            </dt>
                            <dd className="text-sm font-medium text-gray-900">
                                Usuario Anónimo ({denuncia.Rut})
                            </dd>
                        </div>
                        <div>
                            <dt className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">
                                Fecha Hecho
                            </dt>
                            <dd className="text-sm font-medium text-gray-900">
                                {denuncia.Fecha_Fin ? (
                                    <span>
                                        Del {new Date(denuncia.Fecha_Inicio).toLocaleDateString()} al {new Date(denuncia.Fecha_Fin).toLocaleDateString()}
                                    </span>
                                ) : (
                                    new Date(denuncia.Fecha_Inicio).toLocaleDateString()
                                )}
                            </dd>
                        </div>
                    </div>

                    {/* Fila 3: UBICACIÓN */}
                    <div>
                        <dt className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">
                            Ubicación
                        </dt>
                        <dd className="text-sm font-medium text-gray-900">
                            {denuncia.Ubicacion || 'No informada'}
                        </dd>
                    </div>

                    {/* Fila 4: RELATO */}
                    <div>
                        <dt className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">
                            Relato
                        </dt>
                        <div className="w-full rounded-md border border-gray-200 bg-white p-4 text-sm text-gray-700 min-h-[100px] whitespace-pre-wrap leading-relaxed shadow-sm">
                            {denuncia.Relato_Hechos}
                        </div>
                    </div>

                </div>

                {/* FOOTER CON BOTONES DE ACCIÓN */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row justify-end gap-3">

                    {/* Botón 1: Solicitar Recomendación a Fiscalía */}
                    <button
                        onClick={() => setShowSolicitudFiscalia(true)}
                        className="px-4 py-2 bg-ubb-blue border border-ubb-blue text-white rounded-md text-sm font-bold hover:bg-blue-900 shadow-sm transition-colors flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                        Solicitar Recomendación a Fiscalía
                    </button>

                    {/* Botón 2: Derivar a Otra Autoridad */}
                    <button
                        onClick={() => setShowDerivacion(true)}
                        className="px-4 py-2 bg-white border border-orange-500 text-orange-600 rounded-md text-sm font-bold hover:bg-orange-50 shadow-sm flex items-center justify-center gap-2 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
                        </svg>
                        Derivar a Otra Autoridad
                    </button>

                    {/* Botón 3: Instruir Investigación Sumaria (Condicional) */}
                    <div className="relative group">
                        <button
                            onClick={() => puedeInstruirInvestigacion && setShowInstruirInvestigacion(true)}
                            disabled={!puedeInstruirInvestigacion}
                            className={`px-4 py-2 rounded-md text-sm font-bold shadow-sm flex items-center justify-center gap-2 transition-colors
                ${puedeInstruirInvestigacion
                                    ? 'bg-green-600 text-white hover:bg-green-700 border border-green-600'
                                    : 'bg-gray-200 text-gray-400 border border-gray-300 cursor-not-allowed'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                            Instruir Investigación Sumaria
                        </button>

                        {/* Tooltip cuando está deshabilitado */}
                        {!puedeInstruirInvestigacion && (
                            <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 hidden group-hover:block z-10">
                                <div className="bg-gray-800 text-white text-xs rounded py-1 px-3 whitespace-nowrap">
                                    Pendiente de recomendación de Fiscalía
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* BOTÓN VOLVER */}
            <div className="mt-8 flex justify-start">
                <button
                    onClick={() => navigate('/autoridad/bandeja')}
                    className="inline-flex items-center justify-center rounded-md bg-ubb-blue px-6 py-2 text-sm font-bold text-white hover:bg-blue-900 transition-colors shadow-md"
                >
                    ← Volver a la Bandeja de Casos
                </button>
            </div>

            {/* MODALES */}
            <SolicitudFiscaliaModal
                isOpen={showSolicitudFiscalia}
                onClose={() => setShowSolicitudFiscalia(false)}
                onConfirm={handleSolicitudFiscalia}
                isProcessing={processing}
            />

            <DerivacionAutoridadModal
                isOpen={showDerivacion}
                onClose={() => setShowDerivacion(false)}
                onConfirm={handleDerivacion}
                isProcessing={processing}
                autoridadActual={autoridadActual}
            />

            <InstruirInvestigacionModal
                isOpen={showInstruirInvestigacion}
                onClose={() => setShowInstruirInvestigacion(false)}
                onConfirm={handleInstruirInvestigacion}
                isProcessing={processing}
            />
        </section>
    )
}
