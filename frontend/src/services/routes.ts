export const routes = {
  home: '/',
  login: '/login',
  denuncias: {
    root: '/denuncias',
    nueva: '/denuncias/nueva',
    detalle: (id: string | number) => `/denuncias/${id}`,
  },
} as const
