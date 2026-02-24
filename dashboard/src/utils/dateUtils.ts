import { format as dateFnsFormat, parseISO, isValid } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * Formatea una fecha de manera segura, manejando tanto strings ISO como objetos Date
 * @param date - Fecha en formato string ISO o objeto Date
 * @param formatStr - Formato deseado (ej: 'dd/MM/yyyy HH:mm')
 * @param fallback - Texto a mostrar si la fecha es inválida
 * @returns Fecha formateada o texto de fallback
 */
export function safeFormatDate(
  date: Date | string | null | undefined,
  formatStr: string = 'dd/MM/yyyy HH:mm',
  fallback: string = 'Fecha inválida'
): string {
  try {
    if (!date) {
      return fallback
    }

    // Convertir string a Date si es necesario
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date)

    // Validar que la fecha es válida
    if (!isValid(dateObj)) {
      console.warn('Invalid date:', date)
      return fallback
    }

    return dateFnsFormat(dateObj, formatStr, { locale: es })
  } catch (error) {
    console.error('Error formatting date:', error, date)
    return fallback
  }
}

/**
 * Convierte una fecha string o Date a un objeto Date válido
 * @param date - Fecha en formato string ISO o objeto Date
 * @returns Objeto Date válido o null si la fecha es inválida
 */
export function toSafeDate(date: Date | string | null | undefined): Date | null {
  try {
    if (!date) {
      return null
    }

    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date)

    if (!isValid(dateObj)) {
      return null
    }

    return dateObj
  } catch (error) {
    console.error('Error converting to date:', error, date)
    return null
  }
}
