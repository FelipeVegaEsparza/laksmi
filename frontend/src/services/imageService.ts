import axios from 'axios';
import { ImageInfo, ImageUploadOptions } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

const imageApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// Interceptor para agregar token de autenticación
imageApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const imageService = {
  /**
   * Subir una imagen
   */
  uploadImage: async (
    file: File,
    type: 'service' | 'product',
    entityId: string,
    options: ImageUploadOptions = {}
  ): Promise<{ image: ImageInfo; thumbnail: string }> => {
    const formData = new FormData();
    formData.append('image', file);

    const params = new URLSearchParams();
    if (options.width) params.append('width', options.width.toString());
    if (options.height) params.append('height', options.height.toString());
    if (options.quality) params.append('quality', options.quality.toString());
    if (options.format) params.append('format', options.format);

    const response = await imageApi.post(
      `/images/upload/${type}/${entityId}?${params.toString()}`,
      formData
    );

    return response.data.data;
  },

  /**
   * Subir múltiples imágenes
   */
  uploadMultipleImages: async (
    files: File[],
    type: 'service' | 'product',
    entityId: string,
    options: ImageUploadOptions = {}
  ): Promise<{
    uploaded: Array<{ image: ImageInfo; thumbnail: string }>;
    errors: Array<{ filename: string; error: string }>;
    summary: { total: number; successful: number; failed: number };
  }> => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });

    const params = new URLSearchParams();
    if (options.width) params.append('width', options.width.toString());
    if (options.height) params.append('height', options.height.toString());
    if (options.quality) params.append('quality', options.quality.toString());
    if (options.format) params.append('format', options.format);

    const response = await imageApi.post(
      `/images/upload-multiple/${type}/${entityId}?${params.toString()}`,
      formData
    );

    return response.data.data;
  },

  /**
   * Obtener imágenes de una entidad
   */
  getImages: async (
    type: 'service' | 'product',
    entityId: string
  ): Promise<ImageInfo[]> => {
    const response = await imageApi.get(`/images/${type}/${entityId}`);
    return response.data.data;
  },

  /**
   * Eliminar una imagen
   */
  deleteImage: async (
    type: 'service' | 'product',
    filename: string
  ): Promise<void> => {
    await imageApi.delete(`/images/${type}/${filename}`);
  },

  /**
   * Limpiar imágenes huérfanas
   */
  cleanupImages: async (
    type: 'service' | 'product',
    referencedImages: string[]
  ): Promise<{ deletedCount: number }> => {
    const response = await imageApi.post(`/images/cleanup/${type}`, {
      referencedImages
    });
    return response.data.data;
  },

  /**
   * Obtener URL de thumbnail
   */
  getThumbnailUrl: (imageUrl: string): string => {
    const urlParts = imageUrl.split('/');
    const filename = urlParts[urlParts.length - 1];
    urlParts[urlParts.length - 1] = `thumb_${filename}`;
    return urlParts.join('/');
  },

  /**
   * Validar archivo de imagen
   */
  validateImageFile: (file: File): { valid: boolean; error?: string } => {
    // Verificar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Tipo de archivo no permitido. Solo se permiten JPEG, PNG, GIF y WebP.'
      };
    }

    // Verificar tamaño (5MB máximo)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'El archivo es demasiado grande. Tamaño máximo: 5MB.'
      };
    }

    return { valid: true };
  },

  /**
   * Redimensionar imagen en el cliente (opcional)
   */
  resizeImage: (
    file: File,
    maxWidth: number = 800,
    maxHeight: number = 600,
    quality: number = 0.8
  ): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calcular nuevas dimensiones manteniendo proporción
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        // Dibujar imagen redimensionada
        ctx?.drawImage(img, 0, 0, width, height);

        // Convertir a blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              resolve(resizedFile);
            } else {
              reject(new Error('Error al redimensionar imagen'));
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = () => reject(new Error('Error al cargar imagen'));
      img.src = URL.createObjectURL(file);
    });
  }
};