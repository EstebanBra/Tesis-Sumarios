import InfoTooltip from "@/components/ui/InfoTooltip";
import FileUploader from "@/components/FileUploader";
import { formatearRut } from "@/utils/validation.utils";
import { SEDES, LUGARES_SEDE, VINCULACIONES, VINCULACIONES_CAMPO_CLINICO } from "@/data/denuncias.data";
import type { Paso2Props } from "@/types/step-props";

export default function Paso2Hechos({
  formulario,
  handleChange,
  errors,
  intentoAvanzar,
  setErrors,
  handleEsVictimaChange,
  involucrados,
  handleAddInvolucrado,
  handleRemoveInvolucrado,
  mostrarCamposAdicionalesDenunciado,
  setMostrarCamposAdicionalesDenunciado,
  testigos,
  nuevoTestigo,
  setNuevoTestigo,
  mostrarFormTestigo,
  setMostrarFormTestigo,
  handleAgregarTestigo,
  handleEliminarTestigo,
  archivosEvidencia,
  setArchivosEvidencia,
  enviando,
  allRegions,
  lugaresDisponibles,
  setForm,
  errorDenunciado,
  errorTestigo,
  setErrorDenunciado,
  setErrorTestigo,
}: Paso2Props) {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="font-condensed text-lg font-semibold text-gray-900 border-b pb-2">
          Víctima de los hechos
        </h2>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="grid gap-6 md:grid-cols-2 mb-4">
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                ¿Víctima menor de edad?
                <InfoTooltip text="Si la víctima es menor de 18 años, la Universidad tiene la obligación de priorizar medidas de resguardo urgentes." />
              </div>
              <div className="flex gap-4">
                <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="menor"
                    checked={formulario.victimaMenor === "si"}
                    onChange={() => handleChange("victimaMenor", "si")}
                  />{" "}
                  Sí
                </label>
                <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="menor"
                    checked={formulario.victimaMenor === "no"}
                    onChange={() => handleChange("victimaMenor", "no")}
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
                    checked={formulario.esVictima === "si"}
                    onChange={() => handleEsVictimaChange("si")}
                  />{" "}
                  Sí
                </label>
                <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="esVictima"
                    checked={formulario.esVictima === "no"}
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
                RUT {formulario.esVictima === "no" && "*"}
              </label>
              <input
                data-field="victimaRut"
                className={`mt-1 w-full rounded-md border px-3 py-2 text-sm bg-gray-100 text-gray-60 ${
                  errors.victimaRut && intentoAvanzar ? 'border-red-500' : 'border-gray-300'
                }`}
                value={formulario.victimaRut}
                onChange={(e) => {
                  const valor = e.target.value;
                  const formateado = formatearRut(valor);
                  handleChange("victimaRut", formateado);
                  if (errors.victimaRut) {
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.victimaRut;
                      return newErrors;
                    });
                  }
                }}
                disabled={formulario.esVictima === "si"}
              />
              {errors.victimaRut && intentoAvanzar && formulario.esVictima === "no" && (
                <p className="mt-1 text-xs text-red-500">{errors.victimaRut}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                Nombre Completo
                <InfoTooltip text="Indica el nombre de la víctima. Si ella utiliza un Nombre Social distinto a su nombre legal, escríbelo aquí. La Universidad prioriza el reconocimiento de la identidad de género para garantizar un trato digno." />
              </label>
              <input
                data-field="victimaNombre"
                className={`mt-1 w-full rounded-md border px-3 py-2 text-sm bg-gray-100 text-gray-60 ${
                  errors.victimaNombre && intentoAvanzar ? 'border-red-500' : 'border-gray-300'
                }`}
                value={formulario.victimaNombre}
                onChange={(e) => {
                  handleChange("victimaNombre", e.target.value);
                  if (errors.victimaNombre) {
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.victimaNombre;
                      return newErrors;
                    });
                  }
                }}
                disabled={formulario.esVictima === "si"}
              />
              {errors.victimaNombre && intentoAvanzar && (
                <p className="mt-1 text-xs text-red-500">{errors.victimaNombre}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center">
                Correo
                <InfoTooltip text="Datos exclusivos para que DIRGEGEN contacte a la víctima confidencialmente y le ofrezca apoyo." />
              </label>
              <input
                data-field="victimaCorreo"
                className={`mt-1 w-full rounded-md border px-3 py-2 text-sm bg-gray-100 text-gray-60 ${
                  errors.victimaCorreo && intentoAvanzar ? 'border-red-500' : 'border-gray-300'
                }`}
                value={formulario.victimaCorreo}
                onChange={(e) => {
                  handleChange("victimaCorreo", e.target.value);
                  if (errors.victimaCorreo) {
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.victimaCorreo;
                      return newErrors;
                    });
                  }
                }}
                disabled={formulario.esVictima === "si"}
              />
              {errors.victimaCorreo && intentoAvanzar && (
                <p className="mt-1 text-xs text-red-500">{errors.victimaCorreo}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center">
                Teléfono
                <InfoTooltip text="Datos exclusivos para que DIRGEGEN contacte a la víctima confidencialmente y le ofrezca apoyo." />
              </label>
              <input
                data-field="victimaTelefono"
                className={`mt-1 w-full rounded-md border px-3 py-2 text-sm bg-gray-100 text-gray-60 ${
                  errors.victimaTelefono && intentoAvanzar ? 'border-red-500' : 'border-gray-300'
                }`}
                value={formulario.victimaTelefono}
                onChange={(e) => {
                  handleChange("victimaTelefono", e.target.value);
                  if (errors.victimaTelefono) {
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.victimaTelefono;
                      return newErrors;
                    });
                  }
                }}
                disabled={formulario.esVictima === "si"}
              />
              {errors.victimaTelefono && intentoAvanzar && (
                <p className="mt-1 text-xs text-red-500">{errors.victimaTelefono}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center">
                Sexo *
                <InfoTooltip text="Si no estás seguro(a) de cómo se identifica la víctima, selecciona la opción más cercana. Estos datos podrán ser rectificados luego." />
              </label>
              <select
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-600 focus:ring-2 focus:ring-blue-100 outline-none bg-white"
                value={formulario.victimaSexo || ""}
                onChange={(e) => handleChange("victimaSexo", e.target.value)}
              >
                <option value="">Seleccionar</option>
                <option value="Femenino">Femenino</option>
                <option value="Masculino">Masculino</option>
                <option value="Desconocido">Desconocido</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center">
                Género (Opcional)
                <InfoTooltip text="Si no estás seguro(a) de cómo se identifica la víctima, selecciona la opción más cercana. Estos datos podrán ser rectificados luego." />
              </label>
              <select
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-600 focus:ring-2 focus:ring-blue-100 outline-none bg-white"
                value={formulario.victimaGenero || ""}
                onChange={(e) => handleChange("victimaGenero", e.target.value)}
              >
                <option value="">Seleccionar</option>
                <option value="Femenino (Mujer Cis / Mujer Trans)">Femenino (Mujer Cis / Mujer Trans)</option>
                <option value="Masculino (Hombre Cis / Hombre Trans)">Masculino (Hombre Cis / Hombre Trans)</option>
                <option value="NoBinario">No Binario</option>
                <option value="Fluido">Fluido</option>
                <option value="Otro">Otro</option>
                <option value="NoLoSe">No lo sé</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-condensed text-lg font-semibold text-gray-900 border-b pb-2">
          Denunciado/s <span className="text-sm font-normal text-gray-500">(Opcional)</span>
        </h2>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  Nombre Completo <span className="text-red-500">*</span>
                  <InfoTooltip text="Si no conoces el nombre legal, usa su nombre social o apodo." />
                </label>
                <input
                  type="text"
                  className={`mt-1 w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none ${
                    errors.nuevoInvolucrado_nombre ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Nombre completo del denunciado (opcional)"
                  value={formulario.nuevoInvolucrado.nombre}
                  onChange={(e) => {
                    setForm((p) => ({
                      ...p,
                      nuevoInvolucrado: {
                        ...p.nuevoInvolucrado,
                        nombre: e.target.value,
                      },
                    }));
                    // Limpiar error al escribir
                    if (errors.nuevoInvolucrado_nombre) {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.nuevoInvolucrado_nombre;
                        return newErrors;
                      });
                    }
                    // Limpiar el error temporal de denunciado
                    if (errorDenunciado) {
                      setErrorDenunciado("");
                    }
                  }}
                />
                {errors.nuevoInvolucrado_nombre && (
                  <p className="mt-1 text-xs text-red-500">{errors.nuevoInvolucrado_nombre}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Vinculación <span className="text-red-500">*</span>
                </label>
                <select
                  className={`mt-1 w-full rounded-md border px-3 py-2 text-sm text-gray-600 focus:ring-2 focus:ring-blue-100 outline-none bg-white ${
                    errors.nuevoInvolucrado_vinculacion ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={formulario.nuevoInvolucrado.vinculacion}
                  onChange={(e) => {
                    const valor = e.target.value;
                    setForm((p) => ({
                      ...p,
                      nuevoInvolucrado: {
                        ...p.nuevoInvolucrado,
                        vinculacion: valor,
                      },
                    }));
                    // Limpiar error al cambiar
                    if (errors.nuevoInvolucrado_vinculacion) {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.nuevoInvolucrado_vinculacion;
                        return newErrors;
                      });
                    }
                    // Limpiar el error temporal de denunciado
                    if (errorDenunciado) {
                      setErrorDenunciado("");
                    }
                    if (formulario.tipoId === 3 && valor === 'TUTOR_HOSPITAL') {
                      alert('Importante: Si el denunciado es Personal Colaboración Docente (Tutor Hospital), esta denuncia podría ser derivada a las autoridades correspondientes del establecimiento de salud.');
                    }
                  }}
                >
                  <option value="">Seleccionar Vinculación</option>
                  {(formulario.tipoId === 3 ? VINCULACIONES_CAMPO_CLINICO : VINCULACIONES).map((v) => (
                    <option key={v} value={v}>
                      {v === 'DOCENTE_IES' ? 'Docente Institución de Educación Superior' :
                       v === 'TUTOR_HOSPITAL' ? 'Personal colaborador docente (Tutor Hospital)' :
                       v}
                  </option>
                ))}
                </select>
                {errors.nuevoInvolucrado_vinculacion && (
                  <p className="mt-1 text-xs text-red-500">{errors.nuevoInvolucrado_vinculacion}</p>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center">
                Descripción del denunciado <span className="text-xs text-gray-500 font-normal">(Opcional)</span>
                <InfoTooltip text="Al no tener el nombre, detalla características físicas, tatuajes, ropa o acento. Es vital para la identificación." />
              </label>
              <textarea
                placeholder="Descripción física, ropa, edad, etc., cualquier información adicional (opcional)"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm h-24 resize-none focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-gray-400"
                value={formulario.nuevoInvolucrado.descripcionDenunciado}
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

            {mostrarCamposAdicionalesDenunciado && (
              <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      RUT <span className="text-xs text-gray-500 font-normal">(Opcional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="12.345.678-9 (opcional)"
                      className={`mt-1 w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all ${
                        errors.nuevoInvolucrado_rut ? 'border-red-500' : 'border-gray-300'
                      }`}
                      value={formulario.nuevoInvolucrado.rut || ""}
                      onChange={(e) => {
                        const valor = e.target.value;
                        const formateado = formatearRut(valor);
                        setForm((p) => ({
                          ...p,
                          nuevoInvolucrado: {
                            ...p.nuevoInvolucrado,
                            rut: formateado,
                          },
                        }));
                        // Limpiar error al escribir
                        if (errors.nuevoInvolucrado_rut) {
                          setErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.nuevoInvolucrado_rut;
                            return newErrors;
                          });
                        }
                        // Limpiar el error temporal de denunciado
                        if (errorDenunciado) {
                          setErrorDenunciado("");
                        }
                      }}
                    />
                    {errors.nuevoInvolucrado_rut && (
                      <p className="mt-1 text-xs text-red-500">{errors.nuevoInvolucrado_rut}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Unidad o Carrera <span className="text-xs text-gray-500 font-normal">(Opcional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Enfermería, Medicina, Unidad de Urgencias... (opcional)"
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      value={formulario.nuevoInvolucrado.unidadCarrera || ""}
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
            {errorDenunciado && (
              <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm flex items-center gap-2">
                ⚠️ {errorDenunciado}
              </div>
            )}
            <button
              type="button"
              onClick={handleAddInvolucrado}
              className="text-sm bg-ubb-blue text-white px-4 py-2 rounded font-medium hover:bg-blue-800 transition-colors flex items-center gap-1"
            >
              <span>+</span> Confirmar Denunciado
            </button>
          </div>

          {involucrados.length > 0 && (
            <div className="mt-3 space-y-2">
              {involucrados.map((inv, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-white border border-gray-200 rounded-md p-3"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {inv.nombre || "Sin nombre"}
                    </p>
                    <div className="flex gap-4 mt-1 text-xs text-gray-500">
                      {inv.rut && <span>RUT: {inv.rut}</span>}
                      {inv.vinculacion && <span>Vinculación: {inv.vinculacion}</span>}
                      {inv.unidadCarrera && <span>Unidad/Carrera: {inv.unidadCarrera}</span>}
                    </div>
                    {inv.descripcionDenunciado && (
                      <p className="text-xs text-gray-500 mt-1">
                        {inv.descripcionDenunciado}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveInvolucrado(i)}
                    className="text-red-600 hover:text-red-800 text-xs font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}
          {involucrados.length === 0 && (
            <p className="text-sm text-gray-500 italic mt-3">
              No se han agregado denunciados aún
            </p>
          )}
        </div>
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
                  checked={formulario.tipoFecha === "unica"}
                  onChange={() => handleChange("tipoFecha", "unica")}
                />{" "}
                Fecha única
              </label>
              <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="tipoFecha"
                  checked={formulario.tipoFecha === "rango"}
                  onChange={() => handleChange("tipoFecha", "rango")}
                />{" "}
                Rango de fechas
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">
                  {formulario.tipoFecha === "unica"
                    ? "Fecha de los hechos"
                    : "Fecha de inicio"}
                </label>
                <input
                  data-field="fechaHecho"
                  type="date"
                  className={`mt-1 w-full rounded-md border px-3 py-2 text-sm ${
                    errors.fechaHecho && intentoAvanzar ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={formulario.fechaHecho}
                  onChange={(e) => {
                    handleChange("fechaHecho", e.target.value);
                    if (errors.fechaHecho) {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.fechaHecho;
                        return newErrors;
                      });
                    }
                  }}
                />
                {errors.fechaHecho && intentoAvanzar && (
                  <p className="mt-1 text-xs text-red-500">{errors.fechaHecho}</p>
                )}
              </div>
              {formulario.tipoFecha === "rango" && (
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">
                    Fecha de término
                  </label>
                  <input
                    data-field="fechaHechoFin"
                    type="date"
                    className={`mt-1 w-full rounded-md border px-3 py-2 text-sm ${
                      errors.fechaHechoFin && intentoAvanzar ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={formulario.fechaHechoFin}
                    onChange={(e) => {
                      handleChange("fechaHechoFin", e.target.value);
                      if (errors.fechaHechoFin) {
                        setErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.fechaHechoFin;
                          return newErrors;
                        });
                      }
                    }}
                  />
                  {errors.fechaHechoFin && intentoAvanzar && (
                    <p className="mt-1 text-xs text-red-500">{errors.fechaHechoFin}</p>
                  )}
                </div>
              )}
            </div>
            <p className="text-[10px] text-gray-500 mt-1 italic">
              Si no recuerdas la fecha exacta, por favor indica un rango
              aproximado.
            </p>
          </div>

          {formulario.tipoId === 3 ? (
            <>
              <div className="border-t border-gray-200 pt-4 mt-4">
                <label className="text-sm font-medium text-gray-700">
                  Establecimiento de Salud * <span className="text-xs text-gray-500">(Hospital/CESFAM/Centro de Salud)</span>
                </label>
                <input
                  data-field="nombreEstablecimiento"
                  className={`mt-1 w-full rounded-md border px-3 py-2 text-sm ${
                    errors.nombreEstablecimiento && intentoAvanzar ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ej: Hospital Regional de Concepción, CESFAM Las Higueras..."
                  value={formulario.nombreEstablecimiento}
                  onChange={(e) => {
                    handleChange("nombreEstablecimiento", e.target.value);
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
                {errors.nombreEstablecimiento && intentoAvanzar && (
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
                      errors.regionEstablecimiento && intentoAvanzar ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={formulario.regionEstablecimiento}
                    onChange={(e) => {
                      handleChange("regionEstablecimiento", e.target.value);
                      handleChange("comunaEstablecimiento", "");
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
                  {errors.regionEstablecimiento && intentoAvanzar && (
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
                      errors.comunaEstablecimiento && intentoAvanzar ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={formulario.comunaEstablecimiento}
                    onChange={(e) => {
                      handleChange("comunaEstablecimiento", e.target.value);
                      if (errors.comunaEstablecimiento) {
                        setErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.comunaEstablecimiento;
                          return newErrors;
                        });
                      }
                    }}
                    disabled={!formulario.regionEstablecimiento}
                    required
                  >
                    <option value="">Seleccionar</option>
                    {(() => {
                      if (!formulario.regionEstablecimiento) return [];
                      const region = allRegions.find((r) => r.name === formulario.regionEstablecimiento);
                      if (!region) return [];
                      const allCommunes: any[] = [];
                      Object.values(region.provinces || {}).forEach((province: any) => {
                        Object.values(province.communes || {}).forEach((commune: any) => {
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
                  {errors.comunaEstablecimiento && intentoAvanzar && (
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
                    errors.direccionEstablecimiento && intentoAvanzar ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ej: Av. O'Higgins 1234, Concepción..."
                  value={formulario.direccionEstablecimiento}
                  onChange={(e) => {
                    handleChange("direccionEstablecimiento", e.target.value);
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
                {errors.direccionEstablecimiento && intentoAvanzar && (
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
                      errors.unidadServicio && intentoAvanzar ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Ej: Urgencias, Pediatría, Medicina Interna..."
                    value={formulario.unidadServicio}
                    onChange={(e) => {
                      handleChange("unidadServicio", e.target.value);
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
                  {errors.unidadServicio && intentoAvanzar && (
                    <p className="mt-1 text-xs text-red-500">{errors.unidadServicio}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Detalles adicionales
                  </label>
                  <input
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Ej: Sala 204, 2° piso, pasillo norte frente a la biblioteca..."
                    value={formulario.detalleHecho}
                    onChange={(e) => handleChange("detalleHecho", e.target.value)}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="border-t border-gray-200 pt-4 mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    Sede *
                    <InfoTooltip text="Si fue fuera del campus, selecciona la sede de tu carrera." />
                  </label>
                  <select
                    data-field="sedeHecho"
                    className={`mt-1 w-full rounded-md border px-3 py-2 text-sm ${
                      errors.sedeHecho && intentoAvanzar ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={formulario.sedeHecho}
                    onChange={(e) => {
                      const sede = SEDES.find((s) => s.id === e.target.value);
                      handleChange("sedeHecho", e.target.value);
                      handleChange("regionHecho", sede?.region || "");
                      handleChange("lugarHecho", "");
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
                  {errors.sedeHecho && intentoAvanzar && (
                    <p className="mt-1 text-xs text-red-500">{errors.sedeHecho}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Región
                  </label>
                  <div className="mt-1 w-full rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-600 font-medium h-[38px] flex items-center">
                    {formulario.regionHecho || "Selecciona una sede"}
                  </div>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2 pt-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Lugar Específico
                  </label>
                  <select
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    value={formulario.lugarHecho}
                    onChange={(e) => handleChange("lugarHecho", e.target.value)}
                    disabled={!formulario.sedeHecho}
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
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    Detalles adicionales
                    <InfoTooltip text="Indica Piso (ej: 2° piso), Número de Sala o referencias (ej: 'frente al casino'). Vital para revisar cámaras." />
                  </label>
                  <input
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Ej: Sala 204, 2° piso, pasillo norte frente a la biblioteca..."
                    value={formulario.detalleHecho}
                    onChange={(e) => handleChange("detalleHecho", e.target.value)}
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
            <label className="text-sm font-medium text-gray-700 block mb-1 flex items-center">
              Descripción detallada de los hechos *
              <InfoTooltip text="Intenta ser cronológico. Detalla acciones, palabras exactas usadas y si había testigos. No te preocupes por términos técnicos." />
            </label>
            <textarea
              data-field="relato"
              className={`mt-1 w-full rounded-md border px-3 py-2 text-sm h-32 focus:ring-2 focus:ring-ubb-blue/20 ${
                errors.relato && intentoAvanzar ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={
                formulario.tipoId === 3
                  ? "Describe los hechos detalladamente. Menciona: Unidad/Servicio, si ocurrió durante la atención de un paciente, si el denunciado es personal del hospital o de la universidad, y si hubo testigos..."
                  : "Describe qué pasó, indicando fecha, hora, lugar específico, palabras utilizadas, si hubo contacto físico y quiénes estaban presentes..."
              }
              value={formulario.relato}
              onChange={(e) => {
                handleChange("relato", e.target.value);
                if (errors.relato) {
                  setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.relato;
                    return newErrors;
                  });
                }
              }}
            />
            {errors.relato && intentoAvanzar && (
              <p className="mt-1 text-xs text-red-500">{errors.relato}</p>
            )}
          </div>

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

            {mostrarFormTestigo && (
              <div className="mb-4 bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      className={`w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none ${
                        errors.nuevoTestigo_nombre ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Nombre del testigo"
                      value={nuevoTestigo.nombreCompleto}
                      onChange={(e) => {
                        setNuevoTestigo({
                          ...nuevoTestigo,
                          nombreCompleto: e.target.value,
                        });
                        // Limpiar error al escribir
                        if (errors.nuevoTestigo_nombre) {
                          setErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.nuevoTestigo_nombre;
                            return newErrors;
                          });
                        }
                        // Limpiar el error temporal de testigo
                        if (errorTestigo) {
                          setErrorTestigo("");
                        }
                      }}
                    />
                    {errors.nuevoTestigo_nombre && (
                      <p className="mt-1 text-xs text-red-500">{errors.nuevoTestigo_nombre}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">
                      RUT (Opcional)
                    </label>
                    <input
                      type="text"
                      className={`w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none ${
                        errors.nuevoTestigo_rut ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="12.345.678-9"
                      value={nuevoTestigo.rut}
                      onChange={(e) => {
                        const valor = e.target.value;
                        const formateado = formatearRut(valor);
                        setNuevoTestigo({
                          ...nuevoTestigo,
                          rut: formateado,
                        });
                        // Limpiar error al escribir
                        if (errors.nuevoTestigo_rut) {
                          setErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.nuevoTestigo_rut;
                            return newErrors;
                          });
                        }
                        // Limpiar el error temporal de testigo
                        if (errorTestigo) {
                          setErrorTestigo("");
                        }
                      }}
                    />
                    {errors.nuevoTestigo_rut && (
                      <p className="mt-1 text-xs text-red-500">{errors.nuevoTestigo_rut}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">
                    Contacto *
                  </label>
                  <input
                    type="text"
                    className={`w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none ${
                      errors.nuevoTestigo_contacto ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Correo o teléfono"
                    value={nuevoTestigo.contacto}
                    onChange={(e) => {
                      setNuevoTestigo({
                        ...nuevoTestigo,
                        contacto: e.target.value,
                      });
                      // Limpiar error al escribir
                      if (errors.nuevoTestigo_contacto) {
                        setErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.nuevoTestigo_contacto;
                          return newErrors;
                        });
                      }
                      // Limpiar el error temporal de testigo
                      if (errorTestigo) {
                        setErrorTestigo("");
                      }
                    }}
                  />
                  {errors.nuevoTestigo_contacto && (
                    <p className="mt-1 text-xs text-red-500">{errors.nuevoTestigo_contacto}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {errorTestigo && (
                    <div className="w-full p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm flex items-center gap-2">
                      ⚠️ {errorTestigo}
                    </div>
                  )}
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

            {testigos.length > 0 && (
              <div className="mt-3 space-y-2">
                {testigos.map((testigo, index) => (
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
                        <span>Contacto: {testigo.contacto || <span className="text-red-500 italic">Sin contacto</span>}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        handleEliminarTestigo(index);
                        if (errors.testigos) {
                          setErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.testigos;
                            return newErrors;
                          });
                        }
                      }}
                      className="text-red-600 hover:text-red-800 text-xs font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
                {errors.testigos && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm flex items-center gap-2">
                    <span>⚠️</span>
                    <span>{errors.testigos}</span>
                  </div>
                )}
              </div>
            )}
            {testigos.length === 0 && (
              <p className="text-sm text-gray-500 italic">
                No se han agregado testigos aún
              </p>
            )}
          </div>
        </div>

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
  );
}

