import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { fileURLToPath } from 'url'

const prisma = new PrismaClient()

export async function runInitialSetup() {
  console.log('🌱 Iniciando seed de datos...')

  const estados = [
    { Tipo_Estado: 'Recibida' },
    { Tipo_Estado: 'En Revisión' },
    { Tipo_Estado: 'Derivada' },
    { Tipo_Estado: 'Admisible' },
    { Tipo_Estado: 'Inadmisible' },
    { Tipo_Estado: 'En Investigación' },
    { Tipo_Estado: 'Cerrada' }
  ]
  console.log('... Insertando Estados')
  for (const e of estados) {
    const existe = await prisma.estado_Denuncia.findFirst({ where: { Tipo_Estado: e.Tipo_Estado } })
    if (!existe) {
      await prisma.estado_Denuncia.create({ data: e })
    }
  }

  // Tipos de Denuncia
  const tipos = [
    { Nombre: 'Acoso Sexual', Area: 'DIRGEGEN' },
    { Nombre: 'Violencia de Género', Area: 'DIRGEGEN' },
    { Nombre: 'Discriminación Arbitraria', Area: 'DIRGEGEN' },
    { Nombre: 'Falta a la Convivencia', Area: 'VRA' },
    { Nombre: 'Falta Académica', Area: 'VRA' }
  ]

  console.log('... Insertando Tipos de Denuncia')
  for (const t of tipos) {
    const existe = await prisma.tipo_Denuncia.findFirst({ where: { Nombre: t.Nombre } })
    if (!existe) {
      await prisma.tipo_Denuncia.create({ data: t })
    }
  }


  // 1. Crear Usuarios (Personas)
  const passwordHash = await bcrypt.hash('123456', 10)

  const usuarios = [
    //ingrese un dirgergen
    {
      Rut: '00000000-1',
      Nombre: 'Encargada Dirgegen',
      Correo: 'Dirgegen@ubb.cl',
      Telefono: '+56911111111',
      password: passwordHash,
      roles: ['Dirgegen']
    },
    {
      Rut: '11111111-1',
      Nombre: 'Esteban Bravo',
      Correo: 'esteban@ubb.cl',
      Telefono: '+56911111111',
      password: passwordHash,
      roles: ['Admin']
    },
    {
      Rut: '22222222-2',
      Nombre: 'Francisca Rabanal',
      Correo: 'francisca@ubb.cl',
      Telefono: '+56922222222',
      password: passwordHash,
      roles: ['Admin']
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
    },
    {
      Rut: '10000000-1',
      Nombre: 'María Soledad Vásquez Soto',
      Correo: 'maria.vasquez@ubb.cl',
      Telefono: '+56910000001',
      password: passwordHash,
      roles: [] // Denunciante potencial
    },
    {
      Rut: '10000001-K', // Usando K como dígito verificador para el ejemplo
      Nombre: 'Ricardo Andrés Palma Muñoz',
      Correo: 'ricardo.palma@ubb.cl',
      Telefono: '+56910000002',
      password: passwordHash,
      roles: [] // Denunciado potencial
    },
    {
      Rut: '10000002-3',
      Nombre: 'Javiera Isidora Díaz Lagos',
      Correo: 'javiera.diaz@ubb.cl',
      Telefono: '+56910000003',
      password: passwordHash,
      roles: [] // Testigo potencial
    },
    {
      Rut: '10000003-4',
      Nombre: 'Carlos Alberto Rojas Pérez',
      Correo: 'carlos.rojas@ubb.cl',
      Telefono: '+56910000004',
      password: passwordHash,
      roles: [] 
    },
    {
      Rut: '10000004-5',
      Nombre: 'Daniela Fernanda Castro Vera',
      Correo: 'daniela.castro@ubb.cl',
      Telefono: '+56910000005',
      password: passwordHash,
      roles: [] 
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
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runInitialSetup()
    .catch(e => {
      console.error(e)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}
