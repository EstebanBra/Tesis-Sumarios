import { http } from './api'

export type DenuncianteParticipante = {
  rut?: string
  nombre?: string
}

export type EvidenciaInput = {
  archivo: string // por ahora cadena simple; luego lo cambiaremos a upload real
}

export type CrearDenunciaInput = {
  Rut: string
  ID_TipoDe: number
  Fecha_Inicio: string // ISO
  Relato_Hechos: string
  Ubicacion?: string | null

  // opcionales
  ID_EstadoDe?: number
  denunciados?: DenuncianteParticipante[]
  testigos?: DenuncianteParticipante[]
  evidencias?: EvidenciaInput[]
  caracteristicasDenunciado?: string | null
}

export async function crearDenuncia(payload: CrearDenunciaInput) {
  // POST /api/denuncias
  return http('/denuncias', { method: 'POST', body: payload })
}