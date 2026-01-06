import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const prisma = new PrismaClient();

export async function runInitialSetup() {
  console.log('🌱 Iniciando seed de datos...');

  // 1. ESTADOS DE DENUNCIA
  const estados = [
    { Tipo_Estado: 'Recibida' },
    { Tipo_Estado: 'En Revisión' },
    { Tipo_Estado: 'Derivada' },
    { Tipo_Estado: 'Admisible' },
    { Tipo_Estado: 'Inadmisible' },
    { Tipo_Estado: 'En Investigación' },
    { Tipo_Estado: 'Cerrada' },
  ];
  console.log('... Insertando Estados');
  for (const e of estados) {
    const existe = await prisma.estado_Denuncia.findFirst({
      where: { Tipo_Estado: e.Tipo_Estado },
    });
    if (!existe) {
      await prisma.estado_Denuncia.create({ data: e });
    }
  }

  // 2. TIPOS DE DENUNCIA (CATÁLOGO COMPLETO)
  // Nota: Asegúrate de que tu modelo Tipo_Denuncia tenga el campo 'Subtipo' o 'Nombre' alineado
  // y el campo 'Descripcion' agregado en el schema.prisma.

  const tiposDenunciaData = [
    // --- TIPOS GENERALES POR ÁREA (sin subtipos) ---
    {
      id: 100,
      area: 'Género y Equidad',
      nombre: 'Género y Equidad',
      descripcion: 'Denuncias relacionadas con Protocolo de Género y Equidad (DUE 4560).',
    },
    {
      id: 200,
      area: 'Convivencia Estudiantil',
      nombre: 'Convivencia Estudiantil',
      descripcion: 'Denuncias relacionadas con Reglamento de Convivencia Estudiantil (DUE 5415).',
    },

    // --- DERIVACIONES A VRA ---
    {
      id: 301,
      area: 'VRA',
      nombre: 'VRA General',
      descripcion: 'Derivación a Vicerrectoría Académica General.',
    },
    // --- DERIVACIONES A DIRGEGEN ---
    {
      id: 303,
      area: 'Dirgegen',
      nombre: 'Derivación a Dirgegen',
      descripcion: 'Derivación desde VRA hacia Dirección de Género y Equidad.',
    },

    // --- CONVIVENCIA EN CAMPOS CLÍNICOS (NCG N°4) ---
    // Solo un tipo principal, sin subtipos
    {
      id: 300,
      area: 'Campos Clínicos',
      nombre: 'Convivencia en Campos Clínicos',
      descripcion:
        'Denuncias por hechos de maltrato, acoso sexual, hostigamiento docente o discriminación arbitraria que ocurran en el contexto de actividades formativas en campos clínicos (Hospitales, CESFAM, Centros de Salud).',
    },
  ];

  console.log('... Insertando Tipos Detallados');
  for (const tipo of tiposDenunciaData) {
    await prisma.tipo_Denuncia.upsert({
      where: { ID_TipoDe: tipo.id },
      update: {
        Nombre: tipo.nombre,
        Area: tipo.area,
        Descripcion: tipo.descripcion,
      },
      create: {
        ID_TipoDe: tipo.id,
        Nombre: tipo.nombre,
        Area: tipo.area,
        Descripcion: tipo.descripcion,
      },
    });
  }
  console.log('✅ Tipos de denuncia cargados correctamente.');

  // 3. CREAR USUARIO ADMINISTRADOR INICIAL (desde variables de entorno)
  const adminRut = process.env.ADMIN_RUT || '11111111-1';
  const adminExists = await prisma.persona.findUnique({
    where: { Rut: adminRut }
  });

  if (!adminExists) {
    const adminPassword = process.env.ADMIN_PASSWORD || '123456';
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    console.log('... Creando usuario administrador inicial');
    const admin = await prisma.persona.create({
      data: {
        Rut: adminRut,
        Nombre: process.env.ADMIN_NOMBRE || 'Administrador Principal',
        Correo: process.env.ADMIN_CORREO || 'admin@ubb.cl',
        Telefono: process.env.ADMIN_TELEFONO || '+56900000000',
        password: passwordHash,
      },
    });

    await prisma.participante_Caso.create({
      data: {
        ID_Persona: admin.ID,
        Tipo_PC: 'Admin',
      },
    });

    console.log(`✅ Administrador creado: ${admin.Correo}`);
  } else {
    console.log('⚠️ Administrador ya existe');
  }

  console.log('✅ Seed completado exitosamente');
}

// Ejecutar si se llama directamente
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runInitialSetup()
    .catch(e => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
