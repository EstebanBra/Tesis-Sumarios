import { http } from './api'
import type { DenunciaListado } from './denuncias.api'


export interface DetalleDenunciaCompleta extends DenunciaListado {
  historial_estado?: {
    Fecha: string
    estado_denuncia: { Tipo_Estado: string }
  }[]
}
// por ahora esta lo de derivar denuncia pero despues hay que colocar el formulario
export async function derivarDenuncia(id: number, nuevoTipoId: number, nuevoEstadoId: number) {
  return http(`/gestion/denuncias/${id}/derivar`, {
    method: 'PATCH',
    body: {
      nuevoTipoId,
      nuevoEstadoId,
    }
  })
}

// Endpoint para obtener el detalle completo de una denuncia
export async function getDetalleDenuncia(id: string | number): Promise<DetalleDenunciaCompleta> {
  return http(`/denuncias/${id}`)
}