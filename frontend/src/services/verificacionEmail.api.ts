import { apiClient } from './api.client'

interface SolicitudCodigoResponse {
    message: string
    emailEnmascarado: string
}

interface VerificarCodigoResponse {
    message: string
    data: {
        rut: string | number
        dv: string
        nombre_completo: string
        nombres: string
        apellido_paterno: string
        apellido_materno: string
        email: string
        email_secundario?: string
        telefono: string
        roles: string[]
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
                email_opcional?: string
            }
        }
    }
}

/**
 * Solicita un código de verificación para el RUT proporcionado
 */
export const solicitarCodigoVerificacion = async (
    rut: string
): Promise<SolicitudCodigoResponse> => {
    const response = await apiClient.post<SolicitudCodigoResponse>(
        '/verificacion-email/solicitar',
        { rut }
    )
    return response.data
}

/**
 * Verifica el código ingresado por el usuario
 */
export const verificarCodigoEmail = async (
    rut: string,
    codigo: string
): Promise<VerificarCodigoResponse['data']> => {
    const response = await apiClient.post<VerificarCodigoResponse>(
        '/verificacion-email/verificar',
        { rut, codigo }
    )
    return response.data.data
}
