import { createContext, useState, useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { login as loginApi, logout as logoutApi, getMe } from '@/services/auth.api'

interface User {
    rut: string
    nombre: string
    email: string
    telefono?: string | null
    roles: string[]
    region?: string | null
    comuna?: string | null
    direccion?: string | null
    genero?: string | null
}

interface AuthContextType {
    user: User | null
    loading: boolean
    login: (rut: string, password: string) => Promise<void>
    logout: () => Promise<void>
    isAuthenticated: boolean
    hasRole: (role: string) => boolean
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        checkAuth()
    }, [])

    async function checkAuth() {
        try {
            const userData = await getMe()
            setUser(userData)
        } catch (error) {
            setUser(null)
        } finally {
            setLoading(false)
        }
    }

    async function login(rut: string, password: string) {
        const { user } = await loginApi(rut, password)
        setUser(user)
        navigate('/')
    }

    async function logout() {
        await logoutApi()
        setUser(null)
        navigate('/login')
    }

    const hasRole = (role: string) => {
        return user?.roles.includes(role) ?? false
    }

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            login,
            logout,
            isAuthenticated: !!user,
            hasRole
        }}>
            {children}
        </AuthContext.Provider>
    )
}

