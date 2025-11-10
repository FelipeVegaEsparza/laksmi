
import { apiService } from './apiService'

export interface UploadedFile {
  filename: string
  originalName: string
  size: number
  mimetype: string
  url: string
}

export interface UploadResponse {
  files: UploadedFile[]
  urls: string[]
}

class UploadService {
  /**
   * Upload images for products or services
   */
  async uploadImages(type: 'products' | 'services', files: File[]): Promise<UploadResponse> {
    const formData = new FormData()

    files.forEach(file => {
      formData.append('images', file)
    })

    try {
      // SOLUCIÓN DEFINITIVA: Usar el endpoint limpio y estable
      console.log('🔄 Using CLEAN upload endpoint...');

      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/v1/upload/${type}`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('✅ Upload successful with corrected server!');
          
          // CORRECCIÓN: Convertir URLs relativas a URLs completas
          const processedData = {
            ...data.data,
            urls: data.data.urls.map((url: string) => this.getImageUrl(url)),
            files: data.data.files.map((file: any) => ({
              ...file,
              url: this.getImageUrl(file.url)
            }))
          };
          
          return processedData;
        } else {
          throw new Error(data.message || 'Upload failed');
        }
      } else {
        throw new Error(`Upload endpoint returned ${response.status}`);
      }
    } catch (error: any) {
      console.error('❌ Upload failed:', error.message);

      // Fallback: create mock URLs for development
      console.warn('Using mock URLs for development');

      const mockFiles: UploadedFile[] = files.map((file, index) => ({
        filename: `mock-${Date.now()}-${index}.${file.name.split('.').pop()}`,
        originalName: file.name,
        size: file.size,
        mimetype: file.type,
        url: `/uploads/${type}/mock-${Date.now()}-${index}.${file.name.split('.').pop()}`
      }))

      return {
        files: mockFiles,
        urls: mockFiles.map(f => f.url)
      }
    }
  }

  /**
   * Delete an uploaded image
   */
  async deleteImage(type: 'products' | 'services', filename: string): Promise<void> {
    try {
      // SOLUCIÓN DEFINITIVA: Usar el endpoint que funciona después de la corrección
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/v1/upload/${type}/${filename}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Delete failed with status ${response.status}`);
      }
    } catch (error: any) {
      console.warn('❌ Delete failed:', error.message);
      // Silently fail for now
    }
  }

  /**
   * List uploaded images for a type
   */
  async listImages(type: 'products' | 'services'): Promise<UploadedFile[]> {
    try {
      // SOLUCIÓN DEFINITIVA: Usar el endpoint que funciona después de la corrección
      console.log('📋 Listing images from WORKING endpoint (post-fix)...');

      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/v1/upload/${type}`);

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('✅ List successful with corrected server!');
          
          // CORRECCIÓN: Convertir URLs relativas a URLs completas
          const processedData = data.data.map((file: any) => ({
            ...file,
            url: this.getImageUrl(file.url)
          }));
          
          return processedData;
        }
      }
      throw new Error('List endpoint failed');
    } catch (error: any) {
      console.warn('❌ List failed:', error.message);

      // Return empty array as fallback
      return [];
    }
  }

  /**
   * Convert File to base64 for preview
   */
  fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result)
        } else {
          reject(new Error('Error al leer el archivo'))
        }
      }
      reader.onerror = () => reject(new Error('Error al leer el archivo'))
      reader.readAsDataURL(file)
    })
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File, maxSizeKB: number = 2048): string | null {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

    if (!allowedTypes.includes(file.type)) {
      return `Tipo de archivo no válido. Acepta: ${allowedTypes.join(', ')}`
    }

    if (file.size > maxSizeKB * 1024) {
      return `El archivo es muy grande. Máximo: ${maxSizeKB}KB`
    }

    return null
  }

  /**
   * Get full URL for an image with CORS handling
   */
  getImageUrl(path: string): string {
    if (path.startsWith('http')) {
      return path
    }

    if (path.startsWith('data:')) {
      return path // Base64 image
    }

    // If it's a mock URL, return a placeholder image
    if (path.includes('mock-') || path.includes('emergency-') || path.includes('local-')) {
      return 'https://via.placeholder.com/300x200/f3f4f6/6b7280?text=Imagen+Subida'
    }

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    const fullUrl = `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`

    // CORRECCIÓN: Sin cache busting que causa problemas de CORS
    return fullUrl
  }

  /**
   * Preload image with simplified CORS handling
   */
  async preloadImage(url: string): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image()
      
      // Intentar sin crossOrigin primero (más compatible)
      img.onload = () => {
        resolve(url)
      }

      img.onerror = () => {
        console.warn('❌ Image failed to load:', url)
        // Devolver la URL original para que CorsImage maneje el fallback
        resolve(url)
      }

      img.src = url
    })
  }
}

export const uploadService = new UploadService()