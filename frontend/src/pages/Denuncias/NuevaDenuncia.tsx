import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { crearDenuncia, type CrearDenunciaInput } from '@/services/denuncias.api'
import { routes } from '@/services/routes'
import { Cards } from '@/components/ui/Cards'



type OpcionTipo = { 
  id: number; 
  nombre: string; 
  descripcion: string; 
  icono: React.ReactNode 
}
//definiciones del tipo y el subtipo
type OpcionSubtipo = {
  id: number
  tipoId: number
  nombre: string
  descripcion: string
}

const IconoViolencia = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
)

const IconoConvivencia = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.499 5.24 50.552 50.552 0 00-2.658.814m-15.482 0A50.55 50.55 0 0112 13.489a50.55 50.55 0 016.744-3.342" />
  </svg>
)

const TIPOS_DENUNCIA: OpcionTipo[] = [
  { 
    id: 1, 
    nombre: 'Acoso / Violencia / Discriminación', 
    descripcion: 'Denuncias relacionadas con acoso sexual, laboral, violencia de género o discriminación arbitraria (Dirgegen).',
    icono: <IconoViolencia />
  },
  { 
    id: 2, 
    nombre: 'Convivencia Estudiantil', 
    descripcion: 'Denuncias por faltas al Reglamento de Convivencia tales como agresiones entre pares, conflictos cotidianos o daños.',
    icono: <IconoConvivencia />
  },
]

const SUBTIPOS_DENUNCIA: OpcionSubtipo[] = [
  { id: 101, tipoId: 1, nombre: 'Acoso sexual', descripcion: 'Requerimientos de carácter sexual no consentidos que amenacen o perjudiquen tu situación laboral o académica.' },
  { id: 102, tipoId: 1, nombre: 'Acoso laboral', descripcion: 'Conductas de hostigamiento que provoquen menoscabo, maltrato o humillación; incluye Ley Karin.' },
  { id: 103, tipoId: 1, nombre: 'Violencia de género', descripcion: 'Cualquier acción basada en género que cause daño físico, sexual o psicológico.' },
  { id: 104, tipoId: 1, nombre: 'Violencia ejercida por terceros', descripcion: 'Agresiones realizadas por clientes, proveedores o usuarios hacia trabajadores/as.' },
  { id: 105, tipoId: 1, nombre: 'Discriminación arbitraria', descripcion: 'Exclusión o menoscabo por raza, nacionalidad, sexo, orientación sexual, religión, edad, etc.' },
  { id: 106, tipoId: 1, nombre: 'Agresión física/psicológica', descripcion: 'Agresiones individuales o colectivas ocurridas en recintos universitarios.' },
  { id: 201, tipoId: 2, nombre: 'Plagio en certámenes / tesis', descripcion: 'Presentar como propio un trabajo realizado por terceros.' },
  { id: 202, tipoId: 2, nombre: 'Copia de material no autorizado', descripcion: 'Copiar o utilizar información no autorizada en evaluaciones.' },
  { id: 203, tipoId: 2, nombre: 'Suplantación académica', descripcion: 'Suplantar o dejarse suplantar en actividades académicas.' },
  { id: 204, tipoId: 2, nombre: 'Adulteración de documentos', descripcion: 'Confeccionar o adulterar certificados/documentos oficiales.' },
  { id: 205, tipoId: 2, nombre: 'Uso indebido de propiedad', descripcion: 'Usar sin autorización recursos, sellos o equipamiento UBB.' },
  { id: 206, tipoId: 2, nombre: 'Daño a la propiedad', descripcion: 'Destruir o deteriorar bienes o infraestructura.' },
  { id: 207, tipoId: 2, nombre: 'Uso indebido de beneficios', descripcion: 'Suplantación para acceder a becas o créditos.' },
  { id: 208, tipoId: 2, nombre: 'Consumo/porte ilegal', descripcion: 'Sustancias ilícitas que pongan en riesgo la integridad.' },
  { id: 209, tipoId: 2, nombre: 'Uso de recintos para drogas', descripcion: 'Elaborar o traficar sustancias en la universidad.' },
  { id: 210, tipoId: 2, nombre: 'Amenaza u ofensa', descripcion: 'Amenazar o insultar a miembros de la comunidad.' },
  { id: 211, tipoId: 2, nombre: 'Fraude / representación falsa', descripcion: 'Arrogarse la representación de la Universidad.' },
  { id: 212, tipoId: 2, nombre: 'Maltrato animal', descripcion: 'Maltratar animales en dependencias universitarias.' },
]

const REGIONES = ['XV Región de Arica y Parinacota', 'I Región de Tarapacá', 'II Región de Antofagasta', 'III Región de Atacama', 'IV Región de Coquimbo', 'V Región de Valparaíso', 'RM Región Metropolitana de Santiago', 'VI Región del Libertador General Bernardo O’Higgins', 'VII Región del Maule', 'XVI Región de Ñuble', 'VIII Región del Bío-Bío', 'IX Región de La Araucanía', 'XIV Región de Los Ríos', 'X Región de Los Lagos', 'XI Región de Aysén del General Carlos Ibáñez del Campo', 'XII Región de Magallanes y de la Antártica Chilena'];
const COMUNAS = ['Concepción', 'Chillán', 'Los Ángeles', 'Talcahuano', 'San Pedro de la Paz', 'Santiago', 'Valparaíso']; // Simplificado

//estructua de todo el formulario 

type Involucrado = {
  nombre: string
  apellido1: string
  apellido2: string
  parentesco: string
  vinculacion: string
  antecedentes: string
}

type FormularioDenuncia = {
  rut: string
  nombre: string
  telefono: string
  correo: string
  institucional: boolean
  reservaIdentidad: boolean

  tipoId: number // esto es lo que cambia
  subtipoId: number | null// este igual
  regionDenunciante: string
  comunaDenunciante: string
  direccionDenunciante: string

  victimaMenor: 'si' | 'no'
  esVictima: 'si' | 'no'
  victimaRut: string
  victimaNombre: string
  victimaApellido1: string
  victimaApellido2: string
  victimaGenero: string
  victimaSexo: string
  victimaNacionalidad: string
  victimaNacimiento: string
  // esto deberiamos cambiarlo con lo de l si es chillan o conce y que falcultad es 
  regionHecho: string
  comunaHecho: string
  direccionHecho: string
  fechaHecho: string
  horaHecho: string
  relato: string
  involucrados: Involucrado[]
  nuevoInvolucrado: Involucrado
}

const initialInvolucrado: Involucrado = { nombre: '', apellido1: '', apellido2: '', parentesco: '', vinculacion: '', antecedentes: '' }

const initialForm: FormularioDenuncia = {
  rut: '', nombre: '', telefono: '', correo: '', institucional: false, reservaIdentidad: false,
  tipoId: 0, subtipoId: null,
  regionDenunciante: '', comunaDenunciante: '', direccionDenunciante: '',
  victimaMenor: 'no', esVictima: 'si', victimaRut: '', victimaNombre: '', victimaApellido1: '', victimaApellido2: '', victimaGenero: '', victimaSexo: '', victimaNacionalidad: '', victimaNacimiento: '',
  regionHecho: '', comunaHecho: '', direccionHecho: '', fechaHecho: '', horaHecho: '', relato: '',
  involucrados: [], nuevoInvolucrado: { ...initialInvolucrado },
}

const steps = [
  { id: 1, label: 'Datos del denunciante' },
  { id: 2, label: 'Hechos y participantes' },
  { id: 3, label: 'Revisión' },
]

type FaseRegistro = 'seleccion_tipo' | 'seleccion_subtipo' | 'formulario'

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
    if (!form.nuevoInvolucrado.nombre.trim()) return
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
    if (step === 2) return !!form.relato.trim()
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

    // esto es de los tipos y sub tipos
    const notasAdicionales = [
      subtipoSeleccionado ? `Subtipo: ${subtipoSeleccionado.nombre}` : null,
      subtipoSeleccionado ? subtipoSeleccionado.descripcion : null,
    ].filter(Boolean).join(' | ') || null

    const payload: CrearDenunciaInput = {
      Rut: form.rut.trim(),
      ID_TipoDe: Number(form.tipoId),
      Fecha_Inicio: form.fechaHecho ? new Date(form.fechaHecho).toISOString() : new Date().toISOString(),
      Relato_Hechos: form.relato.trim(),
      Ubicacion: form.direccionHecho.trim() || form.regionHecho ? `${form.direccionHecho} ${form.comunaHecho}`.trim() : null,
      denunciados: form.involucrados.map((i) => ({ nombre: `${i.nombre} ${i.apellido1}`.trim(), rut: undefined })),
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

// lo primero que sale los 2 tipos  
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

 

// y aca el subtipo
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

  // lo que estaba antes 

  return (
    <section className="mx-auto max-w-4xl py-6">
      <header className="mb-6 space-y-2">
        <p className="text-xs font-bold uppercase tracking-wide text-ubb-blue">Nueva denuncia</p>
        <h1 className="font-condensed text-3xl font-bold tracking-tight text-gray-900">
          Paso {step} · {stepTitle}
        </h1>
        <p className="text-sm text-gray-600">
          Completa los campos. Puedes revisar todo al final antes de enviar.
        </p>
      </header>

      
      <ol className="mb-8 flex items-center justify-between gap-3">
        {steps.map((s, idx) => {
          const isActive = step === s.id
          const isCompleted = step > s.id
          return (
            <li key={s.id} className="flex flex-1 items-center gap-3">
              <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${isCompleted ? 'bg-ubb-blue text-white' : isActive ? 'border-2 border-ubb-blue text-ubb-blue' : 'border-2 border-gray-300 text-gray-500'}`}>
                {isCompleted ? '✓' : s.id}
              </span>
              <div className={`hidden sm:block flex-1 text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>{s.label}</div>
              {idx < steps.length - 1 && <div className="h-[1px] flex-1 bg-gray-200" />}
            </li>
          )
        })}
      </ol>

      {error && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p className="font-bold">No se pudo registrar</p>
          <p>{error}</p>
          {detalles && (
            <ul className="mt-2 list-disc pl-4">
              {detalles.map((d, i) => <li key={i}><b>{d.field}:</b> {d.msg}</li>)}
            </ul>
          )}
        </div>
      )}

      <div className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        
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
                  <input className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="12.345.678-9" value={form.rut} onChange={(e) => updateField('rut', e.target.value)} required />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Nombre completo *</label>
                  <input className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="Tu nombre" value={form.nombre} onChange={(e) => updateField('nombre', e.target.value)} required />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">Teléfono</label>
                  <input className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="+56 9 ..." value={form.telefono} onChange={(e) => updateField('telefono', e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Correo</label>
                  <input type="email" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="correo@ubb.cl" value={form.correo} onChange={(e) => updateField('correo', e.target.value)} />
                </div>
              </div>
              
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
                <label className="text-sm font-medium text-gray-700">Dirección *</label>
                <input className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="Calle / número" value={form.direccionDenunciante} onChange={(e) => updateField('direccionDenunciante', e.target.value)} />
              </div>

              <div className="flex flex-wrap gap-6 pt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.institucional} onChange={(e) => updateField('institucional', e.target.checked)} className="rounded text-ubb-blue focus:ring-ubb-blue" />
                  ¿Es una denuncia institucional?
                </label>
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
                <div><label className="text-sm font-medium text-gray-700">RUT</label><input className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={form.victimaRut} onChange={(e) => updateField('victimaRut', e.target.value)} /></div>
                <div><label className="text-sm font-medium text-gray-700">Nombre</label><input className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={form.victimaNombre} onChange={(e) => updateField('victimaNombre', e.target.value)} /></div>
                <div><label className="text-sm font-medium text-gray-700">Apellidos</label><input className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={form.victimaApellido1} onChange={(e) => updateField('victimaApellido1', e.target.value)} /></div>
              </div>
            </section>

            {/* Sección Involucrados */}
            <section className="space-y-4">
               <h2 className="font-condensed text-lg font-semibold text-gray-900 border-b pb-2">Personas involucradas (Denunciados)</h2>
               <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="grid gap-3 md:grid-cols-3 mb-3">
                    <input placeholder="Nombre" className="rounded border border-gray-300 px-3 py-2 text-sm" value={form.nuevoInvolucrado.nombre} onChange={e => setForm(p => ({...p, nuevoInvolucrado: {...p.nuevoInvolucrado, nombre: e.target.value}}))} />
                    <input placeholder="Apellido" className="rounded border border-gray-300 px-3 py-2 text-sm" value={form.nuevoInvolucrado.apellido1} onChange={e => setForm(p => ({...p, nuevoInvolucrado: {...p.nuevoInvolucrado, apellido1: e.target.value}}))} />
                    <input placeholder="Vinculación (Estudiante/Docente)" className="rounded border border-gray-300 px-3 py-2 text-sm" value={form.nuevoInvolucrado.vinculacion} onChange={e => setForm(p => ({...p, nuevoInvolucrado: {...p.nuevoInvolucrado, vinculacion: e.target.value}}))} />
                  </div>
                  <button type="button" onClick={handleAddInvolucrado} className="text-sm bg-ubb-blue text-white px-3 py-1.5 rounded hover:bg-blue-700 transition-colors">
                    + Agregar persona
                  </button>
               </div>
               {form.involucrados.length > 0 && (
                 <ul className="divide-y border rounded-md">
                   {form.involucrados.map((inv, i) => (
                     <li key={i} className="p-3 flex justify-between items-center text-sm">
                       <span>{inv.nombre} {inv.apellido1} <span className="text-gray-500">({inv.vinculacion})</span></span>
                       <button type="button" onClick={() => handleRemoveInvolucrado(i)} className="text-red-600 hover:underline text-xs">Eliminar</button>
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
                  <input type="date" className="mt-1 w-full rounded border-gray-300 px-3 py-2 text-sm" value={form.fechaHecho} onChange={e => updateField('fechaHecho', e.target.value)} />
                 </div>
                 <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Lugar *</label>
                  <input className="mt-1 w-full rounded border-gray-300 px-3 py-2 text-sm" placeholder="Dirección, Campus, Sala..." value={form.direccionHecho} onChange={e => updateField('direccionHecho', e.target.value)} />
                 </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Descripción detallada *</label>
                <textarea 
                  className="w-full rounded border-gray-300 px-3 py-2 text-sm h-32 focus:ring-2 focus:ring-ubb-blue/20" 
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
                   <div className="md:col-span-2"><dt className="text-gray-500 text-xs uppercase font-bold mb-1">Relato</dt><dd className="bg-white p-3 rounded border text-gray-700 whitespace-pre-wrap">{form.relato}</dd></div>
                </dl>
             </div>
             <div className="text-sm text-gray-500 text-center">
               <p>Al enviar, confirmas que los datos entregados son verídicos.</p>
             </div>
          </div>
        )}
      </div>

      {/* FOOTER NAVEGACIÓN */}
      <div className="mt-6 flex flex-col gap-3 border-t border-gray-100 pt-4 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-gray-500">Paso {step} de {steps.length}</div>
        <div className="flex flex-col gap-2 md:flex-row">
          <button type="button" onClick={handleBackToSubtipo} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            {step === 1 ? 'Volver a selección' : 'Volver'}
          </button>
          
          {step < steps.length && (
            <button type="button" disabled={!puedeAvanzar()} onClick={handleNext} className="rounded-md bg-ubb-blue px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed">
              Siguiente
            </button>
          )}
          
          {step === steps.length && (
            <button type="button" onClick={enviarDenuncia} disabled={enviando} className="rounded-md bg-ubb-blue px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50">
              {enviando ? 'Enviando...' : 'Enviar denuncia'}
            </button>
          )}
        </div>
      </div>
    </section>
  )
}