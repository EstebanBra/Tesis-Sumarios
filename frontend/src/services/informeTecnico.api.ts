
import { http } from './api'

export interface CrearInformeDTO {
  idDenuncia: number
  idAutor: number
  antecedentes: string
  analisisSocial: string
  analisisPsico: string
  analisisJuridico: string
  sugerencias: string
}

// Función para CREAR el informe (POST)
export const crearInformeTecnico = async (data: CrearInformeDTO) => {

  // Nota: Ajusta si 'http' devuelve response.data o la respuesta completa
  return http('/informes-tecnicos', { 
    method: 'POST', 
    body: data 
  })
}

// Útil para validar si ya existe o para mostrarlo en pantalla
export const obtenerInformePorDenuncia = async (idDenuncia: number) => {
  return http(`/informes-tecnicos/${idDenuncia}`)
}
export const actualizarInformeTecnico = async (
  idDenuncia: number, 
  data: Omit<CrearInformeDTO, 'idDenuncia' | 'idAutor'> // No enviamos IDs en el body al editar
) => {
  return http(`/informes-tecnicos/${idDenuncia}`, { 
    method: 'PUT', 
    body: data 
  })
}