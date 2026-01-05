import prismaExternal from "../config/prismaExternal.js";

const serializarDatos = (data) => {
  return JSON.parse(JSON.stringify(data, (key, value) => {
    if (value && typeof value === 'object' && value.d && value.e) {
      return parseFloat(value);
    }
    if (typeof value === 'string') {
      return value.trim();
    }
    return value;
  }));
};

/**
 * Ejecuta el SP PA_DENUNCIA_CONSULTA_ALUMNO en la base de datos externa.
 * @param {string | number} rut - RUT del alumno.
 * @returns {Promise<Array>} - Retorna el resultado del SP.
 */
export async function consultarAlumnoExterno(rut) {
    try {
    const resultado = await prismaExternal.$queryRaw`EXEC PA_DENUNCIA_CONSULTA_ALUMNO ${rut}`;
    return serializarDatos(resultado);
  } catch (error) {
    console.error(`Error consultando alumno externo (RUT: ${rut}):`, error);
    throw new Error("Error al obtener datos del alumno desde el sistema externo.");
  }
}

/**
 * Ejecuta el SP PA_DENUNCIA_CONSULTA_PERSONAL en la base de datos externa.
 * @param {string | number} rut - RUT del personal.
 * @returns {Promise<Array>} - Retorna el resultado del SP.
 */
export async function consultarPersonalExterno(rut) {
  try {
    const resultado = await prismaExternal.$queryRaw`EXEC PA_DENUNCIA_CONSULTA_PERSONAL ${rut}`;
    return serializarDatos(resultado);
  } catch (error) {
    console.error(`Error consultando personal externo (RUT: ${rut}):`, error);
    throw new Error("Error al obtener datos del personal desde el sistema externo.");
  }
}

/**
 * Obtiene y unifica los datos de Alumno y Personal basados en el RUT proporcionado.
 * @param {string | number} rut - RUT del individuo a consultar.
 * @returns {Promise<Object|null>} - Retorna un objeto con los datos unificados o null si no se encuentran datos.
 */
export async function obtenerDatosUnificados(rut) {
  const [alumnoData, personalData] = await Promise.all([
    consultarAlumnoExterno(rut),
    consultarPersonalExterno(rut)
  ]);

  const alumno = alumnoData[0] || null;
  const personal = personalData[0] || null;

  if (!alumno && !personal) {
    return null;
  }

  const resultado = {
    rut: rut,
    dv: alumno?.Dv || personal?.Dv,
    nombre_completo: '',
    nombres: '',
    apellido_paterno: '',
    apellido_materno: '',
    email: '',
    telefono: '',
    roles: [],
    detalles: {}
  };

  // 3. Lógica de fusión (Prioridad: Personal > Alumno para datos básicos)

  if (personal) {
    resultado.roles.push('Personal');
    resultado.nombres = personal.Nombre;
    resultado.apellido_paterno = personal.Apellido_paterno;
    resultado.apellido_materno = personal.Apellido_materno;
    resultado.email = personal.Mail;
    resultado.telefono = personal.Fono;

    resultado.detalles.personal = {
      unidad: personal.Reparticion || personal.Centro_costo,
      cargo: personal.Cargo || personal.Funcion,
      condicion: personal.Condicion,
      tipo: personal.Tipo
    };
  }

  // Procesar Alumno
  if (alumno) {
    resultado.roles.push('Alumno');

    if (!resultado.nombres) resultado.nombres = alumno.Nombre;
    if (!resultado.apellido_paterno) resultado.apellido_paterno = alumno.Apellido_paterno;
    if (!resultado.apellido_materno) resultado.apellido_materno = alumno.Apellido_materno;

    if (resultado.email && alumno.Email && resultado.email !== alumno.Email) {
        resultado.email_secundario = alumno.Email;
    } else if (!resultado.email) {
        resultado.email = alumno.Email;
    }

    if (!resultado.telefono) resultado.telefono = alumno.Fono;

    resultado.detalles.alumno = {
      carrera: alumno.Carrera,
      sede: alumno.Sede,
      email_opcional: alumno.Email_opcional
    };
  }

  resultado.nombre_completo = `${resultado.nombres} ${resultado.apellido_paterno} ${resultado.apellido_materno || ''}`.trim();

return resultado;
}
