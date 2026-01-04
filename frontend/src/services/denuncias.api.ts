import { http } from './api'
import { apiClient } from './api.client'

// --- TIPOS ---

export type DenuncianteParticipante = {
  rut?: string
  nombre?: string
  descripcion?: string
  contacto?: string
}

export type ParticipanteOutput = {
  ID_Participante: number;
  Nombre: string;
  Rut?: string;
  Correo?: string;
  Tipo_Participante: 'DENUNCIANTE' | 'DENUNCIADO' | 'TESTIGO' | 'VICTIMA';
  Estamento?: string;
  Descripcion?: string;
}

export type ArchivoOutput = {
  ID_Archivo: number;
  Nombre_Archivo?: string; // Deprecated, usar Nombre_Original
  Ruta_Archivo?: string; // Deprecated
  Fecha_Subida?: string; // Deprecated
  MinIO_Key?: string; // Clave del objeto en MinIO (UUID-nombre)
  Nombre_Original?: string; // Nombre original del archivo
  Tipo_Archivo?: string; // MIME type (ej: image/jpeg, application/pdf)
  Tamaño?: bigint | number | string; // Tamaño en bytes
}

export type EvidenciaInput = {
  nombreArchivo: string // MinIO object key (UUID-nombre)
  nombreOriginal: string // Nombre original del archivo
  tipoArchivo: string // MIME type
  tamaño: number // Tamaño en bytes
}

export type CrearDenunciaInput = {
  Rut?: string | null // Opcional para denuncias anónimas
  genero?: string | null // String directo, opcional
  sexo?: string | null // String directo, opcional
  Nombre?: string | null
  Correo?: string | null
  Telefono?: string | null
  regionDenunciante?: string | null
  comunaDenunciante?: string | null
  direccionDenunciante?: string | null
  carreraCargo?: string | null // Carrera o Cargo del denunciante

  ID_TipoDe: number
  Fecha_Inicio: string // ISO
  Fecha_Fin?: string | null // ISO - Fecha fin del rango (opcional, solo si es rango)
  Relato_Hechos: string
  Ubicacion?: string | null
  reservaIdentidad?: boolean // Reserva de identidad

  ID_EstadoDe?: number
  denunciados?: DenuncianteParticipante[]
  testigos?: DenuncianteParticipante[]
  victima?: {
    nombre: string
    rut: string
    correo?: string
    telefono?: string
    genero?: string
    sexo?: string
  }
  evidencias?: EvidenciaInput[]
  caracteristicasDenunciado?: string | null

  // Datos específicos para denuncias de campo clínico
  detalleCampoClinico?: {
    nombreEstablecimiento: string
    unidadServicio: string
    tipoVinculacionDenunciado: string
    region?: string
    comuna?: string
    direccionEstablecimiento?: string
  } | null
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
  Rut?: string // Deprecated: usar denunciante?.Rut en su lugar
  Fecha_Ingreso?: string // Fecha de ingreso al sistema
  Fecha_Inicio: string // Fecha de los hechos (o fecha única)
  Fecha_Fin?: string | null // Fecha fin del rango (opcional)
  Relato_Hechos: string
  Ubicacion: string | null

  observacionDirgegen?: string | null

  denunciante?: {
    Rut?: string | null
    Nombre?: string
    Correo?: string
    Telefono?: string
    sexo?: string | null
    genero?: string | null
    region?: string | null
    comuna?: string | null
    direccion?: string | null
    carreraCargo?: string | null // Carrera o Cargo del denunciante
  }

  tipo_denuncia?: {
    ID_TipoDe: number
    Nombre: string
    Area?: string
  }
  estado_denuncia?: {
    ID_EstadoDe: number
    Tipo_Estado: string
  }

  solicitudes_medidas?: SolicitudMedida[]

  // Listas usadas en el detalle
  participante_denuncia?: ParticipanteOutput[]
  archivos_denuncia?: ArchivoOutput[]

  informe_tecnico?: {
    ID_Informe: number
    Fecha_Emision: string
  } | null
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

export async function crearDenuncia(payload: CrearDenunciaInput, archivos?: File[]) {
  // Si hay archivos, usar FormData; si no, JSON normal
  if (archivos && archivos.length > 0) {
    const formData = new FormData();

    // Agregar todos los campos del payload como JSON string
    // (multer no parsea JSON automáticamente, así que lo enviamos como string)
    formData.append('data', JSON.stringify(payload));

    // Agregar archivos
    archivos.forEach((archivo) => {
      formData.append('archivos', archivo);
    });

    // Usar el cliente Axios centralizado para FormData
    // Axios detecta FormData y ajusta automáticamente el Content-Type con boundary
    const response = await apiClient.post('/denuncias', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } else {
    // Sin archivos, usar el método normal
    return http('/denuncias', { method: 'POST', body: payload });
  }
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

export async function subirEvidenciaDenuncia(idDenuncia: number, archivo: File) {
  // Paso 1: Obtener presigned URL para subir
  const presignedResponse = await http('/storage/presigned-upload', {
    method: 'POST',
    body: {
      fileName: archivo.name,
      mimeType: archivo.type,
      size: archivo.size,
    },
  });

  // El servicio http devuelve directamente el objeto de respuesta
  if (!presignedResponse || !presignedResponse.data) {
    throw new Error('No se pudo obtener la URL de carga');
  }

  const { uploadUrl, objectKey } = presignedResponse.data;

  // Paso 2: Subir archivo directamente a MinIO usando la presigned URL
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    body: archivo,
    headers: {
      'Content-Type': archivo.type,
    },
  });

  if (!uploadResponse.ok) {
    throw new Error('Error al subir archivo a MinIO');
  }

  // Paso 3: Registrar metadatos en la base de datos
  return http(`/denuncias/${idDenuncia}/evidencia`, {
    method: 'POST',
    body: {
      objectKey: objectKey,
      nombreOriginal: archivo.name,
      tipoArchivo: archivo.type,
      tamaño: archivo.size,
    },
  });
}

