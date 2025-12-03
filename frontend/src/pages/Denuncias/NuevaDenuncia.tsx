import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { crearDenuncia, type CrearDenunciaInput } from '@/services/denuncias.api'
import { routes } from '@/services/routes'
import { Cards } from '@/components/ui/Cards'
import { TIPOS_DENUNCIA, SUBTIPOS_DENUNCIA, REGIONES, COMUNAS, SEDES, LUGARES_SEDE, VINCULACIONES } from '@/data/denuncias.data'
import type { FormularioDenuncia, Involucrado, FaseRegistro } from '@/types/denuncia.types'
import FormularioLayout from './components/FormularioLayout'
import { useAuth } from '@/context/AuthContext'

const initialInvolucrado: Involucrado = {
  nombre: '',
  apellido1: '',
  apellido2: '',
  parentesco: '',
  vinculacion: '',
  antecedentes: '',
  descripcionFisica: ''
}

const initialForm: FormularioDenuncia = {
  rut: '', nombre: '', telefono: '', correo: '', genero: '', reservaIdentidad: false,
  tipoId: 0, subtipoId: null, descripcionOtro: '',
  regionDenunciante: '', comunaDenunciante: '', direccionDenunciante: '',

  victimaMenor: 'no',
  esVictima: 'si',
  victimaRut: '', victimaNombre: '', victimaApellido1: '', victimaApellido2: '',
  victimaGenero: '', victimaSexo: '', victimaNacionalidad: '', victimaNacimiento: '',
  victimaCorreo: '', victimaTelefono: '',

  regionHecho: '', comunaHecho: '', sedeHecho: '', lugarHecho: '', detalleHecho: '',
  fechaHecho: '', horaHecho: '', relato: '',
  involucrados: [],
  nuevoInvolucrado: { ...initialInvolucrado },
}

const steps = [
  { id: 1, label: 'Datos del denunciante' },
  { id: 2, label: 'Hechos y participantes' },
  { id: 3, label: 'Revisión' },
]

// ✅ HELPER: Detecta si el ID seleccionado corresponde a "Otro" (Género o Convivencia)
const esOtro = (id: number | null) => id === 199 || id === 299;

export default function NuevaDenuncia() {
  const nav = useNavigate()
  const { user } = useAuth()

  const [fase, setFase] = useState<FaseRegistro>('seleccion_tipo')
  const [form, setForm] = useState<FormularioDenuncia>(initialForm)
  const [step, setStep] = useState(1)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detalles, setDetalles] = useState<{ field: string; msg: string }[] | null>(null)

  const stepTitle = useMemo(() => steps[step - 1]?.label ?? '', [step])

  const subtiposDisponibles = useMemo(() => {
    if (!form.tipoId) return []
    // Filtramos solo por el tipoId correspondiente (1 o 2)
    return SUBTIPOS_DENUNCIA.filter((s) => s.tipoId === form.tipoId)
  }, [form.tipoId])

  const subtipoSeleccionado = useMemo(() => SUBTIPOS_DENUNCIA.find((s) => s.id === form.subtipoId) ?? null, [form.subtipoId])
  const tipoSeleccionado = useMemo(() => TIPOS_DENUNCIA.find((t) => t.id === form.tipoId) ?? null, [form.tipoId])

  const lugaresDisponibles = useMemo(() => {
    if (!form.sedeHecho) return []
    return LUGARES_SEDE[form.sedeHecho] || []
  }, [form.sedeHecho])

  useEffect(() => {
    if (user) {
      setForm((prev) => {
        const isVictima = prev.esVictima === 'si';
        return {
          ...prev,
          rut: user.rut,
          nombre: user.nombre,
          correo: user.email,
          victimaRut: isVictima ? user.rut : prev.victimaRut,
          victimaNombre: isVictima ? user.nombre : prev.victimaNombre,
          victimaCorreo: isVictima ? user.email : prev.victimaCorreo
        }
      })
    }
  }, [user])

  function handleSelectTipo(id: number) {
    setForm(prev => ({ ...prev, tipoId: id, subtipoId: null }))
    setFase('seleccion_subtipo')
    window.scrollTo(0, 0)
  }

  function handleSelectSubtipo(id: number) {
    setForm(prev => ({ ...prev, subtipoId: id, descripcionOtro: '' }))
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

  function handleEsVictimaChange(esVictima: 'si' | 'no') {
    if (esVictima === 'si' && user) {
      setForm(prev => ({
        ...prev,
        esVictima: 'si',
        victimaRut: user.rut,
        victimaNombre: user.nombre,
        victimaCorreo: user.email,
        victimaTelefono: prev.telefono
      }))
    } else {
      setForm(prev => ({
        ...prev,
        esVictima: 'no',
        victimaRut: '',
        victimaNombre: '',
        victimaCorreo: '',
        victimaTelefono: ''
      }))
    }
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
    if (step === 1) return !!form.rut.trim() && !!form.nombre.trim() && !!form.genero
    if (step === 2) {
      // ✅ CORRECCIÓN 1: Usar esOtro() en lugar de === 999
      if (esOtro(form.subtipoId) && !form.descripcionOtro.trim()) return false
      return !!form.relato.trim() && !!form.sedeHecho
    }
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

    if (!form.rut.trim() || !form.relato.trim() || !form.subtipoId) {
      setError('Faltan campos obligatorios.')
      return
    }

    const sedeNombre = SEDES.find(s => s.id === form.sedeHecho)?.nombre || form.sedeHecho
    const ubicacionCompleta = [
      sedeNombre,
      form.lugarHecho,
      form.detalleHecho
    ].filter(Boolean).join(' - ')

    let relatoFinal = form.relato.trim()

    // ✅ CORRECCIÓN 2: Usar esOtro() para concatenar la descripción
    if (esOtro(form.subtipoId) && form.descripcionOtro.trim()) {
      relatoFinal = `[MOTIVO ESPECÍFICO: ${form.descripcionOtro}]\n\n${relatoFinal}`
    }

    const notasAdicionales = [
      `Tipo General: ${tipoSeleccionado?.nombre}`,
      form.reservaIdentidad ? 'Solicita Reserva de Identidad' : null,
      form.esVictima === 'si' ? 'Denunciante es la víctima' : 'Denunciante es testigo/tercero',
      form.victimaMenor === 'si' ? 'Víctima es menor de edad' : null,
      form.esVictima === 'no' ? `Víctima: ${form.victimaNombre} (RUT: ${form.victimaRut})` : null
    ].filter(Boolean).join(' | ')

    const payload: CrearDenunciaInput = {
      Rut: form.rut.trim(),
      Nombre: form.nombre.trim(),
      Correo: form.correo.trim(),
      Telefono: form.telefono.trim(),
      genero: form.genero,
      ID_TipoDe: Number(form.subtipoId),
      Fecha_Inicio: form.fechaHecho ? new Date(form.fechaHecho).toISOString() : new Date().toISOString(),
      Relato_Hechos: relatoFinal,
      Ubicacion: ubicacionCompleta,
      denunciados: form.involucrados.map((i) => ({
        nombre: `${i.nombre} ${i.apellido1}`.trim() || 'Sin nombre',
        descripcion: i.descripcionFisica
      })),
      testigos: [],
      evidencias: [],
      caracteristicasDenunciado: notasAdicionales,
    }

    try {
      setEnviando(true)
      await crearDenuncia(payload)
      nav(routes.denuncias.root)
    } catch (err: any) {
      setError(err?.message ?? 'Error al crear la denuncia')
      if (err?.detalles && Array.isArray(err.detalles)) {
        setDetalles(err.detalles as { field: string; msg: string }[])
      }
    } finally {
      setEnviando(false)
    }
  }

  // --- RENDERS ---
  if (fase === 'seleccion_tipo') {
    return (
      <section className="mx-auto max-w-5xl py-12">
        <header className="mb-10 text-center px-4">
          <h1 className="font-condensed text-3xl font-bold tracking-tight text-gray-900">
            ¿Qué tipo de denuncia deseas realizar?
          </h1>
          <p className="mt-3 text-gray-600 max-w-2xl mx-auto">
            Selecciona la categoría general. Esto nos ayudará a derivar tu caso a la unidad correspondiente.
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
          <button onClick={() => history.back()} className="mt-4 inline-flex items-center justify-center rounded-md bg-ubb-blue px-6 py-2 text-sm font-semibold text-white">Cancelar</button>
        </div>
      </section>
    )
  }

  if (fase === 'seleccion_subtipo') {
    return (
      <section className="mx-auto max-w-6xl py-10">
        <header className="mb-8 px-4">
          <button onClick={handleBackToTipo} className="group mb-6 inline-flex items-center rounded-md bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-200">
            <span className="mr-2 transition-transform group-hover:-translate-x-1">&larr;</span> Volver a categorías
          </button>
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-sm font-bold tracking-wider text-ubb-blue uppercase bg-blue-50 px-2 py-1 rounded">{tipoSeleccionado?.nombre}</span>
            <h1 className="font-condensed text-3xl font-bold tracking-tight text-gray-900">Especifica el motivo</h1>
          </div>
          <p className="mt-2 text-gray-600">Selecciona la opción que mejor describa los hechos.</p>
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
          <div className="rounded-lg border border-blue-100 bg-blue-50/50 px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-ubb-blue uppercase tracking-wider">Categoría seleccionada</h3>
              <button onClick={handleBackToSubtipo} className="text-xs font-medium text-gray-500 underline hover:text-ubb-blue">Cambiar</button>
            </div>
            <div className="grid md:grid-cols-1 gap-6">
              <div>
                <label className="text-[10px] uppercase tracking-wide text-gray-500 font-bold block mb-1">Tipo de Denuncia</label>
                <p className="text-sm font-semibold">{subtipoSeleccionado?.nombre}</p>
              </div>
            </div>
          </div>

          <section className="space-y-4">
            <h2 className="font-condensed text-lg font-semibold text-gray-900 border-b pb-2">Datos de contacto</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">RUT *</label>
                <input className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="12.345.678-9" value={form.rut} onChange={(e) => updateField('rut', e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Nombre completo *</label>
                <input className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="Tu nombre" value={form.nombre} onChange={(e) => updateField('nombre', e.target.value)} required />
              </div>
            </div>

            {/* GÉNERO */}
            <div>
              <label className="text-sm font-medium text-gray-700">Género *</label>
              <select className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white" value={form.genero} onChange={(e) => updateField('genero', e.target.value)} required>
                <option value="">Seleccionar</option>
                <option value="Femenino">Femenino</option>
                <option value="Masculino">Masculino</option>
                <option value="No Binario">No Binario</option>
                <option value="Otro">Otro / Prefiero no decir</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Esta información ayuda a activar los protocolos de protección adecuados.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div><label className="text-sm font-medium text-gray-700">Teléfono</label><input className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="+56 9 ..." value={form.telefono} onChange={(e) => updateField('telefono', e.target.value)} /></div>
              <div><label className="text-sm font-medium text-gray-700">Correo</label><input type="email" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="correo@ubb.cl" value={form.correo} onChange={(e) => updateField('correo', e.target.value)} /></div>
            </div>

            {/* Región y Comuna */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">Región *</label>
                <select className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={form.regionDenunciante} onChange={(e) => updateField('regionDenunciante', e.target.value)}>
                  <option value="">Seleccionar</option>
                  {REGIONES.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Comuna *</label>
                <select className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={form.comunaDenunciante} onChange={(e) => updateField('comunaDenunciante', e.target.value)}>
                  <option value="">Seleccionar</option>
                  {COMUNAS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Dirección domicilio *</label>
              <input className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="Calle / número" value={form.direccionDenunciante} onChange={(e) => updateField('direccionDenunciante', e.target.value)} />
            </div>

            <div className="flex flex-wrap gap-6 pt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
              <div className="inline-flex items-center gap-3">
                <span>¿Reserva de identidad?</span>
                <label className="inline-flex items-center gap-1 cursor-pointer"><input type="radio" name="reserva" checked={form.reservaIdentidad} onChange={() => updateField('reservaIdentidad', true)} /> Sí</label>
                <label className="inline-flex items-center gap-1 cursor-pointer"><input type="radio" name="reserva" checked={!form.reservaIdentidad} onChange={() => updateField('reservaIdentidad', false)} /> No</label>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* PASO 2: HECHOS Y PARTICIPANTES */}
      {step === 2 && (
        <div className="space-y-8">

          <section className="space-y-4">
            <h2 className="font-condensed text-lg font-semibold text-gray-900 border-b pb-2">Información de la víctima</h2>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="grid gap-6 md:grid-cols-2 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">¿Víctima menor de edad?</p>
                  <div className="flex gap-4">
                    <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" name="menor" checked={form.victimaMenor === 'si'} onChange={() => updateField('victimaMenor', 'si')} /> Sí
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" name="menor" checked={form.victimaMenor === 'no'} onChange={() => updateField('victimaMenor', 'no')} /> No
                    </label>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">¿Eres tú la víctima?</p>
                  <div className="flex gap-4">
                    <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" name="esVictima" checked={form.esVictima === 'si'} onChange={() => handleEsVictimaChange('si')} /> Sí
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" name="esVictima" checked={form.esVictima === 'no'} onChange={() => handleEsVictimaChange('no')} /> No
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">RUT</label>
                  <input className={`mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm ${form.esVictima === 'si' ? 'bg-gray-100 text-gray-600' : 'bg-white'}`}
                    value={form.victimaRut}
                    onChange={(e) => updateField('victimaRut', e.target.value)}
                    disabled={form.esVictima === 'si'}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Nombre Completo</label>
                  <input className={`mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm ${form.esVictima === 'si' ? 'bg-gray-100 text-gray-600' : 'bg-white'}`}
                    value={form.victimaNombre}
                    onChange={(e) => updateField('victimaNombre', e.target.value)}
                    disabled={form.esVictima === 'si'}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Correo</label>
                  <input className={`mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm ${form.esVictima === 'si' ? 'bg-gray-100 text-gray-600' : 'bg-white'}`}
                    value={form.victimaCorreo}
                    onChange={(e) => updateField('victimaCorreo', e.target.value)}
                    disabled={form.esVictima === 'si'}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Teléfono</label>
                  <input className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white"
                    value={form.victimaTelefono}
                    onChange={(e) => updateField('victimaTelefono', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* NUEVOS CAMPOS: SEXO Y GÉNERO DE LA VÍCTIMA */}
            <div className="grid gap-4 md:grid-cols-2 mt-4 px-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Sexo *</label>
                <select
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white"
                  value={form.victimaSexo || ''}
                  onChange={(e) => updateField('victimaSexo', e.target.value)}
                >
                  <option value="">Seleccionar</option>
                  <option value="Hombre">Hombre</option>
                  <option value="Mujer">Mujer</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Género (Opcional)</label>
                <select
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white"
                  value={form.victimaGenero || ''}
                  onChange={(e) => updateField('victimaGenero', e.target.value)}
                >
                  <option value="">Seleccionar</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="No Binario">No Binario</option>
                  <option value="Otro">Otro</option>
                  <option value="Prefiero no decir">Prefiero no decir</option>
                </select>
              </div>
            </div>

          </section>

          <section className="space-y-4">
            <h2 className="font-condensed text-lg font-semibold text-gray-900 border-b pb-2">Personas involucradas (Denunciados)</h2>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">

              <div className="grid gap-3 md:grid-cols-3 mb-3">
                <input
                  placeholder="Nombre"
                  className="rounded border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  value={form.nuevoInvolucrado.nombre}
                  onChange={e => setForm(p => ({ ...p, nuevoInvolucrado: { ...p.nuevoInvolucrado, nombre: e.target.value } }))}
                />
                <input
                  placeholder="Apellido"
                  className="rounded border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  value={form.nuevoInvolucrado.apellido1}
                  onChange={e => setForm(p => ({ ...p, nuevoInvolucrado: { ...p.nuevoInvolucrado, apellido1: e.target.value } }))}
                />
                <select
                  className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-600 focus:ring-2 focus:ring-blue-100 outline-none"
                  value={form.nuevoInvolucrado.vinculacion}
                  onChange={e => setForm(p => ({ ...p, nuevoInvolucrado: { ...p.nuevoInvolucrado, vinculacion: e.target.value } }))}
                >
                  <option value="">Seleccionar Vinculación</option>
                  {VINCULACIONES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>

              <div className="mb-4">
                <textarea
                  placeholder="Información adicional (descripción física, vestimenta, señas particulares, etc.)"
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm h-24 resize-none focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-gray-400"
                  value={form.nuevoInvolucrado.descripcionFisica}
                  onChange={e => setForm(p => ({ ...p, nuevoInvolucrado: { ...p.nuevoInvolucrado, descripcionFisica: e.target.value } }))}
                />
              </div>

              <button
                type="button"
                onClick={handleAddInvolucrado}
                className="text-sm bg-ubb-blue text-white px-4 py-2 rounded font-medium hover:bg-blue-800 transition-colors flex items-center gap-1"
              >
                <span>+</span> Agregar persona
              </button>
            </div>

            {form.involucrados.length > 0 && (
              <div className="mt-4 border rounded-md overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b">
                  Personas agregadas ({form.involucrados.length})
                </div>
                <ul className="divide-y bg-white">
                  {form.involucrados.map((inv, i) => (
                    <li key={i} className="p-4 flex flex-col gap-1 text-sm hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-gray-900">{inv.nombre} {inv.apellido1}</span>
                          <span className="ml-2 inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                            {inv.vinculacion || 'Sin vinculación'}
                          </span>
                        </div>
                        <button type="button" onClick={() => handleRemoveInvolucrado(i)} className="text-red-600 hover:text-red-800 text-xs font-medium px-2 py-1 rounded hover:bg-red-50">
                          Eliminar
                        </button>
                      </div>
                      {inv.descripcionFisica && (
                        <p className="text-gray-600 text-xs mt-1 pl-3 border-l-2 border-gray-200">
                          {inv.descripcionFisica}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section className="space-y-4">
            <h2 className="font-condensed text-lg font-semibold text-gray-900 border-b pb-2">Relato de los hechos</h2>

            {/* ✅ CORRECCIÓN 3: Usar esOtro() para mostrar el input */}
            {esOtro(form.subtipoId) && (
              <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 animate-in fade-in slide-in-from-top-2">
                <label className="block text-sm font-bold text-yellow-800 mb-1">
                  Describe brevemente el tipo de situación *
                </label>
                <input
                  type="text"
                  className="block w-full rounded-md border-yellow-400 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 text-sm"
                  placeholder="Ej: Problemas con un proveedor externo, ruidos molestos, etc."
                  value={form.descripcionOtro}
                  onChange={(e) => updateField('descripcionOtro', e.target.value)}
                  required
                />
                <p className="text-xs text-yellow-700 mt-1">Esta descripción corta nos ayudará a clasificar tu caso.</p>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Fecha *</label>
                <input type="date" className="mt-1 w-full rounded border-gray-300 px-3 py-2 text-sm" value={form.fechaHecho} onChange={e => updateField('fechaHecho', e.target.value)} />
              </div>
              <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">Sede *</label>
                  <select
                    className="mt-1 w-full rounded border-gray-300 px-3 py-2 text-sm"
                    value={form.sedeHecho}
                    onChange={e => {
                      const sede = SEDES.find(s => s.id === e.target.value)
                      updateField('sedeHecho', e.target.value)
                      updateField('regionHecho', sede?.region || '')
                      updateField('lugarHecho', '')
                    }}
                  >
                    <option value="">Seleccionar Sede</option>
                    {SEDES.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Región</label>
                  <input className="mt-1 w-full rounded border-gray-300 px-3 py-2 text-sm bg-gray-100 text-gray-600" value={form.regionHecho} readOnly />
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">Lugar Específico</label>
                <select className="mt-1 w-full rounded border-gray-300 px-3 py-2 text-sm" value={form.lugarHecho} onChange={e => updateField('lugarHecho', e.target.value)} disabled={!form.sedeHecho}>
                  <option value="">Seleccionar Lugar</option>
                  {lugaresDisponibles.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Detalles adicionales</label>
                <input className="mt-1 w-full rounded border-gray-300 px-3 py-2 text-sm" placeholder="Ej: Segundo piso, pasillo norte..." value={form.detalleHecho} onChange={e => updateField('detalleHecho', e.target.value)} />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Descripción detallada de los hechos *</label>
              <textarea
                className="w-full rounded border-gray-300 px-3 py-2 text-sm h-32 focus:ring-2 focus:ring-ubb-blue/20"
                placeholder="Describe qué pasó, cómo, cuándo y quiénes estaban presentes..."
                value={form.relato}
                onChange={e => updateField('relato', e.target.value)}
                required
              />
            </div>

            {/* SECCIÓN DE EVIDENCIA (VISUAL) */}
            <div className="pt-4 border-t border-gray-200">
              <label className="text-sm font-medium text-gray-700 block mb-2">Adjuntar Evidencia (Opcional)</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer">
                <svg className="w-10 h-10 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm text-gray-600 font-medium">Haz clic para subir archivos o arrástralos aquí</p>
                <p className="text-xs text-gray-500 mt-1">Formatos permitidos: PDF, JPG, PNG, DOCX (Máx. 10MB)</p>
              </div>
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
              <div><dt className="text-gray-500 text-xs uppercase font-bold">Tipo de Denuncia</dt><dd>{subtipoSeleccionado?.nombre} {esOtro(form.subtipoId) && `(${form.descripcionOtro})`}</dd></div>
              <div><dt className="text-gray-500 text-xs uppercase font-bold">Víctima</dt><dd>{form.victimaNombre || 'No especificado'}</dd></div>

              <div className="md:col-span-2">
                <dt className="text-gray-500 text-xs uppercase font-bold mb-1">Personas Denunciadas</dt>
                {form.involucrados.length > 0 ? (
                  <ul className="list-disc pl-4 text-gray-700">
                    {form.involucrados.map((inv, idx) => (
                      <li key={idx}>{inv.nombre} {inv.apellido1} ({inv.vinculacion})</li>
                    ))}
                  </ul>
                ) : (
                  <dd className="text-gray-500 italic">No se agregaron personas específicas</dd>
                )}
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