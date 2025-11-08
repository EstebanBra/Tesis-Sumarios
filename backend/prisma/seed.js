// src/config/initialSetup.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function runInitialSetup() {
  try {
    // Persona base 
    await prisma.persona.upsert({
      where: { Rut: '11111111-1' },
      update: {},
      create: {
        Rut: '11111111-1',
        Nombre: 'Juan Pérez',
        Correo: 'juan.perez@example.com',
        Telefono: '+56 9 1111 1111'
      }
    });

    // Tipos de denuncia
    const [acoso, violencia] = await Promise.all([
      prisma.tipo_Denuncia.upsert({
        where: { ID_TipoDe: 1 },
        update: {},
        create: {
          Nombre: 'Denuncia por acoso sexual, violencia y/o discriminación arbitraria por razones de sexo/género',
          Area: 'Convivencia'
        }
      }),
      prisma.tipo_Denuncia.upsert({
        where: { ID_TipoDe: 2 },
        update: {},
        create: {
          Nombre: 'Denuncia por infracción al Reglamento de Convivencia Estudiantil',
          Area: 'Convivencia'
        }
      })
    ]);

    // Estados
    await Promise.all([
      prisma.estado_Denuncia.upsert({
        where: { ID_EstadoDe: 1 },
        update: {},
        create: { Tipo_Estado: 'Ingreso o recepción de denuncia' }
      }),
      prisma.estado_Denuncia.upsert({
        where: { ID_EstadoDe: 2 },
        update: {},
        create: { Tipo_Estado: 'Análisis de admisibilidad / pertinencia' }
      }),
      prisma.estado_Denuncia.upsert({
        where: { ID_EstadoDe: 3 },
        update: {},
        create: { Tipo_Estado: 'Investigación o sumario' }
      }),
      prisma.estado_Denuncia.upsert({
        where: { ID_EstadoDe: 4 },
        update: {},
        create: { Tipo_Estado: 'Medidas de resguardo' }
      }),
      prisma.estado_Denuncia.upsert({
        where: { ID_EstadoDe: 5 },
        update: {},
        create: { Tipo_Estado: 'Formulación de cargos' }
      }),
      prisma.estado_Denuncia.upsert({
        where: { ID_EstadoDe: 6 },
        update: {},
        create: { Tipo_Estado: 'Descargos y término probatorio' }
      }),
      prisma.estado_Denuncia.upsert({
        where: { ID_EstadoDe: 7 },
        update: {},
        create: { Tipo_Estado: 'Resolución final' }
      }),
      prisma.estado_Denuncia.upsert({
        where: { ID_EstadoDe: 8 },
        update: {},
        create: { Tipo_Estado: 'Recursos' }
      }),
      prisma.estado_Denuncia.upsert({
        where: { ID_EstadoDe: 9 },
        update: {},
        create: { Tipo_Estado: 'Cierre del caso' }
      })
    ]);

    console.log("✅ Datos iniciales creados o actualizados correctamente");
  } catch (error) {
    console.error("❌ Error ejecutando el seed:", error);
  } finally {
    await prisma.$disconnect();
  }
}
