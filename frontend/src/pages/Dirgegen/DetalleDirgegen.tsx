import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getDenunciaById, gestionarDenuncia, type DenunciaListado, type SolicitudMedida } from '@/services/denuncias.api'
import DerivacionModal from "@/pages/Denuncias/components/Derivacion"
import InformeTecnicoModal from './components/InformeTecnicoModal'
import { useAuth } from '@/context/AuthContext'

export default function DetalleDirgegen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [denuncia, setDenuncia] = useState<DenunciaListado | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false) // Modal Derivación
  const [showInformeModal, setShowInformeModal] = useState(false) // Modal Informe Técnico
  const [processing, setProcessing] = useState(false)

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

  const handleDerivacionConfirm = async (observacion: string) => {
    if (!denuncia) return
    try {
      setProcessing(true)
      await gestionarDenuncia(denuncia.ID_Denuncia, { observacion, nuevoEstadoId: 3 })
      setShowModal(false)
      alert('Denuncia derivada exitosamente a VRA.')
      navigate('/dirgegen/bandeja')
    } catch (error) {
      console.error(error)
      alert('Error al derivar.')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) return (
    <div className="flex h-64 items-center justify-center text-ubb-blue font-medium animate-pulse">
      Cargando caso...
    </div>
  )
  
  if (!denuncia) return (
    <div className="p-10 text-center text-red-600 font-bold border border-red-200 bg-red-50 rounded-lg mx-auto max-w-lg mt-10">
      Error: Denuncia no encontrada.
    </div>
  )

  const solicitudesDeMedida: SolicitudMedida[] = denuncia.solicitudes_medidas || [];
  const solicitudPendiente = solicitudesDeMedida.find((s: SolicitudMedida) => s.Estado === 'Pendiente Informe');
  
  // ✅ Detectar si ya existe informe
  const tieneInforme = !!(denuncia.informe_tecnico );
  console.log("¿Tiene informe?", tieneInforme);

  return (
    <section className="mx-auto max-w-5xl pb-12 px-4 py-8 space-y-6">
      
      {/* =================================================================================
          SECCIÓN DE ALERTAS DE ESTADO (PRIORIDAD ALTA)
          ================================================================================= */}
      
      <div className="space-y-4">
        {/* 1. Alerta de Medidas Pendientes (ROJO/AMARILLO) */}
        {solicitudesDeMedida.length > 0 && (
            <div className={`rounded-lg border shadow-sm overflow-hidden ${solicitudPendiente ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-white'}`}>
                <div className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{solicitudPendiente ? '🚨' : '🛡️'}</span>
                        <div>
                            <h2 className={`text-sm font-bold uppercase tracking-wider ${solicitudPendiente ? 'text-red-800' : 'text-ubb-blue'}`}>
                                {solicitudPendiente ? 'Acción Requerida: Solicitud de Medida Pendiente' : 'Historial de Medidas de Resguardo'}
                            </h2>
                            {solicitudPendiente && <p className="text-xs text-red-600 mt-1">Se requiere evaluar la solicitud para avanzar.</p>}
                        </div>
                    </div>
                    {/* Botón de acción rápida si no hay informe aún */}
                    {solicitudPendiente && !tieneInforme && (
                        <button
                            onClick={() => setShowInformeModal(true)}
                            className="text-xs bg-white border border-red-300 text-red-700 px-3 py-2 rounded-md font-bold hover:bg-red-50 shadow-sm transition-colors"
                        >
                            Gestionar Ahora
                        </button>
                    )}
                </div>
            </div>
        )}

        {/* 2. ✅ MENSAJE DE ÉXITO: INFORME TÉCNICO EMITIDO (VERDE) */}
        {tieneInforme && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 flex items-start gap-4 shadow-sm animate-in fade-in slide-in-from-top-2">
                <div className="bg-green-100 p-2 rounded-full text-green-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <div>
                    <h3 className="text-sm font-bold text-green-800 uppercase tracking-wide">Informe Técnico Psicosociojurídico Emitido</h3>
                    <p className="text-sm text-green-700 mt-1">
                        Este caso ya cuenta con un informe oficial asociado. No es necesario generar uno nuevo.
                        Puede visualizarlo o descargarlo en la sección inferior.
                    </p>
                    <div className="mt-2 flex gap-4 text-xs text-green-800/70 font-medium">
                        <span>ID Informe: #{denuncia.informe_tecnico?.ID_Informe}</span>
                        <span>•</span>
                        <span>Estado: Finalizado</span>
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* --- HEADER PRINCIPAL --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4 pt-2">
        <div>
          <h1 className="font-condensed text-3xl font-bold text-gray-900">
            Gestión de Caso #{denuncia.ID_Denuncia}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Protocolo de Género y Equidad (DUE 4560)</p>
        </div>
        <span className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-bold border ${
          denuncia.estado_denuncia?.Tipo_Estado === 'Cerrada' ? 'bg-gray-100 text-gray-600 border-gray-200' : 'bg-blue-50 text-blue-700 border-blue-200'
        }`}>
          {denuncia.estado_denuncia?.Tipo_Estado}
        </span>
      </div>

      {/* --- TARJETA DE DETALLE DEL CASO --- */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <dt className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Tipo de Denuncia</dt>
              <dd className="text-base font-semibold text-gray-900">{denuncia.tipo_denuncia?.Nombre}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Fecha de Ingreso</dt>
              <dd className="text-base font-medium text-gray-900">{new Date(denuncia.Fecha_Inicio).toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</dd>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <dt className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Identidad Denunciante</dt>
              <dd className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">Usuario Confidencial</span>
                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded font-mono">
                  {denuncia.Rut}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Ubicación</dt>
              <dd className="text-sm font-medium text-gray-900">{denuncia.Ubicacion || 'No informada'}</dd>
            </div>
          </div>

          <div>
            <dt className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Relato de los Hechos</dt>
            <div className="w-full rounded-lg border border-gray-200 bg-gray-50/50 p-5 text-sm text-gray-700 min-h-[120px] whitespace-pre-wrap leading-relaxed">
              {denuncia.Relato_Hechos}
            </div>
          </div>
        </div>

        {/* --- FOOTER DE ACCIONES --- */}
        <div className="bg-gray-50 px-6 py-5 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
            
            {/* Mensaje de estado en el footer (Opcional, refuerzo) */}
            <div className="text-xs text-gray-500 font-medium">
                {tieneInforme 
                    ? "✅ Documentación técnica completa." 
                    : "⚠️ Pendiente: Emisión de Informe Técnico."
                }
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                {/* LÓGICA DEL BOTÓN PRINCIPAL:
                    - Si TIENE informe: Botón Verde (Ver/Descargar).
                    - Si NO TIENE informe: Botón Azul/Gris (Crear).
                */}
                {tieneInforme ? (
                    <button 
                        onClick={() => alert(`Descargando PDF del Informe #${denuncia.informe_tecnico?.ID_Informe}`)}
                        className="px-5 py-2.5 bg-white border border-green-500 text-green-700 rounded-lg text-sm font-bold hover:bg-green-50 shadow-sm transition-all flex items-center justify-center gap-2"
                    >
                        <span>📄</span> Ver Informe Técnico
                    </button>
                ) : (
                    <button 
                        onClick={() => setShowInformeModal(true)}
                        className="px-5 py-2.5 bg-ubb-blue text-white rounded-lg text-sm font-bold hover:bg-blue-900 shadow-md transition-all flex items-center justify-center gap-2"
                    >
                        <span>📝</span> Generar Informe Técnico
                    </button>
                )}
                
                <div className="h-auto w-px bg-gray-300 hidden sm:block mx-1"></div>

                <button
                    onClick={() => setShowModal(true)}
                    className="px-5 py-2.5 bg-white border border-orange-300 text-orange-600 rounded-lg text-sm font-bold hover:bg-orange-50 transition-all flex items-center justify-center gap-2"
                >
                    <span>↗️</span> Derivar Caso
                </button>
            </div>
        </div>
      </div> 

      <div className="flex justify-start pt-2"> 
        <button onClick={() => navigate('/dirgegen/bandeja')} className="text-sm font-medium text-gray-500 hover:text-ubb-blue transition-colors flex items-center gap-2">
          ← Volver a la Bandeja
        </button>
      </div>

      {/* --- MODALES --- */}
      <DerivacionModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        // @ts-ignore
        onConfirm={handleDerivacionConfirm}
        isProcessing={processing}
      />

      {/* Solo mostramos el modal si NO tiene informe, por seguridad extra */}
      {denuncia && !tieneInforme && (
        <InformeTecnicoModal
          isOpen={showInformeModal}
          onClose={() => setShowInformeModal(false)}
          onSuccess={() => cargarDatos()}
          idDenuncia={denuncia.ID_Denuncia}
          // @ts-ignore
          idAutor={user?.id || 0} 
          denunciaData={denuncia} // Pasamos la data para el acordeón
        />
      )}

    </section>
  )
}