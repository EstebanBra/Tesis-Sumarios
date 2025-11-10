const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

type Options = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
}

export async function http(path: string, options: Options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  // intenta parsear JSON siempre
  const text = await res.text()
  const data = text ? JSON.parse(text) : null

  if (!res.ok) {
    const mensaje = (data && (data.message || data.error)) || `HTTP ${res.status}`
    const detalles = (data && (data.details || data.errors)) || null
    const err = new Error(mensaje) as Error & { detalles?: unknown; status?: number }
    err.detalles = detalles
    err.status = res.status
    throw err
  }

  return data
}