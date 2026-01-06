import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from '@/App';
import Home from '@/pages/Home';
import Login from '@/pages/Login/Login';
import AccesoDenuncia from '@/pages/AccesoDenuncia';
import VerificacionEmail from '@/pages/VerificacionEmail/VerificacionEmail';
import SeleccionRol from '@/pages/SeleccionRol/SeleccionRol';
import NuevaDenuncia from '@/pages/Denuncias/NuevaDenuncia';
import MisDenuncias from '@/pages/Denuncias/MisDenuncias';
import DetalleDenuncia from '@/pages/Denuncias/DetalleDenuncia';
import SeguimientoDenuncia from '@/pages/SeguimientoDenuncia/SeguimientoDenuncia';
import ConfirmacionDenuncia from '@/pages/ConfirmacionDenuncia/ConfirmacionDenuncia';
import BandejaDirgegen from '@/pages/Dirgegen/BandejaDirgegen';
import DetalleDirgegen from '@/pages/Dirgegen/DetalleDirgegen';
import BandejaAutoridad from '@/pages/Autoridad/BandejaAutoridad';
import DetalleAutoridad from '@/pages/Autoridad/DetalleAutoridad';
import BandejaRevisor from '@/pages/Revisor/BandejaRevisor';
import DetalleRevisor from '@/pages/Revisor/DetalleRevisor';
import BandejaCampoClinico from '@/pages/CampoClinico/BandejaCampoClinico';
import DetalleCampoClinico from '@/pages/CampoClinico/DetalleCampoClinico';

import AuthShell from '@/components/layout/AuthShell';
import RequireAuth from '@/components/RequireAuth';

import { AuthProvider } from '@/context/AuthContext';
import { Outlet } from 'react-router-dom';

// Grupo AUTH (sin header/footer): Login y flujo de denuncias sin login (acceso directo)
const authRoutes = {
  element: <AuthShell />,
  children: [
    { path: '/login', element: <Login /> },
    { path: '/directo/acceso', element: <AccesoDenuncia /> },
    { path: '/directo/verificacion-email', element: <VerificacionEmail /> },
    { path: '/directo/seleccion-rol', element: <SeleccionRol /> },
    { path: '/directo/nueva-denuncia', element: <NuevaDenuncia /> },
    { path: '/directo/confirmacion', element: <ConfirmacionDenuncia /> },
    { path: '/directo/seguimiento/:token', element: <SeguimientoDenuncia /> },
  ],
};

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
        { path: 'denuncias/nueva', element: <NuevaDenuncia /> },
        { path: 'denuncias', element: <MisDenuncias /> },
        { path: 'denuncias/:id', element: <DetalleDenuncia /> },

        { path: 'dirgegen/bandeja', element: <BandejaDirgegen /> },
        { path: 'dirgegen/denuncia/:id', element: <DetalleDirgegen /> },

        { path: 'autoridad/bandeja', element: <BandejaAutoridad /> },
        { path: 'autoridad/denuncia/:id', element: <DetalleAutoridad /> },

        { path: 'revisor/bandeja', element: <BandejaRevisor /> },
        { path: 'revisor/denuncia/:id', element: <DetalleRevisor /> },

        { path: 'campo-clinico/bandeja', element: <BandejaCampoClinico /> },
        { path: 'campo-clinico/denuncia/:id', element: <DetalleCampoClinico /> },
      ],
    },
  ],
};

export const router = createBrowserRouter([
  {
    element: (
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    ),
    children: [authRoutes, appRoutes],
  },
]);
