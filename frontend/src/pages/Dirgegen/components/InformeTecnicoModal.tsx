import { useState } from 'react'
import { crearInformeTecnico, type CrearInformeDTO } from '@/services/informeTecnico.api'
import { SEDES } from '@/data/denuncias.data' 
import type { FormularioDenuncia } from '@/types/denuncia.types' 

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  idDenuncia: number
  idAutor: number
  denunciaData?: any // Puedes tiparlo como FormularioDenuncia o DenunciaListado según corresponda
}

export default function InformeTecnicoModal({ isOpen, onClose, onSuccess, idDenuncia, idAutor, denunciaData }: Props) {
  const [loading, setLoading] = useState(false)
  const [mostrarDetalleHechos, setMostrarDetalleHechos] = useState(false)
  
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
      await crearInformeTecnico({ ...formData, idDenuncia, idAutor })
      alert('✅ Informe emitido correctamente.')
      onSuccess()
      onClose()
    } catch (error) {
      console.error(error)
      alert('❌ Error: Ya existe un informe para este caso o hubo un problema de conexión.')
    } finally {
      setLoading(false)
    }
  }

  // Estilos base replicados de NuevaDenuncia.tsx para consistencia
  const sectionTitleClass = "font-condensed text-lg font-semibold text-gray-900 border-b pb-2 mb-4"
  const containerClass = "bg-gray-50 p-6 rounded-lg border border-gray-200 shadow-sm"
  const labelClass = "text-sm font-medium text-gray-700 block mb-1"
  const inputReadClass = "w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm bg-white text-gray-600 focus:outline-none cursor-default"

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
              SECCIÓN 1: VISTA DE DATOS (HECHOS Y DENUNCIADOS)
              Estilo visual idéntico a NuevaDenuncia.tsx (Paso 2)
              ================================================================================= */}
          {denunciaData && (
            <div className="mb-8 border border-gray-200 rounded-lg overflow-hidden">
              <button 
                type="button"
                onClick={() => setMostrarDetalleHechos(!mostrarDetalleHechos)}
                className="w-full bg-gray-50 px-5 py-4 flex justify-between items-center text-sm font-bold text-gray-700 hover:bg-gray-100 transition-colors border-b border-gray-200"
              >
                <span className="flex items-center gap-2 uppercase tracking-wide text-xs font-extrabold text-ubb-blue">
                  ℹ️ Antecedentes de la Denuncia (Hechos y Denunciados)
                </span>
                <span className="text-gray-400 text-lg">{mostrarDetalleHechos ? '▲' : '▼'}</span>
              </button>

              {mostrarDetalleHechos && (
                <div className="p-6 bg-white space-y-8 animate-in slide-in-from-top-2 duration-200">
                  
                  {/* A. VÍCTIMA */}
                  <section>
                    <h2 className={sectionTitleClass}>Víctima de los hechos</h2>
                    <div className={containerClass}>
                      <div className="grid gap-6 md:grid-cols-3">
                         <div>
                          <label className={labelClass}>RUT</label>
                          <input className={inputReadClass}
                            value={denunciaData.victimaRut || denunciaData.Rut || 'No informado'} readOnly />
                        </div>
                        <div className="md:col-span-2">
                          <label className={labelClass}>Nombre Completo</label>
                          <input className={inputReadClass}
                            value={denunciaData.victimaNombre || denunciaData.Nombre || 'No informado'} readOnly />
                        </div>
                        <div>
                          <label className={labelClass}>Correo</label>
                          <input className={inputReadClass}
                            value={denunciaData.victimaCorreo || denunciaData.Correo || 'No informado'} readOnly />
                        </div>
                        <div>
                          <label className={labelClass}>Teléfono</label>
                          <input className={inputReadClass}
                            value={denunciaData.victimaTelefono || denunciaData.Telefono || 'No informado'} readOnly />
                        </div>
                         <div>
                          <label className={labelClass}>Menor de edad</label>
                          <input className={inputReadClass}
                            value={denunciaData.victimaMenor === 'si' ? 'Sí' : 'No'} readOnly />
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* B. DENUNCIADOS */}
                  <section>
                    <h2 className={sectionTitleClass}>Denunciado/s</h2>
                    <div className={containerClass}>
                      {denunciaData.denunciados && denunciaData.denunciados.length > 0 ? (
                        <ul className="divide-y divide-gray-200 bg-white border border-gray-200 rounded-md overflow-hidden">
                          {denunciaData.denunciados.map((inv: any, i: number) => (
                            <li key={i} className="p-4 flex flex-col gap-2 text-sm hover:bg-gray-50 transition-colors">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-gray-900 text-base">{inv.nombre}</span>
                                {inv.vinculacion && (
                                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                    {inv.vinculacion}
                                  </span>
                                )}
                              </div>
                              {inv.descripcion && (
                                <div className="bg-gray-50 p-3 rounded-md text-gray-700 border-l-4 border-ubb-blue italic text-xs">
                                  {inv.descripcion}
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500 italic p-2">No se registraron denunciados específicos.</p>
                      )}
                    </div>
                  </section>

                  {/* C. LUGAR Y FECHA */}
                  <section>
                    <h2 className={sectionTitleClass}>Lugar y fecha de los hechos</h2>
                    <div className={containerClass}>
                      <div className="grid gap-6 md:grid-cols-2">
                        <div>
                          <label className={labelClass}>Fecha del suceso</label>
                          <input className={inputReadClass}
                            value={denunciaData.Fecha_Inicio ? new Date(denunciaData.Fecha_Inicio).toLocaleDateString() : ''} readOnly />
                        </div>
                        <div>
                          <label className={labelClass}>Sede / Ubicación General</label>
                          <input className={inputReadClass}
                            value={denunciaData.sedeHecho || 'Según relato'} readOnly />
                        </div>
                        <div className="md:col-span-2">
                          <label className={labelClass}>Lugar Específico / Detalle</label>
                          <input className={inputReadClass}
                            value={denunciaData.Ubicacion || ''} readOnly />
                        </div>
                      </div>
                    </div>
                  </section>

                   {/* D. RELATO */}
                   <section>
                    <h2 className={sectionTitleClass}>Relato de los hechos</h2>
                    <div className={containerClass}>
                      <textarea
                        className="w-full rounded-md border border-gray-300 p-4 text-sm bg-white text-gray-800 h-48 resize-none leading-relaxed shadow-sm focus:outline-none"
                        value={denunciaData.Relato_Hechos || denunciaData.relato || ''}
                        readOnly
                      />
                    </div>
                  </section>

                </div>
              )}
            </div>
          )}

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