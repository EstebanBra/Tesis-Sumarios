import { userService } from '../services/user.service.js';

export const userController = {
  /**
   * Crear un nuevo usuario
   * POST /api/users
   */
  async createUser(req, res) {
    try {
      const user = await userService.createUser(req.body);
      res.status(201).json({
        ok: true,
        message: 'Usuario creado exitosamente',
        data: user,
      });
    } catch (error) {
      console.error('Error al crear usuario:', error);
      res.status(400).json({
        ok: false,
        message: error.message || 'Error al crear usuario',
      });
    }
  },

  /**
   * Obtener todos los usuarios
   * GET /api/users
   */
  async getAllUsers(req, res) {
    try {
      const users = await userService.getAllUsers();
      res.status(200).json({
        ok: true,
        data: users,
      });
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      res.status(500).json({
        ok: false,
        message: 'Error al obtener usuarios',
      });
    }
  },

  /**
   * Obtener un usuario por RUT
   * GET /api/users/:rut
   */
  async getUserByRut(req, res) {
    try {
      const { rut } = req.params;
      const user = await userService.getUserByRut(rut);
      res.status(200).json({
        ok: true,
        data: user,
      });
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      res.status(404).json({
        ok: false,
        message: error.message || 'Usuario no encontrado',
      });
    }
  },

  /**
   * Actualizar un usuario
   * PUT /api/users/:rut
   */
  async updateUser(req, res) {
    try {
      const { rut } = req.params;
      const user = await userService.updateUser(rut, req.body);
      res.status(200).json({
        ok: true,
        message: 'Usuario actualizado exitosamente',
        data: user,
      });
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      res.status(400).json({
        ok: false,
        message: error.message || 'Error al actualizar usuario',
      });
    }
  },

  /**
   * Eliminar un usuario
   * DELETE /api/users/:rut
   */
  async deleteUser(req, res) {
    try {
      const { rut } = req.params;
      const result = await userService.deleteUser(rut);
      res.status(200).json({
        ok: true,
        message: result.message,
      });
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      res.status(400).json({
        ok: false,
        message: error.message || 'Error al eliminar usuario',
      });
    }
  },

  /**
   * Cambiar contraseña (usuario autenticado)
   * POST /api/users/change-password
   */
  async changePassword(req, res) {
    try {
      const { oldPassword, newPassword } = req.body;
      const rut = req.user.Rut; // Del middleware de autenticación

      const result = await userService.changePassword(rut, oldPassword, newPassword);
      res.status(200).json({
        ok: true,
        message: result.message,
      });
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      res.status(400).json({
        ok: false,
        message: error.message || 'Error al cambiar contraseña',
      });
    }
  },

  /**
   * Resetear contraseña (solo admin)
   * POST /api/users/:rut/reset-password
   */
  async resetPassword(req, res) {
    try {
      const { rut } = req.params;
      const { newPassword } = req.body;

      const result = await userService.resetPassword(rut, newPassword);
      res.status(200).json({
        ok: true,
        message: result.message,
      });
    } catch (error) {
      console.error('Error al resetear contraseña:', error);
      res.status(400).json({
        ok: false,
        message: error.message || 'Error al resetear contraseña',
      });
    }
  },
};
