import axios from 'axios'

/**
 * Cliente Axios centralizado para todas las peticiones HTTP.
 *
 * Configuración:
 * - baseURL: '/api' - Ruta relativa que funciona tanto en desarrollo (proxy de Vite)
 *   como en producción (proxy reverso de Nginx)
 * - withCredentials: true - Incluye cookies automáticamente para autenticación
 */
export const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Interceptor para manejar errores de forma consistente
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si el error tiene respuesta del servidor, extraer información útil
    if (error.response) {
      const { status, data } = error.response
      const mensaje = data?.message || data?.error || `HTTP ${status}`
      const detalles = data?.details || data?.errors || null

      const err = new Error(mensaje) as Error & {
        detalles?: unknown
        status?: number
      }
      err.detalles = detalles
      err.status = status

      return Promise.reject(err)
    }

    // Error de red u otro error
    return Promise.reject(error)
  }
)

/**
 * Constante para uso en otros contextos (ej: WebSocket)
 */
export const API_BASE_URL = '/api'

