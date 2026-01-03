import { apiClient } from './api.client'

export const login = async (rut: string, password: string) => {
    const response = await apiClient.post('/auth/login', { rut, password })
    return response.data
}

export const logout = async () => {
    const response = await apiClient.post('/auth/logout')
    return response.data
}

export const getMe = async () => {
    const response = await apiClient.get('/auth/me')
    return response.data
}
