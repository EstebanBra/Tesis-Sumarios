import { createBrowserRouter, Navigate } from 'react-router-dom'
import App from '@/App'
import Home from '@/pages/Home'
import Login from '@/pages/Login/Login'
import NuevaDenuncia from '@/pages/Denuncias/NuevaDenuncia'
import MisDenuncias from '@/pages/Denuncias/MisDenuncias'
import DetalleDenuncia from '@/pages/Denuncias/DetalleDenuncia'
import BandejaDirgegen from '@/pages/Dirgegen/BandejaDirgegen'
import DetalleDirgegen from '@/pages/Dirgegen/DetalleDirgegen'
import BandejaAutoridad from '@/pages/Autoridad/BandejaAutoridad'
import DetalleAutoridad from '@/pages/Autoridad/DetalleAutoridad'

import AuthShell from '@/components/layout/AuthShell'
import RequireAuth from '@/components/RequireAuth'

import { AuthProvider } from '@/context/AuthContext'
import { Outlet } from 'react-router-dom'

// ... (imports remain the same)

// Grupo AUTH (sin header/footer): Login
const authRoutes = {
  element: <AuthShell />,
  children: [
    { path: '/login', element: <Login /> },
  ],
}

// Grupo APP (con header/footer): Protegido
const appRoutes = {
  path: '/',
  element: <RequireAuth />, // Protege todas las rutas hijas
  children: [
    {
      element: <App />, // App monta AppShell + <Outlet/>
      children: [
        { index: true, element: <Navigate to="/home" replace /> },
        { path: 'home', element: <Home /> },
        { path: 'denuncias', element: <MisDenuncias /> },
        { path: 'denuncias/nueva', element: <NuevaDenuncia /> },
        { path: 'denuncias/:id', element: <DetalleDenuncia /> },

        { path: 'dirgegen/bandeja', element: <BandejaDirgegen /> },
        { path: 'dirgegen/denuncia/:id', element: <DetalleDirgegen /> },

        { path: 'autoridad/bandeja', element: <BandejaAutoridad /> },
        { path: 'autoridad/denuncia/:id', element: <DetalleAutoridad /> }
      ],
    }
  ]
}




export const router = createBrowserRouter([
  {
    element: (
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    ),
    children: [authRoutes, appRoutes]
  }
])
