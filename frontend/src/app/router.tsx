import { createBrowserRouter } from 'react-router-dom'
import App from '@/App'
import Home from '@/pages/Home'
import Login from '@/pages/Auth/Login'
import NuevaDenuncia from '@/pages/Denuncias/NuevaDenuncia'
import MisDenuncias from '@/pages/Denuncias/MisDenuncias'
import DetalleDenuncia from '@/pages/Denuncias/DetalleDenuncia'
import AuthShell from '@/components/layout/AuthShell'

// Grupo AUTH (sin header/footer): sólo "/"
const authRoutes = {
  path: '/',
  element: <AuthShell />,
  children: [
    { index: true, element: <Login /> }, // ← solo login en "/"
  ],
}

// Grupo APP (con header/footer): resto del sitio
const appRoutes = {
  path: '/',
  element: <App />, // App monta AppShell + <Outlet/>
  children: [
    { path: 'home', element: <Home /> },
    { path: 'denuncias', element: <MisDenuncias /> },
    { path: 'denuncias/nueva', element: <NuevaDenuncia /> },
    { path: 'denuncias/:id', element: <DetalleDenuncia /> },
  ],
}

export const router = createBrowserRouter([authRoutes, appRoutes])
