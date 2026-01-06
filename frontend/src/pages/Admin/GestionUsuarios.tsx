import React, { useState, useEffect } from 'react';
import { usersApi, type User, type CreateUserDto } from '@/services/users.api';

// SVG Icons
const UserPlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const KeyIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

// Componente Modal para Crear/Editar Usuario
interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user?: User | null;
}

function UserModal({ isOpen, onClose, onSuccess, user }: UserModalProps) {
  const [formData, setFormData] = useState<CreateUserDto>({
    Rut: '',
    Nombre: '',
    Correo: '',
    Telefono: '',
    password: '',
    roles: [],
  });
  const [enviarCorreo, setEnviarCorreo] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        Rut: user.Rut,
        Nombre: user.Nombre,
        Correo: user.Correo,
        Telefono: user.Telefono,
        password: '',
        roles: user.roles,
      });
      setEnviarCorreo(false); // En edición, por defecto no enviar
    } else {
      setFormData({
        Rut: '',
        Nombre: '',
        Correo: '',
        Telefono: '',
        password: '',
        roles: [],
      });
      setEnviarCorreo(true); // En creación, por defecto sí enviar
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (user) {
        // Editar usuario
        const updateData: any = {
          Nombre: formData.Nombre,
          Correo: formData.Correo,
          Telefono: formData.Telefono,
          roles: formData.roles,
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        await usersApi.update(user.Rut, updateData);
        alert('Usuario actualizado exitosamente');
      } else {
        // Crear usuario
        await usersApi.create({ ...formData, enviarCorreo });
        alert('Usuario creado exitosamente');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al guardar usuario');
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = (role: string) => {
    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter((r) => r !== role)
        : [...prev.roles, role],
    }));
  };

  const availableRoles = ['Admin', 'Dirgegen', 'VRA', 'VRAE', 'Fiscalia', 'REVISOR', 'CampoClinico'];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">
            {user ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* RUT */}
            <div>
              <label className="block text-sm font-medium mb-2">
                RUT <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="12345678-9"
                value={formData.Rut}
                onChange={(e) => setFormData({ ...formData, Rut: e.target.value })}
                disabled={!!user}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                required
              />
            </div>

            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Nombre Completo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Juan Pérez González"
                value={formData.Nombre}
                onChange={(e) => setFormData({ ...formData, Nombre: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Correo */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Correo Electrónico <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                placeholder="correo@ubb.cl"
                value={formData.Correo}
                onChange={(e) => setFormData({ ...formData, Correo: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Teléfono <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                placeholder="+56912345678"
                value={formData.Telefono}
                onChange={(e) => setFormData({ ...formData, Telefono: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Contraseña {!user && <span className="text-red-500">*</span>}
                {user && <span className="text-gray-500 text-xs">(dejar vacío para no cambiar)</span>}
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required={!user}
              />
            </div>

            {/* Enviar Correo */}
            {!user && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enviarCorreo}
                    onChange={(e) => setEnviarCorreo(e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      Enviar credenciales por correo electrónico
                    </span>
                    <p className="text-xs text-gray-600 mt-1">
                      Se enviará un correo al usuario con su RUT y contraseña para acceder al sistema
                    </p>
                  </div>
                </label>
              </div>
            )}

            {/* Roles */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Roles <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {availableRoles.map((role) => (
                  <label
                    key={role}
                    className="flex items-center space-x-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={formData.roles.includes(role)}
                      onChange={() => toggleRole(role)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm">{role}</span>
                  </label>
                ))}
              </div>
              {formData.roles.length === 0 && (
                <p className="text-red-500 text-sm mt-1">Debe seleccionar al menos un rol</p>
              )}
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                disabled={loading || formData.roles.length === 0}
              >
                {loading ? 'Guardando...' : user ? 'Actualizar' : 'Crear Usuario'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Modal para Resetear Contraseña
interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

function ResetPasswordModal({ isOpen, onClose, user }: ResetPasswordModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    if (!user) return;

    setLoading(true);
    try {
      await usersApi.resetPassword(user.Rut, newPassword);
      alert('Contraseña reseteada exitosamente');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al resetear contraseña');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-4">Resetear Contraseña</h2>
        <p className="text-gray-600 mb-6">
          Resetear contraseña para: <strong>{user.Nombre}</strong>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nueva Contraseña</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Confirmar Contraseña</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
              minLength={6}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Reseteando...' : 'Resetear Contraseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Página Principal de Gestión de Usuarios
export default function GestionUsuarios() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await usersApi.getAll();
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      alert('Error al cargar usuarios');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter(
      (user) =>
        user.Nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.Rut.includes(searchTerm) ||
        user.Correo.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const handleCreateUser = () => {
    setSelectedUser(null);
    setIsUserModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsUserModalOpen(true);
  };

  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setIsResetPasswordModalOpen(true);
  };

  const getRolesBadges = (roles: string[]) => {
    const colors: Record<string, string> = {
      Admin: 'bg-red-100 text-red-800',
      Dirgegen: 'bg-purple-100 text-purple-800',
      VRA: 'bg-blue-100 text-blue-800',
      VRAE: 'bg-cyan-100 text-cyan-800',
      Fiscalia: 'bg-orange-100 text-orange-800',
      REVISOR: 'bg-green-100 text-green-800',
      CampoClinico: 'bg-pink-100 text-pink-800',
    };

    return roles.map((role) => (
      <span
        key={role}
        className={`px-2 py-1 rounded-full text-xs font-medium ${colors[role] || 'bg-gray-100 text-gray-800'}`}
      >
        {role}
      </span>
    ));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Gestión de Usuarios</h1>
        <p className="text-gray-600 mt-2">Administra los usuarios del sistema</p>
      </div>

      {/* Barra de acciones */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full md:max-w-md">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre, RUT o correo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={handleCreateUser}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlusIcon />
            Crear Usuario
          </button>
        </div>
      </div>

      {/* Tabla de usuarios */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Cargando usuarios...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    RUT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Correo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teléfono
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Roles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No se encontraron usuarios
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.ID} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.Rut}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.Nombre}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {user.Correo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {user.Telefono}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">{getRolesBadges(user.roles)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar usuario"
                          >
                            <EditIcon />
                          </button>
                          <button
                            onClick={() => handleResetPassword(user)}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Resetear contraseña"
                          >
                            <KeyIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modales */}
      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSuccess={loadUsers}
        user={selectedUser}
      />

      <ResetPasswordModal
        isOpen={isResetPasswordModalOpen}
        onClose={() => setIsResetPasswordModalOpen(false)}
        user={selectedUser}
      />
    </div>
  );
}
