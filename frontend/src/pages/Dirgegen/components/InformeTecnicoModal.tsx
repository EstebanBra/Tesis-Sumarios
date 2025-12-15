import { useState } from 'react'
import { crearInformeTecnico, type CrearInformeDTO } from '@/services/informeTecnico.api'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  idDenuncia: number
  idAutor: number
}

export default function InformeTecnicoModal({ isOpen, onClose, onSuccess, idDenuncia, idAutor }: Props) {
  const [loading, setLoading] = useState(false)
  
  // Estado del formulario
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
    
    // Validación simple
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
    } catch (error) {
      console.error(error)
      alert('❌ Error: Ya existe un informe para este caso o hubo un problema de conexión.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Encabezado */}
        <div className="bg-ubb-blue px-6 py-4 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-white font-bold text-lg">Informe Técnico Psicosociojurídico</h2>
            <p className="text-blue-200 text-xs">Protocolo DUE Nº 4560 - Caso #{idDenuncia}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl leading-none">&times;</button>
        </div>

        {/* Formulario Scrollable */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
          
          {/* 1. Antecedentes */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-1">1. Antecedentes del Caso</label>
            <textarea
              name="antecedentes"
              required
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-ubb-blue focus:ring-ubb-blue text-sm min-h-[80px]"
              placeholder="Resumen breve de los hechos y contexto de la entrevista..."
              onChange={handleChange}
            />
          </div>

          {/* 2. Análisis (3 columnas) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-bold text-gray-700">2.1 Dimensión Social</label>
              <textarea
                name="analisisSocial"
                required
                className="w-full rounded-lg border-gray-300 shadow-sm text-sm min-h-[150px]"
                placeholder="Redes de apoyo, contexto socioeconómico..."
                onChange={handleChange}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-bold text-gray-700">2.2 Dimensión Psicológica</label>
              <textarea
                name="analisisPsico"
                required
                className="w-full rounded-lg border-gray-300 shadow-sm text-sm min-h-[150px]"
                placeholder="Estado emocional, afectación..."
                onChange={handleChange}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-bold text-gray-700">2.3 Dimensión Jurídica</label>
              <textarea
                name="analisisJuridico"
                required
                className="w-full rounded-lg border-gray-300 shadow-sm text-sm min-h-[150px]"
                placeholder="Encuadre normativo, tipificación..."
                onChange={handleChange}
              />
            </div>
          </div>

          {/* 3. Sugerencias (Destacado) */}
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
            <label className="block text-sm font-bold text-orange-900 mb-1">3. Medidas de Resguardo Sugeridas</label>
            <textarea
              name="sugerencias"
              required
              className="w-full rounded-lg border-orange-200 shadow-sm focus:border-orange-500 focus:ring-orange-200 text-sm min-h-[100px]"
              placeholder="Se sugiere a la autoridad competente decretar: 1. Alejamiento, 2. Adecuación académica..."
              onChange={handleChange}
            />
          </div>

          {/* Botones de Acción */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-lg bg-ubb-blue text-white font-bold hover:bg-blue-900 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {loading ? (
                <>Guardando...</>
              ) : (
                <>💾 Emitir Informe Oficial</>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}