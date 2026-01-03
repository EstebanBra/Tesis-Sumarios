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
 */
export const formatearRut = (rut: string): string => {
  const actual = rut.replace(/^0+/, "").replace(/[^0-9kK]/g, "").toUpperCase();
  if (actual === '') return '';

  const cuerpo = actual.slice(0, -1);
  const dv = actual.slice(-1);

  if (actual.length < 2) return actual;

  return cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "-" + dv;
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

