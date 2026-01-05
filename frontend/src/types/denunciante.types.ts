export interface DatosDenunciante {
  rut: string
  nombre: string
  telefono: string
  correo: string
  carreraCargo: string
  rolSeleccionado?: 'Personal' | 'Alumno'
  rolesDisponibles: string[]
}
