import { apiClient } from './api.client'

type Options = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
}

/**
 * Función helper para realizar peticiones HTTP usando el cliente Axios centralizado.
 * Mantiene compatibilidad con la API anterior basada en fetch.
 *
 * @param path - Ruta relativa (sin '/api', se añade automáticamente)
 * @param options - Opciones de la petición
 * @returns Los datos de la respuesta (response.data)
 */
export async function http(path: string, options: Options = {}) {
  const { method = 'GET', body, headers } = options

  const response = await apiClient.request({
    url: path,
    method,
    data: body,
    headers: {
      ...headers,
    },
  })

  // Axios ya parsea JSON automáticamente y maneja errores a través del interceptor
  return response.data
}
