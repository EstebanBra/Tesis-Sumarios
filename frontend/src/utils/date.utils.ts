/**
 * Utilidades para manejo seguro de fechas sin problemas de zona horaria
 * 
 * Estas funciones están diseñadas para trabajar con fechas que representan
 * solo días (sin hora), evitando el problema de "off-by-one day" causado
 * por conversiones de zona horaria.
 */

/**
 * Formatea una fecha ISO string o Date a formato legible en español
 * Extrae solo la parte de fecha sin considerar la zona horaria
 * 
 * @param fecha - String ISO o objeto Date
 * @param formato - Formato deseado ('short' | 'long' | 'iso')
 * @returns String formateado o '-' si la fecha es inválida
 */
export function formatearFecha(
  fecha: string | Date | null | undefined,
  formato: 'short' | 'long' | 'iso' = 'short'
): string {
  if (!fecha) return '-';
  
  try {
    // Si es string, parsear como fecha
    const dateObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
    
    // Validar que sea una fecha válida
    if (isNaN(dateObj.getTime())) return '-';
    
    // Extraer componentes de fecha en UTC para evitar problemas de zona horaria
    const year = dateObj.getUTCFullYear();
    const month = dateObj.getUTCMonth();
    const day = dateObj.getUTCDate();
    
    // Crear fecha local usando los componentes UTC (esto preserva el día correcto)
    const fechaLocal = new Date(year, month, day);
    
    switch (formato) {
      case 'long':
        return fechaLocal.toLocaleDateString('es-CL', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      case 'iso':
        // Retornar en formato YYYY-MM-DD
        return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      case 'short':
      default:
        return fechaLocal.toLocaleDateString('es-CL', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
    }
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return '-';
  }
}

/**
 * Formatea una fecha para mostrar en formato corto (DD/MM/YYYY)
 */
export function formatearFechaCorta(fecha: string | Date | null | undefined): string {
  return formatearFecha(fecha, 'short');
}

/**
 * Formatea una fecha para mostrar en formato largo (ej: "2 de diciembre, 2025")
 */
export function formatearFechaLarga(fecha: string | Date | null | undefined): string {
  return formatearFecha(fecha, 'long');
}

/**
 * Convierte una fecha a string YYYY-MM-DD para inputs de tipo date
 * Útil para pre-llenar campos de fecha
 */
export function fechaParaInput(fecha: string | Date | null | undefined): string {
  if (!fecha) return '';
  
  try {
    const dateObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
    if (isNaN(dateObj.getTime())) return '';
    
    // Usar UTC para evitar problemas de zona horaria
    const year = dateObj.getUTCFullYear();
    const month = dateObj.getUTCMonth();
    const day = dateObj.getUTCDate();
    
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  } catch (error) {
    console.error('Error convirtiendo fecha para input:', error);
    return '';
  }
}

/**
 * Compara dos fechas solo por día (ignora hora)
 * Retorna:
 * - -1 si fecha1 < fecha2
 * - 0 si fecha1 === fecha2
 * - 1 si fecha1 > fecha2
 */
export function compararFechas(
  fecha1: string | Date | null | undefined,
  fecha2: string | Date | null | undefined
): number {
  if (!fecha1 || !fecha2) return 0;
  
  try {
    const d1 = typeof fecha1 === 'string' ? new Date(fecha1) : fecha1;
    const d2 = typeof fecha2 === 'string' ? new Date(fecha2) : fecha2;
    
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
    
    // Comparar solo por fecha (ignorar hora)
    const date1 = new Date(Date.UTC(d1.getUTCFullYear(), d1.getUTCMonth(), d1.getUTCDate()));
    const date2 = new Date(Date.UTC(d2.getUTCFullYear(), d2.getUTCMonth(), d2.getUTCDate()));
    
    if (date1 < date2) return -1;
    if (date1 > date2) return 1;
    return 0;
  } catch (error) {
    console.error('Error comparando fechas:', error);
    return 0;
  }
}

