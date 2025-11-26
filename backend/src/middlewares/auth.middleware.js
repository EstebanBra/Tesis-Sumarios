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
            const { rut } = req.user

            // Buscar roles en Participante_Caso
            const rolesUsuario = await prisma.participante_Caso.findMany({
                where: { Rut: rut },
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

export const isAdmin = hasRole(['Admin', 'VRA', 'VRAE', 'Fiscal', 'Fiscalia','Dirgergen']) // Ajustar según necesidad
