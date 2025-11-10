import { Request, Response } from 'express';
import { ImageService } from '../services/ImageService';
import { AuthenticatedRequest } from '../middleware/auth';

export class ImageController {
  /**
   * Subir imagen para servicio o producto
   */
  static async uploadImage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { type, entityId } = req.params;
      const file = req.file;

      if (!file) {
        res.status(400).json({
          success: false,
          message: 'No se proporcionó ningún archivo'
        });
        return;
      }

      if (!type || !entityId) {
        res.status(400).json({
          success: false,
          message: 'Tipo de entidad y ID son requeridos'
        });
        return;
      }

      if (type !== 'service' && type !== 'product') {
        res.status(400).json({
          success: false,
          message: 'Tipo debe ser "service" o "product"'
        });
        return;
      }

      // Opciones de procesamiento desde query params
      const options = {
        width: req.query.width ? parseInt(req.query.width as string) : undefined,
        height: req.query.height ? parseInt(req.query.height as string) : undefined,
        quality: req.query.quality ? parseInt(req.query.quality as string) : undefined,
        format: req.query.format as 'jpeg' | 'png' | 'webp' || 'webp'
      };

      const imageInfo = await ImageService.processAndSaveImage(
        file,
        type as 'service' | 'product',
        entityId,
        options
      );

      res.status(201).json({
        success: true,
        message: 'Imagen subida exitosamente',
        data: {
          image: imageInfo,
          thumbnail: ImageService.getThumbnailUrl(imageInfo.url)
        }
      });

    } catch (error) {
      console.error('Error subiendo imagen:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error interno del servidor'
      });
    }
  }

  /**
   * Subir múltiples imágenes
   */
  static async uploadMultipleImages(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { type, entityId } = req.params;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        res.status(400).json({
          success: false,
          message: 'No se proporcionaron archivos'
        });
        return;
      }

      if (!type || !entityId) {
        res.status(400).json({
          success: false,
          message: 'Tipo de entidad y ID son requeridos'
        });
        return;
      }

      if (type !== 'service' && type !== 'product') {
        res.status(400).json({
          success: false,
          message: 'Tipo debe ser "service" o "product"'
        });
        return;
      }

      const options = {
        width: req.query.width ? parseInt(req.query.width as string) : undefined,
        height: req.query.height ? parseInt(req.query.height as string) : undefined,
        quality: req.query.quality ? parseInt(req.query.quality as string) : undefined,
        format: req.query.format as 'jpeg' | 'png' | 'webp' || 'webp'
      };

      const uploadedImages = [];
      const errors = [];

      for (const file of files) {
        try {
          const imageInfo = await ImageService.processAndSaveImage(
            file,
            type as 'service' | 'product',
            entityId,
            options
          );

          uploadedImages.push({
            image: imageInfo,
            thumbnail: ImageService.getThumbnailUrl(imageInfo.url)
          });

        } catch (error) {
          errors.push({
            filename: file.originalname,
            error: error instanceof Error ? error.message : 'Error desconocido'
          });
        }
      }

      res.status(201).json({
        success: true,
        message: `${uploadedImages.length} imágenes subidas exitosamente`,
        data: {
          uploaded: uploadedImages,
          errors: errors,
          summary: {
            total: files.length,
            successful: uploadedImages.length,
            failed: errors.length
          }
        }
      });

    } catch (error) {
      console.error('Error subiendo múltiples imágenes:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error interno del servidor'
      });
    }
  }

  /**
   * Eliminar imagen
   */
  static async deleteImage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { type, filename } = req.params;

      if (!type || !filename) {
        res.status(400).json({
          success: false,
          message: 'Tipo y nombre de archivo son requeridos'
        });
        return;
      }

      if (type !== 'service' && type !== 'product') {
        res.status(400).json({
          success: false,
          message: 'Tipo debe ser "service" o "product"'
        });
        return;
      }

      const imagePath = `uploads/${type}s/${filename}`;
      
      if (!ImageService.validateImageExists(imagePath)) {
        res.status(404).json({
          success: false,
          message: 'Imagen no encontrada'
        });
        return;
      }

      await ImageService.deleteImage(imagePath);

      res.json({
        success: true,
        message: 'Imagen eliminada exitosamente'
      });

    } catch (error) {
      console.error('Error eliminando imagen:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener información de imágenes
   */
  static async getImagesInfo(req: Request, res: Response): Promise<void> {
    try {
      const { type, entityId } = req.params;

      if (!type || !entityId) {
        res.status(400).json({
          success: false,
          message: 'Tipo de entidad y ID son requeridos'
        });
        return;
      }

      if (type !== 'service' && type !== 'product') {
        res.status(400).json({
          success: false,
          message: 'Tipo debe ser "service" o "product"'
        });
        return;
      }

      // Buscar imágenes que contengan el entityId en el nombre
      const uploadDir = `uploads/${type}s`;
      const fs = require('fs');
      
      if (!fs.existsSync(uploadDir)) {
        res.json({
          success: true,
          data: []
        });
        return;
      }

      const files = fs.readdirSync(uploadDir);
      const entityImages = files.filter((file: string) => 
        file.includes(`${type}_${entityId}_`) && !file.startsWith('thumb_')
      );

      const imagePaths = entityImages.map((file: string) => `${uploadDir}/${file}`);
      const imagesInfo = await ImageService.getImagesInfo(imagePaths);

      res.json({
        success: true,
        data: imagesInfo.map(img => ({
          ...img,
          thumbnail: ImageService.getThumbnailUrl(img.url)
        }))
      });

    } catch (error) {
      console.error('Error obteniendo información de imágenes:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error interno del servidor'
      });
    }
  }

  /**
   * Limpiar imágenes huérfanas
   */
  static async cleanupImages(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { type } = req.params;
      const { referencedImages } = req.body;

      if (!type) {
        res.status(400).json({
          success: false,
          message: 'Tipo es requerido'
        });
        return;
      }

      if (type !== 'service' && type !== 'product') {
        res.status(400).json({
          success: false,
          message: 'Tipo debe ser "service" o "product"'
        });
        return;
      }

      if (!Array.isArray(referencedImages)) {
        res.status(400).json({
          success: false,
          message: 'referencedImages debe ser un array'
        });
        return;
      }

      const deletedCount = await ImageService.cleanupOrphanedImages(
        type as 'service' | 'product',
        referencedImages
      );

      res.json({
        success: true,
        message: `${deletedCount} imágenes huérfanas eliminadas`,
        data: {
          deletedCount
        }
      });

    } catch (error) {
      console.error('Error limpiando imágenes:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error interno del servidor'
      });
    }
  }
}