import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getDenunciaById, gestionarDenuncia, type DenunciaListado, type SolicitudMedida } from '@/services/denuncias.api'
import DerivacionModal from "@/pages/Denuncias/components/Derivacion"
import InformeTecnicoModal from './components/InformeTecnicoModal'
import { useAuth } from '@/context/AuthContext'

export default function DetalleDirgegen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth() // Obtener usuario logueado
  
  const [denuncia, setDenuncia] = useState<DenunciaListado | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false) // Modal Derivación
  const [showInformeModal, setShowInformeModal] = useState(false) // Modal Informe Técnico
  const [processing, setProcessing] = useState(false)

  // Cargar datos al montar el componente
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

  // Lógica para derivar denuncia (si no corresponde a Dirgegen)
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

  // Estados de carga y error
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

  // Filtrar solicitudes de medida pendientes
  const solicitudesDeMedida: SolicitudMedida[] = denuncia.solicitudes_medidas || [];
  const solicitudPendiente = solicitudesDeMedida.find((s: SolicitudMedida) => s.Estado === 'Pendiente Informe');

  return (
    <section className="mx-auto max-w-5xl pb-12 px-4 py-8 space-y-8">
      
      {/* --- SECCIÓN 1: ALERTA DE MEDIDAS DE RESGUARDO (Prioridad Alta) --- */}
      {solicitudesDeMedida.length > 0 && (
        <div className="rounded-xl border border-blue-200 bg-white shadow-lg overflow-hidden ring-1 ring-blue-100">
            
            {/* Cabecera de la sección de medidas */}
            <div className={`px-6 py-4 border-b border-gray-100 flex items-center justify-between ${solicitudPendiente ? 'bg-red-50' : 'bg-blue-50'}`}>
                <h2 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${solicitudPendiente ? 'text-red-700' : 'text-ubb-blue'}`}>
                    {solicitudPendiente ? '🚨 SOLICITUD DE MEDIDA PENDIENTE' : '✔️ Historial de Solicitudes de Resguardo'}
                </h2>
                {solicitudPendiente && (
                  <span className="text-xs font-bold bg-red-200 text-red-800 px-2 py-1 rounded animate-pulse">
                    Acción Requerida
                  </span>
                )}
            </div>
            
            {/* Lista de Solicitudes */}
            {solicitudesDeMedida.map((solicitud: SolicitudMedida) => (
              <div key={solicitud.ID_Solicitud} className={`p-6 border-b last:border-0 ${solicitud.Estado === 'Pendiente Informe' ? 'bg-yellow-50/50' : ''}`}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="md:col-span-2">
                        <dt className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Tipo de Medida Solicitada:</dt>
                        <dd className="font-semibold text-gray-900 text-lg">{solicitud.Tipo_Medida}</dd>
                    </div>
                    <div>
                        <dt className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Estado Actual:</dt>
                        <dd className={`font-bold inline-flex px-2 py-1 rounded text-xs ${
                          solicitud.Estado === 'Aprobada' ? 'bg-green-100 text-green-700' : 
                          solicitud.Estado === 'Pendiente Informe' ? 'bg-red-100 text-red-700' : 
                          'bg-gray-100 text-gray-600'
                        }`}>
                            {solicitud.Estado}
                        </dd>
                    </div>
                    <div className="md:col-span-3 mt-2">
                        <dt className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Justificación de la Víctima:</dt>
                        <dd className="text-gray-700 italic border-l-4 border-gray-300 pl-4 py-1 bg-gray-50/50 rounded-r">
                            "{solicitud.Observacion || 'No se proporcionó justificación adicional.'}"
                        </dd>
                    </div>
                </div>

                {/* BOTÓN DE ACCIÓN RÁPIDA EN LA ALERTA */}
                {solicitud.Estado === 'Pendiente Informe' && !denuncia.informe_tecnico && (
                    <div className="mt-5 pt-4 border-t border-yellow-200 flex justify-end">
                        <button
                            onClick={() => setShowInformeModal(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-ubb-blue text-white rounded-lg text-sm font-bold hover:bg-blue-900 shadow-md transition-all transform hover:-translate-y-0.5"
                        >
                            <span>✍️</span>
                            Gestionar Solicitud (Redactar Informe)
                        </button>
                    </div>
                )}
              </div>
            ))}
        </div>
      )}
      
      {/* --- HEADER PRINCIPAL DEL CASO --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="font-condensed text-3xl font-bold text-gray-900">
            Gestión de Caso #{denuncia.ID_Denuncia}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Protocolo de Género y Equidad (DUE 4560)</p>
        </div>
        <span className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-bold border ${
          denuncia.estado_denuncia?.Tipo_Estado === 'Cerrada' ? 'bg-gray-100 text-gray-600 border-gray-200' : 'bg-blue-50 text-blue-700 border-blue-200'
        }`}>
          Estado: {denuncia.estado_denuncia?.Tipo_Estado}
        </span>
      </div>

      {/* --- TARJETA DE DETALLE DEL CASO --- */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 space-y-8">
          
          {/* Fila 1: Datos Básicos */}
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

          {/* Fila 2: Denunciante y Ubicación */}
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
              <dt className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Ubicación de los Hechos</dt>
              <dd className="text-sm font-medium text-gray-900">{denuncia.Ubicacion || 'No informada'}</dd>
            </div>
          </div>

          {/* Fila 3: Relato */}
          <div>
            <dt className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Relato de los Hechos</dt>
            <div className="w-full rounded-lg border border-gray-200 bg-gray-50/50 p-5 text-sm text-gray-700 min-h-[120px] whitespace-pre-wrap leading-relaxed shadow-inner">
              {denuncia.Relato_Hechos}
            </div>
          </div>
        </div>

        {/* --- FOOTER DE ACCIONES PRINCIPALES --- */}
        <div className="bg-gray-50 px-6 py-5 border-t border-gray-200 flex flex-col sm:flex-row justify-end gap-4 items-center">
          
          {/* ✅ LÓGICA DEL BOTÓN INFORME TÉCNICO */}
          {denuncia.informe_tecnico ? (
            // CASO A: INFORME YA EXISTE (Botón Verde de Ver/Descargar)
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                Informe Técnico Emitido
              </span>
              <button 
                onClick={() => alert(`Funcionalidad futura: Descargar PDF del Informe #${denuncia.informe_tecnico?.ID_Informe}`)}
                className="w-full sm:w-auto px-5 py-2.5 bg-white border border-green-500 text-green-700 rounded-lg text-sm font-bold hover:bg-green-50 shadow-sm transition-all flex items-center justify-center gap-2"
              >
                📄 Ver Informe Técnico
              </button>
            </div>
          ) : (
            // CASO B: NO EXISTE INFORME (Botón Gris para Crear)
            <button 
              onClick={() => setShowInformeModal(true)}
              className="w-full sm:w-auto px-5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-gray-900 shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <span>📝</span>
              Generar Informe Técnico
            </button>
          )}
          
          <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>

          <button
            onClick={() => setShowModal(true)}
            className="w-full sm:w-auto px-5 py-2.5 bg-white border border-orange-300 text-orange-600 rounded-lg text-sm font-bold hover:bg-orange-50 hover:border-orange-400 shadow-sm flex items-center justify-center gap-2 transition-all"
          >
            <span>↗️</span>
            Derivar a Otra Unidad
          </button>
        </div>
      </div> 

      {/* Botón de Navegación */}
      <div className="flex justify-start pt-4"> 
        <button 
          onClick={() => navigate('/dirgegen/bandeja')} 
          className="group inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-ubb-blue transition-colors"
        >
          <span className="bg-white border border-gray-300 rounded-full w-8 h-8 flex items-center justify-center group-hover:border-ubb-blue group-hover:text-ubb-blue transition-colors">←</span>
          Volver a la Bandeja
        </button>
      </div>

      {/* --- MODALES --- */}
      
      {/* Modal de Derivación (Existente) */}
      <DerivacionModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        // @ts-ignore
        onConfirm={handleDerivacionConfirm}
        isProcessing={processing}
      />

      {/* ✅ Modal de Informe Técnico (Nuevo) */}
      {denuncia && (
        <InformeTecnicoModal
          isOpen={showInformeModal}
          onClose={() => setShowInformeModal(false)}
          onSuccess={() => {
            cargarDatos(); // Recargar datos para que aparezca el botón verde
          }}
          idDenuncia={denuncia.ID_Denuncia}
          // Corrección del tipo de usuario para evitar error TS
          idAutor={Number((user as any)?.id || (user as any)?.ID) || 0} 
        />
      )}

    </section>
  )
}