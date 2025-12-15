import { http } from './api'
import type { DenunciaListado } from './denuncias.api'

// Extendemos la interfaz base para incluir el historial completo
export interface DetalleDenunciaCompleta extends DenunciaListado {
  historial_estado?: {
    Fecha: string
    estado_denuncia: { Tipo_Estado: string }
  }[]
}

/**
 * Deriva una denuncia a otra unidad (ej: VRA).
 * Ahora incluye el parámetro 'observacion' para el informe técnico.
 */
export async function derivarDenuncia(id: number, nuevoTipoId: number, nuevoEstadoId: number, observacion?: string) {
  // CORRECCIÓN: La ruta debe coincidir con index.routes.js (/gestion) + dirgegen.routes.js (/denuncias/:id/derivar)
  return http(`/gestion/denuncias/${id}/derivar`, {
    method: 'PATCH',
    body: {
      nuevoTipoId,
      nuevoEstadoId,
      observacion 
    }
  })
}

// Obtiene el detalle completo (incluyendo historial) para la vista de gestión
export async function getDetalleDenuncia(id: string | number): Promise<DetalleDenunciaCompleta> {
  return http(`/denuncias/${id}`)
}