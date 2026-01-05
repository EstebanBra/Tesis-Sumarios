import jwt from 'jsonwebtoken'
import { JWT_SECRET, COOKIE_NAME } from '../config/auth.config.js'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const verifyToken = async (req, res, next) => {
    const token = req.cookies[COOKIE_NAME]

    if (!token) {
        return res.status(401).json({ message: 'No autorizado: No se encontró token' })
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET)
        req.user = decoded
        next()
    } catch (error) {
        return res.status(401).json({ message: 'No autorizado: Token inválido' })
    }
}

export const hasRole = (rolesPermitidos) => {
    return async (req, res, next) => {
        try {
            const { id } = req.user  // Ahora usamos ID del token

            // Buscar roles en Participante_Caso
            const rolesUsuario = await prisma.participante_Caso.findMany({
                where: { ID_Persona: id },
                select: { Tipo_PC: true }
            })

            const rolesNombres = rolesUsuario.map(r => r.Tipo_PC)

            // Verificar si tiene alguno de los roles permitidos
            const tienePermiso = rolesPermitidos.some(rol => rolesNombres.includes(rol))

            if (!tienePermiso) {
                return res.status(403).json({ message: 'Prohibido: No tienes permisos suficientes' })
            }

            next()
        } catch (error) {
            console.error('Error verificando roles:', error)
            return res.status(500).json({ message: 'Error interno verificando permisos' })
        }
    }
}

export const isAdmin = hasRole(['Admin', 'VRA', 'VRAE', 'Fiscal', 'Fiscalia', 'Dirgergen']) // Ajustar según necesidad

/**
 * Middleware para verificar tokens temporales de denuncias públicas
 * Estos tokens se generan después de la verificación de email
 */
export const verifyTemporaryToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No se encontró token de verificación' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Verificar que sea un token temporal de denuncia pública
    if (decoded.tipo !== 'denuncia_publica') {
      return res.status(401).json({ message: 'Token inválido para esta operación' });
    }

    // Agregar datos del denunciante verificado al request
    req.denuncianteVerificado = {
      rut: decoded.rut
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'El token de verificación ha expirado. Por favor, verifica tu email nuevamente.'
      });
    }
    return res.status(401).json({ message: 'Token de verificación inválido' });
  }
};
