/**
 * Genera un slug URL-friendly desde un texto
 * @param text Texto a convertir en slug
 * @returns Slug generado
 */
export function generateSlug(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    // Reemplazar caracteres con tildes
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Reemplazar ñ con n
    .replace(/ñ/g, 'n')
    // Reemplazar espacios y caracteres especiales con guiones
    .replace(/[^a-z0-9]+/g, '-')
    // Eliminar guiones al inicio y final
    .replace(/^-+|-+$/g, '')
    // Reemplazar múltiples guiones con uno solo
    .replace(/-+/g, '-');
}

/**
 * Genera un slug único verificando contra la base de datos
 * @param text Texto base para el slug
 * @param checkExists Función que verifica si el slug ya existe
 * @returns Slug único
 */
export async function generateUniqueSlug(
  text: string,
  checkExists: (slug: string) => Promise<boolean>
): Promise<string> {
  let slug = generateSlug(text);
  let counter = 1;
  
  // Verificar si el slug ya existe
  while (await checkExists(slug)) {
    counter++;
    slug = `${generateSlug(text)}-${counter}`;
  }
  
  return slug;
}
