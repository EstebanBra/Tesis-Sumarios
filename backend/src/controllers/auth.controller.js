import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { JWT_SECRET, JWT_EXPIRES_IN, COOKIE_NAME } from '../config/auth.config.js'

const prisma = new PrismaClient()

export const login = async (req, res) => {
    const { rut, password } = req.body

    try {
        // 1. Buscar usuario
        const usuario = await prisma.persona.findUnique({
            where: { Rut: rut }
        })

        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' })
        }

        // 2. Verificar password
        if (!usuario.password) {
            return res.status(401).json({ message: 'Credenciales inválidas (Sin contraseña configurada)' })
        }

        const isPasswordValid = await bcrypt.compare(password, usuario.password)
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Credenciales inválidas' })
        }

        // 3. Obtener roles
        const rolesData = await prisma.participante_Caso.findMany({
            where: { Rut: rut },
            select: { Tipo_PC: true }
        })
        const roles = rolesData.map(r => r.Tipo_PC)

        // 4. Generar Token
        const token = jwt.sign(
            { rut: usuario.Rut, nombre: usuario.Nombre, roles },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        )

        // 5. Setear Cookie
        res.cookie(COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 horas
        })

        res.json({
            message: 'Login exitoso',
            user: {
                rut: usuario.Rut,
                nombre: usuario.Nombre,
                email: usuario.Correo,
                roles
            }
        })

    } catch (error) {
        console.error('Login error:', error)
        res.status(500).json({ message: 'Error en el servidor' })
    }
}

export const logout = (req, res) => {
    res.clearCookie(COOKIE_NAME)
    res.json({ message: 'Logout exitoso' })
}

export const me = async (req, res) => {
    try {
        const { rut } = req.user

        const usuario = await prisma.persona.findUnique({
            where: { Rut: rut }
        })

        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' })
        }

        const rolesData = await prisma.participante_Caso.findMany({
            where: { Rut: rut },
            select: { Tipo_PC: true }
        })
        const roles = rolesData.map(r => r.Tipo_PC)

        res.json({
            rut: usuario.Rut,
            nombre: usuario.Nombre,
            email: usuario.Correo,
            roles
        })
    } catch (error) {
        console.error('Me error:', error)
        res.status(500).json({ message: 'Error en el servidor' })
    }
}
