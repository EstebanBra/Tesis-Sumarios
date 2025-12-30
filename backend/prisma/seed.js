import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { fileURLToPath } from 'url'

const prisma = new PrismaClient()

export async function runInitialSetup() {
  console.log('🌱 Iniciando seed de datos...')

  // 1. ESTADOS DE DENUNCIA
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

  // 2. TIPOS DE DENUNCIA (CATÁLOGO COMPLETO)
  // Nota: Asegúrate de que tu modelo Tipo_Denuncia tenga el campo 'Subtipo' o 'Nombre' alineado
  // y el campo 'Descripcion' agregado en el schema.prisma.

  const tiposDenunciaData = [
    // --- TIPOS GENERALES POR ÁREA (sin subtipos) ---
    { id: 100, area: 'Género y Equidad', nombre: 'Género y Equidad', descripcion: 'Denuncias relacionadas con Protocolo de Género y Equidad (DUE 4560).' },
    { id: 200, area: 'Convivencia Estudiantil', nombre: 'Convivencia Estudiantil', descripcion: 'Denuncias relacionadas con Reglamento de Convivencia Estudiantil (DUE 5415).' },

    // --- DERIVACIONES A VRA ---
    { id: 301, area: 'VRA', nombre: 'VRA General', descripcion: 'Derivación a Vicerrectoría Académica General.' },
    { id: 302, area: 'VRA', nombre: 'Casos Clínicos', descripcion: 'Derivación a área de Casos Clínicos de VRA.' },
    // --- DERIVACIONES A DIRGEGEN ---
    { id: 303, area: 'Dirgegen', nombre: 'Derivación a Dirgegen', descripcion: 'Derivación desde VRA hacia Dirección de Género y Equidad.' },

  ]

  console.log('... Insertando Tipos Detallados')
  for (const tipo of tiposDenunciaData) {
    await prisma.tipo_Denuncia.upsert({
      where: { ID_TipoDe: tipo.id },
      update: {
        Nombre: tipo.nombre,
        Area: tipo.area,
        Descripcion: tipo.descripcion
      },
      create: {
        ID_TipoDe: tipo.id,
        Nombre: tipo.nombre,
        Area: tipo.area,
        Descripcion: tipo.descripcion
      },
    })
  }
  console.log('✅ Tipos de denuncia cargados correctamente.')

  // 3. CREAR USUARIOS (PERSONAS)
  const passwordHash = await bcrypt.hash('123456', 10)

  const usuarios = [
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
      Rut: '33000000-3',
      Nombre: 'Usuario VRA', // Cambié VRAE por VRA si es lo que usas en el área de tipos
      Correo: 'vra@ubb.cl',
      Telefono: '+56933333333',
      password: passwordHash,
      roles: ['VRA']
    },
    {
      Rut: '33333333-3',
      Nombre: 'Usuario VRAE', // Cambié VRAE por VRA si es lo que usas en el área de tipos
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
      Rut: '55555555-5',
      Nombre: 'Usuario Revisor',
      Correo: 'revisor@ubb.cl',
      Telefono: '+56955555555',
      password: passwordHash,
      roles: ['REVISOR']
    },
    // Actores del caso (Sin rol administrativo)
    {
      Rut: '10000000-1',
      Nombre: 'María Soledad Vásquez Soto',
      Correo: 'maria.vasquez@ubb.cl',
      Telefono: '+56910000001',
      password: passwordHash,
      roles: [] // Denunciante potencial
    },
    {
      Rut: '10000001-K',
      Nombre: 'Ricardo Andrés Palma Muñoz',
      Correo: 'ricardo.palma@ubb.cl',
      Telefono: '+56910000002',
      password: passwordHash,
      roles: [] // Denunciado potencial
    },
  ]

  console.log('... Insertando Usuarios y Roles')
  for (const u of usuarios) {
    // Upsert Persona
    const persona = await prisma.persona.upsert({
      where: { Rut: u.Rut },
      update: { password: u.password }, // Actualiza pass si ya existe
      create: {
        Rut: u.Rut,
        Nombre: u.Nombre,
        Correo: u.Correo,
        Telefono: u.Telefono,
        password: u.password
      }
    })

    // Asignar Roles usando ID_Persona
    for (const rol of u.roles) {
      const existeRol = await prisma.participante_Caso.findFirst({
        where: { ID_Persona: persona.ID, Tipo_PC: rol }
      })

      if (!existeRol) {
        await prisma.participante_Caso.create({
          data: {
            ID_Persona: persona.ID,
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