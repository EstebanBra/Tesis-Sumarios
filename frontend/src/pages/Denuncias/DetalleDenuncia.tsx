import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
// IMPORTANTE: Importamos 'SolicitudMedida' aquí para usarla en el tipado de abajo
import { getDenunciaById, type DenunciaListado, type SolicitudMedida } from '@/services/denuncias.api'
import SolicitudMedidaModal from '@/pages/Denuncias/components/SolicitudMedidaModal';


export default function DetalleDenuncia() {
  const { id } = useParams()
  
  const [denuncia, setDenuncia] = useState<DenunciaListado | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showSolicitudModal, setShowSolicitudModal] = useState(false);

  useEffect(() => {
    if (!id) return
    cargarDatos()
  }, [id])

  async function cargarDatos() {
    try {
      setLoading(true)
      const data = await getDenunciaById(Number(id))
      setDenuncia(data)
    } catch (err: any) {
      setError(err?.message ?? 'No pudimos cargar la denuncia.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // CORRECCIÓN 1: Tipamos 's' explícitamente como SolicitudMedida para evitar el error 'any'
  // Usamos ?. (encadenamiento opcional) por si solicitudes_medidas es undefined
  const tieneSolicitudPendiente = denuncia?.solicitudes_medidas?.some(
    (s: SolicitudMedida) => s.Estado === 'Pendiente Informe' || s.Estado === 'En Revisión'
  );
  
  if (loading) return <div className="p-10 text-center text-gray-500">Cargando caso...</div>
  if (error) return <div className="p-10 text-center text-red-600">Error: {error}</div>

  return (
    <section className="space-y-6">
      <h1 className="font-condensed text-3xl font-bold tracking-tight">Detalle de denuncia #{denuncia?.ID_Denuncia}</h1>
      
      <div className="flex justify-end">
        <button
          onClick={() => setShowSolicitudModal(true)}
          disabled={tieneSolicitudPendiente}
          className="rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {tieneSolicitudPendiente ? '⚠️ Solicitud de Resguardo en Proceso' : 'Solicitar Medida de Resguardo'}
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 space-y-4">
        <p className="text-sm text-gray-700">Estado: <span className="font-semibold">{denuncia?.estado_denuncia?.Tipo_Estado}</span></p>
        <p className="text-sm text-gray-700">Tipo: {denuncia?.tipo_denuncia?.Nombre}</p>
        
        {denuncia?.solicitudes_medidas?.length ? (
          <div className="mt-4 border-t pt-4">
            <h3 className="font-bold text-sm text-ubb-blue">Historial de Medidas Solicitadas:</h3>
            <ul className="list-disc pl-5 mt-2 text-sm text-gray-700">
              
              {/* 👇 AQUÍ TAMBIÉN ES EL PASO 2: Agrega ": SolicitudMedida" */}
              {denuncia.solicitudes_medidas.map((s: SolicitudMedida) => (
                <li key={s.ID_Solicitud}>
                  {s.Tipo_Medida} - Estado: <strong>{s.Estado}</strong> ...
                </li>
              ))}
              
            </ul>
          </div>
        ) : null}
      </div>

      {denuncia && (
        <SolicitudMedidaModal
          idDenuncia={denuncia.ID_Denuncia}
          isOpen={showSolicitudModal}
          onClose={() => setShowSolicitudModal(false)}
          onSuccess={cargarDatos}
        />
      )}
    </section>
  )
}