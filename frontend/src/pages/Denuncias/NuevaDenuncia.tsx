import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {crearDenuncia,type CrearDenunciaInput,} from "@/services/denuncias.api";
import { routes } from "@/services/routes";
import { Cards } from "@/components/ui/Cards";
import {TIPOS_DENUNCIA,SEDES,LUGARES_SEDE,VINCULACIONES,VINCULACIONES_CAMPO_CLINICO,} from "@/data/denuncias.data";
import type {FormularioDenuncia,Involucrado,FaseRegistro,Testigo,} from "@/types/denuncia.types";
import FormularioLayout from "./components/FormularioLayout";
import { useAuth } from "@/context/AuthContext";
import { clRegions } from "@clregions/data";
import FileUploader, { type FileMetadata } from "@/components/FileUploader";
import { validarRut, validarEmail, validarTelefono } from "@/utils/validation.utils";

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
  const [detalles, setDetalles] = useState< { field: string; msg: string }[] | null > (null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mostrarCamposAdicionalesDenunciado,setMostrarCamposAdicionalesDenunciado,] = useState(false);
  const [mostrarFormTestigo, setMostrarFormTestigo] = useState(false);
  const [nuevoTestigo, setNuevoTestigo] = useState<Testigo>({nombreCompleto: "",rut: "",contacto: "",});
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
    // Asignar tipo de denuncia por defecto basado en el tipo seleccionado
    // ID 100 = "Género y Equidad" para tipo 1 (Género)
    // ID 200 = "Convivencia Estudiantil" para tipo 2 (Convivencia)
    // ID 300 = "Campos Clínicos" para tipo 3 (Campos Clínicos)
    let tipoPorDefecto: number;
    if (id === 1) {
      tipoPorDefecto = 100;
    } else if (id === 2) {
      tipoPorDefecto = 200;
    } else if (id === 3) {
      tipoPorDefecto = 300;
    } else {
      tipoPorDefecto = 100; // Fallback por defecto
    }
    setForm((prev) => ({ ...prev, tipoId: id, subtipoId: tipoPorDefecto }));
    setFase("formulario");
    window.scrollTo(0, 0);
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
    // Solo requerir nombre para agregar un involucrado (la sección es opcional)
    // Si el usuario quiere agregar uno, al menos debe tener nombre
    if (!form.nuevoInvolucrado.nombre.trim()) {
      return;
    }
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
      return true; // Todos los campos del denunciante son opcionales ahora
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

  /**
   * Valida el formulario completo antes de enviar
   * Retorna un objeto con errores por campo
   */
  function validateForm(): Record<string, string> {
    const newErrors: Record<string, string> = {};
    const esCampoClinico = form.tipoId === 3;

    // Validar campos obligatorios básicos
    if (!form.relato.trim()) {
      newErrors.relato = "El relato de los hechos es obligatorio";
    }
    
    // Validar campos obligatorios básicos
    if (!form.relato.trim()) {
      newErrors.relato = "El relato de los hechos es obligatorio";
    }
    if (!form.subtipoId) {
      newErrors.tipoDenuncia = "Debe seleccionar un tipo de denuncia";
    }

    // Validaciones del denunciante (SOLO si el usuario ha ingresado algo)
    // Si hay algún campo lleno, validamos todos los que estén llenos
    const tieneDatosDenunciante = 
      form.rut.trim() || 
      form.nombre.trim() || 
      form.correo.trim() || 
      form.telefono.trim();

    if (tieneDatosDenunciante) {
      // Si ingresó RUT, validarlo
      if (form.rut.trim() && !validarRut(form.rut)) {
        newErrors.rut = "RUT inválido";
      }
      // Si ingresó correo, validarlo
      if (form.correo.trim() && !validarEmail(form.correo)) {
        newErrors.correo = "Correo electrónico inválido";
      }
      // Si ingresó teléfono, validarlo
      if (form.telefono.trim() && !validarTelefono(form.telefono)) {
        newErrors.telefono = "Teléfono inválido (debe tener 8-9 dígitos)";
      }
    }

    // Validaciones de víctima (denunciado) - SIEMPRE OBLIGATORIA
    if (form.esVictima === "no") {
      // Si NO es el denunciante, la víctima externa es obligatoria
      // RUT de víctima es obligatorio si no es el denunciante
      if (!form.victimaRut.trim()) {
        newErrors.victimaRut = "El RUT de la víctima es obligatorio";
      } else if (!validarRut(form.victimaRut)) {
        newErrors.victimaRut = "RUT de víctima inválido";
      }
      // Si ingresó correo de víctima, validarlo
      if (form.victimaCorreo.trim() && !validarEmail(form.victimaCorreo)) {
        newErrors.victimaCorreo = "Correo electrónico de víctima inválido";
      }
      // Si ingresó teléfono de víctima, validarlo
      if (form.victimaTelefono.trim() && !validarTelefono(form.victimaTelefono)) {
        newErrors.victimaTelefono = "Teléfono de víctima inválido (debe tener 8-9 dígitos)";
      }
    } else {
      // Si el denunciante ES la víctima, validar que tenga datos básicos del denunciante
      // El denunciante ya tiene sus datos, pero debemos asegurarnos de que estén presentes
      // Si está autenticado, los datos se autocompletan, pero validamos por si acaso
      // (No hacemos esto estricto ya que el denunciante es opcional ahora)
    }

    // Validar RUTs de denunciados (si tienen RUT)
    form.involucrados.forEach((inv, index) => {
      if (inv.rut && inv.rut.trim() && !validarRut(inv.rut)) {
        newErrors[`involucrado_${index}_rut`] = "RUT del denunciado inválido";
      }
    });

    // Validar RUTs de testigos (si tienen RUT)
    form.testigos.forEach((test, index) => {
      if (test.rut && test.rut.trim() && !validarRut(test.rut)) {
        newErrors[`testigo_${index}_rut`] = "RUT del testigo inválido";
      }
      // Validar contacto de testigo (puede ser email o teléfono)
      if (test.contacto && test.contacto.trim()) {
        const esEmail = test.contacto.includes('@');
        if (esEmail && !validarEmail(test.contacto)) {
          newErrors[`testigo_${index}_contacto`] = "Correo electrónico del testigo inválido";
        } else if (!esEmail && !validarTelefono(test.contacto)) {
          newErrors[`testigo_${index}_contacto`] = "Teléfono del testigo inválido";
        }
      }
    });

    // Validaciones específicas de campo clínico
    if (esCampoClinico) {
      if (!form.nombreEstablecimiento.trim()) {
        newErrors.nombreEstablecimiento = "El nombre del establecimiento es obligatorio";
      }
      if (!form.regionEstablecimiento.trim()) {
        newErrors.regionEstablecimiento = "La región del establecimiento es obligatoria";
      }
      if (!form.comunaEstablecimiento.trim()) {
        newErrors.comunaEstablecimiento = "La comuna del establecimiento es obligatoria";
      }
      if (!form.direccionEstablecimiento.trim()) {
        newErrors.direccionEstablecimiento = "La dirección del establecimiento es obligatoria";
      }
      if (!form.unidadServicio.trim()) {
        newErrors.unidadServicio = "La unidad de servicio es obligatoria";
      }
      // Los involucrados (Denunciado/s) son OPCIONALES, incluso para campo clínico
      // Solo validamos RUT si se ingresa, pero no es obligatorio agregar denunciados
    } else {
      // Para denuncias normales, validar sede
      if (!form.sedeHecho) {
        newErrors.sedeHecho = "La sede del hecho es obligatoria";
      }
    }


    return newErrors;
  }

  async function enviarDenuncia() {
    setError(null);
    setDetalles(null);
    setErrors({});

    // Validar formulario completo
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Crear un mensaje más descriptivo con la cantidad de errores
      const errorCount = Object.keys(validationErrors).length;
      const errorFields = Object.keys(validationErrors).map(field => {
        // Mapear nombres de campos técnicos a nombres legibles
        const fieldNames: Record<string, string> = {
          'relato': 'Relato de los hechos',
          'tipoDenuncia': 'Tipo de denuncia',
          'rut': 'RUT del denunciante',
          'correo': 'Correo del denunciante',
          'telefono': 'Teléfono del denunciante',
          'victimaRut': 'RUT de la víctima',
          'victimaCorreo': 'Correo de la víctima',
          'victimaTelefono': 'Teléfono de la víctima',
          'nombreEstablecimiento': 'Nombre del establecimiento',
          'unidadServicio': 'Unidad de servicio',
          'regionEstablecimiento': 'Región del establecimiento',
          'comunaEstablecimiento': 'Comuna del establecimiento',
          'direccionEstablecimiento': 'Dirección del establecimiento',
          'sedeHecho': 'Sede del hecho',
        };
        return fieldNames[field] || field;
      });
      setError(`Se encontraron ${errorCount} error(es) en el formulario. Por favor revise los campos marcados en rojo: ${errorFields.join(', ')}.`);
      // Scroll al primer error
      const firstErrorField = Object.keys(validationErrors)[0];
      setTimeout(() => {
        const element = document.querySelector(`[data-field="${firstErrorField}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Intentar hacer focus si es un input o select
          if (element instanceof HTMLElement && (element.tagName === 'INPUT' || element.tagName === 'SELECT' || element.tagName === 'TEXTAREA')) {
            (element as HTMLElement).focus();
          }
        }
      }, 100);
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

    const relatoFinal = form.relato.trim();

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
      // Las validaciones ya se hicieron en validateForm(), solo construimos el payload
    }

    const payload: CrearDenunciaInput = {
      // Campos del denunciante (todos opcionales ahora - se envían null si están vacíos)
      Rut: form.rut?.trim() || null,
      Nombre: form.nombre?.trim() || null,
      Correo: form.correo?.trim() || null,
      Telefono: form.telefono?.trim() || null,
      genero: form.genero?.trim() || null, // String directo, opcional
      sexo: form.sexo?.trim() || null, // String directo, opcional
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
      // Si la víctima es externa (no es el denunciante), agregarla como participante
      // IMPORTANTE: Solo enviar si tiene RUT (es obligatorio para guardar como participante)
      victima: form.esVictima === "no" && form.victimaRut && form.victimaRut.trim() ? {
        nombre: form.victimaNombre || "",
        rut: form.victimaRut.trim(),
        correo: form.victimaCorreo || undefined,
        telefono: form.victimaTelefono || undefined,
        genero: form.victimaGenero || undefined,
        sexo: form.victimaSexo || undefined,
      } : undefined,
      evidencias: [],
      caracteristicasDenunciado: notasAdicionales,
      
      // Datos específicos para denuncias de campo clínico
      detalleCampoClinico: esCampoClinico ? {
        nombreEstablecimiento: form.nombreEstablecimiento.trim(),
        unidadServicio: form.unidadServicio.trim(),
        // Priorizar la vinculación del primer involucrado, o del nuevo involucrado si está siendo agregado
        tipoVinculacionDenunciado: form.involucrados.length > 0 && form.involucrados[0].vinculacion 
          ? form.involucrados[0].vinculacion.trim() 
          : (form.nuevoInvolucrado.vinculacion && form.nuevoInvolucrado.vinculacion.trim())
          ? form.nuevoInvolucrado.vinculacion.trim()
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
      // Mapear errores del backend al estado errors para mostrarlos en los campos
      const backendErrors: Record<string, string> = {};
      
      // Si hay detalles de error del backend, mapearlos a los campos
      if (err?.detalles && Array.isArray(err.detalles)) {
        setDetalles(err.detalles as { field: string; msg: string }[]);
        
        // Mapear errores a campos individuales
        err.detalles.forEach((detalle: { field: string; msg: string }) => {
          // Normalizar el nombre del campo para que coincida con los data-field
          const fieldName = detalle.field?.toLowerCase() || '';
          
          // Mapear nombres de campos del backend a nombres de campos del frontend
          const fieldMapping: Record<string, string> = {
            'rut': 'rut',
            'nombre': 'nombre',
            'correo': 'correo',
            'telefono': 'telefono',
            'genero': 'genero',
            'sexo': 'sexo',
            'victimarut': 'victimaRut',
            'victima_rut': 'victimaRut',
            'victimacorreo': 'victimaCorreo',
            'victima_correo': 'victimaCorreo',
            'victimatelefono': 'victimaTelefono',
            'victima_telefono': 'victimaTelefono',
            'relato': 'relato',
            'relato_hechos': 'relato',
            'sede': 'sedeHecho',
            'sede_hecho': 'sedeHecho',
            'tipo': 'tipoDenuncia',
            'tipodenuncia': 'tipoDenuncia',
            'id_tipode': 'tipoDenuncia',
          };
          
          const mappedField = fieldMapping[fieldName] || fieldName;
          backendErrors[mappedField] = detalle.msg;
        });
      }
      
      // Si hay errores mapeados, mostrarlos en los campos
      if (Object.keys(backendErrors).length > 0) {
        setErrors(backendErrors);
        // Scroll al primer error
        const firstErrorField = Object.keys(backendErrors)[0];
        setTimeout(() => {
          const element = document.querySelector(`[data-field="${firstErrorField}"]`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Intentar hacer focus si es un input o select
            if (element instanceof HTMLElement && (element.tagName === 'INPUT' || element.tagName === 'SELECT' || element.tagName === 'TEXTAREA')) {
              (element as HTMLElement).focus();
            }
          }
        }, 100);
      }
      
      // Establecer mensaje de error general
      const errorMessage = err?.message ?? "Error al crear la denuncia";
      setError(errorMessage);
      
      // Si no hay mensaje específico pero hay detalles, crear mensaje más descriptivo
      if (!err?.message && err?.detalles && Array.isArray(err.detalles) && err.detalles.length > 0) {
        setError(`Se encontraron ${err.detalles.length} error(es) en el formulario. Por favor revise los campos marcados.`);
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
              <div data-field="tipoDenuncia">
                <label className="text-[10px] uppercase tracking-wide text-gray-500 font-bold block mb-1">
                  Tipo de Denuncia
                </label>
                <p className={`text-sm font-semibold ${errors.tipoDenuncia ? 'text-red-500' : ''}`}>
                  {tipoSeleccionado?.nombre || 'No seleccionado'}
                </p>
                {errors.tipoDenuncia && (
                  <p className="mt-1 text-xs text-red-500">{errors.tipoDenuncia}</p>
                )}
              </div>
            </div>
          </div>

          <section className="space-y-4">
            <h2 className="font-condensed text-lg font-semibold text-gray-900 border-b pb-2">
              Datos del denunciante <span className="text-sm font-normal text-gray-500">(Opcional)</span>
            </h2>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    RUT
                  </label>
                  <input
                    data-field="rut"
                    className={`mt-1 w-full rounded-md border px-3 py-2 text-sm ${
                      errors.rut ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="12.345.678-9"
                    value={form.rut}
                    onChange={(e) => {
                      updateField("rut", e.target.value);
                      // Limpiar error al escribir
                      if (errors.rut) {
                        setErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.rut;
                          return newErrors;
                        });
                      }
                    }}
                  />
                  {errors.rut && (
                    <p className="mt-1 text-xs text-red-500">{errors.rut}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Nombre completo
                  </label>
                  <input
                    data-field="nombre"
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Tu nombre"
                    value={form.nombre}
                    onChange={(e) => updateField("nombre", e.target.value)}
                  />
                </div>
              </div>

              {/* Sexo y Género - igual que en paso 2 */}
              <div className="grid gap-4 md:grid-cols-2 mt-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Sexo
                  </label>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Ingrese el sexo"
                    value={form.sexo || ""}
                    onChange={(e) => updateField("sexo", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Género (Opcional)
                  </label>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Ingrese el género"
                    value={form.genero || ""}
                    onChange={(e) => updateField("genero", e.target.value)}
                  />
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
                    data-field="telefono"
                    className={`mt-1 w-full rounded-md border px-3 py-2 text-sm ${
                      errors.telefono ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="+56 9 ..."
                    value={form.telefono}
                    onChange={(e) => {
                      updateField("telefono", e.target.value);
                      // Limpiar error al escribir
                      if (errors.telefono) {
                        setErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.telefono;
                          return newErrors;
                        });
                      }
                    }}
                  />
                  {errors.telefono && (
                    <p className="mt-1 text-xs text-red-500">{errors.telefono}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Correo
                  </label>
                  <input
                    data-field="correo"
                    type="email"
                    className={`mt-1 w-full rounded-md border px-3 py-2 text-sm ${
                      errors.correo ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="correo@ubb.cl"
                    value={form.correo}
                    onChange={(e) => {
                      updateField("correo", e.target.value);
                      // Limpiar error al escribir
                      if (errors.correo) {
                        setErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.correo;
                          return newErrors;
                        });
                      }
                    }}
                  />
                  {errors.correo && (
                    <p className="mt-1 text-xs text-red-500">{errors.correo}</p>
                  )}
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
                    Región
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
                    Comuna
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
                  Dirección domicilio
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
                    RUT {form.esVictima === "no" && "*"}
                  </label>
                  <input
                    data-field="victimaRut"
                    className={`mt-1 w-full rounded-md border px-3 py-2 text-sm bg-gray-100 text-gray-60 ${
                      errors.victimaRut ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={form.victimaRut}
                    onChange={(e) => {
                      updateField("victimaRut", e.target.value);
                      if (errors.victimaRut) {
                        setErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.victimaRut;
                          return newErrors;
                        });
                      }
                    }}
                    disabled={form.esVictima === "si"}
                  />
                  {errors.victimaRut && form.esVictima === "no" && (
                    <p className="mt-1 text-xs text-red-500">{errors.victimaRut}</p>
                  )}
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
                    data-field="victimaCorreo"
                    className={`mt-1 w-full rounded-md border px-3 py-2 text-sm bg-gray-100 text-gray-60 ${
                      errors.victimaCorreo ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={form.victimaCorreo}
                    onChange={(e) => {
                      updateField("victimaCorreo", e.target.value);
                      if (errors.victimaCorreo) {
                        setErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.victimaCorreo;
                          return newErrors;
                        });
                      }
                    }}
                    disabled={form.esVictima === "si"}
                  />
                  {errors.victimaCorreo && (
                    <p className="mt-1 text-xs text-red-500">{errors.victimaCorreo}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Teléfono
                  </label>
                  <input
                    data-field="victimaTelefono"
                    className={`mt-1 w-full rounded-md border px-3 py-2 text-sm bg-gray-100 text-gray-60 ${
                      errors.victimaTelefono ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={form.victimaTelefono}
                    onChange={(e) => {
                      updateField("victimaTelefono", e.target.value);
                      if (errors.victimaTelefono) {
                        setErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.victimaTelefono;
                          return newErrors;
                        });
                      }
                    }}
                    disabled={form.esVictima === "si"}
                  />
                  {errors.victimaTelefono && (
                    <p className="mt-1 text-xs text-red-500">{errors.victimaTelefono}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Sexo *
                  </label>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-100 text-gray-600"
                    placeholder="Ingrese el sexo"
                    value={form.victimaSexo || ""}
                    onChange={(e) => updateField("victimaSexo", e.target.value)}
                    disabled={form.esVictima === "si"}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Género (Opcional)
                  </label>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-100 text-gray-600"
                    placeholder="Ingrese el género"
                    value={form.victimaGenero || ""}
                    onChange={(e) =>
                      updateField("victimaGenero", e.target.value)
                    }
                    disabled={form.esVictima === "si"}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="font-condensed text-lg font-semibold text-gray-900 border-b pb-2">
              Denunciado/s <span className="text-sm font-normal text-gray-500">(Opcional)</span>
            </h2>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              {/* Campos principales siempre visibles */}
              <div className="space-y-4">
                {/* Nombre y Vinculación en la misma fila */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Nombre Completo
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
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Vinculación
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
                    Descripción del denunciado
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
                      data-field="nombreEstablecimiento"
                      className={`mt-1 w-full rounded-md border px-3 py-2 text-sm ${
                        errors.nombreEstablecimiento ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Ej: Hospital Regional de Concepción, CESFAM Las Higueras..."
                      value={form.nombreEstablecimiento}
                      onChange={(e) => {
                        updateField("nombreEstablecimiento", e.target.value);
                        if (errors.nombreEstablecimiento) {
                          setErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.nombreEstablecimiento;
                            return newErrors;
                          });
                        }
                      }}
                      required
                    />
                    {errors.nombreEstablecimiento && (
                      <p className="mt-1 text-xs text-red-500">{errors.nombreEstablecimiento}</p>
                    )}
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2 pt-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Región del Establecimiento *
                      </label>
                      <select
                        data-field="regionEstablecimiento"
                        className={`mt-1 w-full rounded-md border px-3 py-2 text-sm ${
                          errors.regionEstablecimiento ? 'border-red-500' : 'border-gray-300'
                        }`}
                        value={form.regionEstablecimiento}
                        onChange={(e) => {
                          updateField("regionEstablecimiento", e.target.value);
                          updateField("comunaEstablecimiento", ""); // Clear commune when region changes
                          if (errors.regionEstablecimiento) {
                            setErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors.regionEstablecimiento;
                              return newErrors;
                            });
                          }
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
                      {errors.regionEstablecimiento && (
                        <p className="mt-1 text-xs text-red-500">{errors.regionEstablecimiento}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Comuna del Establecimiento *
                      </label>
                      <select
                        data-field="comunaEstablecimiento"
                        className={`mt-1 w-full rounded-md border px-3 py-2 text-sm ${
                          errors.comunaEstablecimiento ? 'border-red-500' : 'border-gray-300'
                        }`}
                        value={form.comunaEstablecimiento}
                        onChange={(e) => {
                          updateField("comunaEstablecimiento", e.target.value);
                          if (errors.comunaEstablecimiento) {
                            setErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors.comunaEstablecimiento;
                              return newErrors;
                            });
                          }
                        }}
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
                      {errors.comunaEstablecimiento && (
                        <p className="mt-1 text-xs text-red-500">{errors.comunaEstablecimiento}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <label className="text-sm font-medium text-gray-700">
                      Dirección del Establecimiento *
                    </label>
                    <input
                      data-field="direccionEstablecimiento"
                      className={`mt-1 w-full rounded-md border px-3 py-2 text-sm ${
                        errors.direccionEstablecimiento ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Ej: Av. O'Higgins 1234, Concepción..."
                      value={form.direccionEstablecimiento}
                      onChange={(e) => {
                        updateField("direccionEstablecimiento", e.target.value);
                        if (errors.direccionEstablecimiento) {
                          setErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.direccionEstablecimiento;
                            return newErrors;
                          });
                        }
                      }}
                      required
                    />
                    {errors.direccionEstablecimiento && (
                      <p className="mt-1 text-xs text-red-500">{errors.direccionEstablecimiento}</p>
                    )}
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2 pt-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Unidad o Servicio * <span className="text-xs text-gray-500">(Donde ocurrió el hecho)</span>
                      </label>
                      <input
                        data-field="unidadServicio"
                        className={`mt-1 w-full rounded-md border px-3 py-2 text-sm ${
                          errors.unidadServicio ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Ej: Urgencias, Pediatría, Medicina Interna..."
                        value={form.unidadServicio}
                        onChange={(e) => {
                          updateField("unidadServicio", e.target.value);
                          if (errors.unidadServicio) {
                            setErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors.unidadServicio;
                              return newErrors;
                            });
                          }
                        }}
                        required
                      />
                      {errors.unidadServicio && (
                        <p className="mt-1 text-xs text-red-500">{errors.unidadServicio}</p>
                      )}
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
                        data-field="sedeHecho"
                        className={`mt-1 w-full rounded-md border px-3 py-2 text-sm ${
                          errors.sedeHecho ? 'border-red-500' : 'border-gray-300'
                        }`}
                        value={form.sedeHecho}
                        onChange={(e) => {
                          const sede = SEDES.find((s) => s.id === e.target.value);
                          updateField("sedeHecho", e.target.value);
                          updateField("regionHecho", sede?.region || "");
                          updateField("lugarHecho", "");
                          if (errors.sedeHecho) {
                            setErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors.sedeHecho;
                              return newErrors;
                            });
                          }
                        }}
                      >
                        <option value="">Seleccionar Sede</option>
                        {SEDES.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nombre}
                          </option>
                        ))}
                      </select>
                      {errors.sedeHecho && (
                        <p className="mt-1 text-xs text-red-500">{errors.sedeHecho}</p>
                      )}
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
                  data-field="relato"
                  className={`mt-1 w-full rounded-md border px-3 py-2 text-sm h-32 focus:ring-2 focus:ring-ubb-blue/20 ${
                    errors.relato ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Describe qué pasó, cómo, cuándo y quiénes estaban presentes..."
                  value={form.relato}
                  onChange={(e) => {
                    updateField("relato", e.target.value);
                    if (errors.relato) {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.relato;
                        return newErrors;
                      });
                    }
                  }}
                />
                {errors.relato && (
                  <p className="mt-1 text-xs text-red-500">{errors.relato}</p>
                )}
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
