/**
 * Utilidades para manejo de zona horaria de Chile
 * Chile usa UTC-3 (horario estándar) y UTC-4 (horario de verano)
 * Para simplificar, usaremos UTC-3 de forma fija
 */

const CHILE_OFFSET = -3; // UTC-3

/**
 * Convierte una fecha UTC a hora de Chile
 */
export function utcToChile(date: Date): Date {
  const utcTime = date.getTime();
  const chileTime = new Date(utcTime + (CHILE_OFFSET * 60 * 60 * 1000));
  return chileTime;
}

/**
 * Convierte una fecha de hora de Chile a UTC
 */
export function chileToUtc(date: Date): Date {
  const chileTime = date.getTime();
  const utcTime = new Date(chileTime - (CHILE_OFFSET * 60 * 60 * 1000));
  return utcTime;
}

/**
 * Crea una fecha en hora de Chile a partir de componentes
 */
export function createChileDate(year: number, month: number, day: number, hour: number = 0, minute: number = 0): Date {
  // Crear fecha en UTC
  const date = new Date(Date.UTC(year, month, day, hour, minute, 0, 0));
  // Ajustar por el offset de Chile
  return chileToUtc(date);
}

/**
 * Obtiene la hora actual en Chile
 */
export function nowInChile(): Date {
  return utcToChile(new Date());
}

/**
 * Formatea una fecha UTC para mostrar en hora de Chile
 */
export function formatChileTime(date: Date): string {
  const chileDate = utcToChile(date);
  return chileDate.toISOString();
}

/**
 * Parsea una fecha/hora en formato ISO pero interpretándola como hora de Chile
 * Ejemplo: "2025-12-10T15:00:00" se interpreta como 15:00 hora de Chile
 */
export function parseChileDateTime(dateTimeString: string): Date {
  // Parsear la fecha como si fuera UTC
  const parts = dateTimeString.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
  if (!parts) {
    throw new Error('Invalid date format');
  }
  
  const [, year, month, day, hour, minute, second] = parts.map(Number);
  
  // Crear fecha en UTC con los valores dados
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  
  // Ajustar por el offset de Chile (restar 3 horas para convertir de Chile a UTC)
  return new Date(date.getTime() - (CHILE_OFFSET * 60 * 60 * 1000));
}
