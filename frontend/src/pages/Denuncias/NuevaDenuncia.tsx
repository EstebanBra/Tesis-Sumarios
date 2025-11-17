import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { crearDenuncia, type CrearDenunciaInput } from '@/services/denuncias.api'
import { routes } from '@/services/routes'

type OpcionTipo = { id: number; nombre: string }

type OpcionSubtipo = {
  id: number
  tipoId: number
  nombre: string
  descripcion: string
}

const TIPOS_DENUNCIA: OpcionTipo[] = [
  { id: 1, nombre: 'Acoso/Violencia/Discriminación (Dirgegen)' },
  { id: 2, nombre: 'Infracción Reglamento de Convivencia Estudiantil' },
]

const SUBTIPOS_DENUNCIA: OpcionSubtipo[] = [
  {
    id: 101,
    tipoId: 1,
    nombre: 'Acoso sexual',
    descripcion:
      'Requerimientos de carácter sexual no consentidos que amenacen o perjudiquen tu situación laboral o académica.',
  },
  {
    id: 102,
    tipoId: 1,
    nombre: 'Acoso laboral',
    descripcion:
      'Conductas de hostigamiento que provoquen menoscabo, maltrato o humillación; incluye lo establecido por la Ley Karin.',
  },
  {
    id: 103,
    tipoId: 1,
    nombre: 'Violencia de género',
    descripcion:
      'Cualquier acción basada en género que cause daño físico, sexual o psicológico dentro de la comunidad universitaria.',
  },
  {
    id: 104,
    tipoId: 1,
    nombre: 'Violencia ejercida por terceros',
    descripcion:
      'Agresiones realizadas por clientes, proveedores o usuarios hacia trabajadores/as durante la prestación de servicios.',
  },
  {
    id: 105,
    tipoId: 1,
    nombre: 'Discriminación arbitraria',
    descripcion:
      'Actos que excluyen o menoscaban por motivos de raza, nacionalidad, sexo, orientación sexual, religión, edad, entre otros.',
  },
  {
    id: 106,
    tipoId: 1,
    nombre: 'Agresión física/psicológica',
    descripcion:
      'Agresiones individuales o colectivas, físicas, psicológicas o de género, ocurridas en recintos universitarios.',
  },
  {
    id: 201,
    tipoId: 2,
    nombre: 'Plagio en certámenes / tesis',
    descripcion:
      'Presentar como propio un trabajo realizado por terceros (proyectos, memorias, tesis u otras AFE).',
  },
  {
    id: 202,
    tipoId: 2,
    nombre: 'Copia de material no autorizado',
    descripcion:
      'Copiar o utilizar información no autorizada en evaluaciones por cualquier medio físico o virtual.',
  },
  {
    id: 203,
    tipoId: 2,
    nombre: 'Suplantación académica',
    descripcion: 'Suplantar o dejarse suplantar en el cumplimiento de actividades académicas.',
  },
  {
    id: 204,
    tipoId: 2,
    nombre: 'Adulteración de documentos',
    descripcion:
      'Confeccionar, adulterar o comercializar certificados o documentos oficiales de la Universidad.',
  },
  {
    id: 205,
    tipoId: 2,
    nombre: 'Uso indebido de propiedad universitaria',
    descripcion:
      'Usar sin autorización recursos o bienes institucionales, logos, sellos, timbres o equipamiento.',
  },
  {
    id: 206,
    tipoId: 2,
    nombre: 'Daño a la propiedad',
    descripcion:
      'Destruir o deteriorar bienes de la Universidad o afectar estructuras patrimoniales.',
  },
  {
    id: 207,
    tipoId: 2,
    nombre: 'Uso indebido de beneficios',
    descripcion:
      'Suplantar o dejarse suplantar para acceder a becas, créditos u otras ayudas internas.',
  },
  {
    id: 208,
    tipoId: 2,
    nombre: 'Consumo/porte ilegal de sustancias',
    descripcion:
      'Forzar, inducir o transitar bajo efectos de sustancias ilícitas que pongan en riesgo la integridad.',
  },
  {
    id: 209,
    tipoId: 2,
    nombre: 'Uso indebido de recintos para sustancias',
    descripcion:
      'Utilizar recintos para elaborar, traficar o transformar drogas o psicotrópicos ilegales.',
  },
  {
    id: 210,
    tipoId: 2,
    nombre: 'Amenaza u ofensa a la dignidad',
    descripcion:
      'Amenazar, ofender o insultar a miembros de la comunidad universitaria (excluye discriminación arbitraria).',
  },
  {
    id: 211,
    tipoId: 2,
    nombre: 'Fraude / representación falsa',
    descripcion:
      'Arrogarse mediante simulación la representación de la Universidad o de un funcionario.',
  },
  {
    id: 212,
    tipoId: 2,
    nombre: 'Maltrato animal',
    descripcion:
      'Maltratar animales que coexisten con la comunidad en dependencias universitarias.',
  },
]

const REGIONES = [
  'XV Región de Arica y Parinacota',
  'I Región de Tarapacá',
  'II Región de Antofagasta',
  'III Región de Atacama',
  'IV Región de Coquimbo',
  'V Región de Valparaíso',
  'RM Región Metropolitana de Santiago',
  'VI Región del Libertador General Bernardo O’Higgins',
  'VII Región del Maule',
  'XVI Región de Ñuble',
  'VIII Región del Bío-Bío',
  'IX Región de La Araucanía',
  'XIV Región de Los Ríos',
  'X Región de Los Lagos',
  'XI Región de Aysén del General Carlos Ibáñez del Campo',
  'XII Región de Magallanes y de la Antártica Chilena'
];

const COMUNAS = [
  // XV Región: Arica y Parinacota
  'Arica', 'Putre',
  // I Región: Tarapacá
  'Iquique', 'Alto Hospicio',
  // II Región: Antofagasta
  'Antofagasta', 'Calama', 'San Pedro de Atacama',
  // V Región: Valparaíso
  'Valparaíso', 'Viña del Mar', 'Isla de Pascua',
  // RM Región: Metropolitana
  'Santiago', 'Maipú', 'Las Condes', 'Puente Alto',
  // VII Región: Maule
  'Talca', 'Constitución', 'Linares',
  // XVI Región: Ñuble
  'Chillán', 'San Carlos', 'Bulnes',
  // VIII Región: Bío-Bío
  'Concepción', 'San Pedro de la Paz', 'Los Ángeles', 'Talcahuano', 'Coronel',
  // IX Región: La Araucanía
  'Temuco', 'Pucón', 'Villarrica',
  // X Región: Los Lagos
  'Puerto Montt', 'Osorno', 'Castro',
  // XII Región: Magallanes
  'Punta Arenas', 'Puerto Natales', 'Cabo de Hornos'
];

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
  tipoId: number
  subtipoId: number | null
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

  regionHecho: string
  comunaHecho: string
  direccionHecho: string
  fechaHecho: string
  horaHecho: string
  relato: string

  involucrados: Involucrado[]
  nuevoInvolucrado: Involucrado
}

const initialInvolucrado: Involucrado = {
  nombre: '',
  apellido1: '',
  apellido2: '',
  parentesco: '',
  vinculacion: '',
  antecedentes: '',
}

const initialForm: FormularioDenuncia = {
  rut: '',
  nombre: '',
  telefono: '',
  correo: '',
  institucional: false,
  reservaIdentidad: false,
  tipoId: 1,
  subtipoId: null,
  regionDenunciante: '',
  comunaDenunciante: '',
  direccionDenunciante: '',

  victimaMenor: 'no',
  esVictima: 'si',
  victimaRut: '',
  victimaNombre: '',
  victimaApellido1: '',
  victimaApellido2: '',
  victimaGenero: '',
  victimaSexo: '',
  victimaNacionalidad: '',
  victimaNacimiento: '',

  regionHecho: '',
  comunaHecho: '',
  direccionHecho: '',
  fechaHecho: '',
  horaHecho: '',
  relato: '',

  involucrados: [],
  nuevoInvolucrado: { ...initialInvolucrado },
}

const steps = [
  { id: 1, label: 'Datos del denunciante' },
  { id: 2, label: 'Hechos y participantes' },
  { id: 3, label: 'Revisión' },
]

export default function NuevaDenuncia() {
  const nav = useNavigate()
  const [form, setForm] = useState<FormularioDenuncia>(initialForm)
  const [step, setStep] = useState(1)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detalles, setDetalles] = useState<{ field: string; msg: string }[] | null>(null)

  const stepTitle = useMemo(() => steps[step - 1]?.label ?? '', [step])
  const subtiposDisponibles = useMemo(
    () => SUBTIPOS_DENUNCIA.filter((s) => s.tipoId === form.tipoId),
    [form.tipoId],
  )
  const subtipoSeleccionado = useMemo(
    () => SUBTIPOS_DENUNCIA.find((s) => s.id === form.subtipoId) ?? null,
    [form.subtipoId],
  )

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
    if (step === 1) {
      return !!form.rut.trim() && !!form.nombre.trim() && form.subtipoId != null
    }
    if (step === 2) {
      return !!form.relato.trim()
    }
    return true
  }

  async function enviarDenuncia() {
    setError(null)
    setDetalles(null)

    if (!form.rut.trim() || !form.relato.trim()) {
      setError('Debes completar al menos el RUT del denunciante y el relato del hecho.')
      return
    }

    const subtipo = SUBTIPOS_DENUNCIA.find((s) => s.id === form.subtipoId) ?? null
    const notasAdicionales = [
      subtipo ? `Subtipo seleccionado: ${subtipo.nombre}` : null,
      subtipo ? subtipo.descripcion : null,
    ]
      .filter(Boolean)
      .join(' | ') || null

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

  function handleNext() {
    if (step < steps.length && puedeAvanzar()) {
      setStep((prev) => prev + 1)
    }
  }

  function handlePrev() {
    if (step > 1) setStep((prev) => prev - 1)
  }

  return (
    <section className="mx-auto max-w-4xl">
      <header className="mb-6 space-y-2">
        <p className="text-sm uppercase tracking-wide text-ubb-blue font-semibold">Nueva denuncia</p>
        <h1 className="font-condensed text-3xl font-bold tracking-tight text-gray-900">Paso {step} · {stepTitle}</h1>
        <p className="text-sm text-gray-600">Completa los campos siguiendo el flujo. Puedes revisar todo al final antes de enviar.</p>
      </header>

      <ol className="mb-8 flex items-center justify-between gap-3">
        {steps.map((s, idx) => {
          const isActive = step === s.id
          const isCompleted = step > s.id
          return (
            <li key={s.id} className="flex flex-1 items-center gap-3">
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                  isCompleted
                    ? 'bg-ubb-blue text-white'
                    : isActive
                      ? 'border-2 border-ubb-blue text-ubb-blue'
                      : 'border-2 border-gray-300 text-gray-500'
                }`}
              >
                {isCompleted ? '✓' : s.id}
              </span>
              <div className="flex-1 text-sm font-medium text-gray-700">{s.label}</div>
              {idx < steps.length - 1 && <div className="h-[1px] flex-1 bg-gray-200" />}
            </li>
          )
        })}
      </ol>

      {error && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p className="font-semibold">No se pudo registrar la denuncia</p>
          <p className="mt-1">{error}</p>
          {detalles && (
            <ul className="mt-2 list-disc space-y-1 pl-4">
              {detalles.map((d, i) => (
                <li key={i}>
                  <span className="font-semibold">{d.field}:</span> {d.msg}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        {step === 1 && (
          <div className="space-y-6">
            <section className="space-y-4">
              <header className="border-b border-gray-100 pb-2">
                <h2 className="font-condensed text-xl font-semibold text-gray-900">Datos del denunciante</h2>
                <p className="text-sm text-gray-500">Usaremos esta información para contactarte y validar la denuncia.</p>
              </header>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">RUT *</label>
                  <input
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-ubb-blue focus:ring-2 focus:ring-ubb-blue/30"
                    placeholder="12.345.678-9"
                    value={form.rut}
                    onChange={(e) => updateField('rut', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Nombre completo *</label>
                  <input
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-ubb-blue focus:ring-2 focus:ring-ubb-blue/30"
                    placeholder="Tu nombre y apellidos"
                    value={form.nombre}
                    onChange={(e) => updateField('nombre', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">Teléfono *</label>
                  <input
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-ubb-blue focus:ring-2 focus:ring-ubb-blue/30"
                    placeholder="+56 9 ..."
                    value={form.telefono}
                    onChange={(e) => updateField('telefono', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Correo electrónico *</label>
                  <input
                    type="email"
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-ubb-blue focus:ring-2 focus:ring-ubb-blue/30"
                    placeholder="correo@ubb.cl"
                    value={form.correo}
                    onChange={(e) => updateField('correo', e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-6 text-sm text-gray-700">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.institucional}
                    onChange={(e) => updateField('institucional', e.target.checked)}
                  />
                  ¿Denuncia institucional?
                </label>
                <label className="inline-flex items-center gap-2">
                  ¿Deseas mantener tu identidad en reserva?
                  <label className="inline-flex items-center gap-1 text-gray-800">
                    <input
                      type="radio"
                      name="reserva"
                      checked={form.reservaIdentidad}
                      onChange={() => updateField('reservaIdentidad', true)}
                    />
                    Sí
                  </label>
                  <label className="inline-flex items-center gap-1 text-gray-800">
                    <input
                      type="radio"
                      name="reserva"
                      checked={!form.reservaIdentidad}
                      onChange={() => updateField('reservaIdentidad', false)}
                    />
                    No
                  </label>
                </label>
              </div>
            </section>

            <section className="space-y-4">
              <header className="border-b border-gray-100 pb-2">
                <h2 className="font-condensed text-xl font-semibold text-gray-900">Datos de contacto</h2>
              </header>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">Región *</label>
                  <select
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={form.regionDenunciante}
                    onChange={(e) => updateField('regionDenunciante', e.target.value)}
                  >
                    <option value="">Seleccionar región</option>
                    {REGIONES.map((region) => (
                      <option key={region}>{region}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Comuna *</label>
                  <select
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={form.comunaDenunciante}
                    onChange={(e) => updateField('comunaDenunciante', e.target.value)}
                  >
                    <option value="">Seleccionar comuna</option>
                    {COMUNAS.map((comuna) => (
                      <option key={comuna}>{comuna}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">Tipo de denuncia *</label>
                  <select
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={String(form.tipoId)}
                    onChange={(e) => {
                      const nextTipo = Number(e.target.value)
                      setForm((prev) => ({
                        ...prev,
                        tipoId: nextTipo,
                        subtipoId:
                          prev.subtipoId && SUBTIPOS_DENUNCIA.some((s) => s.id === prev.subtipoId && s.tipoId === nextTipo)
                            ? prev.subtipoId
                            : null,
                      }))
                    }}
                  >
                    {TIPOS_DENUNCIA.map((tipo) => (
                      <option key={tipo.id} value={tipo.id}>
                        {tipo.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Subtipo específico *</label>
                  <select
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={form.subtipoId ?? ''}
                    onChange={(e) => updateField('subtipoId', e.target.value ? Number(e.target.value) : null)}
                    disabled={subtiposDisponibles.length === 0}
                  >
                    <option value="">{subtiposDisponibles.length ? 'Seleccionar subtipo' : 'Sin subtipos'}</option>
                    {subtiposDisponibles.map((subtipo) => (
                      <option key={subtipo.id} value={subtipo.id}>
                        {subtipo.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {subtipoSeleccionado ? (
                <div className="rounded-lg border border-ubb-blue/30 bg-ubb-blue/5 px-4 py-3 text-sm text-gray-700">
                  <p className="font-semibold text-ubb-blue">{subtipoSeleccionado.nombre}</p>
                  <p className="mt-1 leading-relaxed">{subtipoSeleccionado.descripcion}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Selecciona un subtipo para ver su descripción oficial.</p>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700">Dirección *</label>
                <input
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Calle / número / depto"
                  value={form.direccionDenunciante}
                  onChange={(e) => updateField('direccionDenunciante', e.target.value)}
                />
              </div>
            </section>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <section className="space-y-4">
              <header className="border-b border-gray-100 pb-2">
                <h2 className="font-condensed text-xl font-semibold text-gray-900">Víctima</h2>
              </header>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">¿La víctima es menor de 18 años?</p>
                  <div className="flex gap-4 text-sm">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="victimaMenor"
                        value="si"
                        checked={form.victimaMenor === 'si'}
                        onChange={(e) => updateField('victimaMenor', e.target.value as 'si' | 'no')}
                      />
                      Sí
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="victimaMenor"
                        value="no"
                        checked={form.victimaMenor === 'no'}
                        onChange={(e) => updateField('victimaMenor', e.target.value as 'si' | 'no')}
                      />
                      No
                    </label>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">¿Eres la víctima del hecho?</p>
                  <div className="flex gap-4 text-sm">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="esVictima"
                        value="si"
                        checked={form.esVictima === 'si'}
                        onChange={(e) => updateField('esVictima', e.target.value as 'si' | 'no')}
                      />
                      Sí
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="esVictima"
                        value="no"
                        checked={form.esVictima === 'no'}
                        onChange={(e) => updateField('esVictima', e.target.value as 'si' | 'no')}
                      />
                      No
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">RUT</label>
                  <input
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={form.victimaRut}
                    onChange={(e) => updateField('victimaRut', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Nombre</label>
                  <input
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={form.victimaNombre}
                    onChange={(e) => updateField('victimaNombre', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">1er Apellido</label>
                  <input
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={form.victimaApellido1}
                    onChange={(e) => updateField('victimaApellido1', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">2do Apellido</label>
                  <input
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={form.victimaApellido2}
                    onChange={(e) => updateField('victimaApellido2', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Género</label>
                  <select
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={form.victimaGenero}
                    onChange={(e) => updateField('victimaGenero', e.target.value)}
                  >
                    <option value="">Seleccionar</option>
                    <option value="femenino">Femenino</option>
                    <option value="masculino">Masculino</option>
                    <option value="otro">Otro / Prefiere no decir</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Sexo registral</label>
                  <select
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={form.victimaSexo}
                    onChange={(e) => updateField('victimaSexo', e.target.value)}
                  >
                    <option value="">Seleccionar</option>
                    <option value="femenino">Femenino</option>
                    <option value="masculino">Masculino</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">Nacionalidad</label>
                  <input
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={form.victimaNacionalidad}
                    onChange={(e) => updateField('victimaNacionalidad', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Fecha de nacimiento</label>
                  <input
                    type="date"
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={form.victimaNacimiento}
                    onChange={(e) => updateField('victimaNacimiento', e.target.value)}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <header className="border-b border-gray-100 pb-2 flex items-center justify-between">
                <div>
                  <h2 className="font-condensed text-xl font-semibold text-gray-900">Involucrados en el hecho</h2>
                  <p className="text-sm text-gray-500">Agrega a personas involucradas si conoces sus datos.</p>
                </div>
              </header>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Nombre *</label>
                  <input
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={form.nuevoInvolucrado.nombre}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, nuevoInvolucrado: { ...prev.nuevoInvolucrado, nombre: e.target.value } }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">1er Apellido *</label>
                  <input
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={form.nuevoInvolucrado.apellido1}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, nuevoInvolucrado: { ...prev.nuevoInvolucrado, apellido1: e.target.value } }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">2do Apellido</label>
                  <input
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={form.nuevoInvolucrado.apellido2}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, nuevoInvolucrado: { ...prev.nuevoInvolucrado, apellido2: e.target.value } }))
                    }
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Parentesco</label>
                  <input
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={form.nuevoInvolucrado.parentesco}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, nuevoInvolucrado: { ...prev.nuevoInvolucrado, parentesco: e.target.value } }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Vinculación</label>
                  <input
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={form.nuevoInvolucrado.vinculacion}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, nuevoInvolucrado: { ...prev.nuevoInvolucrado, vinculacion: e.target.value } }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Otros antecedentes</label>
                  <input
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={form.nuevoInvolucrado.antecedentes}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, nuevoInvolucrado: { ...prev.nuevoInvolucrado, antecedentes: e.target.value } }))
                    }
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddInvolucrado}
                className="rounded-md bg-ubb-blue px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
              >
                Agregar involucrado
              </button>

              {form.involucrados.length > 0 && (
                <div className="rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-4 py-2">Nombre</th>
                        <th className="px-4 py-2">Parentesco</th>
                        <th className="px-4 py-2">Vinculación</th>
                        <th className="px-4 py-2">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {form.involucrados.map((inv, idx) => (
                        <tr key={`${inv.nombre}-${idx}`}>
                          <td className="px-4 py-2">{inv.nombre} {inv.apellido1}</td>
                          <td className="px-4 py-2">{inv.parentesco || '—'}</td>
                          <td className="px-4 py-2">{inv.vinculacion || '—'}</td>
                          <td className="px-4 py-2">
                            <button
                              type="button"
                              onClick={() => handleRemoveInvolucrado(idx)}
                              className="text-sm text-red-600 hover:underline"
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="space-y-4">
              <header className="border-b border-gray-100 pb-2">
                <h2 className="font-condensed text-xl font-semibold text-gray-900">Lugar y relato del hecho</h2>
              </header>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Región *</label>
                  <select
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={form.regionHecho}
                    onChange={(e) => updateField('regionHecho', e.target.value)}
                  >
                    <option value="">Seleccionar región</option>
                    {REGIONES.map((region) => (
                      <option key={region}>{region}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Comuna *</label>
                  <select
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={form.comunaHecho}
                    onChange={(e) => updateField('comunaHecho', e.target.value)}
                  >
                    <option value="">Seleccionar comuna</option>
                    {COMUNAS.map((comuna) => (
                      <option key={comuna}>{comuna}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Fecha *</label>
                  <input
                    type="date"
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={form.fechaHecho}
                    onChange={(e) => updateField('fechaHecho', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">Dirección *</label>
                  <input
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Calle / número / referencia"
                    value={form.direccionHecho}
                    onChange={(e) => updateField('direccionHecho', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Hora aproximada</label>
                  <input
                    type="time"
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={form.horaHecho}
                    onChange={(e) => updateField('horaHecho', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Relato del hecho *</label>
                <textarea
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-3 text-sm"
                  rows={5}
                  placeholder="Describe detalladamente los hechos ocurridos..."
                  value={form.relato}
                  onChange={(e) => updateField('relato', e.target.value)}
                  required
                />
              </div>
            </section>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <section className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <h2 className="font-condensed text-xl font-semibold text-gray-900 mb-2">Resumen del denunciante</h2>
              <dl className="grid gap-4 md:grid-cols-2 text-sm">
                <div>
                  <dt className="font-semibold text-gray-600">RUT</dt>
                  <dd className="text-gray-900">{form.rut || '—'}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-600">Nombre</dt>
                  <dd className="text-gray-900">{form.nombre || '—'}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-600">Teléfono</dt>
                  <dd className="text-gray-900">{form.telefono || '—'}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-600">Correo</dt>
                  <dd className="text-gray-900">{form.correo || '—'}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-600">Dirección</dt>
                  <dd className="text-gray-900">
                    {[form.direccionDenunciante, form.comunaDenunciante, form.regionDenunciante].filter(Boolean).join(', ') || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-600">Tipo de denuncia</dt>
                  <dd className="text-gray-900">{TIPOS_DENUNCIA.find((t) => t.id === form.tipoId)?.nombre ?? '—'}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-600">Subtipo</dt>
                  <dd className="text-gray-900">{subtipoSeleccionado?.nombre ?? '—'}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <h2 className="font-condensed text-xl font-semibold text-gray-900 mb-2">Datos del hecho</h2>
              <dl className="grid gap-4 md:grid-cols-2 text-sm">
                <div>
                  <dt className="font-semibold text-gray-600">¿Eres la víctima?</dt>
                  <dd className="text-gray-900">{form.esVictima === 'si' ? 'Sí' : 'No'}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-600">Fecha y hora</dt>
                  <dd className="text-gray-900">
                    {form.fechaHecho || '—'} {form.horaHecho ? `a las ${form.horaHecho}` : ''}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-600">Lugar</dt>
                  <dd className="text-gray-900">
                    {[form.direccionHecho, form.comunaHecho, form.regionHecho].filter(Boolean).join(', ') || '—'}
                  </dd>
                </div>
              </dl>
              <div className="mt-4">
                <dt className="font-semibold text-gray-600">Relato</dt>
                <dd className="mt-1 whitespace-pre-line rounded-md bg-white p-3 text-gray-900">
                  {form.relato || 'Sin relato'}
                </dd>
              </div>
            </section>

            <section className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <h2 className="font-condensed text-xl font-semibold text-gray-900 mb-2">Involucrados</h2>
              {form.involucrados.length === 0 ? (
                <p className="text-sm text-gray-600">No registraste personas involucradas.</p>
              ) : (
                <ul className="space-y-2 text-sm text-gray-900">
                  {form.involucrados.map((inv, idx) => (
                    <li key={`${inv.nombre}-${idx}`} className="rounded-md bg-white p-3 shadow-sm">
                      <p className="font-semibold">{inv.nombre} {inv.apellido1}</p>
                      <p className="text-gray-600 text-xs">Parentesco: {inv.parentesco || 'No informado'} · Vinculación: {inv.vinculacion || 'No informada'}</p>
                      {inv.antecedentes && <p className="text-gray-700 text-sm mt-1">{inv.antecedentes}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t border-gray-100 pt-4 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-gray-500">
          Paso {step} de {steps.length}
        </div>
        <div className="flex flex-col gap-2 md:flex-row">
          <button
            type="button"
            onClick={() => history.back()}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          {step > 1 && (
            <button
              type="button"
              onClick={handlePrev}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Volver
            </button>
          )}
          {step < steps.length && (
            <button
              type="button"
              disabled={!puedeAvanzar()}
              onClick={handleNext}
              className="rounded-md bg-ubb-blue px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
            >
              Siguiente
            </button>
          )}
          {step === steps.length && (
            <button
              type="button"
              onClick={enviarDenuncia}
              disabled={enviando}
              className="rounded-md bg-ubb-blue px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
            >
              {enviando ? 'Enviando…' : 'Enviar denuncia'}
            </button>
          )}
        </div>
      </div>
    </section>
  )
}