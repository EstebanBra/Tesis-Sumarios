import { apiClient } from './api.client';

export interface User {
  ID: number;
  Rut: string;
  Nombre: string;
  Correo: string;
  Telefono: string;
  roles: string[];
}

export interface CreateUserDto {
  Rut: string;
  Nombre: string;
  Correo: string;
  Telefono: string;
  password: string;
  roles: string[];
  enviarCorreo?: boolean;
}

export interface UpdateUserDto {
  Nombre?: string;
  Correo?: string;
  Telefono?: string;
  password?: string;
  roles?: string[];
}

export interface ResetPasswordDto {
  newPassword: string;
}

export const usersApi = {
  async getAll(): Promise<User[]> {
    const response = await apiClient.get('/users');
    return response.data.data;
  },

  async getByRut(rut: string): Promise<User> {
    const response = await apiClient.get(`/users/${rut}`);
    return response.data.data;
  },

  async create(user: CreateUserDto): Promise<User> {
    const response = await apiClient.post('/users', user);
    return response.data.data;
  },

  async update(rut: string, user: UpdateUserDto): Promise<User> {
    const response = await apiClient.put(`/users/${rut}`, user);
    return response.data.data;
  },

  async resetPassword(rut: string, newPassword: string): Promise<void> {
    await apiClient.post(`/users/${rut}/reset-password`, { newPassword });
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await apiClient.post('/users/change-password', { oldPassword, newPassword });
  },
};
