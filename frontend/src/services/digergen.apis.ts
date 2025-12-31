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

/**
 * Identifica un denunciado con datos reales
 * @param idDatosDenunciado - ID de Datos_Denunciado
 * @param datosPersona - Datos reales de la persona (RUT, Nombre, etc.)
 */
export async function identificarDenunciado(idDatosDenunciado: number, datosPersona: {
  Rut: string
  Nombre?: string
  Correo?: string
  Telefono?: string
  sexo?: string
  genero?: string
  region?: string
  comuna?: string
  direccion?: string
}) {
  return http(`/gestion/denunciados/${idDatosDenunciado}/identificar`, {
    method: 'PUT',
    body: datosPersona
  })
}