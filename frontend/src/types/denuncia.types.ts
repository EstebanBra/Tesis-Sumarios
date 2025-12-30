
export type OpcionTipo = {
    id: number;
    nombre: string;
    descripcion: string;
    icono: React.ReactNode
}

export type OpcionSubtipo = {
    id: number
    tipoId: number
    nombre: string
    descripcion: string
}

export type Involucrado = {
    nombre: string
    vinculacion: string
    descripcionDenunciado: string // Descripción física, ropa, edad, etc.
    rut?: string // Información adicional (opcional)
    unidadCarrera?: string // Información adicional (opcional)
}

export type Testigo = {
    nombreCompleto: string
    rut?: string
    contacto: string
}

export type FormularioDenuncia = {
    rut: string
    nombre: string
    telefono: string
    correo: string
    sexo: string
    genero: string
    reservaIdentidad: boolean
    carreraCargo: string // Carrera (si es estudiante) o Cargo (si es funcionario/académico)

    tipoId: number
    subtipoId: number | null

    descripcionOtro: string

    regionDenunciante: string
    comunaDenunciante: string
    direccionDenunciante: string

    victimaMenor: 'si' | 'no'
    esVictima: 'si' | 'no'
    victimaRut: string
    victimaNombre: string
    victimaApellido1: string
    victimaApellido2: string
    victimaGenero: string
    victimaSexo: string
    victimaNacionalidad: string
    victimaNacimiento: string
    victimaCorreo: string
    victimaTelefono: string

    regionHecho: string
    comunaHecho: string
    sedeHecho: string
    lugarHecho: string
    detalleHecho: string
    tipoFecha: 'unica' | 'rango'
    fechaHecho: string
    fechaHechoFin: string
    horaHecho: string
    relato: string
    involucrados: Involucrado[]
    nuevoInvolucrado: Involucrado
    testigos: Testigo[]
    
    // Campos específicos para denuncias de campo clínico
    nombreEstablecimiento: string
    unidadServicio: string
    tipoVinculacionDenunciado: string
    regionEstablecimiento: string
    comunaEstablecimiento: string
    direccionEstablecimiento: string
}

export type FaseRegistro = 'seleccion_tipo' | 'formulario'
