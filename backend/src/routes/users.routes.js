import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { userValidations } from '../validations/user.validation.js';
import { validationResult } from 'express-validator';
import { verifyToken, hasRole } from '../middlewares/auth.middleware.js';

const router = Router();

// Middleware para validar resultados
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      ok: false,
      message: 'Errores de validación',
      errors: errors.array(),
    });
  }
  next();
};

// Rutas protegidas - solo para Admin
router.use(verifyToken);
router.use(hasRole(['Admin']));

// GET /api/users - Listar todos los usuarios
router.get('/', userController.getAllUsers);

// GET /api/users/:rut - Obtener un usuario por RUT
router.get('/:rut', userValidations.rutParam, validate, userController.getUserByRut);

// POST /api/users - Crear un nuevo usuario
router.post('/', userValidations.createUser, validate, userController.createUser);

// PUT /api/users/:rut - Actualizar un usuario
router.put('/:rut', userValidations.updateUser, validate, userController.updateUser);

// DELETE /api/users/:rut - Eliminar un usuario
router.delete('/:rut', userValidations.rutParam, validate, userController.deleteUser);

// POST /api/users/:rut/reset-password - Resetear contraseña de un usuario
router.post('/:rut/reset-password', userValidations.resetPassword, validate, userController.resetPassword);

// POST /api/users/change-password - Cambiar contraseña propia (no requiere rol Admin)
router.post(
  '/change-password',
  (req, res, next) => {
    // Temporalmente eliminar el requireRole para esta ruta
    next();
  },
  userValidations.changePassword,
  validate,
  userController.changePassword
);

export default router;
