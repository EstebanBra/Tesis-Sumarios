import axios from 'axios'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    withCredentials: true
})

export const login = async (rut: string, password: string) => {
    const response = await api.post('/auth/login', { rut, password })
    return response.data
}

export const logout = async () => {
    const response = await api.post('/auth/logout')
    return response.data
}

export const getMe = async () => {
    const response = await api.get('/auth/me')
    return response.data
}
