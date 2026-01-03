import InfoTooltip from '@/components/ui/InfoTooltip';
import { formatearRut } from '@/utils/validation.utils';
import type { Paso1Props } from '@/types/step-props';

export default function Paso1Identificacion({
  formulario,
  handleChange,
  errors,
  intentoAvanzar,
  setErrors,
  tipoSeleccionado,
  handleBackToSubtipo,
  allRegions,
  communesDenunciante,
}: Paso1Props) {
  return (
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

      {/* Mensaje de error general si falta información obligatoria */}
      {errors.infoDenunciante && intentoAvanzar && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
          ⚠️ {errors.infoDenunciante}
        </div>
      )}

      <section className="space-y-4">
        <h2 className="font-condensed text-lg font-semibold text-gray-900 border-b pb-2">
          Datos del denunciante{' '}
          <span className="text-sm font-normal text-gray-500">
            (Algunos campos son obligatorios)
          </span>
        </h2>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700">RUT</label>
              <input
                data-field="rut"
                className={`mt-1 w-full rounded-md border px-3 py-2 text-sm ${
                  errors.rut && intentoAvanzar ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="12.345.678-9"
                value={formulario.rut}
                onChange={e => {
                  const valor = e.target.value;
                  const formateado = formatearRut(valor);
                  handleChange('rut', formateado);
                  if (errors.rut) {
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.rut;
                      return newErrors;
                    });
                  }
                }}
              />
              {errors.rut && intentoAvanzar && (
                <p className="mt-1 text-xs text-red-500">{errors.rut}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center">
                Nombre completo
                <InfoTooltip text="Puedes ingresar tu nombre legal o tu Nombre Social. La Universidad respeta tu identidad de género y nos dirigiremos a ti estrictamente por el nombre que escribas aquí." />
              </label>
              <input
                data-field="nombre"
                className={`mt-1 w-full rounded-md border px-3 py-2 text-sm ${
                  errors.nombre && intentoAvanzar ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Tu nombre"
                value={formulario.nombre}
                onChange={e => {
                  handleChange('nombre', e.target.value);
                  if (errors.nombre) {
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.nombre;
                      return newErrors;
                    });
                  }
                }}
              />
              {errors.nombre && intentoAvanzar && (
                <p className="mt-1 text-xs text-red-500">{errors.nombre}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 mt-4">
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center">
                Sexo
                <InfoTooltip text="Corresponde al sexo registral que aparece en tu cédula de identidad. Se solicita únicamente para fines estadísticos obligatorios." />
              </label>
              <select
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-600 focus:ring-2 focus:ring-blue-100 outline-none bg-white"
                value={formulario.sexo || ''}
                onChange={e => handleChange('sexo', e.target.value)}
              >
                <option value="">Seleccionar</option>
                <option value="Femenino">Femenino</option>
                <option value="Masculino">Masculino</option>
                <option value="Desconocido">Desconocido</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center">
                Identidad de Género (Opcional)
                <InfoTooltip text="Selecciona la identidad con la que te auto-percibes. Esto nos ayuda a garantizar un trato digno y el uso correcto de pronombres." />
              </label>
              <select
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-600 focus:ring-2 focus:ring-blue-100 outline-none bg-white"
                value={formulario.genero || ''}
                onChange={e => handleChange('genero', e.target.value)}
              >
                <option value="">Seleccionar</option>
                <option value="Femenino (Mujer Cis / Mujer Trans)">
                  Femenino (Mujer Cis / Mujer Trans)
                </option>
                <option value="Masculino (Hombre Cis / Hombre Trans)">
                  Masculino (Hombre Cis / Hombre Trans)
                </option>
                <option value="NoBinario">No Binario</option>
                <option value="Fluido">Fluido</option>
                <option value="Otro">Otro</option>
                <option value="NoLoSe">No lo sé</option>
              </select>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Esta información ayuda a activar los protocolos de protección adecuados.
          </p>

          <div className="mt-4">
            <label className="text-sm font-medium text-gray-700">
              Carrera o Cargo <span className="text-red-500">*</span>
            </label>
            <input
              data-field="carreraCargo"
              className={`mt-1 w-full rounded-md border px-3 py-2 text-sm ${
                errors.carreraCargo && intentoAvanzar ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ej: Enfermería, Medicina, Funcionario Administrativo..."
              value={formulario.carreraCargo}
              onChange={e => {
                handleChange('carreraCargo', e.target.value);
                if (errors.carreraCargo) {
                  setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.carreraCargo;
                    delete newErrors.infoDenunciante;
                    return newErrors;
                  });
                }
              }}
            />
            {errors.carreraCargo && intentoAvanzar && (
              <p className="mt-1 text-xs text-red-500">{errors.carreraCargo}</p>
            )}
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
              <label className="text-sm font-medium text-gray-700">Teléfono</label>
              <input
                data-field="telefono"
                className={`mt-1 w-full rounded-md border px-3 py-2 text-sm ${
                  errors.telefono && intentoAvanzar ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="+56 9 ..."
                value={formulario.telefono}
                onChange={e => {
                  handleChange('telefono', e.target.value);
                  if (errors.telefono) {
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.telefono;
                      return newErrors;
                    });
                  }
                }}
              />
              {errors.telefono && intentoAvanzar && (
                <p className="mt-1 text-xs text-red-500">{errors.telefono}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Correo</label>
              <input
                data-field="correo"
                type="email"
                className={`mt-1 w-full rounded-md border px-3 py-2 text-sm ${
                  errors.correo && intentoAvanzar ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="correo@ubb.cl"
                value={formulario.correo}
                onChange={e => {
                  handleChange('correo', e.target.value);
                  if (errors.correo) {
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.correo;
                      return newErrors;
                    });
                  }
                }}
              />
              {errors.correo && intentoAvanzar && (
                <p className="mt-1 text-xs text-red-500">{errors.correo}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-condensed text-lg font-semibold text-gray-900 border-b pb-2">
          Dirección del denunciante{' '}
          <span className="text-sm font-normal text-red-500"></span>
        </h2>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Región <span className="text-red-500">*</span>
              </label>
              <select
                data-field="regionDenunciante"
                className={`mt-1 w-full rounded-md border px-3 py-2 text-sm ${
                  errors.regionDenunciante && intentoAvanzar ? 'border-red-500' : 'border-gray-300'
                }`}
                value={formulario.regionDenunciante}
                onChange={e => {
                  handleChange('regionDenunciante', e.target.value);
                  handleChange('comunaDenunciante', '');
                  if (errors.regionDenunciante) {
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.regionDenunciante;
                      delete newErrors.infoDenunciante;
                      return newErrors;
                    });
                  }
                }}
              >
                <option value="">Seleccionar</option>
                {allRegions.map(r => (
                  <option key={r.id} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </select>
              {errors.regionDenunciante && intentoAvanzar && (
                <p className="mt-1 text-xs text-red-500">{errors.regionDenunciante}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Comuna <span className="text-red-500">*</span>
              </label>
              <select
                data-field="comunaDenunciante"
                className={`mt-1 w-full rounded-md border px-3 py-2 text-sm ${
                  errors.comunaDenunciante && intentoAvanzar ? 'border-red-500' : 'border-gray-300'
                }`}
                value={formulario.comunaDenunciante}
                onChange={e => {
                  handleChange('comunaDenunciante', e.target.value);
                  if (errors.comunaDenunciante) {
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.comunaDenunciante;
                      delete newErrors.infoDenunciante;
                      return newErrors;
                    });
                  }
                }}
                disabled={!formulario.regionDenunciante}
              >
                <option value="">Seleccionar</option>
                {communesDenunciante.map(c => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.comunaDenunciante && intentoAvanzar && (
                <p className="mt-1 text-xs text-red-500">{errors.comunaDenunciante}</p>
              )}
            </div>
          </div>
          <div className="mt-4">
            <label className="text-sm font-medium text-gray-700">
              Dirección domicilio <span className="text-red-500">*</span>
            </label>
            <input
              data-field="direccionDenunciante"
              className={`mt-1 w-full rounded-md border px-3 py-2 text-sm ${
                errors.direccionDenunciante && intentoAvanzar ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Calle / número"
              value={formulario.direccionDenunciante}
              onChange={e => {
                handleChange('direccionDenunciante', e.target.value);
                if (errors.direccionDenunciante) {
                  setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.direccionDenunciante;
                    delete newErrors.infoDenunciante;
                    return newErrors;
                  });
                }
              }}
            />
            {errors.direccionDenunciante && intentoAvanzar && (
              <p className="mt-1 text-xs text-red-500">{errors.direccionDenunciante}</p>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-condensed text-lg font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
          Reserva de identidad
          <InfoTooltip text="Tu identidad será conocida solo por el Fiscal a cargo para la investigación. No se revelará al denunciado en la etapa inicial." />
        </h2>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex flex-wrap gap-6 text-sm text-gray-700 mb-2">
            <div className="inline-flex items-center gap-3">
              <span className="font-medium">¿Reserva de identidad?</span>
              <label className="inline-flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="reserva"
                  checked={formulario.reservaIdentidad}
                  onChange={() => handleChange('reservaIdentidad', true)}
                />{' '}
                Sí
              </label>
              <label className="inline-flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="reserva"
                  checked={!formulario.reservaIdentidad}
                  onChange={() => handleChange('reservaIdentidad', false)}
                />{' '}
                No
              </label>
            </div>
          </div>
          {formulario.reservaIdentidad && (
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
                  <strong>Importante:</strong> La reserva de identidad no es absoluta, ya que el(la)
                  fiscal o instructor(a) de la investigación sumaria deberá conocer tu identidad
                  para llevar a cabo el proceso.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
