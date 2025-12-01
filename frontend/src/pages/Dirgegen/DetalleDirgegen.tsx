import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getDenunciaById, gestionarDenuncia, type DenunciaListado } from '@/services/denuncias.api'
import DerivacionModal from "@/pages/Denuncias/components/Derivacion" // Asegúrate de importar el nuevo modal

export default function DetalleDirgegen() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [denuncia, setDenuncia] = useState<DenunciaListado | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
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

  // Esta función se ejecuta cuando le dan "Confirmar" en el Modal
  const handleDerivacionConfirm = async (observacion: string) => {
    if (!denuncia) return
    try {
      setProcessing(true)
      
      // Llamada al API con la observación que viene del Modal
      await gestionarDenuncia(denuncia.ID_Denuncia, {
        observacion: observacion,
        nuevoEstadoId: 3 // ID 3 = "Derivada" (Ajustar según tu seed de estados)
      })
      
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

      {/* TARJETA RESUMEN (DISEÑO IDÉNTICO A LA IMAGEN) */}
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
                {/* Aquí podrías mostrar nombre si lo tienes, o Rut */}
                Usuario Anónimo ({denuncia.Rut}) 
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">
                Fecha Hecho
              </dt>
              <dd className="text-sm font-medium text-gray-900">
                {new Date(denuncia.Fecha_Inicio).toLocaleDateString()}
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

        {/* FOOTER CON BOTONES */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row justify-end gap-3">
          <button 
            onClick={() => alert('Funcionalidad de generar PDF pendiente')}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 shadow-sm transition-colors"
          >
            Generar Informe Técnico
          </button>
          
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-white border border-orange-500 text-orange-600 rounded-md text-sm font-bold hover:bg-orange-50 shadow-sm flex items-center justify-center gap-2 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
            </svg>
            Derivar a Otra Unidad
          </button>
        </div>

      </div> 

      {/* BOTÓN VOLVER */}
      <div className="mt-8 flex justify-start"> 
        <button
          onClick={() => navigate('/dirgegen/bandeja')}
          className="inline-flex items-center justify-center rounded-md bg-ubb-blue px-6 py-2 text-sm font-bold text-white hover:bg-blue-900 transition-colors shadow-md"
        >
          ← Volver a la Bandeja de Casos
        </button>
      </div>

      {/* MODAL (Invisible hasta que se activa) */}
      <DerivacionModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleDerivacionConfirm}
        isProcessing={processing}
      />
    </section>
  )
}