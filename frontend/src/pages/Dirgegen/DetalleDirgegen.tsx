import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getDetalleDenuncia, derivarDenuncia, type DetalleDenunciaCompleta } from '@/services/digergen.apis'
import DerivacionModal from '@/components/Derivacion'

export default function DetalleDirgegen() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [denuncia, setDenuncia] = useState<DetalleDenunciaCompleta | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (!id) return
    getDetalleDenuncia(id)
      .then(setDenuncia)
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [id])

  const handleDerivacionConfirm = async (nuevoTipoId: number) => {
    if (!denuncia) return
    try {
      setProcessing(true)
      await derivarDenuncia(denuncia.ID_Denuncia, nuevoTipoId, 1) // el 1 es por el estado "Derivada"
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

  if (loading) return <div className="p-10 text-center">Cargando...</div>
  if (!denuncia) return <div className="p-10 text-center text-red-600">Denuncia no encontrada.</div>

  return (
    <section className="mx-auto max-w-4xl pb-12">
      
      
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-condensed text-3xl font-bold text-gray-900">
          Gestión de Caso #{denuncia.ID_Denuncia}
        </h1>
        <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium border border-gray-300">
          Estado: {denuncia.estado_denuncia?.Tipo_Estado}
        </span>
      </div>

      {/*esto es como el reumen de  la denuncia para que quede mejor ahi despues se puede cambiar a algo más personalizado o
      lo que quieran en la reunion*/}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        
        
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-ubb-blue">
            Resumen General
          </h2>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <dt className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">
                Tipo
              </dt>
              <dd className="text-sm font-medium text-gray-900">
                {denuncia.tipo_denuncia?.Nombre}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">
                Subtipo
              </dt>
              <dd className="text-sm font-medium text-gray-900">
                
                — 
              </dd>
            </div>
          </div>

         
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <dt className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">
                Denunciante
              </dt>
              <dd className="text-sm font-medium text-gray-900">
              
                Usuario Anónimo ({denuncia.Rut}) 
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">
                Fecha Hecho
              </dt>
              <dd className="text-sm font-medium text-gray-900">
                {new Date(denuncia.Fecha_Inicio).toLocaleDateString()}
              </dd>
            </div>
          </div>

        
          <div>
            <dt className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">
              Ubicación
            </dt>
            <dd className="text-sm font-medium text-gray-900">
              {denuncia.Ubicacion || 'No informada'}
            </dd>
          </div>

         
          <div>
            <dt className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2">
              Relato
            </dt>
            <div className="w-full rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-700 min-h-[100px] whitespace-pre-wrap">
              {denuncia.Relato_Hechos}
            </div>
          </div>

        </div>

   
        
       
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button 
            onClick={() => alert('Funcionalidad de generar informe pendiente')}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
          >
            Generar Informe Técnico
          </button>
          
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-white border border-orange-500 text-orange-600 rounded-md text-sm font-bold hover:bg-orange-50 shadow-sm flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
            </svg>
            Derivar a Otra Unidad
          </button>
        </div>
        

      </div> 


      
      <div className="mt-8 flex justify-start"> 
        <button
          onClick={() => history.back()}
          className="inline-flex items-center justify-center rounded-md bg-ubb-blue px-6 py-2 text-sm font-semibold text-white hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-ubb-blue/30"
        >
          ← Volver a la Bandeja de Casos
        </button>
      </div>





      <DerivacionModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleDerivacionConfirm}
        isProcessing={processing}
      />
    </section>
  )
}