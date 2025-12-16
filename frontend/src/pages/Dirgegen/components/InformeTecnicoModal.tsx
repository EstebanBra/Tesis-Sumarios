import { useState } from 'react'
import { crearInformeTecnico, type CrearInformeDTO } from '@/services/informeTecnico.api'
interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  idDenuncia: number
  idAutor: number
  denunciaData?: any // Puedes tiparlo como FormularioDenuncia o DenunciaListado según corresponda
}

export default function InformeTecnicoModal({ isOpen, onClose, onSuccess, idDenuncia, idAutor }: Props) {
  const [loading, setLoading] = useState(false)

  
  const [formData, setFormData] = useState<Omit<CrearInformeDTO, 'idDenuncia' | 'idAutor'>>({
    antecedentes: '',
    analisisSocial: '',
    analisisPsico: '',
    analisisJuridico: '',
    sugerencias: ''
  })

  if (!isOpen) return null

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!confirm('¿Confirmas la emisión de este Informe Técnico? Esta acción es oficial.')) return

    try {
      setLoading(true)
      await crearInformeTecnico({
        ...formData,
        idDenuncia,
        idAutor
      })
      alert('✅ Informe emitido correctamente.')
      onSuccess() // Refresca la pantalla anterior
      onClose()   // Cierra el modal
    } catch (error: any) {
      console.error("Error capturado:", error)

      // --- AQUÍ ESTÁ LA MAGIA ---
      // Verificamos si el mensaje de error indica que ya existe
      const mensajeError = error.response?.data?.message || error.message || "";
      
      if (mensajeError.includes("Ya existe") || mensajeError.includes("400")) {
          alert('⚠️ El sistema detectó que este caso YA TIENE un informe. Se actualizará la pantalla para mostrarlo.');
          onSuccess(); // <--- ESTO ES CLAVE: Obliga a DetalleDirgegen a recargar los datos
          onClose();   // Cierra el modal
      } else {
          alert('❌ Error al guardar: ' + mensajeError);
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        
        {/* Encabezado Azul */}
        <div className="bg-ubb-blue px-6 py-4 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-white font-bold text-lg">Informe Técnico Psicosociojurídico</h2>
            <p className="text-blue-200 text-xs">Protocolo DUE Nº 4560 - Caso #{idDenuncia}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl leading-none">&times;</button>
        </div>

        {/* Contenido con Scroll */}
        <div className="overflow-y-auto flex-1 p-8 bg-white">
          
         
          {/* =================================================================================
              SECCIÓN 2: REDACCIÓN DEL INFORME (FORMULARIO EDITABLE)
              ================================================================================= */}
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex items-center gap-3 mb-6 pb-3 border-b-2 border-ubb-blue/10">
                <span className="text-2xl">📝</span>
                <h2 className="text-2xl font-bold text-ubb-blue">
                  Redacción del Informe
                </h2>
            </div>

            {/* 1. Antecedentes */}
            <div>
              <label className="block text-base font-bold text-gray-800 mb-2">1. Antecedentes del Caso (Síntesis Técnica)</label>
              <textarea
                name="antecedentes"
                required
                className="w-full rounded-lg border-gray-300 p-4 shadow-sm focus:border-ubb-blue focus:ring-ubb-blue text-sm min-h-[100px]"
                placeholder="Resumen técnico de los hechos y contexto de la entrevista..."
                onChange={handleChange}
              />
            </div>

            {/* 2. Análisis */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">2.1 Dimensión Social</label>
                <textarea
                  name="analisisSocial"
                  required
                  className="w-full rounded-lg border-gray-300 p-3 shadow-sm text-sm min-h-[180px] focus:border-ubb-blue focus:ring-ubb-blue"
                  placeholder="Redes de apoyo, contexto socioeconómico..."
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">2.2 Dimensión Psicológica</label>
                <textarea
                  name="analisisPsico"
                  required
                  className="w-full rounded-lg border-gray-300 p-3 shadow-sm text-sm min-h-[180px] focus:border-ubb-blue focus:ring-ubb-blue"
                  placeholder="Estado emocional, afectación..."
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">2.3 Dimensión Jurídica</label>
                <textarea
                  name="analisisJuridico"
                  required
                  className="w-full rounded-lg border-gray-300 p-3 shadow-sm text-sm min-h-[180px] focus:border-ubb-blue focus:ring-ubb-blue"
                  placeholder="Encuadre normativo, tipificación..."
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* 3. Sugerencias */}
            <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
              <label className="block text-base font-bold text-orange-900 mb-2">3. Medidas de Resguardo Sugeridas</label>
              <textarea
                name="sugerencias"
                required
                className="w-full rounded-lg border-orange-200 p-4 shadow-sm focus:border-orange-500 focus:ring-orange-200 text-sm min-h-[120px] bg-white"
                placeholder="Se sugiere a la autoridad competente decretar: 1. Alejamiento, 2. Adecuación académica..."
                onChange={handleChange}
              />
              <p className="text-xs text-orange-800 mt-2 font-medium">
                * Las medidas sugeridas deben basarse en los principios de proporcionalidad y no revictimización.
              </p>
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-lg bg-ubb-blue text-white font-bold hover:bg-blue-900 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {loading ? 'Guardando...' : '💾 Emitir Informe Oficial'}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  )
}