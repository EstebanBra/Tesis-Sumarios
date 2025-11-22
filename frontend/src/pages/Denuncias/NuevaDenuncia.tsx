import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { crearDenuncia, type CrearDenunciaInput } from '@/services/denuncias.api'
import { routes } from '@/services/routes'
import { Cards } from '@/components/ui/Cards'
import { TIPOS_DENUNCIA, SUBTIPOS_DENUNCIA, REGIONES, COMUNAS, SEDES, LUGARES_SEDE, VINCULACIONES } from '@/data/denuncias.data'
import type { FormularioDenuncia, Involucrado, FaseRegistro } from '@/types/denuncia.types'
import FormularioLayout from './components/FormularioLayout'

const initialInvolucrado: Involucrado = { nombre: '', apellido1: '', apellido2: '', parentesco: '', vinculacion: '', antecedentes: '', descripcionFisica: '' }

const initialForm: FormularioDenuncia = {
  rut: '', nombre: '', telefono: '', correo: '', reservaIdentidad: false,
  tipoId: 0, subtipoId: null,
  regionDenunciante: '', comunaDenunciante: '', direccionDenunciante: '',
  victimaMenor: 'no', esVictima: 'si', victimaRut: '', victimaNombre: '', victimaApellido1: '', victimaApellido2: '', victimaGenero: '', victimaSexo: '', victimaNacionalidad: '', victimaNacimiento: '',
  regionHecho: '', comunaHecho: '', sedeHecho: '', lugarHecho: '', detalleHecho: '', fechaHecho: '', horaHecho: '', relato: '',
  involucrados: [], nuevoInvolucrado: { ...initialInvolucrado },
}

const steps = [
  { id: 1, label: 'Datos del denunciante' },
  { id: 2, label: 'Hechos y participantes' },
  { id: 3, label: 'Revisión' },
]

export default function NuevaDenuncia() {
  const nav = useNavigate()

  const [fase, setFase] = useState<FaseRegistro>('seleccion_tipo')
  const [form, setForm] = useState<FormularioDenuncia>(initialForm)
  const [step, setStep] = useState(1)


  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detalles, setDetalles] = useState<{ field: string; msg: string }[] | null>(null)

  const stepTitle = useMemo(() => steps[step - 1]?.label ?? '', [step])


  const subtiposDisponibles = useMemo(() => SUBTIPOS_DENUNCIA.filter((s) => s.tipoId === form.tipoId), [form.tipoId])
  const subtipoSeleccionado = useMemo(() => SUBTIPOS_DENUNCIA.find((s) => s.id === form.subtipoId) ?? null, [form.subtipoId])
  const tipoSeleccionado = useMemo(() => TIPOS_DENUNCIA.find((t) => t.id === form.tipoId) ?? null, [form.tipoId])

  const lugaresDisponibles = useMemo(() => {
    if (!form.sedeHecho) return []
    return LUGARES_SEDE[form.sedeHecho] || []
  }, [form.sedeHecho])


  function handleSelectTipo(id: number) {
    setForm(prev => ({ ...prev, tipoId: id, subtipoId: null }))
    setFase('seleccion_subtipo')
    window.scrollTo(0, 0)
  }

  function handleSelectSubtipo(id: number) {
    setForm(prev => ({ ...prev, subtipoId: id }))
    setFase('formulario')
    window.scrollTo(0, 0)
  }

  function handleBackToTipo() {
    setFase('seleccion_tipo')
    setForm(prev => ({ ...prev, tipoId: 0, subtipoId: null }))
  }

  function handleBackToSubtipo() {
    if (step === 1) {
      setFase('seleccion_subtipo')
      setForm(prev => ({ ...prev, subtipoId: null }))
    } else {
      handlePrev()
    }
  }

  function updateField<K extends keyof FormularioDenuncia>(key: K, value: FormularioDenuncia[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleAddInvolucrado() {
    if (!form.nuevoInvolucrado.nombre.trim() && !form.nuevoInvolucrado.descripcionFisica.trim()) return
    setForm((prev) => ({
      ...prev,
      involucrados: [...prev.involucrados, prev.nuevoInvolucrado],
      nuevoInvolucrado: { ...initialInvolucrado },
    }))
  }

  function handleRemoveInvolucrado(index: number) {
    setForm((prev) => ({
      ...prev,
      involucrados: prev.involucrados.filter((_, i) => i !== index),
    }))
  }

  function puedeAvanzar() {
    if (step === 1) return !!form.rut.trim() && !!form.nombre.trim()
    if (step === 2) return !!form.relato.trim() && !!form.sedeHecho
    return true
  }

  function handleNext() {
    if (step < steps.length && puedeAvanzar()) {
      setStep((prev) => prev + 1)
      window.scrollTo(0, 0)
    }
  }

  function handlePrev() {
    if (step > 1) setStep((prev) => prev - 1)
  }

  async function enviarDenuncia() {
    setError(null)
    setDetalles(null)

    if (!form.rut.trim() || !form.relato.trim()) {
      setError('Faltan campos obligatorios.')
      return
    }

    // Construir ubicación completa
    const sedeNombre = SEDES.find(s => s.id === form.sedeHecho)?.nombre || form.sedeHecho
    const ubicacionCompleta = [
      sedeNombre,
      form.lugarHecho,
      form.detalleHecho
    ].filter(Boolean).join(' - ')

    // Notas adicionales
    const notasAdicionales = [
      subtipoSeleccionado ? `Subtipo: ${subtipoSeleccionado.nombre}` : null,
      subtipoSeleccionado ? subtipoSeleccionado.descripcion : null,
    ].filter(Boolean).join(' | ') || null

    const payload: CrearDenunciaInput = {
      Rut: form.rut.trim(),
      ID_TipoDe: Number(form.tipoId),
      Fecha_Inicio: form.fechaHecho ? new Date(form.fechaHecho).toISOString() : new Date().toISOString(),
      Relato_Hechos: form.relato.trim(),
      Ubicacion: ubicacionCompleta,
      denunciados: form.involucrados.map((i) => ({
        nombre: `${i.nombre} ${i.apellido1}`.trim() || 'Sin nombre',
        rut: undefined,
        descripcion: i.descripcionFisica
      })),
      testigos: [],
      evidencias: [],
      caracteristicasDenunciado: notasAdicionales,
    }

    try {
      setEnviando(true)
      const creada = await crearDenuncia(payload)
      const id = creada?.ID_Denuncia ?? creada?.id ?? null
      if (id == null) {
        nav(routes.denuncias.root)
        return
      }
      nav(routes.denuncias.detalle(id))
    } catch (err: any) {
      setError(err?.message ?? 'Error al crear la denuncia')
      if (err?.detalles && Array.isArray(err.detalles)) {
        setDetalles(err.detalles as { field: string; msg: string }[])
      }
    } finally {
      setEnviando(false)
    }
  }

  // Seleccionar Tipo de denuncia 
  if (fase === 'seleccion_tipo') {
    return (
      <section className="mx-auto max-w-5xl py-12">
        <header className="mb-10 text-center px-4">
          <h1 className="font-condensed text-3xl font-bold tracking-tight text-gray-900">
            ¿Qué tipo de denuncia deseas realizar?
          </h1>
          <p className="mt-3 text-gray-600 max-w-2xl mx-auto">
            Selecciona la categoría general. Esto nos ayudará a derivar tu caso a la unidad correspondiente (Dirgegen o Dirección de Desarrollo Estudiantil).
          </p>
        </header>

        <div className="grid gap-8 md:grid-cols-2 px-4">
          {TIPOS_DENUNCIA.map((tipo) => (
            <Cards
              key={tipo.id}
              title={tipo.nombre}
              description={tipo.descripcion}
              icon={tipo.icono}
              onClick={() => handleSelectTipo(tipo.id)}
            />
          ))}
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={() => history.back()}
            className="mt-4 inline-flex items-center justify-center rounded-md bg-ubb-blue px-6 py-2 text-sm font-semibold text-white hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-ubb-blue/30"
          >
            Cancelar y volver al inicio
          </button>
        </div>

      </section>
    )
  }



  // Seleccionar el subTipo de denuncia
  if (fase === 'seleccion_subtipo') {
    return (
      <section className="mx-auto max-w-6xl py-10">
        <header className="mb-8 px-4">
          <button
            onClick={handleBackToTipo}
            className="group mb-6 inline-flex items-center rounded-md bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-200"
          >
            <span className="mr-2 transition-transform group-hover:-translate-x-1">&larr;</span>
            Volver a categorías
          </button>
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-sm font-bold tracking-wider text-ubb-blue uppercase bg-blue-50 px-2 py-1 rounded">
              {tipoSeleccionado?.nombre}
            </span>
            <h1 className="font-condensed text-3xl font-bold tracking-tight text-gray-900">
              Especifica el motivo
            </h1>
          </div>
          <p className="mt-2 text-gray-600">Selecciona la opción que mejor describa los hechos ocurridos.</p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 px-4">
          {subtiposDisponibles.map((subtipo) => (
            <Cards
              key={subtipo.id}
              title={subtipo.nombre}
              description={subtipo.descripcion}
              onClick={() => handleSelectSubtipo(subtipo.id)}
            />
          ))}
        </div>
      </section>
    )
  }

  // Formulario

  return (
    <FormularioLayout
      step={step}
      steps={steps}
      stepTitle={stepTitle}
      error={error}
      detalles={detalles}
      onBack={handleBackToSubtipo}
      onNext={handleNext}
      onSend={enviarDenuncia}
      puedeAvanzar={puedeAvanzar()}
      enviando={enviando}
    >

      {/* PASO 1: DATOS DENUNCIANTE */}
      {step === 1 && (
        <div className="space-y-6">

          {/* RESUMEN SELECCIÓN PREVIA (Solo Lectura) */}
          <div className="rounded-lg border border-blue-100 bg-blue-50/50 px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-ubb-blue uppercase tracking-wider">Categoría seleccionada</h3>
              <button onClick={handleBackToSubtipo} className="text-xs font-medium text-gray-500 underline hover:text-ubb-blue">
                Cambiar
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] uppercase tracking-wide text-gray-500 font-bold block mb-1">Tipo General</label>
                <p className="text-sm font-semibold text-gray-900">{tipoSeleccionado?.nombre}</p>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wide text-gray-500 font-bold block mb-1">Subtipo Específico</label>
                <p className="text-sm font-semibold text-gray-900">{subtipoSeleccionado?.nombre}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-blue-100">
              <p className="text-xs text-gray-600 italic">{subtipoSeleccionado?.descripcion}</p>
            </div>
          </div>

          <section className="space-y-4">
            <h2 className="font-condensed text-lg font-semibold text-gray-900 border-b pb-2">Datos de contacto</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">RUT *</label>
                <input className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm hover:border-gray-400 transition-colors" placeholder="12.345.678-9" value={form.rut} onChange={(e) => updateField('rut', e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Nombre completo *</label>
                <input className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm hover:border-gray-400 transition-colors" placeholder="Tu nombre" value={form.nombre} onChange={(e) => updateField('nombre', e.target.value)} required />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">Teléfono</label>
                <input className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm hover:border-gray-400 transition-colors" placeholder="+56 9 ..." value={form.telefono} onChange={(e) => updateField('telefono', e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Correo</label>
                <input type="email" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm hover:border-gray-400 transition-colors" placeholder="correo@ubb.cl" value={form.correo} onChange={(e) => updateField('correo', e.target.value)} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">Región *</label>
                <select className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm hover:border-gray-400 transition-colors" value={form.regionDenunciante} onChange={(e) => updateField('regionDenunciante', e.target.value)}>
                  <option value="">Seleccionar</option>
                  {REGIONES.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Comuna *</label>
                <select className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm hover:border-gray-400 transition-colors" value={form.comunaDenunciante} onChange={(e) => updateField('comunaDenunciante', e.target.value)}>
                  <option value="">Seleccionar</option>
                  {COMUNAS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Dirección *</label>
              <input className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm hover:border-gray-400 transition-colors" placeholder="Calle / número" value={form.direccionDenunciante} onChange={(e) => updateField('direccionDenunciante', e.target.value)} />
            </div>

            <div className="flex flex-wrap gap-6 pt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
              <div className="inline-flex items-center gap-3">
                <span>¿Reserva de identidad?</span>
                <label className="inline-flex items-center gap-1"><input type="radio" name="reserva" checked={form.reservaIdentidad} onChange={() => updateField('reservaIdentidad', true)} /> Sí</label>
                <label className="inline-flex items-center gap-1"><input type="radio" name="reserva" checked={!form.reservaIdentidad} onChange={() => updateField('reservaIdentidad', false)} /> No</label>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* PASO 2: HECHOS Y PARTICIPANTES */}
      {step === 2 && (
        <div className="space-y-8">
          {/* Sección Víctima */}
          <section className="space-y-4">
            <h2 className="font-condensed text-lg font-semibold text-gray-900 border-b pb-2">Información de la víctima</h2>
            <div className="grid gap-4 md:grid-cols-2 bg-gray-50 p-3 rounded-md">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">¿Víctima menor de edad?</p>
                <div className="flex gap-3 text-sm">
                  <label className="inline-flex items-center gap-1"><input type="radio" name="menor" value="si" checked={form.victimaMenor === 'si'} onChange={(e) => updateField('victimaMenor', 'si')} /> Sí</label>
                  <label className="inline-flex items-center gap-1"><input type="radio" name="menor" value="no" checked={form.victimaMenor === 'no'} onChange={(e) => updateField('victimaMenor', 'no')} /> No</label>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">¿Eres tú la víctima?</p>
                <div className="flex gap-3 text-sm">
                  <label className="inline-flex items-center gap-1"><input type="radio" name="esVictima" value="si" checked={form.esVictima === 'si'} onChange={(e) => updateField('esVictima', 'si')} /> Sí</label>
                  <label className="inline-flex items-center gap-1"><input type="radio" name="esVictima" value="no" checked={form.esVictima === 'no'} onChange={(e) => updateField('esVictima', 'no')} /> No</label>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div><label className="text-sm font-medium text-gray-700">RUT</label><input className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm hover:border-gray-400 transition-colors" value={form.victimaRut} onChange={(e) => updateField('victimaRut', e.target.value)} /></div>
              <div><label className="text-sm font-medium text-gray-700">Nombre</label><input className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm hover:border-gray-400 transition-colors" value={form.victimaNombre} onChange={(e) => updateField('victimaNombre', e.target.value)} /></div>
              <div><label className="text-sm font-medium text-gray-700">Apellidos</label><input className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm hover:border-gray-400 transition-colors" value={form.victimaApellido1} onChange={(e) => updateField('victimaApellido1', e.target.value)} /></div>
            </div>
          </section>

          {/* Sección Involucrados */}
          <section className="space-y-4">
            <h2 className="font-condensed text-lg font-semibold text-gray-900 border-b pb-2">Personas involucradas (Denunciados)</h2>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="grid gap-3 md:grid-cols-3 mb-3">
                <input placeholder="Nombre" className="rounded border border-gray-300 px-3 py-2 text-sm hover:border-gray-400 transition-colors" value={form.nuevoInvolucrado.nombre} onChange={e => setForm(p => ({ ...p, nuevoInvolucrado: { ...p.nuevoInvolucrado, nombre: e.target.value } }))} />
                <input placeholder="Apellido" className="rounded border border-gray-300 px-3 py-2 text-sm hover:border-gray-400 transition-colors" value={form.nuevoInvolucrado.apellido1} onChange={e => setForm(p => ({ ...p, nuevoInvolucrado: { ...p.nuevoInvolucrado, apellido1: e.target.value } }))} />
                <select
                  className="rounded border border-gray-300 px-3 py-2 text-sm hover:border-gray-400 transition-colors"
                  value={form.nuevoInvolucrado.vinculacion}
                  onChange={e => setForm(p => ({ ...p, nuevoInvolucrado: { ...p.nuevoInvolucrado, vinculacion: e.target.value } }))}
                >
                  <option value="">Seleccionar Vinculación</option>
                  {VINCULACIONES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className="mb-3">
                <textarea
                  placeholder="Información adicional (descripción física, vestimenta, señas particulares, etc.)"
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm h-20 resize-none hover:border-gray-400 transition-colors"
                  value={form.nuevoInvolucrado.descripcionFisica}
                  onChange={e => setForm(p => ({ ...p, nuevoInvolucrado: { ...p.nuevoInvolucrado, descripcionFisica: e.target.value } }))}
                />
              </div>
              <button type="button" onClick={handleAddInvolucrado} className="text-sm bg-ubb-blue text-white px-3 py-1.5 rounded hover:bg-blue-700 transition-colors">
                + Agregar persona
              </button>
            </div>
            {form.involucrados.length > 0 && (
              <ul className="divide-y border rounded-md">
                {form.involucrados.map((inv, i) => (
                  <li key={i} className="p-3 flex flex-col gap-1 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{inv.nombre} {inv.apellido1} <span className="text-gray-500 font-normal">({inv.vinculacion})</span></span>
                      <button type="button" onClick={() => handleRemoveInvolucrado(i)} className="text-red-600 hover:underline text-xs">Eliminar</button>
                    </div>
                    {inv.descripcionFisica && (
                      <p className="text-gray-600 text-xs italic border-l-2 border-gray-300 pl-2">
                        "{inv.descripcionFisica}"
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Sección Relato */}
          <section className="space-y-4">
            <h2 className="font-condensed text-lg font-semibold text-gray-900 border-b pb-2">Relato de los hechos</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Fecha *</label>
                <input type="date" className="mt-1 w-full rounded border-gray-300 px-3 py-2 text-sm hover:border-gray-400 transition-colors" value={form.fechaHecho} onChange={e => updateField('fechaHecho', e.target.value)} />
              </div>
              <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">Sede *</label>
                  <select
                    className="mt-1 w-full rounded border-gray-300 px-3 py-2 text-sm hover:border-gray-400 transition-colors"
                    value={form.sedeHecho}
                    onChange={e => {
                      const sede = SEDES.find(s => s.id === e.target.value)
                      updateField('sedeHecho', e.target.value)
                      updateField('regionHecho', sede?.region || '') // Auto-completar región
                      updateField('lugarHecho', '') // Resetear lugar específico
                    }}
                  >
                    <option value="">Seleccionar Sede</option>
                    {SEDES.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Región</label>
                  <input
                    className="mt-1 w-full rounded border-gray-300 px-3 py-2 text-sm bg-gray-100 text-gray-600"
                    value={form.regionHecho}
                    readOnly
                    placeholder="Se completa automáticamente"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">Lugar Específico</label>
                <select
                  className="mt-1 w-full rounded border-gray-300 px-3 py-2 text-sm hover:border-gray-400 transition-colors"
                  value={form.lugarHecho}
                  onChange={e => updateField('lugarHecho', e.target.value)}
                  disabled={!form.sedeHecho}
                >
                  <option value="">Seleccionar Lugar</option>
                  {lugaresDisponibles.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Detalles adicionales del lugar</label>
                <input
                  className="mt-1 w-full rounded border-gray-300 px-3 py-2 text-sm hover:border-gray-400 transition-colors"
                  placeholder="Ej: Segundo piso, pasillo norte, cerca de la entrada..."
                  value={form.detalleHecho}
                  onChange={e => updateField('detalleHecho', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Descripción detallada de los hechos *</label>
              <textarea
                className="w-full rounded border-gray-300 px-3 py-2 text-sm h-32 focus:ring-2 focus:ring-ubb-blue/20 hover:border-gray-400 transition-colors"
                placeholder="Describe qué pasó, cómo, cuándo y quiénes estaban presentes..."
                value={form.relato}
                onChange={e => updateField('relato', e.target.value)}
                required
              />
            </div>
          </section>
        </div>
      )}

      {/* PASO 3: REVISIÓN */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-ubb-blue font-bold uppercase text-xs tracking-wider mb-4">Resumen General</h3>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4 text-sm">
              <div><dt className="text-gray-500 text-xs uppercase font-bold">Tipo</dt><dd>{tipoSeleccionado?.nombre}</dd></div>
              <div><dt className="text-gray-500 text-xs uppercase font-bold">Subtipo</dt><dd>{subtipoSeleccionado?.nombre}</dd></div>
              <div><dt className="text-gray-500 text-xs uppercase font-bold">Denunciante</dt><dd>{form.nombre} ({form.rut})</dd></div>
              <div><dt className="text-gray-500 text-xs uppercase font-bold">Fecha Hecho</dt><dd>{form.fechaHecho || 'No especificada'}</dd></div>
              <div className="md:col-span-2">
                <dt className="text-gray-500 text-xs uppercase font-bold">Ubicación</dt>
                <dd>
                  {[
                    SEDES.find(s => s.id === form.sedeHecho)?.nombre,
                    form.lugarHecho,
                    form.detalleHecho
                  ].filter(Boolean).join(' - ') || 'No especificada'}
                </dd>
              </div>
              <div className="md:col-span-2"><dt className="text-gray-500 text-xs uppercase font-bold mb-1">Relato</dt><dd className="bg-white p-3 rounded border text-gray-700 whitespace-pre-wrap">{form.relato}</dd></div>
            </dl>
          </div>
          <div className="text-sm text-gray-500 text-center">
            <p>Al enviar, confirmas que los datos entregados son verídicos.</p>
          </div>
        </div>
      )}
    </FormularioLayout>
  )
}