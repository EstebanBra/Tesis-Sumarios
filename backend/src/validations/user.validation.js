import { body, param } from 'express-validator';

export const userValidations = {
  // Validación para crear usuario
  createUser: [
    body('Rut')
      .trim()
      .notEmpty().withMessage('El RUT es obligatorio')
      .matches(/^\d{7,8}-[\dkK]$/).withMessage('Formato de RUT inválido (ej: 12345678-9)'),
    body('Nombre')
      .trim()
      .notEmpty().withMessage('El nombre es obligatorio')
      .isLength({ min: 3, max: 255 }).withMessage('El nombre debe tener entre 3 y 255 caracteres'),
    body('Correo')
      .trim()
      .notEmpty().withMessage('El correo es obligatorio')
      .isEmail().withMessage('Formato de correo inválido')
      .normalizeEmail(),
    body('Telefono')
      .trim()
      .notEmpty().withMessage('El teléfono es obligatorio')
      .matches(/^\+?56\d{9}$/).withMessage('Formato de teléfono inválido (ej: +56912345678)'),
    body('password')
      .notEmpty().withMessage('La contraseña es obligatoria')
      .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('roles')
      .notEmpty().withMessage('Los roles son obligatorios')
      .isArray({ min: 1 }).withMessage('Debe proporcionar al menos un rol')
      .custom((roles) => {
        const validRoles = ['Admin', 'Dirgegen', 'VRA', 'VRAE', 'Fiscalia', 'REVISOR', 'CampoClinico'];
        return roles.every(role => validRoles.includes(role));
      }).withMessage('Uno o más roles no son válidos'),
    body('enviarCorreo')
      .optional()
      .isBoolean().withMessage('El campo enviarCorreo debe ser verdadero o falso'),
  ],

  // Validación para actualizar usuario
  updateUser: [
    param('rut')
      .trim()
      .notEmpty().withMessage('El RUT es obligatorio')
      .matches(/^\d{7,8}-[\dkK]$/).withMessage('Formato de RUT inválido'),
    body('Nombre')
      .optional()
      .trim()
      .isLength({ min: 3, max: 255 }).withMessage('El nombre debe tener entre 3 y 255 caracteres'),
    body('Correo')
      .optional()
      .trim()
      .isEmail().withMessage('Formato de correo inválido')
      .normalizeEmail(),
    body('Telefono')
      .optional()
      .trim()
      .matches(/^\+?56\d{9}$/).withMessage('Formato de teléfono inválido'),
    body('password')
      .optional()
      .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('roles')
      .optional()
      .isArray().withMessage('Los roles deben ser un array')
      .custom((roles) => {
        const validRoles = ['Admin', 'Dirgegen', 'VRA', 'VRAE', 'Fiscalia', 'REVISOR', 'CampoClinico'];
        return roles.every(role => validRoles.includes(role));
      }).withMessage('Uno o más roles no son válidos'),
  ],

  // Validación para obtener/eliminar por RUT
  rutParam: [
    param('rut')
      .trim()
      .notEmpty().withMessage('El RUT es obligatorio')
      .matches(/^\d{7,8}-[\dkK]$/).withMessage('Formato de RUT inválido'),
  ],

  // Validación para cambiar contraseña
  changePassword: [
    body('oldPassword')
      .notEmpty().withMessage('La contraseña actual es obligatoria'),
    body('newPassword')
      .notEmpty().withMessage('La nueva contraseña es obligatoria')
      .isLength({ min: 6 }).withMessage('La nueva contraseña debe tener al menos 6 caracteres')
      .custom((value, { req }) => value !== req.body.oldPassword)
      .withMessage('La nueva contraseña debe ser diferente a la actual'),
  ],

  // Validación para resetear contraseña
  resetPassword: [
    param('rut')
      .trim()
      .notEmpty().withMessage('El RUT es obligatorio')
      .matches(/^\d{7,8}-[\dkK]$/).withMessage('Formato de RUT inválido'),
    body('newPassword')
      .notEmpty().withMessage('La nueva contraseña es obligatoria')
      .isLength({ min: 6 }).withMessage('La nueva contraseña debe tener al menos 6 caracteres'),
  ],
};
