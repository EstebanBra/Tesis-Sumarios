import { apiClient } from './api.client'

export interface DatosExternosResponse {
  rut: string
  dv: string
  nombre_completo: string
  nombres: string
  apellido_paterno: string
  apellido_materno: string
  email: string
  email_secundario?: string
  telefono: string
  roles: string[] // ['Personal', 'Alumno']
  detalles: {
    personal?: {
      unidad: string
      cargo: string
      condicion: string
      tipo: string
    }
    alumno?: {
      carrera: string
      sede: string
      email_opcional: string
    }
  }
}

export const buscarPorRut = async (rut: string): Promise<DatosExternosResponse> => {
  const response = await apiClient.get(`/datos-externos/${rut}`)
  return response.data.data
}
