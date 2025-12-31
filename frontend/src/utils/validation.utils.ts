/**
 * Utilidades para validación de formularios
 * Incluye validaciones de RUT chileno, email y teléfono
 */

/**
 * Limpia un RUT removiendo puntos y guiones
 */
export function limpiarRut(rut: string): string {
  return rut.replace(/[.-]/g, '').toUpperCase();
}

/**
 * Valida un RUT chileno usando el algoritmo módulo 11
 * Acepta formatos con o sin puntos y guion
 * 
 * @param rut - RUT a validar (ej: "12.345.678-9" o "12345678-9")
 * @returns true si el RUT es válido, false en caso contrario
 */
export function validarRut(rut: string): boolean {
  if (!rut || typeof rut !== 'string') return false;
  
  // Limpiar el RUT
  const rutLimpio = limpiarRut(rut);
  
  // Debe tener al menos 8 caracteres (sin contar el guion) y máximo 9
  // Formato esperado después de limpiar: "123456789" o "12345678K"
  if (rutLimpio.length < 8 || rutLimpio.length > 9) return false;
  
  // Separar el cuerpo del dígito verificador
  const cuerpo = rutLimpio.slice(0, -1);
  const dv = rutLimpio.slice(-1).toUpperCase();
  
  // El cuerpo debe ser solo números
  if (!/^\d+$/.test(cuerpo)) return false;
  
  // El dígito verificador debe ser un número o 'K'
  if (!/^[0-9K]$/.test(dv)) return false;
  
  // Calcular el dígito verificador esperado
  let suma = 0;
  let multiplicador = 2;
  
  // Iterar desde el final del cuerpo hacia el inicio
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }
  
  const resto = suma % 11;
  let dvEsperado: string;
  
  if (resto < 2) {
    dvEsperado = String(11 - resto);
  } else if (resto === 2) {
    dvEsperado = 'K';
  } else {
    dvEsperado = String(11 - resto);
  }
  
  // Comparar dígitos verificadores
  return dv === dvEsperado;
}

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
  const telefonoLimpio = telefono.replace(/[\s\-\(\)]/g, '');
  
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

