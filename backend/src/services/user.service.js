import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';
import { enviarCorreo as enviarCorreoEmail } from '../config/email.config.js';

export const userService = {
  /**
   * Crear un nuevo usuario con roles
   */
  async createUser(data) {
    const { Rut, Nombre, Correo, Telefono, password, roles, enviarCorreo } = data;

    // Validar que se proporcionen roles
    if (!roles || roles.length === 0) {
      throw new Error('Debe proporcionar al menos un rol para el usuario');
    }

    // Verificar si el usuario ya existe
    const exists = await prisma.persona.findUnique({
      where: { Rut }
    });

    if (exists) {
      throw new Error('El RUT ya está registrado');
    }

    // Verificar que el correo no esté en uso
    const emailExists = await prisma.persona.findFirst({
      where: { Correo }
    });

    if (emailExists) {
      throw new Error('El correo ya está registrado');
    }

    // Hash de password
    const passwordHash = await bcrypt.hash(password, 10);

    // Crear usuario
    const persona = await prisma.persona.create({
      data: {
        Rut,
        Nombre,
        Correo,
        Telefono,
        password: passwordHash,
      },
    });

    // Asignar roles
    for (const rol of roles) {
      await prisma.participante_Caso.create({
        data: {
          ID_Persona: persona.ID,
          Tipo_PC: rol,
        },
      });
    }

    // Enviar correo si está habilitado
    if (enviarCorreo) {
      try {
        const rolesTexto = roles.join(', ');
        await enviarCorreoEmail({
          to: Correo,
          subject: 'Bienvenido al Sistema de Denuncias UBB',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1e40af;">Bienvenido al Sistema de Denuncias UBB</h2>
              <p>Hola <strong>${Nombre}</strong>,</p>
              <p>Se ha creado una cuenta para ti en el Sistema de Denuncias de la Universidad del Bío-Bío.</p>

              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Tus credenciales de acceso:</h3>
                <p><strong>RUT:</strong> ${Rut}</p>
                <p><strong>Contraseña:</strong> ${password}</p>
                <p><strong>Rol(es):</strong> ${rolesTexto}</p>
              </div>

              <p>Por favor, inicia sesión en el sistema y cambia tu contraseña en tu primer acceso.</p>
              <p style="margin-top: 30px; font-size: 12px; color: #6b7280;">
                Este es un correo automático, por favor no responder.
              </p>
            </div>
          `,
          text: `Bienvenido al Sistema de Denuncias UBB\n\nHola ${Nombre},\n\nTus credenciales:\nRUT: ${Rut}\nContraseña: ${password}\nRol(es): ${rolesTexto}\n\nPor favor, cambia tu contraseña en tu primer acceso.`
        });
      } catch (emailError) {
        console.error('Error al enviar correo de bienvenida:', emailError);
        // No lanzar error, solo registrar - el usuario fue creado exitosamente
      }
    }    // Retornar usuario sin password
    const { password: _, ...userWithoutPassword } = persona;
    return {
      ...userWithoutPassword,
      roles: roles,
    };
  },

  /**
   * Obtener todos los usuarios con sus roles
   */
  async getAllUsers() {
    const personas = await prisma.persona.findMany({
      include: {
        participantes_caso: {
          select: {
            Tipo_PC: true,
          },
        },
      },
    });

    return personas.map((persona) => {
      const { password, participantes_caso, ...rest } = persona;
      return {
        ...rest,
        roles: participantes_caso.map((pc) => pc.Tipo_PC),
      };
    });
  },

  /**
   * Obtener un usuario por RUT
   */
  async getUserByRut(Rut) {
    const persona = await prisma.persona.findUnique({
      where: { Rut },
      include: {
        participantes_caso: {
          select: {
            Tipo_PC: true,
          },
        },
      },
    });

    if (!persona) {
      throw new Error('Usuario no encontrado');
    }

    const { password, participantes_caso, ...rest } = persona;
    return {
      ...rest,
      roles: participantes_caso.map((pc) => pc.Tipo_PC),
    };
  },

  /**
   * Actualizar un usuario
   */
  async updateUser(Rut, data) {
    const { Nombre, Correo, Telefono, password, roles } = data;

    const persona = await prisma.persona.findUnique({
      where: { Rut },
    });

    if (!persona) {
      throw new Error('Usuario no encontrado');
    }

    // Verificar si el correo ya está en uso por otro usuario
    if (Correo && Correo !== persona.Correo) {
      const emailExists = await prisma.persona.findFirst({
        where: {
          Correo,
          NOT: { Rut }
        }
      });

      if (emailExists) {
        throw new Error('El correo ya está registrado por otro usuario');
      }
    }

    const updateData = {};
    if (Nombre) updateData.Nombre = Nombre;
    if (Correo) updateData.Correo = Correo;
    if (Telefono) updateData.Telefono = Telefono;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Actualizar datos básicos
    const updatedPersona = await prisma.persona.update({
      where: { Rut },
      data: updateData,
    });

    // Actualizar roles si se proporcionan
    if (roles !== undefined && Array.isArray(roles)) {
      // Eliminar roles actuales
      await prisma.participante_Caso.deleteMany({
        where: { ID_Persona: persona.ID },
      });

      // Crear nuevos roles
      for (const rol of roles) {
        await prisma.participante_Caso.create({
          data: {
            ID_Persona: persona.ID,
            Tipo_PC: rol,
          },
        });
      }
    }

    // Retornar usuario actualizado sin password
    const { password: _, ...userWithoutPassword } = updatedPersona;
    return {
      ...userWithoutPassword,
      roles: roles || [],
    };
  },

  /**
   * Eliminar un usuario
   */
  async deleteUser(Rut) {
    const persona = await prisma.persona.findUnique({
      where: { Rut },
    });

    if (!persona) {
      throw new Error('Usuario no encontrado');
    }

    // Eliminar roles primero
    await prisma.participante_Caso.deleteMany({
      where: { ID_Persona: persona.ID },
    });

    // Eliminar usuario
    await prisma.persona.delete({
      where: { Rut },
    });

    return { message: 'Usuario eliminado exitosamente' };
  },

  /**
   * Cambiar contraseña de un usuario
   */
  async changePassword(Rut, oldPassword, newPassword) {
    const persona = await prisma.persona.findUnique({
      where: { Rut },
    });

    if (!persona) {
      throw new Error('Usuario no encontrado');
    }

    // Verificar contraseña actual
    const isValidPassword = await bcrypt.compare(oldPassword, persona.password);
    if (!isValidPassword) {
      throw new Error('Contraseña actual incorrecta');
    }

    // Actualizar contraseña
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.persona.update({
      where: { Rut },
      data: { password: passwordHash },
    });

    return { message: 'Contraseña actualizada exitosamente' };
  },

  /**
   * Resetear contraseña de un usuario (solo admin)
   */
  async resetPassword(Rut, newPassword) {
    const persona = await prisma.persona.findUnique({
      where: { Rut },
    });

    if (!persona) {
      throw new Error('Usuario no encontrado');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.persona.update({
      where: { Rut },
      data: { password: passwordHash },
    });

    return { message: 'Contraseña reseteada exitosamente' };
  },
};
