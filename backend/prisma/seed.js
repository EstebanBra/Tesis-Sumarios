import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function runInitialSetup() {
  console.log('🌱 Iniciando seed de datos...')

  // 1. Crear Usuarios (Personas)
  const passwordHash = await bcrypt.hash('123456', 10)

  const usuarios = [
    {
      Rut: '11111111-1',
      Nombre: 'Esteban Bravo',
      Correo: 'esteban@ubb.cl',
      Telefono: '+56911111111',
      password: passwordHash,
      roles: ['Admin', 'VRA']
    },
    {
      Rut: '22222222-2',
      Nombre: 'Francisca Rabanal',
      Correo: 'francisca@ubb.cl',
      Telefono: '+56922222222',
      password: passwordHash,
      roles: ['Admin', 'Fiscal']
    },
    {
      Rut: '33333333-3',
      Nombre: 'Usuario VRAE',
      Correo: 'vrae@ubb.cl',
      Telefono: '+56933333333',
      password: passwordHash,
      roles: ['VRAE']
    },
    {
      Rut: '44444444-4',
      Nombre: 'Usuario Fiscalia',
      Correo: 'fiscalia@ubb.cl',
      Telefono: '+56944444444',
      password: passwordHash,
      roles: ['Fiscalia']
    }
  ]

  for (const u of usuarios) {
    // Crear o actualizar Persona
    await prisma.persona.upsert({
      where: { Rut: u.Rut },
      update: { password: u.password },
      create: {
        Rut: u.Rut,
        Nombre: u.Nombre,
        Correo: u.Correo,
        Telefono: u.Telefono,
        password: u.password
      }
    })

    // Asignar Roles en Participante_Caso
    for (const rol of u.roles) {
      // Verificar si ya tiene el rol para no duplicar (aunque el modelo no tiene unique constraint explícito en Rut+Tipo_PC, es mejor prevenir)
      const existe = await prisma.participante_Caso.findFirst({
        where: { Rut: u.Rut, Tipo_PC: rol }
      })

      if (!existe) {
        await prisma.participante_Caso.create({
          data: {
            Rut: u.Rut,
            Tipo_PC: rol
          }
        })
      }
    }
  }

  console.log('✅ Seed completado exitosamente')
}

// Ejecutar si se llama directamente
if (process.argv[1] === import.meta.url.substring(8)) { // Ajuste simple para detectar ejecución directa
  runInitialSetup()
    .catch(e => {
      console.error(e)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}
