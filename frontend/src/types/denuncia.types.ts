
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
    apellido1: string
    apellido2: string
    parentesco: string
    vinculacion: string
    antecedentes: string
    descripcionFisica: string
}

export type FormularioDenuncia = {
    rut: string
    nombre: string
    telefono: string
    correo: string
    reservaIdentidad: boolean

    tipoId: number
    subtipoId: number | null
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
    fechaHecho: string
    horaHecho: string
    relato: string
    involucrados: Involucrado[]
    nuevoInvolucrado: Involucrado
}

export type FaseRegistro = 'seleccion_tipo' | 'seleccion_subtipo' | 'formulario'
