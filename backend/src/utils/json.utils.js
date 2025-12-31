/**
 * Formatea una fecha a string YYYY-MM-DD sin problemas de zona horaria
 * @param {Date} date - Fecha a formatear
 * @returns {string} - Fecha en formato YYYY-MM-DD
 */
function formatearFechaParaJSON(date) {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return null;
  }
  // Usar UTC para evitar problemas de zona horaria
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Convierte todos los valores BigInt en un objeto a Number para serialización JSON
 * También formatea fechas a YYYY-MM-DD para evitar problemas de zona horaria
 * @param {any} obj - Objeto a transformar
 * @returns {any} - Objeto con BigInt convertidos a Number y fechas formateadas
 */
export function serializeBigInt(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Si es BigInt, convertir a Number
  if (typeof obj === 'bigint') {
    return Number(obj);
  }

  // Si es Date, formatear a YYYY-MM-DD para evitar problemas de zona horaria
  if (obj instanceof Date) {
    return formatearFechaParaJSON(obj);
  }

  // Si es Array, transformar cada elemento
  if (Array.isArray(obj)) {
    return obj.map(item => serializeBigInt(item));
  }

  // Si es Object, transformar recursivamente
  if (typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serializeBigInt(value);
    }
    return result;
  }

  // Para otros tipos (string, number, boolean, etc.), retornar tal cual
  return obj;
}

