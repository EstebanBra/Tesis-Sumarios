import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { crearDenuncia, type CrearDenunciaInput } from '@/services/denuncias.api';
import { routes } from '@/services/routes';
import { Cards } from '@/components/ui/Cards';
import { TIPOS_DENUNCIA, SEDES, LUGARES_SEDE } from '@/data/denuncias.data';
import type {
  FormularioDenuncia,
  Involucrado,
  FaseRegistro,
  Testigo,
} from '@/types/denuncia.types';
import FormularioLayout from './components/FormularioLayout';
import { useAuth } from '@/context/AuthContext';
import { clRegions } from '@clregions/data';
import { type FileMetadata } from '@/components/FileUploader';
import { validarRut, validarEmail, validarTelefono } from '@/utils/validation.utils';
import Paso1Identificacion from './components/steps/Paso1Identificacion';
import Paso2Hechos from './components/steps/Paso2Hechos';
import Paso3Confirmacion from './components/steps/Paso3Confirmacion';

const initialInvolucrado: Involucrado = {
  nombre: '',
  vinculacion: '',
  descripcionDenunciado: '',
  rut: '',
  unidadCarrera: '',
};

const initialForm: FormularioDenuncia = {
  rut: '',
  nombre: '',
  telefono: '',
  correo: '',
  sexo: '',
  genero: '',
  reservaIdentidad: false,
  carreraCargo: '',
  tipoId: 0,
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
  victimaCorreo: '',
  victimaTelefono: '',

  regionHecho: '',
  comunaHecho: '',
  sedeHecho: '',
  lugarHecho: '',
  detalleHecho: '',
  tipoFecha: 'unica',
  fechaHecho: '',
  fechaHechoFin: '',
  horaHecho: '',
  relato: '',
  involucrados: [],
  nuevoInvolucrado: { ...initialInvolucrado },
  testigos: [],

  // Campos específicos para denuncias de campo clínico
  nombreEstablecimiento: '',
  unidadServicio: '',
  tipoVinculacionDenunciado: '',
  regionEstablecimiento: '',
  comunaEstablecimiento: '',
  direccionEstablecimiento: '',
};

const steps = [
  { id: 1, label: 'Información del Denunciante' },
  { id: 2, label: 'Hechos y Denunciados' },
  { id: 3, label: 'Revisión' },
];

export default function NuevaDenuncia() {
  const nav = useNavigate();
  const { user } = useAuth();

  const [fase, setFase] = useState<FaseRegistro>('seleccion_tipo');
  const [form, setForm] = useState<FormularioDenuncia>(initialForm);
  const [step, setStep] = useState(1);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detalles, setDetalles] = useState<{ field: string; msg: string }[] | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [intentoAvanzar, setIntentoAvanzar] = useState(false);
  const [errorDenunciado, setErrorDenunciado] = useState<string>('');
  const [errorTestigo, setErrorTestigo] = useState<string>('');
  const [mostrarCamposAdicionalesDenunciado, setMostrarCamposAdicionalesDenunciado] =
    useState(false);
  const [mostrarFormTestigo, setMostrarFormTestigo] = useState(false);
  const [nuevoTestigo, setNuevoTestigo] = useState<Testigo>({
    nombreCompleto: '',
    rut: '',
    contacto: '',
  });
  const [archivosEvidencia, setArchivosEvidencia] = useState<FileMetadata[]>([]);
  const stepTitle = useMemo(() => steps[step - 1]?.label ?? '', [step]);

  const tipoSeleccionado = useMemo(
    () => TIPOS_DENUNCIA.find(t => t.id === form.tipoId) ?? null,
    [form.tipoId]
  );

  const lugaresDisponibles = useMemo(() => {
    if (!form.sedeHecho) return [];
    return LUGARES_SEDE[form.sedeHecho] || [];
  }, [form.sedeHecho]);

  // --- Dynamic Regions and Communes ---
  const allRegions = useMemo(() => {
    // clRegions.regions is an object with ID as key
    return Object.values(clRegions.regions).sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const communesDenunciante = useMemo(() => {
    if (!form.regionDenunciante) return [];
    // Find region by name
    const region = allRegions.find(r => r.name === form.regionDenunciante);
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
      setForm(prev => {
        const isVictima = prev.esVictima === 'si';
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
          // Si es víctima, precargar todos los datos del usuario
          victimaRut: isVictima ? user.rut : prev.victimaRut,
          victimaNombre: isVictima ? user.nombre : prev.victimaNombre,
          victimaCorreo: isVictima ? user.email : prev.victimaCorreo,
          victimaTelefono: isVictima ? user.telefono || prev.telefono : prev.victimaTelefono,
          victimaSexo: isVictima
            ? (user as any).sexo || prev.victimaSexo || prev.sexo
            : prev.victimaSexo,
          victimaGenero: isVictima
            ? user.genero || prev.victimaGenero || prev.genero
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
    setForm(prev => ({ ...prev, tipoId: id, subtipoId: tipoPorDefecto }));
    setFase('formulario');
    window.scrollTo(0, 0);
  }

  function handleBackToSubtipo() {
    if (step === 1) {
      setFase('seleccion_tipo');
      setForm(prev => ({ ...prev, tipoId: 0, subtipoId: null }));
    } else {
      handlePrev();
    }
  }

  function updateField<K extends keyof FormularioDenuncia>(key: K, value: FormularioDenuncia[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function handleEsVictimaChange(esVictima: 'si' | 'no') {
    if (esVictima === 'si' && user) {
      setForm(prev => ({
        ...prev,
        esVictima: 'si',
        victimaRut: user.rut,
        victimaNombre: user.nombre,
        victimaCorreo: user.email,
        victimaTelefono: user.telefono || prev.telefono,
        // Precargar sexo y género del usuario, o del formulario si no están en el usuario
        victimaSexo: (user as any).sexo || prev.sexo || prev.victimaSexo || '',
        victimaGenero: user.genero || prev.genero || prev.victimaGenero || '',
      }));
    } else {
      setForm(prev => ({
        ...prev,
        esVictima: 'no',
        victimaRut: '',
        victimaNombre: '',
        victimaCorreo: '',
        victimaTelefono: '',
        victimaGenero: '',
        victimaSexo: '',
      }));
    }
  }

  function handleAddInvolucrado() {
    // Validación in-line: Denunciado debe tener Nombre y Vinculación
    const nuevoInv = form.nuevoInvolucrado;

    // Limpiar error previo
    setErrorDenunciado('');

    // Validar que tenga nombre
    if (!nuevoInv.nombre || !nuevoInv.nombre.trim()) {
      setErrorDenunciado('El nombre del denunciado es obligatorio');
      setErrors(prev => ({ ...prev, nuevoInvolucrado_nombre: 'El nombre es obligatorio' }));
      return;
    }

    // Validar nombre con regex
    const nombreRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;
    if (!nombreRegex.test(nuevoInv.nombre.trim())) {
      setErrorDenunciado('El nombre solo puede contener letras');
      setErrors(prev => ({
        ...prev,
        nuevoInvolucrado_nombre: 'El nombre solo puede contener letras',
      }));
      return;
    }

    // Validar que tenga vinculación
    if (!nuevoInv.vinculacion || !nuevoInv.vinculacion.trim()) {
      setErrorDenunciado('La vinculación del denunciado es obligatoria');
      setErrors(prev => ({
        ...prev,
        nuevoInvolucrado_vinculacion: 'La vinculación es obligatoria',
      }));
      return;
    }

    // Validar RUT si se ingresó
    if (nuevoInv.rut && nuevoInv.rut.trim() && !validarRut(nuevoInv.rut)) {
      setErrorDenunciado('El RUT del denunciado es inválido');
      setErrors(prev => ({ ...prev, nuevoInvolucrado_rut: 'RUT inválido' }));
      return;
    }

    // Si pasa todas las validaciones, agregar el involucrado
    setForm(prev => ({
      ...prev,
      involucrados: [...prev.involucrados, { ...prev.nuevoInvolucrado }],
      nuevoInvolucrado: { ...initialInvolucrado },
    }));

    // Limpiar errores
    setErrorDenunciado('');
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.nuevoInvolucrado_nombre;
      delete newErrors.nuevoInvolucrado_vinculacion;
      delete newErrors.nuevoInvolucrado_rut;
      return newErrors;
    });
  }

  function handleRemoveInvolucrado(index: number) {
    setForm(prev => ({
      ...prev,
      involucrados: prev.involucrados.filter((_, i) => i !== index),
    }));
  }

  function handleAgregarTestigo() {
    // Validación in-line: Testigo debe tener Nombre y algún medio de contacto válido
    setErrorTestigo('');

    // Validar que tenga nombre
    if (!nuevoTestigo.nombreCompleto || !nuevoTestigo.nombreCompleto.trim()) {
      setErrorTestigo('El nombre del testigo es obligatorio');
      setErrors(prev => ({ ...prev, nuevoTestigo_nombre: 'El nombre es obligatorio' }));
      return;
    }

    // Validar nombre con regex
    const nombreRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;
    if (!nombreRegex.test(nuevoTestigo.nombreCompleto.trim())) {
      setErrorTestigo('El nombre solo puede contener letras');
      setErrors(prev => ({ ...prev, nuevoTestigo_nombre: 'El nombre solo puede contener letras' }));
      return;
    }

    // Validar que tenga contacto (email o teléfono)
    if (!nuevoTestigo.contacto || !nuevoTestigo.contacto.trim()) {
      setErrorTestigo('Debes ingresar un medio de contacto (email o teléfono) para el testigo');
      setErrors(prev => ({ ...prev, nuevoTestigo_contacto: 'El contacto es obligatorio' }));
      return;
    }

    // Validar formato del contacto
    const contacto = nuevoTestigo.contacto.trim();
    const esEmail = contacto.includes('@');

    if (esEmail && !validarEmail(contacto)) {
      setErrorTestigo('El correo electrónico del testigo es inválido');
      setErrors(prev => ({ ...prev, nuevoTestigo_contacto: 'Correo electrónico inválido' }));
      return;
    } else if (!esEmail && !validarTelefono(contacto)) {
      setErrorTestigo('El teléfono del testigo es inválido (debe tener 8-9 dígitos)');
      setErrors(prev => ({ ...prev, nuevoTestigo_contacto: 'Teléfono inválido' }));
      return;
    }

    // Validar RUT si se ingresó
    if (nuevoTestigo.rut && nuevoTestigo.rut.trim() && !validarRut(nuevoTestigo.rut)) {
      setErrorTestigo('El RUT del testigo es inválido');
      setErrors(prev => ({ ...prev, nuevoTestigo_rut: 'RUT inválido' }));
      return;
    }

    // Si pasa todas las validaciones, agregar el testigo
    setForm(prev => ({
      ...prev,
      testigos: [...prev.testigos, { ...nuevoTestigo }],
    }));
    setNuevoTestigo({ nombreCompleto: '', rut: '', contacto: '' });
    setMostrarFormTestigo(false);

    // Limpiar errores
    setErrorTestigo('');
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.nuevoTestigo_nombre;
      delete newErrors.nuevoTestigo_contacto;
      delete newErrors.nuevoTestigo_rut;
      delete newErrors.testigos; // Limpiar error general si existe
      return newErrors;
    });
  }

  function handleEliminarTestigo(index: number) {
    setForm(prev => {
      const nuevosTestigos = prev.testigos.filter((_, i) => i !== index);
      // Limpiar error si ya no hay testigos sin contacto
      const tieneTestigoSinContacto = nuevosTestigos.some(t => !t.contacto || !t.contacto.trim());
      if (!tieneTestigoSinContacto && errors.testigos) {
        setTimeout(() => {
          setErrors(prevErrors => {
            const newErrors = { ...prevErrors };
            delete newErrors.testigos;
            return newErrors;
          });
        }, 0);
      }
      return {
        ...prev,
        testigos: nuevosTestigos,
      };
    });
  }

  /**
   * Valida solo los campos del paso actual (Validation Gating)
   * Retorna true si el paso es válido, false si hay errores
   */
  function validarPasoActual(): boolean {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1: // Paso 1: Información del Denunciante
        // Validar RUT solo si se ingresó
        if (form.rut.trim()) {
          if (!validarRut(form.rut)) {
            newErrors.rut = 'El RUT es inválido';
          }
        }
        // Validar nombre solo si se ingresó
        if (form.nombre.trim()) {
          const nombreRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;
          if (!nombreRegex.test(form.nombre.trim())) {
            newErrors.nombre = 'El nombre solo puede contener letras';
          }
        }
        // Validar correo solo si se ingresó
        if (form.correo.trim()) {
          if (!validarEmail(form.correo)) {
            newErrors.correo = 'El correo es inválido';
          }
        }
        // Validar teléfono solo si se ingresó
        if (form.telefono.trim()) {
          if (!validarTelefono(form.telefono)) {
            newErrors.telefono = 'El teléfono es inválido (debe tener 8-9 dígitos)';
          }
        }

        // VALIDACIONES OBLIGATORIAS - FASE 1
        // Carrera o Cargo
        if (!form.carreraCargo || !form.carreraCargo.trim()) {
          newErrors.carreraCargo = 'La carrera o cargo es obligatorio';
        }
        // Región
        if (!form.regionDenunciante || !form.regionDenunciante.trim()) {
          newErrors.regionDenunciante = 'La región es obligatoria';
        }
        // Comuna
        if (!form.comunaDenunciante || !form.comunaDenunciante.trim()) {
          newErrors.comunaDenunciante = 'La comuna es obligatoria';
        }
        // Dirección
        if (!form.direccionDenunciante || !form.direccionDenunciante.trim()) {
          newErrors.direccionDenunciante = 'La dirección es obligatoria';
        }

        // Si hay algún error de campos obligatorios, mostrar mensaje general
        if (
          newErrors.carreraCargo ||
          newErrors.regionDenunciante ||
          newErrors.comunaDenunciante ||
          newErrors.direccionDenunciante
        ) {
          newErrors.infoDenunciante = 'Debes completar tu información de ubicación y cargo';
        }
        break;

      case 2: // Paso 2: Hechos y Denunciados
        // Validar RUT de víctima si no es el denunciante
        if (form.esVictima === 'no') {
          if (!form.victimaRut.trim()) {
            newErrors.victimaRut = 'El RUT de la víctima es obligatorio';
          } else if (!validarRut(form.victimaRut)) {
            newErrors.victimaRut = 'RUT de víctima inválido';
          }
          // Validar nombre de víctima si se ingresó
          if (form.victimaNombre.trim()) {
            const nombreRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;
            if (!nombreRegex.test(form.victimaNombre.trim())) {
              newErrors.victimaNombre = 'El nombre solo puede contener letras';
            }
          }
          // Validar correo de víctima si se ingresó
          if (form.victimaCorreo.trim() && !validarEmail(form.victimaCorreo)) {
            newErrors.victimaCorreo = 'Correo electrónico de víctima inválido';
          }
          // Validar teléfono de víctima si se ingresó
          if (form.victimaTelefono.trim() && !validarTelefono(form.victimaTelefono)) {
            newErrors.victimaTelefono = 'Teléfono de víctima inválido (debe tener 8-9 dígitos)';
          }
        }

        // VALIDACIÓN DE FECHAS - Normalizando horas para comparación correcta
        if (form.fechaHecho) {
          const fechaHecho = new Date(form.fechaHecho);
          fechaHecho.setHours(0, 0, 0, 0); // Normalizar a inicio del día

          const hoy = new Date();
          hoy.setHours(0, 0, 0, 0); // Normalizar a inicio del día actual

          if (fechaHecho > hoy) {
            newErrors.fechaHecho = 'La fecha de los hechos no puede ser futura';
          }
        }

        // Validar rango de fechas
        if (form.tipoFecha === 'rango' && form.fechaHecho && form.fechaHechoFin) {
          const fechaInicio = new Date(form.fechaHecho);
          fechaInicio.setHours(0, 0, 0, 0); // Normalizar a inicio del día

          const fechaFin = new Date(form.fechaHechoFin);
          fechaFin.setHours(0, 0, 0, 0); // Normalizar a inicio del día

          const hoy = new Date();
          hoy.setHours(0, 0, 0, 0); // Normalizar a inicio del día actual

          // La fecha de término no puede ser futura
          if (fechaFin > hoy) {
            newErrors.fechaHechoFin = 'La fecha de término no puede ser futura';
          }
          // La fecha de término debe ser posterior o igual al inicio
          else if (fechaFin < fechaInicio) {
            newErrors.fechaHechoFin = 'La fecha de término debe ser posterior al inicio';
          }
        }

        // Validar relato (obligatorio, mínimo 20 caracteres)
        if (!form.relato.trim()) {
          newErrors.relato = 'La descripción de los hechos es obligatoria';
        } else if (form.relato.trim().length < 20) {
          newErrors.relato = 'La descripción debe tener al menos 20 caracteres';
        }

        // Validar campos específicos según tipo de denuncia
        if (form.tipoId === 3) {
          // Denuncia de campo clínico
          if (!form.nombreEstablecimiento.trim()) {
            newErrors.nombreEstablecimiento = 'El nombre del establecimiento es obligatorio';
          }
          if (!form.regionEstablecimiento.trim()) {
            newErrors.regionEstablecimiento = 'La región del establecimiento es obligatoria';
          }
          if (!form.comunaEstablecimiento.trim()) {
            newErrors.comunaEstablecimiento = 'La comuna del establecimiento es obligatoria';
          }
          if (!form.direccionEstablecimiento.trim()) {
            newErrors.direccionEstablecimiento = 'La dirección del establecimiento es obligatoria';
          }
          if (!form.unidadServicio.trim()) {
            newErrors.unidadServicio = 'La unidad de servicio es obligatoria';
          }
        } else {
          // Denuncia normal
          if (!form.sedeHecho) {
            newErrors.sedeHecho = 'La sede del hecho es obligatoria';
          }
        }

        // Validar nombres y RUTs de denunciados si se ingresaron
        form.involucrados.forEach((inv, index) => {
          // Validar nombre si se ingresó
          if (inv.nombre && inv.nombre.trim()) {
            const nombreRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;
            if (!nombreRegex.test(inv.nombre.trim())) {
              newErrors[`involucrado_${index}_nombre`] = 'El nombre solo puede contener letras';
            }
          }
          // Validar RUT si se ingresó
          if (inv.rut && inv.rut.trim() && !validarRut(inv.rut)) {
            newErrors[`involucrado_${index}_rut`] = 'RUT del denunciado inválido';
          }
        });

        // Validar testigos: todos deben tener contacto válido
        if (form.testigos.length > 0) {
          let tieneTestigoSinContacto = false;
          form.testigos.forEach((test, index) => {
            // Validar nombre si se ingresó
            if (test.nombreCompleto && test.nombreCompleto.trim()) {
              const nombreRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;
              if (!nombreRegex.test(test.nombreCompleto.trim())) {
                newErrors[`testigo_${index}_nombre`] = 'El nombre solo puede contener letras';
              }
            }
            // Validar RUT si se ingresó
            if (test.rut && test.rut.trim() && !validarRut(test.rut)) {
              newErrors[`testigo_${index}_rut`] = 'RUT del testigo inválido';
            }
            // Contacto es obligatorio para todos los testigos
            if (!test.contacto || !test.contacto.trim()) {
              tieneTestigoSinContacto = true;
            } else {
              // Si tiene contacto, validarlo
              const esEmail = test.contacto.includes('@');
              if (esEmail && !validarEmail(test.contacto)) {
                newErrors[`testigo_${index}_contacto`] = 'Correo electrónico del testigo inválido';
              } else if (!esEmail && !validarTelefono(test.contacto)) {
                newErrors[`testigo_${index}_contacto`] = 'Teléfono del testigo inválido';
              }
            }
          });
          // Asignar error general si hay testigos sin contacto
          if (tieneTestigoSinContacto) {
            newErrors.testigos =
              'Debes ingresar un medio de contacto para cada testigo o eliminarlo de la lista.';
          }
        }
        break;

      case 3: // Paso 3: Revisión (no requiere validación adicional)
        break;

      default:
        break;
    }

    // Si hay errores, actualizar el estado y retornar false
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }

    // Si no hay errores, limpiar errores y retornar true
    setErrors({});
    return true;
  }

  function puedeAvanzar() {
    if (step === 1) return true; // Todos los campos del denunciante son opcionales ahora
    if (step === 2) {
      // Si es denuncia de campo clínico, validar campos específicos
      if (form.tipoId === 3) {
        return (
          !!form.relato.trim() &&
          !!form.nombreEstablecimiento.trim() &&
          !!form.regionEstablecimiento.trim() &&
          !!form.comunaEstablecimiento.trim() &&
          !!form.direccionEstablecimiento.trim() &&
          !!form.unidadServicio.trim()
        );
      }
      // Para denuncias normales, validar campos estándar
      return !!form.relato.trim() && !!form.sedeHecho;
    }
    return true;
  }

  function handleNext() {
    // Validar paso actual antes de avanzar usando validarPasoActual
    const isValid = validarPasoActual();

    if (!isValid) {
      setIntentoAvanzar(true);
      // Scroll al primer error después de que se actualicen los errores
      setTimeout(() => {
        setErrors(currentErrors => {
          const firstErrorField = Object.keys(currentErrors)[0];
          if (firstErrorField) {
            setTimeout(() => {
              const element = document.querySelector(`[data-field="${firstErrorField}"]`);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                if (
                  element instanceof HTMLElement &&
                  (element.tagName === 'INPUT' ||
                    element.tagName === 'SELECT' ||
                    element.tagName === 'TEXTAREA')
                ) {
                  element.focus();
                }
              }
            }, 50);
          }
          return currentErrors;
        });
      }, 50);
      return;
    }

    // Si la validación pasa, avanzar de fase
    setIntentoAvanzar(false);
    setErrors({});
    if (step < steps.length) {
      setStep(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  }

  function handlePrev() {
    if (step > 1) {
      // Limpiar errores y estado de intento al retroceder
      setErrors({});
      setIntentoAvanzar(false);
      setStep(prev => prev - 1);
    }
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
      newErrors.relato = 'El relato de los hechos es obligatorio';
    }
    if (!form.subtipoId) {
      newErrors.tipoDenuncia = 'Debe seleccionar un tipo de denuncia';
    }

    // Validaciones del denunciante (SOLO si el usuario ha ingresado algo)
    // Si hay algún campo lleno, validamos todos los que estén llenos
    const tieneDatosDenunciante =
      form.rut.trim() || form.nombre.trim() || form.correo.trim() || form.telefono.trim();

    if (tieneDatosDenunciante) {
      // Si ingresó RUT, validarlo
      if (form.rut.trim() && !validarRut(form.rut)) {
        newErrors.rut = 'RUT inválido';
      }
      // Si ingresó correo, validarlo
      if (form.correo.trim() && !validarEmail(form.correo)) {
        newErrors.correo = 'Correo electrónico inválido';
      }
      // Si ingresó teléfono, validarlo
      if (form.telefono.trim() && !validarTelefono(form.telefono)) {
        newErrors.telefono = 'Teléfono inválido (debe tener 8-9 dígitos)';
      }
    }

    // Validaciones de víctima (denunciado) - SIEMPRE OBLIGATORIA
    if (form.esVictima === 'no') {
      // Si NO es el denunciante, la víctima externa es obligatoria
      // RUT de víctima es obligatorio si no es el denunciante
      if (!form.victimaRut.trim()) {
        newErrors.victimaRut = 'El RUT de la víctima es obligatorio';
      } else if (!validarRut(form.victimaRut)) {
        newErrors.victimaRut = 'RUT de víctima inválido';
      }
      // Si ingresó correo de víctima, validarlo
      if (form.victimaCorreo.trim() && !validarEmail(form.victimaCorreo)) {
        newErrors.victimaCorreo = 'Correo electrónico de víctima inválido';
      }
      // Si ingresó teléfono de víctima, validarlo
      if (form.victimaTelefono.trim() && !validarTelefono(form.victimaTelefono)) {
        newErrors.victimaTelefono = 'Teléfono de víctima inválido (debe tener 8-9 dígitos)';
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
        newErrors[`involucrado_${index}_rut`] = 'RUT del denunciado inválido';
      }
    });

    // Validar RUTs de testigos (si tienen RUT)
    form.testigos.forEach((test, index) => {
      if (test.rut && test.rut.trim() && !validarRut(test.rut)) {
        newErrors[`testigo_${index}_rut`] = 'RUT del testigo inválido';
      }
      // Validar contacto de testigo (puede ser email o teléfono)
      if (test.contacto && test.contacto.trim()) {
        const esEmail = test.contacto.includes('@');
        if (esEmail && !validarEmail(test.contacto)) {
          newErrors[`testigo_${index}_contacto`] = 'Correo electrónico del testigo inválido';
        } else if (!esEmail && !validarTelefono(test.contacto)) {
          newErrors[`testigo_${index}_contacto`] = 'Teléfono del testigo inválido';
        }
      }
    });

    // Validaciones específicas de campo clínico
    if (esCampoClinico) {
      if (!form.nombreEstablecimiento.trim()) {
        newErrors.nombreEstablecimiento = 'El nombre del establecimiento es obligatorio';
      }
      if (!form.regionEstablecimiento.trim()) {
        newErrors.regionEstablecimiento = 'La región del establecimiento es obligatoria';
      }
      if (!form.comunaEstablecimiento.trim()) {
        newErrors.comunaEstablecimiento = 'La comuna del establecimiento es obligatoria';
      }
      if (!form.direccionEstablecimiento.trim()) {
        newErrors.direccionEstablecimiento = 'La dirección del establecimiento es obligatoria';
      }
      if (!form.unidadServicio.trim()) {
        newErrors.unidadServicio = 'La unidad de servicio es obligatoria';
      }
      // Los involucrados (Denunciado/s) son OPCIONALES, incluso para campo clínico
      // Solo validamos RUT si se ingresa, pero no es obligatorio agregar denunciados
    } else {
      // Para denuncias normales, validar sede
      if (!form.sedeHecho) {
        newErrors.sedeHecho = 'La sede del hecho es obligatoria';
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
          relato: 'Relato de los hechos',
          tipoDenuncia: 'Tipo de denuncia',
          rut: 'RUT del denunciante',
          correo: 'Correo del denunciante',
          telefono: 'Teléfono del denunciante',
          victimaRut: 'RUT de la víctima',
          victimaCorreo: 'Correo de la víctima',
          victimaTelefono: 'Teléfono de la víctima',
          nombreEstablecimiento: 'Nombre del establecimiento',
          unidadServicio: 'Unidad de servicio',
          regionEstablecimiento: 'Región del establecimiento',
          comunaEstablecimiento: 'Comuna del establecimiento',
          direccionEstablecimiento: 'Dirección del establecimiento',
          sedeHecho: 'Sede del hecho',
        };
        return fieldNames[field] || field;
      });
      setError(
        `Se encontraron ${errorCount} error(es) en el formulario. Por favor revise los campos marcados en rojo: ${errorFields.join(', ')}.`
      );
      // Scroll al primer error
      const firstErrorField = Object.keys(validationErrors)[0];
      setTimeout(() => {
        const element = document.querySelector(`[data-field="${firstErrorField}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Intentar hacer focus si es un input o select
          if (
            element instanceof HTMLElement &&
            (element.tagName === 'INPUT' ||
              element.tagName === 'SELECT' ||
              element.tagName === 'TEXTAREA')
          ) {
            (element as HTMLElement).focus();
          }
        }
      }, 100);
      return;
    }

    // Determinar si es denuncia de campo clínico (tipo 3)
    const esCampoClinico = form.tipoId === 3;

    // Construir ubicación según el tipo de denuncia
    let ubicacionCompleta = '';
    if (esCampoClinico) {
      // Para campo clínico: Establecimiento, Región, Comuna, Dirección, Unidad
      ubicacionCompleta = [
        form.nombreEstablecimiento,
        form.regionEstablecimiento,
        form.comunaEstablecimiento,
        form.direccionEstablecimiento,
        form.unidadServicio,
        form.detalleHecho,
      ]
        .filter(Boolean)
        .join(' - ');
    } else {
      // Para denuncias normales: Sede, Lugar, Detalles
      const sedeNombre = SEDES.find(s => s.id === form.sedeHecho)?.nombre || form.sedeHecho;
      ubicacionCompleta = [sedeNombre, form.lugarHecho, form.detalleHecho]
        .filter(Boolean)
        .join(' - ');
    }

    const relatoFinal = form.relato.trim();

    const notasAdicionales = [
      `Tipo General: ${tipoSeleccionado?.nombre}`,
      form.reservaIdentidad ? 'Solicita Reserva de Identidad' : null,
      form.esVictima === 'si' ? 'Denunciante es la víctima' : 'Denunciante es testigo/tercero',
      form.victimaMenor === 'si' ? 'Víctima es menor de edad' : null,
      form.esVictima === 'no' ? `Víctima: ${form.victimaNombre} (RUT: ${form.victimaRut})` : null,
    ]
      .filter(Boolean)
      .join(' | ');

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
      Fecha_Fin:
        form.tipoFecha === 'rango' && form.fechaHechoFin
          ? form.fechaHechoFin // Ya viene en formato YYYY-MM-DD del input type="date"
          : null, // Solo enviar Fecha_Fin si es un rango
      Relato_Hechos: relatoFinal, // Ya no concatenamos las fechas en el relato
      Ubicacion: ubicacionCompleta,

      // Mapear involucrados (denunciados) con la nueva estructura
      // Todos los campos son opcionales - el denunciante puede no conocer toda la información
      denunciados: form.involucrados.map(i => ({
        nombre: i.nombre?.trim() || 'Sin nombre',
        rut: i.rut?.trim() || undefined,
        // Concatenar descripción del denunciado y unidad/carrera si existe
        descripcion:
          [
            i.descripcionDenunciado?.trim() || null,
            i.unidadCarrera?.trim() ? `Unidad/Carrera: ${i.unidadCarrera.trim()}` : null,
            i.vinculacion?.trim() ? `Vinculación: ${i.vinculacion.trim()}` : null,
          ]
            .filter(Boolean)
            .join('. ') || 'Sin información adicional',
      })),

      testigos: form.testigos.map(t => ({
        nombre: t.nombreCompleto,
        rut: t.rut || undefined,
        contacto: t.contacto || undefined,
      })),
      // Si la víctima es externa (no es el denunciante), agregarla como participante
      // IMPORTANTE: Solo enviar si tiene RUT (es obligatorio para guardar como participante)
      victima:
        form.esVictima === 'no' && form.victimaRut && form.victimaRut.trim()
          ? {
              nombre: form.victimaNombre || '',
              rut: form.victimaRut.trim(),
              correo: form.victimaCorreo || undefined,
              telefono: form.victimaTelefono || undefined,
              genero: form.victimaGenero || undefined,
              sexo: form.victimaSexo || undefined,
            }
          : undefined,
      // Los archivos se enviarán por separado usando FormData
      evidencias: [],
      caracteristicasDenunciado: notasAdicionales,

      // Datos específicos para denuncias de campo clínico
      detalleCampoClinico: esCampoClinico
        ? {
            nombreEstablecimiento: form.nombreEstablecimiento.trim(),
            unidadServicio: form.unidadServicio.trim(),
            // Priorizar la vinculación del primer involucrado, o del nuevo involucrado si está siendo agregado
            tipoVinculacionDenunciado:
              form.involucrados.length > 0 && form.involucrados[0].vinculacion
                ? form.involucrados[0].vinculacion.trim()
                : form.nuevoInvolucrado.vinculacion && form.nuevoInvolucrado.vinculacion.trim()
                  ? form.nuevoInvolucrado.vinculacion.trim()
                  : '',
            region: form.regionEstablecimiento.trim(),
            comuna: form.comunaEstablecimiento.trim(),
            direccionEstablecimiento: form.direccionEstablecimiento.trim(),
          }
        : null,
    };

    try {
      setEnviando(true);
      // Extraer archivos de archivosEvidencia y enviarlos junto con el payload
      const archivosParaEnviar = archivosEvidencia.map(fm => fm.file);
      await crearDenuncia(payload, archivosParaEnviar.length > 0 ? archivosParaEnviar : undefined);
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
            rut: 'rut',
            nombre: 'nombre',
            correo: 'correo',
            telefono: 'telefono',
            genero: 'genero',
            sexo: 'sexo',
            victimarut: 'victimaRut',
            victima_rut: 'victimaRut',
            victimacorreo: 'victimaCorreo',
            victima_correo: 'victimaCorreo',
            victimatelefono: 'victimaTelefono',
            victima_telefono: 'victimaTelefono',
            relato: 'relato',
            relato_hechos: 'relato',
            sede: 'sedeHecho',
            sede_hecho: 'sedeHecho',
            tipo: 'tipoDenuncia',
            tipodenuncia: 'tipoDenuncia',
            id_tipode: 'tipoDenuncia',
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
            if (
              element instanceof HTMLElement &&
              (element.tagName === 'INPUT' ||
                element.tagName === 'SELECT' ||
                element.tagName === 'TEXTAREA')
            ) {
              (element as HTMLElement).focus();
            }
          }
        }, 100);
      }

      // Establecer mensaje de error general
      const errorMessage = err?.message ?? 'Error al crear la denuncia';
      setError(errorMessage);

      // Si no hay mensaje específico pero hay detalles, crear mensaje más descriptivo
      if (
        !err?.message &&
        err?.detalles &&
        Array.isArray(err.detalles) &&
        err.detalles.length > 0
      ) {
        setError(
          `Se encontraron ${err.detalles.length} error(es) en el formulario. Por favor revise los campos marcados.`
        );
      }
    } finally {
      setEnviando(false);
    }
  }

  // --- RENDERS ---
  if (fase === 'seleccion_tipo') {
    return (
      <section className="mx-auto max-w-7xl py-12">
        <header className="mb-10 text-center px-4">
          <h1 className="font-condensed text-3xl font-bold tracking-tight text-gray-900">
            ¿Qué tipo de denuncia deseas realizar?
          </h1>
          <p className="mt-3 text-gray-600 max-w-2xl mx-auto">
            Selecciona la categoría general. Esto nos ayudará a derivar tu caso a la unidad
            correspondiente.
          </p>
        </header>
        <div className="grid gap-8 grid-cols-1 md:grid-cols-3 px-4">
          {TIPOS_DENUNCIA.map(tipo => (
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
            onClick={() => nav(-1)}
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
        <Paso1Identificacion
          formulario={form}
          handleChange={updateField}
          errors={errors}
          intentoAvanzar={intentoAvanzar}
          setErrors={setErrors}
          tipoSeleccionado={tipoSeleccionado}
          handleBackToSubtipo={handleBackToSubtipo}
          allRegions={allRegions}
          communesDenunciante={communesDenunciante}
        />
      )}

      {/* PASO 2: HECHOS Y PARTICIPANTES */}
      {step === 2 && (
        <Paso2Hechos
          formulario={form}
          handleChange={updateField}
          errors={errors}
          intentoAvanzar={intentoAvanzar}
          setErrors={setErrors}
          handleEsVictimaChange={handleEsVictimaChange}
          involucrados={form.involucrados}
          handleAddInvolucrado={handleAddInvolucrado}
          handleRemoveInvolucrado={handleRemoveInvolucrado}
          mostrarCamposAdicionalesDenunciado={mostrarCamposAdicionalesDenunciado}
          setMostrarCamposAdicionalesDenunciado={setMostrarCamposAdicionalesDenunciado}
          testigos={form.testigos}
          nuevoTestigo={nuevoTestigo}
          setNuevoTestigo={setNuevoTestigo}
          mostrarFormTestigo={mostrarFormTestigo}
          setMostrarFormTestigo={setMostrarFormTestigo}
          handleAgregarTestigo={handleAgregarTestigo}
          handleEliminarTestigo={handleEliminarTestigo}
          archivosEvidencia={archivosEvidencia}
          setArchivosEvidencia={setArchivosEvidencia}
          enviando={enviando}
          allRegions={allRegions}
          lugaresDisponibles={lugaresDisponibles}
          setForm={setForm}
          errorDenunciado={errorDenunciado}
          errorTestigo={errorTestigo}
          setErrorDenunciado={setErrorDenunciado}
          setErrorTestigo={setErrorTestigo}
        />
      )}

      {/* PASO 3: REVISIÓN */}
      {step === 3 && (
        <Paso3Confirmacion
          formulario={form}
          tipoSeleccionado={tipoSeleccionado}
          archivosEvidencia={archivosEvidencia}
        />
      )}
    </FormularioLayout>
  );
}
