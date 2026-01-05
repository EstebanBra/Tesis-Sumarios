/**
 * Utilidades para validación de formularios
 * Incluye validaciones de RUT chileno, email y teléfono
 */

/**
 * Valida si un RUT es matemáticamente correcto (Módulo 11).
 * Soporta formato 12.345.678-9 o 123456789.
 */
export const validarRut = (rut: string): boolean => {
  if (!rut || rut.trim().length < 2) return false;

  const valor = rut.replace(/[^0-9kK]/g, "").toUpperCase();
  const cuerpo = valor.slice(0, -1);
  const dv = valor.slice(-1);

  if (cuerpo.length < 7) return false;

  let suma = 0;
  let multiplo = 2;

  for (let i = 1; i <= cuerpo.length; i++) {
    const index = multiplo * parseInt(valor.charAt(cuerpo.length - i));
    suma = suma + index;
    if (multiplo < 7) { multiplo = multiplo + 1; } else { multiplo = 2; }
  }

  const dvEsperado = 11 - (suma % 11);
  const dvCalculado = (dvEsperado === 11) ? "0" : (dvEsperado === 10) ? "K" : dvEsperado.toString();

  return dvCalculado === dv;
};

/**
 * Formatea visualmente el RUT mientras el usuario escribe.
 * Entrada: 123456789 -> Salida: 12.345.678-9
 * Limita el formato a:
 * - RUTs bajo 10 millones: X.XXX.XXX-X (7 dígitos + 1 dígito verificador)
 * - RUTs sobre 10 millones: XX.XXX.XXX-X (8 dígitos + 1 dígito verificador)
 */
export const formatearRut = (rut: string): string => {
  // Limpiar el RUT: remover ceros al inicio y solo permitir números y K
  let actual = rut.replace(/^0+/, "").replace(/[^0-9kK]/g, "").toUpperCase();

  if (actual === '') return '';

  // Si solo tiene un carácter
  if (actual.length === 1) {
    // Si es K, no permitirlo todavía (debe haber cuerpo antes)
    if (actual === 'K') return '';
    return actual;
  }

  // Limitar a máximo 9 caracteres (8 dígitos del cuerpo + 1 dígito verificador)
  if (actual.length > 9) {
    actual = actual.slice(0, 9);
  }

  // Separar: los primeros 8 dígitos son el cuerpo, el último es el dígito verificador
  let cuerpo: string;
  let dv: string;

  if (actual.length <= 8) {
    // Si tiene 8 o menos caracteres, todos son parte del cuerpo
    cuerpo = actual;
    dv = '';
  } else {
    // Si tiene 9 caracteres, los primeros 8 son cuerpo y el último es DV
    cuerpo = actual.slice(0, 8);
    dv = actual.slice(8, 9);

    // El dígito verificador solo puede ser un número o K
    if (dv && !/^[0-9kK]$/.test(dv)) {
      dv = '';
      actual = cuerpo;
    }
  }

  // Formatear el cuerpo con puntos cada 3 dígitos desde la derecha
  const cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  // Retornar formateado
  if (dv) {
    return cuerpoFormateado + "-" + dv;
  }

  return cuerpoFormateado;
};

/**
 * Valida un correo electrónico
 *
 * @param email - Email a validar
 * @returns true si el email es válido, false en caso contrario
 */
export function validarEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;

  // Regex para validar formato de email estándar
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Valida un teléfono chileno
 * Acepta formatos con o sin código de país (+56)
 *
 * @param telefono - Teléfono a validar
 * @returns true si el teléfono es válido, false en caso contrario
 */
export function validarTelefono(telefono: string): boolean {
  if (!telefono || typeof telefono !== 'string') return false;

  // Limpiar el teléfono (remover espacios, guiones, paréntesis, etc.)
  const telefonoLimpio = telefono.replace(/[\s\-()]/g, '');

  // Verificar si tiene código de país
  const tieneCodigoPais = telefonoLimpio.startsWith('+56') || telefonoLimpio.startsWith('56');

  let numeroLimpio: string;
  if (tieneCodigoPais) {
    // Si tiene código de país, removerlo
    numeroLimpio = telefonoLimpio.replace(/^\+?56/, '');
  } else {
    numeroLimpio = telefonoLimpio;
  }

  // Validar que solo contenga números
  if (!/^\d+$/.test(numeroLimpio)) return false;

  // Validar largo (9 dígitos para celulares chilenos, 8 para fijos)
  // Aceptamos entre 8 y 9 dígitos
  return numeroLimpio.length >= 8 && numeroLimpio.length <= 9;
}

/**
 * Valida si un campo requerido está lleno
 *
 * @param valor - Valor a validar
 * @returns true si el valor tiene contenido, false en caso contrario
 */
export function validarRequerido(valor: string | null | undefined): boolean {
  return !!(valor && valor.trim().length > 0);
}

/**
 * Limpia un RUT removiendo puntos y guiones, y opcionalmente el dígito verificador
 * Entrada: 12.345.678-9 -> Salida: 12345678 (sin DV) o 12345678-9 (con DV si keepDv=true)
 *
 * @param rut - RUT a limpiar
 * @param keepDv - Si es true, mantiene el dígito verificador. Por defecto false.
 * @returns RUT sin puntos y opcionalmente sin DV
 */
export function limpiarRut(rut: string, keepDv: boolean = false): string {
  if (!rut || typeof rut !== 'string') return '';

  // Remover puntos
  const rutSinPuntos = rut.replace(/\./g, '').trim();

  // Si queremos mantener el DV, retornar tal cual
  if (keepDv) {
    return rutSinPuntos;
  }

  // Remover el guion y todo lo que esté después (el DV)
  const rutSinDv = rutSinPuntos.split('-')[0];
  return rutSinDv;
}

