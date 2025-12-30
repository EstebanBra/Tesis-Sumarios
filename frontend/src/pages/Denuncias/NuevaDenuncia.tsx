import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  crearDenuncia,
  type CrearDenunciaInput,
} from "@/services/denuncias.api";
import { routes } from "@/services/routes";
import { Cards } from "@/components/ui/Cards";
import {
  TIPOS_DENUNCIA,
  SEDES,
  LUGARES_SEDE,
  VINCULACIONES,
  VINCULACIONES_CAMPO_CLINICO,
} from "@/data/denuncias.data";
import type {
  FormularioDenuncia,
  Involucrado,
  FaseRegistro,
  Testigo,
} from "@/types/denuncia.types";
import FormularioLayout from "./components/FormularioLayout";
import { useAuth } from "@/context/AuthContext";
import { clRegions } from "@clregions/data";
import FileUploader, { type FileMetadata } from "@/components/FileUploader";

const initialInvolucrado: Involucrado = {
  nombre: "",
  vinculacion: "",
  descripcionDenunciado: "",
  rut: "",
  unidadCarrera: "",
};

const initialForm: FormularioDenuncia = {
  rut: "",
  nombre: "",
  telefono: "",
  correo: "",
  sexo: "",
  genero: "",
  reservaIdentidad: false,
  carreraCargo: "",
  tipoId: 0,
  subtipoId: null,
  descripcionOtro: "",
  regionDenunciante: "",
  comunaDenunciante: "",
  direccionDenunciante: "",

  victimaMenor: "no",
  esVictima: "si",
  victimaRut: "",
  victimaNombre: "",
  victimaApellido1: "",
  victimaApellido2: "",
  victimaGenero: "",
  victimaSexo: "",
  victimaNacionalidad: "",
  victimaNacimiento: "",
  victimaCorreo: "",
  victimaTelefono: "",

  regionHecho: "",
  comunaHecho: "",
  sedeHecho: "",
  lugarHecho: "",
  detalleHecho: "",
  tipoFecha: "unica",
  fechaHecho: "",
  fechaHechoFin: "",
  horaHecho: "",
  relato: "",
  involucrados: [],
  nuevoInvolucrado: { ...initialInvolucrado },
  testigos: [],
  
  // Campos específicos para denuncias de campo clínico
  nombreEstablecimiento: "",
  unidadServicio: "",
  tipoVinculacionDenunciado: "",
  regionEstablecimiento: "",
  comunaEstablecimiento: "",
  direccionEstablecimiento: "",
};

const steps = [
  { id: 1, label: "Información del Denunciante" },
  { id: 2, label: "Hechos y Denunciados" },
  { id: 3, label: "Revisión" },
];

export default function NuevaDenuncia() {
  const nav = useNavigate();
  const { user } = useAuth();

  const [fase, setFase] = useState<FaseRegistro>("seleccion_tipo");
  const [form, setForm] = useState<FormularioDenuncia>(initialForm);
  const [step, setStep] = useState(1);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detalles, setDetalles] = useState<
    { field: string; msg: string }[] | null
  >(null);
  const [
    mostrarCamposAdicionalesDenunciado,
    setMostrarCamposAdicionalesDenunciado,
  ] = useState(false);
  const [mostrarFormTestigo, setMostrarFormTestigo] = useState(false);
  const [nuevoTestigo, setNuevoTestigo] = useState<Testigo>({
    nombreCompleto: "",
    rut: "",
    contacto: "",
  });
  const [archivosEvidencia, setArchivosEvidencia] = useState<FileMetadata[]>([]);

  const stepTitle = useMemo(() => steps[step - 1]?.label ?? "", [step]);

  const tipoSeleccionado = useMemo(
    () => TIPOS_DENUNCIA.find((t) => t.id === form.tipoId) ?? null,
    [form.tipoId]
  );

  const lugaresDisponibles = useMemo(() => {
    if (!form.sedeHecho) return [];
    return LUGARES_SEDE[form.sedeHecho] || [];
  }, [form.sedeHecho]);

  // --- Dynamic Regions and Communes ---
  const allRegions = useMemo(() => {
    // clRegions.regions is an object with ID as key
    return Object.values(clRegions.regions).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, []);

  const communesDenunciante = useMemo(() => {
    if (!form.regionDenunciante) return [];
    // Find region by name
    const region = allRegions.find((r) => r.name === form.regionDenunciante);
    if (!region) return [];

    // Extract all communes from all provinces in that region
    const allCommunes: any[] = [];
    Object.values(region.provinces).forEach((province: any) => {
      Object.values(province.communes).forEach((commune: any) => {
        allCommunes.push(commune);
      });
    });

    return allCommunes.sort((a, b) => a.name.localeCompare(b.name));
  }, [form.regionDenunciante, allRegions]);

  useEffect(() => {
    if (user) {
      setForm((prev) => {
        const isVictima = prev.esVictima === "si";
        return {
          ...prev,
          rut: user.rut,
          nombre: user.nombre,
          correo: user.email,
          telefono: user.telefono || prev.telefono,
          sexo: (user as any).sexo || prev.sexo,
          genero: user.genero || prev.genero,
          regionDenunciante: user.region || prev.regionDenunciante,
          comunaDenunciante: user.comuna || prev.comunaDenunciante,
          direccionDenunciante: user.direccion || prev.direccionDenunciante,
          carreraCargo: (user as any).carreraCargo || prev.carreraCargo, // Pre-llenar si el usuario ya lo tiene
          victimaRut: isVictima ? user.rut : prev.victimaRut,
          victimaNombre: isVictima ? user.nombre : prev.victimaNombre,
          victimaCorreo: isVictima ? user.email : prev.victimaCorreo,
          victimaTelefono: isVictima
            ? user.telefono || prev.telefono
            : prev.victimaTelefono,
          victimaGenero: isVictima
            ? user.genero || prev.victimaGenero
            : prev.victimaGenero,
        };
      });
    }
  }, [user]);

  function handleSelectTipo(id: number) {
    // Asignar subtipo por defecto basado en el tipo seleccionado
    // 199 = "Otro motivo (Género)" para tipo 1 (Género)
    // 299 = "Otro motivo (Convivencia)" para tipo 2 (Convivencia)
    // 300 = "Campos Clínicos" para tipo 3 (Campo Clínico) - NO tiene subtipos, es el tipo principal
    const subtipoPorDefecto = id === 1 ? 199 : id === 2 ? 299 : 300;
    setForm((prev) => ({ ...prev, tipoId: id, subtipoId: subtipoPorDefecto, descripcionOtro: "" }));
    setFase("formulario");
    window.scrollTo(0, 0);
  }

  function handleBackToTipo() {
    setFase("seleccion_tipo");
    setForm((prev) => ({ ...prev, tipoId: 0, subtipoId: null }));
  }

  function handleBackToSubtipo() {
    if (step === 1) {
      setFase("seleccion_tipo");
      setForm((prev) => ({ ...prev, tipoId: 0, subtipoId: null }));
    } else {
      handlePrev();
    }
  }

  function updateField<K extends keyof FormularioDenuncia>(
    key: K,
    value: FormularioDenuncia[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleEsVictimaChange(esVictima: "si" | "no") {
    if (esVictima === "si" && user) {
      setForm((prev) => ({
        ...prev,
        esVictima: "si",
        victimaRut: user.rut,
        victimaNombre: user.nombre,
        victimaCorreo: user.email,
        victimaTelefono: user.telefono || prev.telefono,
        victimaGenero: user.genero || "",
        // Se autocompleta con datos del denunciante ya existentes en el form
        // o directamente del user si se prefiere
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        esVictima: "no",
        victimaRut: "",
        victimaNombre: "",
        victimaCorreo: "",
        victimaTelefono: "",
        victimaGenero: "",
        victimaSexo: "",
      }));
    }
  }

  function handleAddInvolucrado() {
    if (
      !form.nuevoInvolucrado.nombre.trim() ||
      !form.nuevoInvolucrado.vinculacion.trim() ||
      !form.nuevoInvolucrado.descripcionDenunciado.trim()
    )
      return;
    setForm((prev) => ({
      ...prev,
      involucrados: [...prev.involucrados, prev.nuevoInvolucrado],
      nuevoInvolucrado: { ...initialInvolucrado },
    }));
  }

  function handleRemoveInvolucrado(index: number) {
    setForm((prev) => ({
      ...prev,
      involucrados: prev.involucrados.filter((_, i) => i !== index),
    }));
  }

  function handleAgregarTestigo() {
    if (!nuevoTestigo.nombreCompleto.trim() || !nuevoTestigo.contacto.trim())
      return;
    setForm((prev) => ({
      ...prev,
      testigos: [...prev.testigos, { ...nuevoTestigo }],
    }));
    setNuevoTestigo({ nombreCompleto: "", rut: "", contacto: "" });
    setMostrarFormTestigo(false);
  }

  function handleEliminarTestigo(index: number) {
    setForm((prev) => ({
      ...prev,
      testigos: prev.testigos.filter((_, i) => i !== index),
    }));
  }

  function puedeAvanzar() {
    if (step === 1)
      return !!form.rut.trim() && !!form.nombre.trim() && !!form.sexo;
    if (step === 2) {
      // Si es denuncia de campo clínico, validar campos específicos
      if (form.tipoId === 3) {
        return !!form.relato.trim() && 
               !!form.nombreEstablecimiento.trim() && 
               !!form.regionEstablecimiento.trim() &&
               !!form.comunaEstablecimiento.trim() &&
               !!form.direccionEstablecimiento.trim() &&
               !!form.unidadServicio.trim();
      }
      // Para denuncias normales, validar campos estándar
      return !!form.relato.trim() && !!form.sedeHecho;
    }
    return true;
  }

  function handleNext() {
    if (step < steps.length && puedeAvanzar()) {
      setStep((prev) => prev + 1);
      window.scrollTo(0, 0);
    }
  }

  function handlePrev() {
    if (step > 1) setStep((prev) => prev - 1);
  }

  async function enviarDenuncia() {
    setError(null);
    setDetalles(null);

    if (!form.rut.trim() || !form.relato.trim() || !form.subtipoId) {
      setError("Faltan campos obligatorios.");
      return;
    }
    
    // Para tipo 3 (Campos Clínicos), el subtipoId debe ser 300 (el tipo principal, no hay subtipos)
    if (form.tipoId === 3 && form.subtipoId !== 300) {
      setError("Error: El tipo de denuncia de Campos Clínicos no tiene subtipos.");
      return;
    }

    // Determinar si es denuncia de campo clínico (tipo 3)
    const esCampoClinico = form.tipoId === 3;
    
    // Construir ubicación según el tipo de denuncia
    let ubicacionCompleta = "";
    if (esCampoClinico) {
      // Para campo clínico: Establecimiento, Región, Comuna, Dirección, Unidad
      ubicacionCompleta = [
        form.nombreEstablecimiento,
        form.regionEstablecimiento,
        form.comunaEstablecimiento,
        form.direccionEstablecimiento,
        form.unidadServicio,
        form.detalleHecho
      ]
        .filter(Boolean)
        .join(" - ");
    } else {
      // Para denuncias normales: Sede, Lugar, Detalles
      const sedeNombre =
        SEDES.find((s) => s.id === form.sedeHecho)?.nombre || form.sedeHecho;
      ubicacionCompleta = [sedeNombre, form.lugarHecho, form.detalleHecho]
        .filter(Boolean)
        .join(" - ");
    }

    let relatoFinal = form.relato.trim();

    // Si el usuario proporcionó una descripción adicional, la incluimos en el relato
    if (form.descripcionOtro.trim()) {
      relatoFinal = `[MOTIVO ESPECÍFICO: ${form.descripcionOtro}]\n\n${relatoFinal}`;
    }

    const notasAdicionales = [
      `Tipo General: ${tipoSeleccionado?.nombre}`,
      form.reservaIdentidad ? "Solicita Reserva de Identidad" : null,
      form.esVictima === "si"
        ? "Denunciante es la víctima"
        : "Denunciante es testigo/tercero",
      form.victimaMenor === "si" ? "Víctima es menor de edad" : null,
      form.esVictima === "no"
        ? `Víctima: ${form.victimaNombre} (RUT: ${form.victimaRut})`
        : null,
    ]
      .filter(Boolean)
      .join(" | ");

    // Validar campos específicos de campo clínico
    if (esCampoClinico) {
      if (!form.nombreEstablecimiento.trim() || 
          !form.regionEstablecimiento.trim() || 
          !form.comunaEstablecimiento.trim() || 
          !form.direccionEstablecimiento.trim() || 
          !form.unidadServicio.trim()) {
        setError("Para denuncias de campo clínico, los campos de establecimiento, región, comuna, dirección y unidad de servicio son obligatorios.");
        return;
      }
      // Validar que haya al menos un denunciado con vinculación
      if (form.involucrados.length === 0 || !form.involucrados.some(i => i.vinculacion.trim())) {
        setError("Para denuncias de campo clínico, debes agregar al menos un denunciado con su vinculación.");
        return;
      }
    }

    const payload: CrearDenunciaInput = {
      Rut: form.rut.trim(),
      Nombre: form.nombre.trim(),
      Correo: form.correo.trim(),
      Telefono: form.telefono.trim(),
      genero: form.genero,
      regionDenunciante: form.regionDenunciante || null,
      comunaDenunciante: form.comunaDenunciante || null,
      direccionDenunciante: form.direccionDenunciante || null,
      carreraCargo: form.carreraCargo?.trim() || null,
      reservaIdentidad: form.reservaIdentidad,
      ID_TipoDe: Number(form.subtipoId),
      // Enviar fechas en formato YYYY-MM-DD para evitar problemas de zona horaria
      Fecha_Inicio: form.fechaHecho || new Date().toISOString().split('T')[0],
      Fecha_Fin: form.tipoFecha === "rango" && form.fechaHechoFin
        ? form.fechaHechoFin // Ya viene en formato YYYY-MM-DD del input type="date"
        : null, // Solo enviar Fecha_Fin si es un rango
      Relato_Hechos: relatoFinal, // Ya no concatenamos las fechas en el relato
      Ubicacion: ubicacionCompleta,

      // Mapear involucrados (denunciados) con la nueva estructura
      denunciados: form.involucrados.map((i) => ({
        nombre: i.nombre.trim() || "Sin nombre",
        rut: i.rut?.trim() || undefined,
        // Concatenar descripción del denunciado y unidad/carrera si existe
        descripcion: [
          i.descripcionDenunciado || "Sin descripción",
          i.unidadCarrera ? `Unidad/Carrera: ${i.unidadCarrera}` : null,
          i.vinculacion ? `Vinculación: ${i.vinculacion}` : null
        ].filter(Boolean).join(". "),
      })),

      testigos: form.testigos.map((t) => ({
        nombre: t.nombreCompleto,
        rut: t.rut || undefined,
        contacto: t.contacto || undefined,
      })),
      evidencias: archivosEvidencia.map(archivo => ({
        nombreArchivo: archivo.objectKey,
        nombreOriginal: archivo.fileName,
        tipoArchivo: archivo.mimeType,
        tamaño: archivo.size,
      })),
      caracteristicasDenunciado: notasAdicionales,
      
      // Datos específicos para denuncias de campo clínico
      detalleCampoClinico: esCampoClinico ? {
        nombreEstablecimiento: form.nombreEstablecimiento.trim(),
        unidadServicio: form.unidadServicio.trim(),
        tipoVinculacionDenunciado: form.involucrados.length > 0 && form.involucrados[0].vinculacion 
          ? form.involucrados[0].vinculacion.trim() 
          : "",
        region: form.regionEstablecimiento.trim(),
        comuna: form.comunaEstablecimiento.trim(),
        direccionEstablecimiento: form.direccionEstablecimiento.trim()
      } : null,
    };

    try {
      setEnviando(true);
      await crearDenuncia(payload);
      nav(routes.denuncias.root);
    } catch (err: any) {
      setError(err?.message ?? "Error al crear la denuncia");
      if (err?.detalles && Array.isArray(err.detalles)) {
        setDetalles(err.detalles as { field: string; msg: string }[]);
      }
    } finally {
      setEnviando(false);
    }
  }

  // --- RENDERS ---
  if (fase === "seleccion_tipo") {
    return (
      <section className="mx-auto max-w-7xl py-12">
        <header className="mb-10 text-center px-4">
          <h1 className="font-condensed text-3xl font-bold tracking-tight text-gray-900">
            ¿Qué tipo de denuncia deseas realizar?
          </h1>
          <p className="mt-3 text-gray-600 max-w-2xl mx-auto">
            Selecciona la categoría general. Esto nos ayudará a derivar tu caso
            a la unidad correspondiente.
          </p>
        </header>
        <div className="grid gap-8 grid-cols-1 md:grid-cols-3 px-4">
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
            className="mt-4 inline-flex items-center justify-center rounded-md bg-ubb-blue px-6 py-2 text-sm font-semibold text-white"
          >
            Cancelar
          </button>
        </div>
      </section>
    );
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
              <h3 className="text-xs font-bold text-ubb-blue uppercase tracking-wider">
                Categoría seleccionada
              </h3>
              <button
                onClick={handleBackToSubtipo}
                className="text-xs font-medium text-gray-500 underline hover:text-ubb-blue"
              >
                Cambiar
              </button>
            </div>
              <div className="grid md:grid-cols-1 gap-6">
              <div>
                <label className="text-[10px] uppercase tracking-wide text-gray-500 font-bold block mb-1">
                  Tipo de Denuncia
                </label>
                <p className="text-sm font-semibold">
                  {tipoSeleccionado?.nombre}
                </p>
              </div>
            </div>
          </div>

          <section className="space-y-4">
            <h2 className="font-condensed text-lg font-semibold text-gray-900 border-b pb-2">
              Datos del denunciante
            </h2>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    RUT *
                  </label>
                  <input
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="12.345.678-9"
                    value={form.rut}
                    onChange={(e) => updateField("rut", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Nombre completo *
                  </label>
                  <input
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Tu nombre"
                    value={form.nombre}
                    onChange={(e) => updateField("nombre", e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Sexo y Género - igual que en paso 2 */}
              <div className="grid gap-4 md:grid-cols-2 mt-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Sexo *
                  </label>
                  <select
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-100 text-gray-600"
                    value={form.sexo || ""}
                    onChange={(e) => updateField("sexo", e.target.value)}
                    required
                  >
                    <option value="">Seleccionar</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Género (Opcional)
                  </label>
                  <select
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-100 text-gray-600"
                    value={form.genero || ""}
                    onChange={(e) => updateField("genero", e.target.value)}
                  >
                    <option value="">Seleccionar</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Transgenero Masculino">
                      Transgenero Masculino
                    </option>
                    <option value="Transgenero Femenino">
                      Transgenero Femenino
                    </option>
                    <option value="No Binario">No Binario</option>
                    <option value="Otro">Otro / Prefiero no decir</option>
                  </select>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Esta información ayuda a activar los protocolos de protección
                adecuados.
              </p>
              
              {/* CARRERA O CARGO */}
              <div className="mt-4">
                <label className="text-sm font-medium text-gray-700">
                  Carrera o Cargo
                </label>
                <input
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Ej: Enfermería, Medicina, Funcionario Administrativo..."
                  value={form.carreraCargo}
                  onChange={(e) => updateField("carreraCargo", e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Indica tu carrera (si eres estudiante) o tu cargo (si eres funcionario/académico).
                </p>
              </div>
            </div>
          </section>
            
          <section className="space-y-4">
            <h2 className="font-condensed text-lg font-semibold text-gray-900 border-b pb-2">
              Datos de contacto
            </h2>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Teléfono
                  </label>
                  <input
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="+56 9 ..."
                    value={form.telefono}
                    onChange={(e) => updateField("telefono", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Correo
                  </label>
                  <input
                    type="email"
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="correo@ubb.cl"
                    value={form.correo}
                    onChange={(e) => updateField("correo", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="font-condensed text-lg font-semibold text-gray-900 border-b pb-2">
              Dirección del denunciante
            </h2>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Región *
                  </label>
                  <select
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={form.regionDenunciante}
                    onChange={(e) => {
                      updateField("regionDenunciante", e.target.value);
                      updateField("comunaDenunciante", ""); // Clear commune when region changes
                    }}
                  >
                    <option value="">Seleccionar</option>
                    {allRegions.map((r) => (
                      <option key={r.id} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Comuna *
                  </label>
                  <select
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={form.comunaDenunciante}
                    onChange={(e) =>
                      updateField("comunaDenunciante", e.target.value)
                    }
                    disabled={!form.regionDenunciante}
                  >
                    <option value="">Seleccionar</option>
                    {communesDenunciante.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="text-sm font-medium text-gray-700">
                  Dirección domicilio *
                </label>
                <input
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Calle / número"
                  value={form.direccionDenunciante}
                  onChange={(e) =>
                    updateField("direccionDenunciante", e.target.value)
                  }
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="font-condensed text-lg font-semibold text-gray-900 border-b pb-2">
              Reserva de identidad
            </h2>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex flex-wrap gap-6 text-sm text-gray-700 mb-2">
                <div className="inline-flex items-center gap-3">
                  <span className="font-medium">¿Reserva de identidad?</span>
                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="reserva"
                      checked={form.reservaIdentidad}
                      onChange={() => updateField("reservaIdentidad", true)}
                    />{" "}
                    Sí
                  </label>
                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="reserva"
                      checked={!form.reservaIdentidad}
                      onChange={() => updateField("reservaIdentidad", false)}
                    />{" "}
                    No
                  </label>
                </div>
              </div>
              {form.reservaIdentidad && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mt-2">
                  <div className="flex gap-2">
                    <svg
                      className="h-5 w-5 text-yellow-600 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <p className="text-xs text-yellow-800">
                      <strong>Importante:</strong> La reserva de identidad no es
                      absoluta, ya que el(la) fiscal o instructor(a) de la
                      investigación sumaria deberá conocer tu identidad para
                      llevar a cabo el proceso.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* PASO 2: HECHOS Y PARTICIPANTES */}
      {step === 2 && (
        <div className="space-y-8">
          <section className="space-y-4">
            <h2 className="font-condensed text-lg font-semibold text-gray-900 border-b pb-2">
              Víctima de los hechos
            </h2>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="grid gap-6 md:grid-cols-2 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    ¿Víctima menor de edad?
                  </p>
                  <div className="flex gap-4">
                    <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="menor"
                        checked={form.victimaMenor === "si"}
                        onChange={() => updateField("victimaMenor", "si")}
                      />{" "}
                      Sí
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="menor"
                        checked={form.victimaMenor === "no"}
                        onChange={() => updateField("victimaMenor", "no")}
                      />{" "}
                      No
                    </label>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    ¿Eres tú la víctima?
                  </p>
                  <div className="flex gap-4">
                    <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="esVictima"
                        checked={form.esVictima === "si"}
                        onChange={() => handleEsVictimaChange("si")}
                      />{" "}
                      Sí
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="esVictima"
                        checked={form.esVictima === "no"}
                        onChange={() => handleEsVictimaChange("no")}
                      />{" "}
                      No
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    RUT
                  </label>
                  <input
                    className={`mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-100 text-gray-60`}
                    value={form.victimaRut}
                    onChange={(e) => updateField("victimaRut", e.target.value)}
                    disabled={form.esVictima === "si"}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">
                    Nombre Completo
                  </label>
                  <input
                    className={`mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-100 text-gray-60`}
                    value={form.victimaNombre}
                    onChange={(e) =>
                      updateField("victimaNombre", e.target.value)
                    }
                    disabled={form.esVictima === "si"}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Correo
                  </label>
                  <input
                    className={`mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-100 text-gray-60`}
                    value={form.victimaCorreo}
                    onChange={(e) =>
                      updateField("victimaCorreo", e.target.value)
                    }
                    disabled={form.esVictima === "si"}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Teléfono
                  </label>
                  <input
                    className={`mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-100 text-gray-60`}
                    value={form.victimaTelefono}
                    onChange={(e) =>
                      updateField("victimaTelefono", e.target.value)
                    }
                    disabled={form.esVictima === "si"}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Sexo *
                  </label>
                  <select
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-100 text-gray-600"
                    value={form.victimaSexo || ""}
                    onChange={(e) => updateField("victimaSexo", e.target.value)}
                  >
                    <option value="">Seleccionar</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Género (Opcional)
                  </label>
                  <select
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-100 text-gray-600"
                    value={form.victimaGenero || ""}
                    onChange={(e) =>
                      updateField("victimaGenero", e.target.value)
                    }
                  >
                    <option value="">Seleccionar</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Transgenero Masculino">
                      Transgenero Masculino
                    </option>
                    <option value="Transgenero Femenino">
                      Transgenero Femenino
                    </option>
                    <option value="No Binario">No Binario</option>
                    <option value="Otro">Otro / Prefiero no decir</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="font-condensed text-lg font-semibold text-gray-900 border-b pb-2">
              Denunciado/s
            </h2>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              {/* Campos principales siempre visibles */}
              <div className="space-y-4">
                {/* Nombre y Vinculación en la misma fila */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                      placeholder="Nombre completo del denunciado"
                      value={form.nuevoInvolucrado.nombre}
                      onChange={(e) => {
                        setForm((p) => ({
                          ...p,
                          nuevoInvolucrado: {
                            ...p.nuevoInvolucrado,
                            nombre: e.target.value,
                          },
                        }));
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Vinculación *
                    </label>
                    <select
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-600 focus:ring-2 focus:ring-blue-100 outline-none bg-white"
                      value={form.nuevoInvolucrado.vinculacion}
                      onChange={(e) => {
                        const valor = e.target.value;
                        setForm((p) => ({
                          ...p,
                          nuevoInvolucrado: {
                            ...p.nuevoInvolucrado,
                            vinculacion: valor,
                          },
                        }));
                        // Mostrar alerta si selecciona TUTOR_HOSPITAL y es campo clínico
                        if (form.tipoId === 3 && valor === 'TUTOR_HOSPITAL') {
                          alert('Importante: Si el denunciado es Personal Colaboración Docente (Tutor Hospital), esta denuncia podría ser derivada a las autoridades correspondientes del establecimiento de salud.');
                        }
                      }}
                      required
                    >
                      <option value="">Seleccionar Vinculación</option>
                      {(form.tipoId === 3 ? VINCULACIONES_CAMPO_CLINICO : VINCULACIONES).map((v) => (
                        <option key={v} value={v}>
                          {v === 'DOCENTE_IES' ? 'Docente Institución de Educación Superior' :
                           v === 'TUTOR_HOSPITAL' ? 'Personal colaborador docente (Tutor Hospital)' :
                           v}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Descripción del Denunciado - siempre visible, ancho completo */}
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Descripción del denunciado *
                  </label>
                  <textarea
                    placeholder="Descripción física, ropa, edad, etc., cualquier información adicional"
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm h-24 resize-none focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-gray-400"
                    value={form.nuevoInvolucrado.descripcionDenunciado}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        nuevoInvolucrado: {
                          ...p.nuevoInvolucrado,
                          descripcionDenunciado: e.target.value,
                        },
                      }))
                    }
                    required
                  />
                </div>
              </div>

              {/* Sección "Información Adicional" - Campos ocultos */}
              <div className="mt-4 pt-4 border-t border-gray-300">
                <button
                  type="button"
                  onClick={() =>
                    setMostrarCamposAdicionalesDenunciado(
                      !mostrarCamposAdicionalesDenunciado
                    )
                  }
                  className="text-sm text-ubb-blue hover:text-blue-800 font-medium flex items-center gap-2 transition-colors"
                >
                  {mostrarCamposAdicionalesDenunciado ? (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                      Ocultar información adicional
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                      ¿Tienes más información del denunciado?
                    </>
                  )}
                </button>

                {/* Campos adicionales (ocultos por defecto) */}
                {mostrarCamposAdicionalesDenunciado && (
                  <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          RUT
                        </label>
                        <input
                          type="text"
                          placeholder="12.345.678-9"
                          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                          value={form.nuevoInvolucrado.rut || ""}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              nuevoInvolucrado: {
                                ...p.nuevoInvolucrado,
                                rut: e.target.value,
                              },
                            }))
                          }
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Unidad o Carrera
                        </label>
                        <input
                          type="text"
                          placeholder="Ej: Enfermería, Medicina, Unidad de Urgencias..."
                          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                          value={form.nuevoInvolucrado.unidadCarrera || ""}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              nuevoInvolucrado: {
                                ...p.nuevoInvolucrado,
                                unidadCarrera: e.target.value,
                              },
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleAddInvolucrado}
                  className="text-sm bg-ubb-blue text-white px-4 py-2 rounded font-medium hover:bg-blue-800 transition-colors flex items-center gap-1"
                >
                  <span>+</span> Confirmar Denunciado
                </button>
              </div>
            </div>

            {form.involucrados.length > 0 && (
              <div className="mt-4 border rounded-md overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b">
                  Personas agregadas ({form.involucrados.length})
                </div>
                <ul className="divide-y bg-white">
                  {form.involucrados.map((inv, i) => (
                    <li
                      key={i}
                      className="p-4 flex flex-col gap-1 text-sm hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-gray-900">
                              {inv.nombre}
                            </span>
                            {inv.rut && (
                              <span className="text-xs text-gray-500">
                                (RUT: {inv.rut})
                              </span>
                            )}
                            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                              {inv.vinculacion || "Sin vinculación"}
                            </span>
                            {inv.unidadCarrera && (
                              <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-300/10">
                                {inv.unidadCarrera}
                              </span>
                            )}
                          </div>
                          {inv.descripcionDenunciado && (
                            <p className="text-gray-600 text-xs mt-2 pl-3 border-l-2 border-gray-200">
                              {inv.descripcionDenunciado}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveInvolucrado(i)}
                          className="text-red-600 hover:text-red-800 text-xs font-medium px-2 py-1 rounded hover:bg-red-50 ml-2 flex-shrink-0"
                        >
                          Eliminar
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section className="space-y-4">
            <h2 className="font-condensed text-lg font-semibold text-gray-900 border-b pb-2">
              Lugar y fecha de los hechos
            </h2>

            {/* Campo opcional para especificar detalles adicionales del tipo de denuncia */}
            <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
              <label className="block text-sm font-bold text-blue-800 mb-1">
                Especificación adicional (Opcional)
              </label>
              <input
                type="text"
                className="block w-full rounded-md border-blue-400 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                placeholder="Ej: Detalles específicos sobre el tipo de situación..."
                value={form.descripcionOtro}
                onChange={(e) =>
                  updateField("descripcionOtro", e.target.value)
                }
              />
              <p className="text-xs text-blue-700 mt-1">
                Si deseas agregar más detalles sobre el tipo de denuncia, puedes hacerlo aquí.
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  ¿Cuándo ocurrieron los hechos? *
                </p>
                <div className="flex gap-6 mb-3">
                  <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="tipoFecha"
                      checked={form.tipoFecha === "unica"}
                      onChange={() => updateField("tipoFecha", "unica")}
                    />{" "}
                    Fecha única
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="tipoFecha"
                      checked={form.tipoFecha === "rango"}
                      onChange={() => updateField("tipoFecha", "rango")}
                    />{" "}
                    Rango de fechas
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">
                      {form.tipoFecha === "unica"
                        ? "Fecha de los hechos"
                        : "Fecha de inicio"}
                    </label>
                    <input
                      type="date"
                      className="mmt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      value={form.fechaHecho}
                      onChange={(e) =>
                        updateField("fechaHecho", e.target.value)
                      }
                    />
                  </div>
                  {form.tipoFecha === "rango" && (
                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">
                        Fecha de término
                      </label>
                      <input
                        type="date"
                        className="mmt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                        value={form.fechaHechoFin}
                        onChange={(e) =>
                          updateField("fechaHechoFin", e.target.value)
                        }
                      />
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-gray-500 mt-1 italic">
                  Si no recuerdas la fecha exacta, por favor indica un rango
                  aproximado.
                </p>
              </div>

              {/* Campos dinámicos según tipo de denuncia */}
              {form.tipoId === 3 ? (
                // Campos para denuncias de campo clínico
                <>
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <label className="text-sm font-medium text-gray-700">
                      Establecimiento de Salud * <span className="text-xs text-gray-500">(Hospital/CESFAM/Centro de Salud)</span>
                    </label>
                    <input
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      placeholder="Ej: Hospital Regional de Concepción, CESFAM Las Higueras..."
                      value={form.nombreEstablecimiento}
                      onChange={(e) => updateField("nombreEstablecimiento", e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2 pt-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Región del Establecimiento *
                      </label>
                      <select
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                        value={form.regionEstablecimiento}
                        onChange={(e) => {
                          updateField("regionEstablecimiento", e.target.value);
                          updateField("comunaEstablecimiento", ""); // Clear commune when region changes
                        }}
                        required
                      >
                        <option value="">Seleccionar</option>
                        {allRegions.map((r) => (
                          <option key={r.id} value={r.name}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Comuna del Establecimiento *
                      </label>
                      <select
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                        value={form.comunaEstablecimiento}
                        onChange={(e) =>
                          updateField("comunaEstablecimiento", e.target.value)
                        }
                        disabled={!form.regionEstablecimiento}
                        required
                      >
                        <option value="">Seleccionar</option>
                        {(() => {
                          if (!form.regionEstablecimiento) return [];
                          const region = allRegions.find((r) => r.name === form.regionEstablecimiento);
                          if (!region) return [];
                          const allCommunes: any[] = [];
                          Object.values(region.provinces).forEach((province: any) => {
                            Object.values(province.communes).forEach((commune: any) => {
                              allCommunes.push(commune);
                            });
                          });
                          return allCommunes.sort((a, b) => a.name.localeCompare(b.name));
                        })().map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <label className="text-sm font-medium text-gray-700">
                      Dirección del Establecimiento *
                    </label>
                    <input
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      placeholder="Ej: Av. O'Higgins 1234, Concepción..."
                      value={form.direccionEstablecimiento}
                      onChange={(e) => updateField("direccionEstablecimiento", e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2 pt-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Unidad o Servicio * <span className="text-xs text-gray-500">(Donde ocurrió el hecho)</span>
                      </label>
                      <input
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                        placeholder="Ej: Urgencias, Pediatría, Medicina Interna..."
                        value={form.unidadServicio}
                        onChange={(e) => updateField("unidadServicio", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Detalles adicionales
                      </label>
                      <input
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                        placeholder="Ej: Segundo piso, pasillo norte..."
                        value={form.detalleHecho}
                        onChange={(e) =>
                          updateField("detalleHecho", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </>
              ) : (
                // Campos para denuncias normales (no campo clínico)
                <>
                  <div className="border-t border-gray-200 pt-4 mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Sede *
                      </label>
                      <select
                        className="mmt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                        value={form.sedeHecho}
                        onChange={(e) => {
                          const sede = SEDES.find((s) => s.id === e.target.value);
                          updateField("sedeHecho", e.target.value);
                          updateField("regionHecho", sede?.region || "");
                          updateField("lugarHecho", "");
                        }}
                      >
                        <option value="">Seleccionar Sede</option>
                        {SEDES.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Región
                      </label>
                      <div className="mt-1 w-full rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-600 font-medium h-[38px] flex items-center">
                        {form.regionHecho || "Selecciona una sede"}
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 pt-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Lugar Específico
                      </label>
                      <select
                        className="mmt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                        value={form.lugarHecho}
                        onChange={(e) => updateField("lugarHecho", e.target.value)}
                        disabled={!form.sedeHecho}
                      >
                        <option value="">Seleccionar Lugar</option>
                        {lugaresDisponibles.map((l) => (
                          <option key={l} value={l}>
                            {l}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Detalles adicionales
                      </label>
                      <input
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                        placeholder="Ej: Segundo piso, pasillo norte..."
                        value={form.detalleHecho}
                        onChange={(e) =>
                          updateField("detalleHecho", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <h2 className="font-condensed text-lg font-semibold text-gray-900 border-b pb-2">
              Relato y antecedentes de los hechos
            </h2>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Descripción detallada de los hechos *
                </label>
                <textarea
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm h-32 focus:ring-2 focus:ring-ubb-blue/20"
                  placeholder="Describe qué pasó, cómo, cuándo y quiénes estaban presentes..."
                  value={form.relato}
                  onChange={(e) => updateField("relato", e.target.value)}
                  required
                />
              </div>

              {/* Sección de Testigos */}
              <div className="pt-4 border-t border-gray-300">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-medium text-gray-700">
                    Testigos
                  </label>
                  <button
                    type="button"
                    onClick={() => setMostrarFormTestigo(!mostrarFormTestigo)}
                    className="text-sm text-ubb-blue hover:text-blue-800 font-medium flex items-center gap-2 transition-colors"
                  >
                    <svg
                      className={`w-4 h-4 transition-transform ${
                        mostrarFormTestigo ? "rotate-45" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    {mostrarFormTestigo ? "Cancelar" : "Agregar Testigo"}
                  </button>
                </div>

                {/* Formulario Inline de Testigo */}
                {mostrarFormTestigo && (
                  <div className="mb-4 bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">
                          Nombre Completo *
                        </label>
                        <input
                          type="text"
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                          placeholder="Nombre del testigo"
                          value={nuevoTestigo.nombreCompleto}
                          onChange={(e) =>
                            setNuevoTestigo({
                              ...nuevoTestigo,
                              nombreCompleto: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">
                          RUT (Opcional)
                        </label>
                        <input
                          type="text"
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                          placeholder="12.345.678-9"
                          value={nuevoTestigo.rut}
                          onChange={(e) =>
                            setNuevoTestigo({
                              ...nuevoTestigo,
                              rut: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">
                        Contacto *
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                        placeholder="Correo o teléfono"
                        value={nuevoTestigo.contacto}
                        onChange={(e) =>
                          setNuevoTestigo({
                            ...nuevoTestigo,
                            contacto: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleAgregarTestigo}
                        className="text-sm bg-ubb-blue text-white px-4 py-2 rounded font-medium hover:bg-blue-800 transition-colors"
                      >
                        Confirmar Testigo
                      </button>
                    </div>
                  </div>
                )}

                {/* Lista de testigos */}
                {form.testigos.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {form.testigos.map((testigo, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-white border border-gray-200 rounded-md p-3"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {testigo.nombreCompleto}
                          </p>
                          <div className="flex gap-4 mt-1 text-xs text-gray-500">
                            {testigo.rut && <span>RUT: {testigo.rut}</span>}
                            <span>Contacto: {testigo.contacto}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleEliminarTestigo(index)}
                          className="text-red-600 hover:text-red-800 text-xs font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {form.testigos.length === 0 && (
                  <p className="text-sm text-gray-500 italic">
                    No se han agregado testigos aún
                  </p>
                )}
              </div>
            </div>

            {/* SECCIÓN DE EVIDENCIA CON MINIO */}
            <div className="pt-4 border-t border-gray-200">
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Adjuntar Evidencia (Opcional)
              </label>
              <FileUploader
                onFilesChange={setArchivosEvidencia}
                maxFiles={10}
                maxSizeMB={200}
                disabled={enviando}
              />
            </div>
          </section>
        </div>
      )}

      {/* PASO 3: REVISIÓN */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-ubb-blue font-bold uppercase text-xs tracking-wider mb-4">
              Resumen General
            </h3>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4 text-sm">
              <div>
                <dt className="text-gray-500 text-xs uppercase font-bold">
                  Tipo de Denuncia
                </dt>
                <dd>
                  {tipoSeleccionado?.nombre}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 text-xs uppercase font-bold">
                  Víctima
                </dt>
                <dd>{form.victimaNombre || "No especificado"}</dd>
              </div>

              <div className="md:col-span-2">
                <dt className="text-gray-500 text-xs uppercase font-bold mb-1">
                  Personas Denunciadas
                </dt>
                {form.involucrados.length > 0 ? (
                  <ul className="list-disc pl-4 text-gray-700">
                    {form.involucrados.map((inv, idx) => (
                      <li key={idx}>
                        {inv.nombre} ({inv.vinculacion})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <dd className="text-gray-500 italic">
                    No se agregaron personas específicas
                  </dd>
                )}
              </div>

              <div className="md:col-span-2">
                <dt className="text-gray-500 text-xs uppercase font-bold mb-1">
                  Relato
                </dt>
                <dd className="bg-white p-3 rounded border text-gray-700 whitespace-pre-wrap">
                  {form.relato}
                </dd>
              </div>

              <div className="md:col-span-2">
                <dt className="text-gray-500 text-xs uppercase font-bold mb-1">
                  Evidencias Adjuntas
                </dt>
                {archivosEvidencia.length > 0 ? (
                  <dd className="bg-white p-3 rounded border">
                    <ul className="space-y-2">
                      {archivosEvidencia.map((archivo, idx) => {
                        const getFileIcon = (mimeType: string): string => {
                          if (mimeType.startsWith('image/')) return '🖼️';
                          if (mimeType.startsWith('video/')) return '🎥';
                          if (mimeType.startsWith('audio/')) return '🎵';
                          if (mimeType === 'application/pdf') return '📄';
                          if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
                          if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
                          return '📎';
                        };
                        const formatFileSize = (bytes: number): string => {
                          if (bytes === 0) return '0 Bytes';
                          const k = 1024;
                          const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                          const i = Math.floor(Math.log(bytes) / Math.log(k));
                          return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
                        };
                        return (
                          <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                            <span>{getFileIcon(archivo.mimeType)}</span>
                            <span className="font-medium">{archivo.fileName}</span>
                            <span className="text-gray-500">({formatFileSize(archivo.size)})</span>
                          </li>
                        );
                      })}
                    </ul>
                  </dd>
                ) : (
                  <dd className="text-gray-500 italic">No se adjuntaron archivos</dd>
                )}
              </div>
            </dl>
          </div>
          <div className="text-sm text-gray-500 text-center">
            <p>Al enviar, confirmas que los datos entregados son verídicos.</p>
          </div>
        </div>
      )}
    </FormularioLayout>
  );
}
