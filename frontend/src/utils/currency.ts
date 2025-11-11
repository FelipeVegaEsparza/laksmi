/**
 * Formatea un precio en pesos chilenos (CLP)
 * @param price - Precio numérico
 * @returns String formateado con separador de miles y sin decimales
 * @example formatPrice(15000) => "$15.000"
 */
export function formatPrice(price: number | string): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numPrice)) {
    return '$0';
  }

  // Formatear sin decimales y con separador de miles (punto)
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numPrice);
}

/**
 * Formatea un precio sin el símbolo de moneda
 * @param price - Precio numérico
 * @returns String formateado solo con el número
 * @example formatPriceNumber(15000) => "15.000"
 */
export function formatPriceNumber(price: number | string): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numPrice)) {
    return '0';
  }

  return new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numPrice);
}
