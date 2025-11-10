import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { deleteFile, moveFile, getFileInfo } from '../middleware/upload';

export interface ImageProcessingOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export interface ImageInfo {
  id: string;
  originalName: string;
  filename: string;
  path: string;
  url: string;
  size: number;
  mimetype: string;
  width?: number;
  height?: number;
  createdAt: Date;
}

export class ImageService {
  private static baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  
  /**
   * Procesar y guardar imagen
   */
  static async processAndSaveImage(
    file: Express.Multer.File,
    type: 'service' | 'product',
    entityId: string,
    options: ImageProcessingOptions = {}
  ): Promise<ImageInfo> {
    const {
      width = 800,
      height = 600,
      quality = 85,
      format = 'webp'
    } = options;

    // Generar nombre de archivo único
    const timestamp = Date.now();
    const randomId = Math.round(Math.random() * 1E9);
    const filename = `${type}_${entityId}_${timestamp}_${randomId}.${format}`;
    
    // Rutas
    const uploadDir = `uploads/${type}s`;
    const outputPath = path.join(uploadDir, filename);
    const thumbnailPath = path.join(uploadDir, `thumb_${filename}`);

    // Crear directorio si no existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    try {
      // Procesar imagen principal
      const imageBuffer = await sharp(file.path)
        .resize(width, height, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .toFormat(format, { quality })
        .toBuffer();

      // Guardar imagen principal
      await fs.promises.writeFile(outputPath, imageBuffer);

      // Crear thumbnail
      await sharp(file.path)
        .resize(300, 200, { 
          fit: 'cover',
          position: 'center'
        })
        .toFormat(format, { quality: 70 })
        .toFile(thumbnailPath);

      // Obtener metadatos de la imagen procesada
      const metadata = await sharp(imageBuffer).metadata();

      // Eliminar archivo temporal
      await deleteFile(file.path);

      // Crear información de la imagen
      const imageInfo: ImageInfo = {
        id: `${timestamp}_${randomId}`,
        originalName: file.originalname,
        filename: filename,
        path: outputPath,
        url: `${this.baseUrl}/uploads/${type}s/${filename}`,
        size: imageBuffer.length,
        mimetype: `image/${format}`,
        width: metadata.width,
        height: metadata.height,
        createdAt: new Date()
      };

      return imageInfo;

    } catch (error) {
      // Limpiar archivo temporal en caso de error
      await deleteFile(file.path);
      throw new Error(`Error procesando imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Eliminar imagen y su thumbnail
   */
  static async deleteImage(imagePath: string): Promise<void> {
    try {
      // Eliminar imagen principal
      await deleteFile(imagePath);

      // Eliminar thumbnail si existe
      const dir = path.dirname(imagePath);
      const filename = path.basename(imagePath);
      const thumbnailPath = path.join(dir, `thumb_${filename}`);
      await deleteFile(thumbnailPath);

    } catch (error) {
      console.error('Error eliminando imagen:', error);
      // No lanzar error para no interrumpir otras operaciones
    }
  }

  /**
   * Obtener URL de thumbnail
   */
  static getThumbnailUrl(imageUrl: string): string {
    const urlParts = imageUrl.split('/');
    const filename = urlParts[urlParts.length - 1];
    urlParts[urlParts.length - 1] = `thumb_${filename}`;
    return urlParts.join('/');
  }

  /**
   * Validar que la imagen existe
   */
  static validateImageExists(imagePath: string): boolean {
    const fileInfo = getFileInfo(imagePath);
    return fileInfo.exists;
  }

  /**
   * Obtener información de múltiples imágenes
   */
  static async getImagesInfo(imagePaths: string[]): Promise<ImageInfo[]> {
    const imagesInfo: ImageInfo[] = [];

    for (const imagePath of imagePaths) {
      try {
        if (this.validateImageExists(imagePath)) {
          const stats = fs.statSync(imagePath);
          const filename = path.basename(imagePath);
          const type = imagePath.includes('/services/') ? 'service' : 'product';
          
          const imageInfo: ImageInfo = {
            id: filename.split('.')[0],
            originalName: filename,
            filename: filename,
            path: imagePath,
            url: `${this.baseUrl}/uploads/${type}s/${filename}`,
            size: stats.size,
            mimetype: `image/${path.extname(filename).substring(1)}`,
            createdAt: stats.birthtime
          };

          // Obtener dimensiones si es posible
          try {
            const metadata = await sharp(imagePath).metadata();
            imageInfo.width = metadata.width;
            imageInfo.height = metadata.height;
          } catch (metadataError) {
            // Ignorar errores de metadatos
          }

          imagesInfo.push(imageInfo);
        }
      } catch (error) {
        console.error(`Error obteniendo info de imagen ${imagePath}:`, error);
      }
    }

    return imagesInfo;
  }

  /**
   * Limpiar imágenes huérfanas (sin referencia en BD)
   */
  static async cleanupOrphanedImages(
    type: 'service' | 'product',
    referencedImages: string[]
  ): Promise<number> {
    const uploadDir = `uploads/${type}s`;
    let deletedCount = 0;

    try {
      if (!fs.existsSync(uploadDir)) {
        return 0;
      }

      const files = fs.readdirSync(uploadDir);
      
      for (const file of files) {
        const filePath = path.join(uploadDir, file);
        const fileUrl = `${this.baseUrl}/uploads/${type}s/${file}`;
        
        // Si la imagen no está referenciada, eliminarla
        if (!referencedImages.includes(fileUrl) && !file.startsWith('thumb_')) {
          await this.deleteImage(filePath);
          deletedCount++;
        }
      }

    } catch (error) {
      console.error('Error limpiando imágenes huérfanas:', error);
    }

    return deletedCount;
  }
}