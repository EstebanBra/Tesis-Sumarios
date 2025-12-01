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
  // Apuntamos a la nueva ruta estandarizada del backend que creamos en el router
  return http(`/denuncias/${id}/gestionar`, {
    method: 'PATCH',
    body: {
      nuevoTipoId,
      nuevoEstadoId,
      observacion // ✅ Aquí va el informe técnico obligatorio
    }
  })
}

// Obtiene el detalle completo (incluyendo historial) para la vista de gestión
export async function getDetalleDenuncia(id: string | number): Promise<DetalleDenunciaCompleta> {
  return http(`/denuncias/${id}`)
}