import { useState, useMemo, useEffect, type FormEvent } from 'react';
import { identificarDenunciado } from '@/services/digergen.apis';
import { clRegions } from '@clregions/data';
import { validarRut, formatearRut, validarEmail } from '@/utils/validation.utils';

interface IdentificarDenunciadoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  idDatosDenunciado: number;
  nombreActual: string;
  datosDenunciado?: any; // Datos del denunciado antes de identificar
}

export default function IdentificarDenunciadoModal({
  isOpen,
  onClose,
  onSuccess,
  idDatosDenunciado,
  nombreActual,
  datosDenunciado,
}: IdentificarDenunciadoModalProps) {
  const [form, setForm] = useState({
    Rut: '',
    Nombre: '',
    Correo: '',
    Telefono: '',
    sexo: '',
    region: '',
    comuna: '',
    direccion: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [processing, setProcessing] = useState(false);

  // --- Dynamic Regions and Communes ---
  const allRegions = useMemo(() => {
    // clRegions.regions is an object with ID as key
    return Object.values(clRegions.regions).sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const communes = useMemo(() => {
    if (!form.region) return [];
    // Find region by name
    const region = allRegions.find(r => r.name === form.region);
    if (!region) return [];

    // Extract all communes from all provinces in that region
    const allCommunes: any[] = [];
    Object.values(region.provinces).forEach((province: any) => {
      Object.values(province.communes).forEach((commune: any) => {
        allCommunes.push(commune);
      });
    });

    return allCommunes.sort((a, b) => a.name.localeCompare(b.name));
  }, [form.region, allRegions]);

  // Autocompletar datos del denunciado cuando el modal se abre
  useEffect(() => {
    if (isOpen && datosDenunciado) {
      setForm(prev => {
        // Si el denunciado ya está identificado, usar datos de persona
        const datosPersona = datosDenunciado.persona || {};
        // Si no está identificado, usar los datos ingresados inicialmente
        const nombreIngresado =
          datosDenunciado.Nombre_Ingresado ||
          datosDenunciado.Nombre ||
          datosDenunciado.nombre ||
          '';

        return {
          ...prev,
          // Priorizar datos de persona si está identificado, sino usar datos ingresados
          Rut: datosPersona.Rut
            ? formatearRut(datosPersona.Rut)
            : datosDenunciado.Rut
              ? formatearRut(datosDenunciado.Rut)
              : prev.Rut,
          Nombre: datosPersona.Nombre || nombreIngresado || prev.Nombre,
          Correo:
            datosPersona.Correo || datosDenunciado.Correo || datosDenunciado.correo || prev.Correo,
          Telefono:
            datosPersona.Telefono ||
            datosDenunciado.Telefono ||
            datosDenunciado.telefono ||
            prev.Telefono,
          sexo: datosPersona.sexo || datosDenunciado.sexo || prev.sexo,
          genero: datosPersona.genero || datosDenunciado.genero || prev.sexo,
          region: datosPersona.region || datosDenunciado.region || prev.region,
          comuna: datosPersona.comuna || datosDenunciado.comuna || prev.comuna,
          direccion:
            datosPersona.direccion ||
            datosDenunciado.direccion ||
            datosDenunciado.Direccion ||
            prev.direccion,
        };
      });
    }
  }, [isOpen, datosDenunciado]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitted(true);

    // Validación completa antes de enviar
    const newErrors: Record<string, string> = {};

    // VALIDACIÓN DE RUT (obligatorio y válido)
    if (!form.Rut.trim()) {
      newErrors.Rut = 'El RUT es obligatorio';
    } else if (!validarRut(form.Rut)) {
      newErrors.Rut = 'El RUT es inválido';
    }

    // VALIDACIÓN DE NOMBRE (obligatorio y solo letras)
    if (!form.Nombre.trim()) {
      newErrors.Nombre = 'El nombre es obligatorio';
    } else {
      const nombreRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;
      if (!nombreRegex.test(form.Nombre.trim())) {
        newErrors.Nombre = 'El nombre solo puede contener letras';
      }
    }

    // VALIDACIÓN DE CORREO (si se ingresa, debe ser válido)
    if (form.Correo.trim() && !validarEmail(form.Correo.trim())) {
      newErrors.Correo = 'El correo electrónico es inválido';
    }

    // Si hay errores, detener el envío
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Si pasa todas las validaciones, limpiar errores y enviar
    setErrors({});

    try {
      setProcessing(true);
      await identificarDenunciado(idDatosDenunciado, {
        Rut: form.Rut.trim(),
        Nombre: form.Nombre.trim() || undefined,
        Correo: form.Correo.trim() || undefined,
        Telefono: form.Telefono.trim() || undefined,
        sexo: form.sexo || undefined,
        region: form.region || undefined,
        comuna: form.comuna || undefined,
        direccion: form.direccion || undefined,
      });
      // Reset form y estados
      setForm({
        Rut: '',
        Nombre: '',
        Correo: '',
        Telefono: '',
        sexo: '',
        region: '',
        comuna: '',
        direccion: '',
      });
      setErrors({});
      setSubmitted(false);
      // Cerrar modal y ejecutar onSuccess DESPUÉS de resetear el form
      onClose();
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error al identificar al denunciado');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto border-2 border-gray-200">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Identificar Denunciado</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={processing}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Denunciado actual:</span> {nombreActual}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Ingresa los datos reales de la persona para identificarla correctamente.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                RUT <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                className={`w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none ${
                  errors.Rut && submitted ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="12.345.678-9"
                value={form.Rut}
                onChange={e => {
                  const valor = e.target.value;
                  const formateado = formatearRut(valor);
                  setForm({ ...form, Rut: formateado });
                  // Limpiar error al escribir
                  if (errors.Rut) {
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.Rut;
                      return newErrors;
                    });
                  }
                }}
                disabled={processing}
              />
              {errors.Rut && submitted && <p className="mt-1 text-xs text-red-500">{errors.Rut}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={`w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none ${
                  errors.Nombre && submitted ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Nombre completo"
                value={form.Nombre}
                onChange={e => {
                  const valor = e.target.value;
                  // Validar que solo contenga letras, espacios, guiones y apostrofes
                  const nombreRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]*$/;
                  if (nombreRegex.test(valor) || valor === '') {
                    setForm({ ...form, Nombre: valor });
                    // Limpiar error al escribir
                    if (errors.Nombre) {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.Nombre;
                        return newErrors;
                      });
                    }
                  }
                }}
                disabled={processing}
              />
              {errors.Nombre && submitted && (
                <p className="mt-1 text-xs text-red-500">{errors.Nombre}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo</label>
              <input
                type="email"
                className={`w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none ${
                  errors.Correo && submitted ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="correo@example.com"
                value={form.Correo}
                onChange={e => {
                  setForm({ ...form, Correo: e.target.value });
                  // Limpiar error al escribir
                  if (errors.Correo) {
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.Correo;
                      return newErrors;
                    });
                  }
                }}
                disabled={processing}
              />
              {errors.Correo && submitted && (
                <p className="mt-1 text-xs text-red-500">{errors.Correo}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input
                type="text"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                placeholder="+56912345678"
                value={form.Telefono}
                onChange={e => {
                  const valor = e.target.value;
                  // Solo permitir números, espacios, + y guiones
                  const soloNumeros = valor.replace(/[^\d+\-\s]/g, '');
                  setForm({ ...form, Telefono: soloNumeros });
                }}
                disabled={processing}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                value={form.sexo}
                onChange={e => setForm({ ...form, sexo: e.target.value })}
                disabled={processing}
              >
                <option value="">Seleccionar</option>
                <option value="Femenino">Femenino</option>
                <option value="Masculino">Masculino</option>
                <option value="Desconocido">Desconocido</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Región</label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                value={form.region}
                onChange={e => {
                  setForm({ ...form, region: e.target.value, comuna: '' }); // Clear commune when region changes
                }}
                disabled={processing}
              >
                <option value="">Seleccionar</option>
                {allRegions.map(r => (
                  <option key={r.id} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Comuna</label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                value={form.comuna}
                onChange={e => setForm({ ...form, comuna: e.target.value })}
                disabled={!form.region || processing}
              >
                <option value="">Seleccionar</option>
                {communes.map(c => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
              <input
                type="text"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                placeholder="Dirección completa"
                value={form.direccion}
                onChange={e => setForm({ ...form, direccion: e.target.value })}
                disabled={processing}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              disabled={processing}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={processing}
            >
              {processing ? 'Identificando...' : 'Identificar Denunciado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
