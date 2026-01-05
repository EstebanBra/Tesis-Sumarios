import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiClient } from '@/services/api.client'

interface DenunciaSeguimiento {
  ID_Denuncia: number
  Fecha_Ingreso: string
  Fecha_Inicio: string
  Fecha_Fin?: string | null
  estado: {
    ID_EstadoDe: number
    Tipo_Estado: string
  }
  tipo: {
    ID_TipoDe: number
    Nombre: string
    Area: string
  }
  Relato_Hechos: string
  Ubicacion?: string | null
  archivos: Array<{
    ID_Archivo: number
    Nombre_Original: string
    Tipo_Archivo: string
    downloadUrl: string
  }>
}

export default function SeguimientoDenuncia() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [denuncia, setDenuncia] = useState<DenunciaSeguimiento | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    cargarDenuncia()
  }, [token])

  const cargarDenuncia = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(`/denuncias/seguimiento/${token}`)
      setDenuncia(response.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'No se pudo cargar la denuncia')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ubb-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando información de la denuncia...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg border border-gray-300 p-8">
          <div className="text-center">
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-red-500"
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
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Error al cargar la denuncia
            </h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="bg-ubb-blue text-white px-6 py-2 rounded hover:bg-ubb-blue/90 transition-colors"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!denuncia) {
    return null
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Encabezado */}
        <div className="bg-white shadow-lg border border-gray-300 mb-6">
          <div className="h-1.5 w-full bg-ubb-blue"></div>
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Seguimiento de Denuncia #{denuncia.ID_Denuncia}
            </h1>
            <p className="text-gray-600">
              Aquí puedes ver el estado actual de tu denuncia y los archivos adjuntos.
            </p>
          </div>
        </div>

        {/* Información de la denuncia */}
        <div className="bg-white shadow-lg border border-gray-300 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">
            Información General
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Denuncia
              </label>
              <p className="text-gray-900">{denuncia.tipo.Nombre}</p>
              <p className="text-sm text-gray-500">{denuncia.tipo.Area}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado Actual
              </label>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                  denuncia.estado.Tipo_Estado === 'Ingresado'
                    ? 'bg-blue-100 text-blue-800'
                    : denuncia.estado.Tipo_Estado === 'En Revisión'
                    ? 'bg-yellow-100 text-yellow-800'
                    : denuncia.estado.Tipo_Estado === 'Cerrado'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {denuncia.estado.Tipo_Estado}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Ingreso
              </label>
              <p className="text-gray-900">{formatDate(denuncia.Fecha_Ingreso)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de los Hechos
              </label>
              <p className="text-gray-900">
                {formatDate(denuncia.Fecha_Inicio)}
                {denuncia.Fecha_Fin && ` - ${formatDate(denuncia.Fecha_Fin)}`}
              </p>
            </div>

            {denuncia.Ubicacion && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ubicación
                </label>
                <p className="text-gray-900">{denuncia.Ubicacion}</p>
              </div>
            )}
          </div>
        </div>

        {/* Relato de los Hechos */}
        <div className="bg-white shadow-lg border border-gray-300 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">
            Relato de los Hechos
          </h2>
          <p className="text-gray-700 whitespace-pre-wrap break-all">{denuncia.Relato_Hechos}</p>
        </div>

        {/* Archivos Adjuntos */}
        {denuncia.archivos && denuncia.archivos.length > 0 && (
          <div className="bg-white shadow-lg border border-gray-300 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">
              Archivos Adjuntos
            </h2>
            <div className="space-y-2">
              {denuncia.archivos.map((archivo) => (
                <div
                  key={archivo.ID_Archivo}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <svg
                      className="h-6 w-6 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {archivo.Nombre_Original}
                      </p>
                      <p className="text-xs text-gray-500">{archivo.Tipo_Archivo}</p>
                    </div>
                  </div>
                  <a
                    href={archivo.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ubb-blue hover:text-ubb-blue/80 text-sm font-semibold"
                  >
                    Descargar
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botón de volver */}
        <div className="text-center">
          <button
            onClick={() => navigate('/')}
            className="bg-gray-200 text-gray-800 px-6 py-2 rounded hover:bg-gray-300 transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  )
}
