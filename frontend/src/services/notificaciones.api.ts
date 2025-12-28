// src/services/notificaciones.api.ts
import { http } from './api'

export interface Notificacion {
  ID_Notificacion: number
  ID_Usuario: number
  Tipo: string
  Titulo: string
  Mensaje: string
  Leida: boolean
  Fecha_Creacion: string
  ID_Denuncia?: number | null
  Enviado_Email: boolean
  denuncia?: {
    ID_Denuncia: number
    tipo_denuncia?: {
      Nombre: string
    }
  }
}

/**
 * Obtener notificaciones del usuario
 */
export async function getNotificaciones(params?: { leidas?: boolean; limit?: number }): Promise<Notificacion[]> {
  const queryParams = new URLSearchParams()
  if (params?.leidas !== undefined) {
    queryParams.append('leidas', params.leidas.toString())
  }
  if (params?.limit) {
    queryParams.append('limit', params.limit.toString())
  }
  
  const query = queryParams.toString()
  const response = await http(`/notificaciones${query ? `?${query}` : ''}`)
  return response.data || []
}

/**
 * Obtener contador de notificaciones no leídas
 */
export async function getContadorNoLeidas(): Promise<number> {
  const response = await http('/notificaciones/contador')
  return response.count || 0
}

/**
 * Marcar una notificación como leída
 */
export async function marcarNotificacionLeida(id: number): Promise<void> {
  await http(`/notificaciones/${id}/leida`, {
    method: 'PATCH'
  })
}

/**
 * Marcar todas las notificaciones como leídas
 */
export async function marcarTodasLeidas(): Promise<void> {
  await http('/notificaciones/marcar-todas', {
    method: 'PATCH'
  })
}

