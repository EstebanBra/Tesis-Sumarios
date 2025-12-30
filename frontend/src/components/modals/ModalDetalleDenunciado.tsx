import Modal from '@/components/ui/Modal'

interface DenunciadoData {
  // Datos básicos del denunciado
  Nombre_Ingresado?: string
  Nombre?: string
  nombre?: string
  Apellido1?: string
  Descripcion?: string
  descripcion?: string
  Vinculacion?: string
  vinculacion?: string
  
  // Datos de persona si está identificado
  persona?: {
    Rut?: string | null
    Nombre?: string
    Correo?: string | null
    Telefono?: string | null
    genero?: string | null
    region?: string | null
    comuna?: string | null
    direccion?: string | null
  }
  
  ID_Persona?: number | null
}

interface ModalDetalleDenunciadoProps {
  isOpen: boolean
  onClose: () => void
  denunciado: DenunciadoData | null
}

export default function ModalDetalleDenunciado({
  isOpen,
  onClose,
  denunciado
}: ModalDetalleDenunciadoProps) {
  if (!denunciado) return null

  // Si está identificado, priorizar el nombre de persona.Nombre, sino usar Nombre_Ingresado
  const nombreBase = denunciado.persona?.Nombre 
    ? denunciado.persona.Nombre.trim()
    : (denunciado.Nombre_Ingresado || denunciado.Nombre || denunciado.nombre || 'Sin Nombre').trim()
  const apellido = denunciado.Apellido1 || ''
  const nombreFinal = `${nombreBase} ${apellido}`.trim()
  const estaIdentificado = !!(denunciado.ID_Persona || denunciado.persona)
  const persona = denunciado.persona

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detalle del Denunciado: ${nombreFinal}`}
      size="lg"
    >
      <div className="space-y-6">
        {/* Estado de Identificación */}
        <div className={`rounded-lg border p-4 ${
          estaIdentificado 
            ? 'bg-green-50 border-green-200' 
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center gap-2">
            {estaIdentificado ? (
              <>
                <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-semibold text-green-800">Persona Identificada</span>
              </>
            ) : (
              <>
                <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-semibold text-yellow-800">Persona No Identificada</span>
              </>
            )}
          </div>
        </div>

        {/* Información Básica */}
        <div>
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
            Información Básica
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Nombre Completo
              </label>
              <p className="text-sm font-medium text-gray-900">{nombreFinal || 'No disponible'}</p>
            </div>

            {persona?.Rut && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  RUT
                </label>
                <p className="text-sm font-mono font-medium text-gray-900">{persona.Rut}</p>
              </div>
            )}

            {denunciado.Vinculacion || denunciado.vinculacion ? (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Vinculación
                </label>
                <p className="text-sm text-gray-700">{denunciado.Vinculacion || denunciado.vinculacion}</p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Información de Contacto (solo si está identificado) */}
        {estaIdentificado && persona && (
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
              Información de Contacto
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {persona.Correo && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                    Correo Electrónico
                  </label>
                  <p className="text-sm text-gray-700 break-words">{persona.Correo}</p>
                </div>
              )}

              {persona.Telefono && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                    Teléfono
                  </label>
                  <p className="text-sm text-gray-700">{persona.Telefono}</p>
                </div>
              )}

              {persona.genero && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                    Género
                  </label>
                  <p className="text-sm text-gray-700">{persona.genero}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Información de Ubicación (solo si está identificado) */}
        {estaIdentificado && persona && (persona.region || persona.comuna || persona.direccion) && (
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
              Ubicación
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {persona.region && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                    Región
                  </label>
                  <p className="text-sm text-gray-700">{persona.region}</p>
                </div>
              )}

              {persona.comuna && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                    Comuna
                  </label>
                  <p className="text-sm text-gray-700">{persona.comuna}</p>
                </div>
              )}

              {persona.direccion && (
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                    Dirección
                  </label>
                  <p className="text-sm text-gray-700">{persona.direccion}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Descripción del Hecho/Cargo */}
        {(denunciado.Descripcion || denunciado.descripcion) && (
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
              Descripción del Hecho / Cargo
            </h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {denunciado.Descripcion || denunciado.descripcion}
              </p>
            </div>
          </div>
        )}

        {/* Mensaje si no está identificado */}
        {!estaIdentificado && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> Esta persona aún no ha sido identificada en el sistema. 
              Para acceder a información adicional, primero debe ser identificada mediante el proceso correspondiente.
            </p>
          </div>
        )}
      </div>
    </Modal>
  )
}

