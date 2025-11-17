/**
 * Utilidades para manejo de texto
 */

/**
 * Extrae texto plano de HTML
 * @param html - String con HTML
 * @returns Texto plano sin etiquetas HTML
 */
export function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  
  // Crear un elemento temporal para parsear el HTML
  if (typeof document !== 'undefined') {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  }
  
  // Fallback para SSR: remover etiquetas HTML con regex
  return html
    .replace(/<[^>]*>/g, '') // Remover etiquetas HTML
    .replace(/&nbsp;/g, ' ') // Reemplazar &nbsp;
    .replace(/&amp;/g, '&')  // Reemplazar &amp;
    .replace(/&lt;/g, '<')   // Reemplazar &lt;
    .replace(/&gt;/g, '>')   // Reemplazar &gt;
    .replace(/&quot;/g, '"') // Reemplazar &quot;
    .replace(/&#39;/g, "'")  // Reemplazar &#39;
    .replace(/\s+/g, ' ')    // Normalizar espacios
    .trim();
}

/**
 * Trunca texto a un número máximo de caracteres
 * @param text - Texto a truncar
 * @param maxLength - Longitud máxima
 * @returns Texto truncado con "..." si es necesario
 */
export function truncateText(text: string, maxLength: number = 100): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Extrae y trunca texto plano de HTML
 * @param html - String con HTML
 * @param maxLength - Longitud máxima
 * @returns Texto plano truncado
 */
export function getPlainTextPreview(html: string | null | undefined, maxLength: number = 100): string {
  const plainText = stripHtml(html);
  return truncateText(plainText, maxLength);
}
