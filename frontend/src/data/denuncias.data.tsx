import type { OpcionTipo, OpcionSubtipo } from '@/types/denuncia.types'

export const IconoViolencia = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
)

export const IconoConvivencia = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.499 5.24 50.552 50.552 0 00-2.658.814m-15.482 0A50.55 50.55 0 0112 13.489a50.55 50.55 0 016.744-3.342" />
    </svg>
)

export const TIPOS_DENUNCIA: OpcionTipo[] = [
    {
        id: 1,
        nombre: 'Acoso / Violencia / Discriminación',
        descripcion: 'Denuncias relacionadas con acoso sexual, laboral, violencia de género o discriminación arbitraria (Dirgegen).',
        icono: <IconoViolencia />
    },
    {
        id: 2,
        nombre: 'Convivencia Estudiantil',
        descripcion: 'Denuncias por faltas al Reglamento de Convivencia tales como agresiones entre pares, conflictos cotidianos o daños.',
        icono: <IconoConvivencia />
    },
]

export const SUBTIPOS_DENUNCIA: OpcionSubtipo[] = [
{ id: 101, tipoId: 1, nombre: 'Acoso Sexual', descripcion: 'Te pidieron favores sexuales no deseados, o te hicieron sentir incómodo/a con tocamientos o comentarios sexuales indebidos.' },
{ id: 102, tipoId: 1, nombre: 'Violencia de Género (Física/Psicológica)', descripcion: 'Sufriste agresiones, insultos, gritos o menoscabo por tu género, identidad u orientación sexual.'},
{ id: 103, tipoId: 1, nombre: 'Violencia Digital / Ciberacoso', descripcion: 'Te acosaron, difamaron o expusieron tu intimidad a través de redes sociales, WhatsApp o internet.' },
{ id: 104, tipoId: 1, nombre: 'Discriminación por Género', descripcion: 'Te excluyeron, trataron mal o negaron oportunidades por ser mujer, hombre o de la diversidad sexual.' },
{ id: 105, tipoId: 1, nombre: 'Acoso Laboral (Contexto Universitario)', descripcion: 'Hostigamiento reiterado que afecta tu dignidad o desempeño (si eres estudiante trabajador o funcionario).' },
{ id: 199, tipoId: 1, nombre: 'Otro tipo de situación', descripcion: 'Mi situación de acoso/violencia no encaja en las anteriores.' },
// GRUPO 2: CONVIVENCIA ESTUDIANTIL 
{ id: 201, tipoId: 2, nombre: 'Agresión o Pelea (No género)', descripcion: 'Hubo golpes, empujones o insultos graves con otra persona por conflictos personales o discusiones.' },
{ id: 202, tipoId: 2, nombre: 'Drogas o Alcohol', descripcion: 'Te presionaron a consumir, o viste consumo/venta que pone en riesgo la seguridad dentro de la U.' },
{ id: 203, tipoId: 2, nombre: 'Plagio o Fraude Académico', descripcion: 'Alguien presentó tu trabajo como suyo, compró una tesis o copió en una prueba usando "torpedos" o celular.' },
{ id: 204, tipoId: 2, nombre: 'Suplantación de Identidad', descripcion: 'Alguien se hizo pasar por ti (o por un profe) para dar una prueba, cobrar beneficios o mandar correos.' },
{ id: 205, tipoId: 2, nombre: 'Daños o Robos', descripcion: 'Rompieron infraestructura de la U, equipos, o dañaron tus pertenencias personales.' },
{ id: 206, tipoId: 2, nombre: 'Maltrato Animal', descripcion: 'Viste a alguien agrediendo o maltratando animales dentro de los campus de la universidad.' },
{ id: 207, tipoId: 2, nombre: 'Falsificación de Documentos', descripcion: 'Alguien alteró un certificado médico, un documento de notas o algún papel oficial de la U.' },
{ id: 299, tipoId: 2, nombre: 'Otro tipo de situación', descripcion: 'Mi conflicto o falta de convivencia no encaja en las anteriores.' },
]

export const REGIONES = ['XV Región de Arica y Parinacota', 'I Región de Tarapacá', 'II Región de Antofagasta', 'III Región de Atacama', 'IV Región de Coquimbo', 'V Región de Valparaíso', 'RM Región Metropolitana de Santiago', 'VI Región del Libertador General Bernardo O’Higgins', 'VII Región del Maule', 'XVI Región de Ñuble', 'VIII Región del Bío-Bío', 'IX Región de La Araucanía', 'XIV Región de Los Ríos', 'X Región de Los Lagos', 'XI Región de Aysén del General Carlos Ibáñez del Campo', 'XII Región de Magallanes y de la Antártica Chilena'];
export const COMUNAS = ['Concepción', 'Chillán', 'Los Ángeles', 'Talcahuano', 'San Pedro de la Paz', 'Santiago', 'Valparaíso'];

export const SEDES = [
    { id: 'concepcion', nombre: 'Sede Concepción (Av. Collao 1202)', region: 'VIII Región del Bío-Bío' },
    { id: 'chillan', nombre: 'Sede Chillán (Av. Andrés Bello 720)', region: 'XVI Región de Ñuble' },
]

export const LUGARES_SEDE: Record<string, string[]> = {
    concepcion: [
        'Facultad de Ciencias',
        'Facultad de Ingeniería',
        'Facultad de Arquitectura',
        'Biblioteca Central',
        'Gimnasio',
        'Canchas de Fútbol',
        'Casino',
        'Edificio de Aulas',
        'Laboratorios Centrales',
        'Parque',
    ],
    chillan: [
        'Campus La Castilla',
        'Campus Fernando May',
        'Facultad de Educación y Humanidades',
        'Facultad de Ciencias de la Salud y de los Alimentos',
        'Biblioteca',
        'Gimnasio',
        'Casino',
        'Auditorio',
    ]
}

export const VINCULACIONES = ['Estudiante', 'Funcionario', 'Académico', 'Externo']
