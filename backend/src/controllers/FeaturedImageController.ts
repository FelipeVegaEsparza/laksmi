import { Request, Response } from 'express';
import { FeaturedImageModel, UpdateFeaturedImageRequest } from '../models/FeaturedImage';
import logger from '../utils/logger';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for featured image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/featured');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const extension = path.extname(file.originalname);
    cb(null, `featured-${uniqueSuffix}${extension}`);
  }
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif, webp)'));
    }
  }
});

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: string;
  };
}

export class FeaturedImageController {
  /**
   * Get all featured images
   */
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const images = await FeaturedImageModel.getAll();

      res.json({
        success: true,
        data: images
      });
    } catch (error: any) {
      logger.error('Get featured images error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener imágenes destacadas'
      });
    }
  }

  /**
   * Get featured image by slot
   */
  static async getBySlot(req: Request, res: Response): Promise<void> {
    try {
      const slot = parseInt(req.params.slot);
      
      if (slot !== 1 && slot !== 2) {
        res.status(400).json({
          success: false,
          error: 'El slot debe ser 1 o 2'
        });
        return;
      }

      const image = await FeaturedImageModel.getBySlot(slot);

      if (!image) {
        res.status(404).json({
          success: false,
          error: 'Imagen destacada no encontrada'
        });
        return;
      }

      res.json({
        success: true,
        data: image
      });
    } catch (error: any) {
      logger.error('Get featured image error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener imagen destacada'
      });
    }
  }

  /**
   * Update featured image
   */
  static async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Only admin can update
      if (req.user?.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'No tienes permisos para actualizar imágenes destacadas'
        });
        return;
      }

      const slot = parseInt(req.params.slot);
      
      if (slot !== 1 && slot !== 2) {
        res.status(400).json({
          success: false,
          error: 'El slot debe ser 1 o 2'
        });
        return;
      }

      const updateData: UpdateFeaturedImageRequest = req.body;
      const image = await FeaturedImageModel.update(slot, updateData);

      if (!image) {
        res.status(404).json({
          success: false,
          error: 'Imagen destacada no encontrada'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Imagen destacada actualizada exitosamente',
        data: image
      });
    } catch (error: any) {
      logger.error('Update featured image error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al actualizar imagen destacada'
      });
    }
  }

  /**
   * Upload featured image
   */
  static async uploadImage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Only admin can upload images
      if (req.user?.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'No tienes permisos para subir imágenes'
        });
        return;
      }

      const slot = parseInt(req.params.slot);
      
      if (slot !== 1 && slot !== 2) {
        res.status(400).json({
          success: false,
          error: 'El slot debe ser 1 o 2'
        });
        return;
      }

      const file = req.file;

      if (!file) {
        res.status(400).json({
          success: false,
          error: 'No se proporcionó ninguna imagen'
        });
        return;
      }

      // Get current image to delete old one
      const image = await FeaturedImageModel.getBySlot(slot);
      if (!image) {
        fs.unlinkSync(file.path);
        res.status(404).json({
          success: false,
          error: 'Imagen destacada no encontrada'
        });
        return;
      }

      // Delete old image if exists
      if (image.imageUrl) {
        const oldImagePath = path.join(__dirname, '../../', image.imageUrl);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      // Update with new image URL
      const imageUrl = `/uploads/featured/${file.filename}`;
      const updatedImage = await FeaturedImageModel.update(slot, { imageUrl });

      res.json({
        success: true,
        message: 'Imagen subida exitosamente',
        data: {
          imageUrl,
          image: updatedImage
        }
      });
    } catch (error: any) {
      logger.error('Upload featured image error:', error);
      
      // Delete uploaded file on error
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({
        success: false,
        error: error.message || 'Error al subir imagen'
      });
    }
  }
}
