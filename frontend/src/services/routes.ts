export const routes = {
  home: '/',
  login: '/login',
  denuncias: {
    root: '/denuncias',
    nueva: '/denuncias/nueva',
    detalle: (id: string | number) => `/denuncias/${id}`,
  },
  directo: {
    acceso: '/directo/acceso',
    verificacionEmail: '/directo/verificacion-email',
    seleccionRol: '/directo/seleccion-rol',
    nuevaDenuncia: '/directo/nueva-denuncia',
    confirmacion: '/directo/confirmacion',
    seguimiento: (token: string) => `/directo/seguimiento/${token}`,
  },
} as const
