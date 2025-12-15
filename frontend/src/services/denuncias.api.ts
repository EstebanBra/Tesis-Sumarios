import { http } from './api'

// --- TIPOS ---

export type DenuncianteParticipante = {
  rut?: string
  nombre?: string
  descripcion?: string
  contacto?: string
}

export type EvidenciaInput = {
  archivo: string 
}

export type CrearDenunciaInput = {
  Rut: string
  genero?: string
  Nombre?: string
  Correo?: string
  Telefono?: string
  regionDenunciante?: string | null
  comunaDenunciante?: string | null
  direccionDenunciante?: string | null
  
  ID_TipoDe: number
  Fecha_Inicio: string // ISO
  Relato_Hechos: string
  Ubicacion?: string | null

  ID_EstadoDe?: number
  denunciados?: DenuncianteParticipante[]
  testigos?: DenuncianteParticipante[]
  evidencias?: EvidenciaInput[]
  caracteristicasDenunciado?: string | null
}
//nuevooo

export async function crearSolicitudMedida(payload: {
  ID_Denuncia: number;
  Tipo_Medida: string;
  Observacion: string;
}) {
  // Esta ruta debe coincidir con la que definiste en el backend (/api/solicitudes/medidas)
  // El helper 'http' añade el prefijo base si está configurado, o usa la ruta relativa.
  return http('/solicitudes/medidas', { 
    method: 'POST', 
    body: payload 
  })
}


export type SolicitudMedida = {
  ID_Solicitud: number
  ID_Denuncia: number
  Rut_Solicitante: string
  Fecha_Solicitud: string // ISO
  Tipo_Medida: string
  
  // Estados manejados en el flujo:
  Estado: 'Pendiente Informe' | 'En Revisión' | 'Aprobada' | 'Rechazada' 
  
  Observacion: string | null
  Informe_Tecnico: string | null // Path/contenido del informe (simulado por ahora)
  Archivo_Resolucion: string | null 
}

export async function listarMedidasPendientes() {
  // Llama a la ruta específica que creamos en solicitudMedida.routes.js
  return http('/solicitudes/medidas/pendientes/dirgegen')
}


export type DenunciaListado = {
  ID_Denuncia: number
  Rut: string
  Fecha_Inicio: string
  Relato_Hechos: string
  Ubicacion: string | null
  
  // ✅ Campo clave para que Dirgegen vea si ya escribió algo
  observacionDirgegen?: string | null 

  tipo_denuncia?: {
    ID_TipoDe: number
    Nombre: string
    Area?: string // ✅ Útil para filtrar visualmente si se necesita
  }
  estado_denuncia?: {
    ID_EstadoDe: number
    Tipo_Estado: string
  }
  solicitudes_medidas?: SolicitudMedida[]
}

export type ListarDenunciasParams = {
  page?: number
  pageSize?: number
  rut?: string
  tipoId?: number
  estadoId?: number
  desde?: string
  hasta?: string
}

export type ListarDenunciasResponse = {
  meta: {
    total: number
    page: number
    pageSize: number
    pages: number
  }
  data: DenunciaListado[]
}

// --- FUNCIONES ---

export async function crearDenuncia(payload: CrearDenunciaInput) {
  return http('/denuncias', { method: 'POST', body: payload })
}

export async function listarDenuncias(params: ListarDenunciasParams = {}): Promise<ListarDenunciasResponse> {
  const search = new URLSearchParams()

  if (params.page) search.set('page', String(params.page))
  if (params.pageSize) search.set('pageSize', String(params.pageSize))
  if (params.rut) search.set('rut', params.rut)
  if (params.tipoId) search.set('tipoId', String(params.tipoId))
  if (params.estadoId) search.set('estadoId', String(params.estadoId))
  if (params.desde) search.set('desde', params.desde)
  if (params.hasta) search.set('hasta', params.hasta)

  const query = search.toString()
  const url = `/denuncias${query ? `?${query}` : ''}`

  return http(url)
}

export async function getDenunciaById(id: number): Promise<DenunciaListado> {
    return http(`/denuncias/${id}`)
}

// ✅ Función genérica de gestión (usada por Dirgegen y Admin)
export async function gestionarDenuncia(id: number, payload: {
    observacion?: string,
    nuevoEstadoId?: number,
    nuevoTipoId?: number
}) {
    return http(`/denuncias/${id}/gestionar`, {
        method: 'PATCH',
        body: payload
    })
}