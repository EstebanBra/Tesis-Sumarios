/**
 * Convierte todos los valores BigInt en un objeto a Number para serialización JSON
 * @param {any} obj - Objeto a transformar
 * @returns {any} - Objeto con BigInt convertidos a Number
 */
export function serializeBigInt(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Si es BigInt, convertir a Number
  if (typeof obj === 'bigint') {
    return Number(obj);
  }

  // Si es Date, mantener como está (se serializa correctamente)
  if (obj instanceof Date) {
    return obj;
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

