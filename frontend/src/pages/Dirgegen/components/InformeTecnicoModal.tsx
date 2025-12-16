import { useState, useEffect } from 'react'
import { crearInformeTecnico, actualizarInformeTecnico, type CrearInformeDTO } from '@/services/informeTecnico.api'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  idDenuncia: number
  idAutor: number
  denunciaData?: any // Necesario para detectar si ya existe informe
}

export default function InformeTecnicoModal({ isOpen, onClose, onSuccess, idDenuncia, idAutor, denunciaData }: Props) {
  const [loading, setLoading] = useState(false)
  
  // 1. Detectar si existe informe previo en los datos de la denuncia
  // Nota: Ajusta 'informe_tecnico' si tu backend usa otro nombre (ej: informeTecnico)
  const informeExistente = denunciaData?.informe_tecnico || denunciaData?.informeTecnico || null;
  const isEditing = !!informeExistente;

  // Estado del formulario
  const [formData, setFormData] = useState<Omit<CrearInformeDTO, 'idDenuncia' | 'idAutor'>>({
    antecedentes: '',
    analisisSocial: '',
    analisisPsico: '',
    analisisJuridico: '',
    sugerencias: ''
  })

  // 2. Efecto para cargar datos si es edición o limpiar si es nuevo
  useEffect(() => {
    if (isOpen) {
      if (isEditing && informeExistente) {
        setFormData({
          antecedentes: informeExistente.Antecedentes || '',
          analisisSocial: informeExistente.Analisis_Social || '',
          analisisPsico: informeExistente.Analisis_Psico || '',
          analisisJuridico: informeExistente.Analisis_Juridico || '',
          sugerencias: informeExistente.Sugerencias || ''
        })
      } else {
        // Resetear formulario para creación nueva
        setFormData({
          antecedentes: '',
          analisisSocial: '',
          analisisPsico: '',
          analisisJuridico: '',
          sugerencias: ''
        })
      }
    }
  }, [isOpen, isEditing, informeExistente])

  if (!isOpen) return null

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const mensajeConfirmacion = isEditing 
      ? '¿Confirmas la ACTUALIZACIÓN de este informe? Quedará registro del cambio.' 
      : '¿Confirmas la emisión de este Informe Técnico? Esta acción es oficial.';

    if (!confirm(mensajeConfirmacion)) return

    try {
      setLoading(true)
      
      if (isEditing) {
        // --- MODO EDICIÓN ---
        await actualizarInformeTecnico(idDenuncia, formData)
        alert('✅ Informe actualizado correctamente.')
      } else {
        // --- MODO CREACIÓN ---
        await crearInformeTecnico({ ...formData, idDenuncia, idAutor })
        alert('✅ Informe emitido correctamente.')
      }

      onSuccess() // Recargar datos en la pantalla principal
      onClose()
    } catch (error: any) {
      console.error(error)
      // Manejo de error por duplicado (backup de seguridad)
      const msg = error.response?.data?.error || error.message || "";
      if (msg.includes("Ya existe") || msg.includes("400")) {
          alert('⚠️ El sistema detectó que el informe ya existía. Se actualizará la vista.');
          onSuccess();
          onClose();
      } else {
          alert('❌ Error: ' + msg);
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        
        {/* Encabezado */}
        <div className="bg-ubb-blue px-6 py-4 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-white font-bold text-lg">
              {isEditing ? 'Editar Informe Técnico' : 'Emitir Informe Técnico'}
            </h2>
            <p className="text-blue-200 text-xs">Protocolo DUE Nº 4560 - Caso #{idDenuncia}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl leading-none">&times;</button>
        </div>

        {/* Contenido */}
        <div className="overflow-y-auto flex-1 p-8 bg-white">
          
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex items-center gap-3 mb-6 pb-3 border-b-2 border-ubb-blue/10">
                <span className="text-2xl">{isEditing ? '✏️' : '📝'}</span>
                <h2 className="text-2xl font-bold text-ubb-blue">
                  {isEditing ? 'Modificar Informe Existente' : 'Redacción del Informe'}
                </h2>
            </div>

            {/* 1. Antecedentes */}
            <div>
              <label className="block text-base font-bold text-gray-800 mb-2">1. Antecedentes del Caso (Síntesis Técnica)</label>
              <textarea
                name="antecedentes"
                value={formData.antecedentes}
                required
                className="w-full rounded-lg border-gray-300 p-4 shadow-sm focus:border-ubb-blue focus:ring-ubb-blue text-sm min-h-[100px]"
                placeholder="Resumen técnico de los hechos y contexto de la entrevista..."
                onChange={handleChange}
              />
            </div>

            {/* 2. Análisis */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-800">2.1 Dimensión Social</label>
                <textarea
                  name="analisisSocial"
                  value={formData.analisisSocial}
                  required
                  className="w-full rounded-lg border-gray-300 p-3 shadow-sm text-sm min-h-[180px] focus:border-ubb-blue focus:ring-ubb-blue"
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-800">2.2 Dimensión Psicológica</label>
                <textarea
                  name="analisisPsico"
                  value={formData.analisisPsico}
                  required
                  className="w-full rounded-lg border-gray-300 p-3 shadow-sm text-sm min-h-[180px] focus:border-ubb-blue focus:ring-ubb-blue"
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-800">2.3 Dimensión Jurídica</label>
                <textarea
                  name="analisisJuridico"
                  value={formData.analisisJuridico}
                  required
                  className="w-full rounded-lg border-gray-300 p-3 shadow-sm text-sm min-h-[180px] focus:border-ubb-blue focus:ring-ubb-blue"
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* 3. Sugerencias */}
            <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
              <label className="block text-base font-bold text-orange-900 mb-2">3. Medidas de Resguardo Sugeridas</label>
              <textarea
                name="sugerencias"
                value={formData.sugerencias}
                required
                className="w-full rounded-lg border-orange-200 p-4 shadow-sm focus:border-orange-500 focus:ring-orange-200 text-sm min-h-[120px] bg-white"
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
                className={`px-6 py-3 rounded-lg text-white font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 ${
                  isEditing ? 'bg-orange-600 hover:bg-orange-700' : 'bg-ubb-blue hover:bg-blue-900'
                }`}
              >
                {loading 
                  ? 'Guardando...' 
                  : (isEditing ? '💾 Guardar Cambios' : '💾 Emitir Informe Oficial')
                }
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  )
}