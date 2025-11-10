import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { crearDenuncia, type CrearDenunciaInput } from '@/services/denuncias.api'
import { routes } from '@/services/routes'

type OpcionTipo = { id: number; nombre: string }

// Temporal: opciones de tipo (hasta que expongas endpoint de catálogos)
const TIPOS: OpcionTipo[] = [
  { id: 1, nombre: 'Acoso/Violencia/Discriminación (Dirgegen)' },
  { id: 2, nombre: 'Infracción Reglamento de Convivencia Estudiantil' },
]

export default function NuevaDenuncia() {
  const nav = useNavigate()
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detalles, setDetalles] = useState<{ field: string; msg: string }[] | null>(null)

  // estado del formulario
  const [rut, setRut] = useState('')
  const [tipoId, setTipoId] = useState<number>(1)
  const [relato, setRelato] = useState('')
  const [ubicacion, setUbicacion] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setDetalles(null)

    // validación mínima de front
    if (!rut.trim() || !relato.trim()) {
      setError('Completa los campos obligatorios.')
      return
    }

    const payload: CrearDenunciaInput = {
      Rut: rut.trim(),
      ID_TipoDe: Number(tipoId),
      Fecha_Inicio: new Date().toISOString(), // ahora
      Relato_Hechos: relato.trim(),
      Ubicacion: ubicacion.trim() ? ubicacion.trim() : null,
      // opcionales por ahora vacíos:
      denunciados: [],
      testigos: [],
      evidencias: [],
    }

    try {
      setEnviando(true)
      const creada = await crearDenuncia(payload)
      // el servicio devuelve la denuncia completa; usamos su ID
      const id = creada?.ID_Denuncia ?? creada?.id ?? null
      if (id == null) {
        // fallback: volver al listado si no vino ID
        nav(routes.denuncias.root)
        return
      }
      nav(routes.denuncias.detalle(id))
    } catch (err: any) {
      setError(err?.message ?? 'Error al crear la denuncia')
      if (err?.detalles && Array.isArray(err.detalles)) {
        // viene de express-validator (denuncia.controller.js formatea como { field, msg })
        setDetalles(err.detalles as { field: string; msg: string }[])
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className="mx-auto max-w-2xl">
      <header className="mb-4">
        <h1 className="font-condensed text-2xl font-bold tracking-tight">Registrar nueva denuncia</h1>
        <p className="text-sm text-gray-600">Completa la información mínima para iniciar el proceso.</p>
      </header>

      {/* Errores */}
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          <p className="font-semibold">No se pudo crear la denuncia</p>
          <p className="mt-1">{error}</p>
          {detalles && detalles.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {detalles.map((d, i) => (
                <li key={i}><span className="font-medium">{d.field}:</span> {d.msg}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Rut denunciante */}
        <div>
          <label htmlFor="rut" className="block text-sm font-medium text-gray-900">RUT del denunciante *</label>
          <input
            id="rut"
            type="text"
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-ubb-blue focus:ring-2 focus:ring-ubb-blue/30"
            placeholder="12.345.678-9"
            value={rut}
            onChange={(e) => setRut(e.target.value)}
            required
          />
          <p className="mt-1 text-xs text-gray-500">Formato con guion. Validaremos en backend.</p>
        </div>

        {/* Tipo de denuncia */}
        <div>
          <label htmlFor="tipo" className="block text-sm font-medium text-gray-900">Tipo de denuncia *</label>
          <select
            id="tipo"
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-ubb-blue focus:ring-2 focus:ring-ubb-blue/30"
            value={String(tipoId)}
            onChange={(e) => setTipoId(Number(e.target.value))}
          >
            {TIPOS.map(op => (
              <option key={op.id} value={op.id}>{op.nombre}</option>
            ))}
          </select>
        </div>

        {/* Ubicación (opcional) */}
        <div>
          <label htmlFor="ubic" className="block text-sm font-medium text-gray-900">Ubicación (opcional)</label>
          <input
            id="ubic"
            type="text"
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-ubb-blue focus:ring-2 focus:ring-ubb-blue/30"
            placeholder="Campus, edificio, sala…"
            value={ubicacion}
            onChange={(e) => setUbicacion(e.target.value)}
          />
        </div>

        {/* Relato de hechos */}
        <div>
          <label htmlFor="relato" className="block text-sm font-medium text-gray-900">Relato de los hechos *</label>
          <textarea
            id="relato"
            rows={6}
            className="mt-1 block w-full resize-y rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-ubb-blue focus:ring-2 focus:ring-ubb-blue/30"
            placeholder="Describe los hechos de forma clara y respetuosa…"
            value={relato}
            onChange={(e) => setRelato(e.target.value)}
            required
          />
          <p className="mt-1 text-xs text-gray-500">No incluyas datos sensibles que no sean necesarios.</p>
        </div>

        {/* Botones */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={enviando}
            className="inline-flex items-center rounded-md bg-ubb-blue px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ubb-blue/30"
          >
            {enviando ? 'Enviando…' : 'Registrar denuncia'}
          </button>

          <button
            type="button"
            onClick={() => history.back()}
            className="inline-flex items-center rounded-md bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-200 focus:outline-none"
          >
            Cancelar
          </button>
        </div>
      </form>
    </section>
  )
}