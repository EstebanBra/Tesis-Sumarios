import { Navigate, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

interface RequireAuthProps {
    allowedRoles?: string[]
}

export default function RequireAuth({ allowedRoles }: RequireAuthProps) {
    const { user, loading } = useAuth()
    const location = useLocation()

    if (loading) {
        return <div className="flex h-screen items-center justify-center">Cargando...</div>
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    if (allowedRoles && !allowedRoles.some(role => user.roles.includes(role))) {
        return <div className="flex h-screen items-center justify-center text-red-600 font-bold">Acceso Denegado: No tienes permisos suficientes.</div>
    }

    return <Outlet />
}
