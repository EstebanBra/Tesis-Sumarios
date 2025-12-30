import Modal from '@/components/ui/Modal'

interface TestigoData {
  Nombre_PD?: string
  Nombre?: string
  nombre?: string
  Rut?: string | null
  rut?: string | null
  Contacto?: string | null
  contacto?: string | null
  
  // Si tiene persona asociada
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

interface ModalDetalleTestigoProps {
  isOpen: boolean
  onClose: () => void
  testigo: TestigoData | null
}

export default function ModalDetalleTestigo({
  isOpen,
  onClose,
  testigo
}: ModalDetalleTestigoProps) {
  if (!testigo) return null

  const nombreCompleto = (testigo.Nombre_PD || testigo.Nombre || testigo.nombre || 'Sin Nombre').trim()
  const rut = testigo.Rut || testigo.rut || testigo.persona?.Rut || null
  const contacto = testigo.Contacto || testigo.contacto || null
  const estaIdentificado = !!(testigo.ID_Persona || testigo.persona)
  const persona = testigo.persona

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detalle del Testigo: ${nombreCompleto}`}
      size="md"
    >
      <div className="space-y-6">
        {/* Estado de Identificación */}
        {estaIdentificado && (
          <div className="rounded-lg border bg-green-50 border-green-200 p-4">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-semibold text-green-800">Persona Identificada</span>
            </div>
          </div>
        )}

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
              <p className="text-sm font-medium text-gray-900">{nombreCompleto || 'No disponible'}</p>
            </div>

            {rut && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  RUT
                </label>
                <p className="text-sm font-mono font-medium text-gray-900">{rut}</p>
              </div>
            )}
          </div>
        </div>

        {/* Información de Contacto */}
        <div>
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
            Información de Contacto
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Si está identificado, mostrar datos de persona */}
            {estaIdentificado && persona ? (
              <>
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

                {(persona.region || persona.comuna || persona.direccion) && (
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                      Ubicación
                    </label>
                    <p className="text-sm text-gray-700">
                      {[persona.direccion, persona.comuna, persona.region]
                        .filter(Boolean)
                        .join(', ') || 'No disponible'}
                    </p>
                  </div>
                )}
              </>
            ) : (
              /* Si no está identificado, mostrar solo el contacto registrado */
              contacto && (
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                    Contacto
                  </label>
                  <p className="text-sm text-gray-700">{contacto}</p>
                </div>
              )
            )}
          </div>
        </div>

        {/* Mensaje si no hay información de contacto */}
        {!estaIdentificado && !contacto && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Nota:</strong> No hay información de contacto disponible para este testigo.
            </p>
          </div>
        )}
      </div>
    </Modal>
  )
}

