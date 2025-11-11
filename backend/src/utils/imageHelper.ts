/**
 * Helper functions for image URL handling
 */

/**
 * Decode HTML entities in image URLs
 */
export function decodeImageUrl(url: string): string {
  if (!url) return '';
  
  return url
    .replace(/&#x2F;/g, '/')
    .replace(/&#x3A;/g, ':')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/**
 * Decode HTML entities in an array of image URLs
 */
export function decodeImageUrls(urls: string[]): string[] {
  if (!urls || !Array.isArray(urls)) return [];
  return urls.map(url => decodeImageUrl(url));
}

/**
 * Clean and normalize image URL
 */
export function normalizeImageUrl(url: string): string {
  if (!url) return '';
  
  // First decode any HTML entities
  let cleanUrl = decodeImageUrl(url);
  
  // Remove any double slashes except after protocol
  cleanUrl = cleanUrl.replace(/([^:]\/)\/+/g, '$1');
  
  return cleanUrl;
}

/**
 * Get full image URL from relative path
 */
export function getFullImageUrl(path: string, baseUrl?: string): string {
  if (!path) return '';
  
  // If already a full URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return normalizeImageUrl(path);
  }
  
  // If it's a data URL, return as is
  if (path.startsWith('data:')) {
    return path;
  }
  
  const base = baseUrl || process.env.API_URL || 'http://localhost:3000';
  const cleanPath = normalizeImageUrl(path);
  const separator = cleanPath.startsWith('/') ? '' : '/';
  
  return `${base}${separator}${cleanPath}`;
}

/**
 * Process service/product data to clean image URLs
 */
export function processImageUrls<T extends { images?: string[] }>(data: T): T {
  if (!data || !data.images) return data;
  
  return {
    ...data,
    images: decodeImageUrls(data.images)
  };
}

/**
 * Process array of service/product data to clean image URLs
 */
export function processArrayImageUrls<T extends { images?: string[] }>(dataArray: T[]): T[] {
  if (!dataArray || !Array.isArray(dataArray)) return [];
  return dataArray.map(item => processImageUrls(item));
}
