import { Request, Response } from 'express';
import { BannerModel, CreateBannerRequest, UpdateBannerRequest } from '../models/Banner';
import logger from '../utils/logger';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for banner image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/banners');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const extension = path.extname(file.originalname);
    cb(null, `banner-${uniqueSuffix}${extension}`);
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

export class BannerController {
  /**
   * Get all banners
   */
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const activeOnly = req.query.activeOnly === 'true';
      const banners = await BannerModel.getAll(activeOnly);

      res.json({
        success: true,
        data: banners
      });
    } catch (error: any) {
      logger.error('Get banners error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener banners'
      });
    }
  }

  /**
   * Get banner by ID
   */
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const banner = await BannerModel.getById(id);

      if (!banner) {
        res.status(404).json({
          success: false,
          error: 'Banner no encontrado'
        });
        return;
      }

      res.json({
        success: true,
        data: banner
      });
    } catch (error: any) {
      logger.error('Get banner error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener banner'
      });
    }
  }

  /**
   * Create banner
   */
  static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Only admin can create banners
      if (req.user?.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'No tienes permisos para crear banners'
        });
        return;
      }

      const bannerData: CreateBannerRequest = req.body;
      const banner = await BannerModel.create(bannerData);

      res.status(201).json({
        success: true,
        message: 'Banner creado exitosamente',
        data: banner
      });
    } catch (error: any) {
      logger.error('Create banner error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al crear banner'
      });
    }
  }

  /**
   * Update banner
   */
  static async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Only admin can update banners
      if (req.user?.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'No tienes permisos para actualizar banners'
        });
        return;
      }

      const { id } = req.params;
      const updateData: UpdateBannerRequest = req.body;

      const banner = await BannerModel.update(id, updateData);

      if (!banner) {
        res.status(404).json({
          success: false,
          error: 'Banner no encontrado'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Banner actualizado exitosamente',
        data: banner
      });
    } catch (error: any) {
      logger.error('Update banner error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al actualizar banner'
      });
    }
  }

  /**
   * Delete banner
   */
  static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Only admin can delete banners
      if (req.user?.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'No tienes permisos para eliminar banners'
        });
        return;
      }

      const { id } = req.params;
      
      // Get banner to delete image file
      const banner = await BannerModel.getById(id);
      
      const deleted = await BannerModel.delete(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Banner no encontrado'
        });
        return;
      }

      // Delete image file if exists
      if (banner?.imageUrl) {
        const imagePath = path.join(__dirname, '../../', banner.imageUrl);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }

      res.json({
        success: true,
        message: 'Banner eliminado exitosamente'
      });
    } catch (error: any) {
      logger.error('Delete banner error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al eliminar banner'
      });
    }
  }

  /**
   * Upload banner image
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

      const { id } = req.params;
      const file = req.file;

      if (!file) {
        res.status(400).json({
          success: false,
          error: 'No se proporcionó ninguna imagen'
        });
        return;
      }

      // Get current banner to delete old image
      const banner = await BannerModel.getById(id);
      if (!banner) {
        // Delete uploaded file
        fs.unlinkSync(file.path);
        res.status(404).json({
          success: false,
          error: 'Banner no encontrado'
        });
        return;
      }

      // Delete old image if exists
      if (banner.imageUrl) {
        const oldImagePath = path.join(__dirname, '../../', banner.imageUrl);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      // Update banner with new image URL
      const imageUrl = `/uploads/banners/${file.filename}`;
      const updatedBanner = await BannerModel.update(id, { imageUrl });

      res.json({
        success: true,
        message: 'Imagen subida exitosamente',
        data: {
          imageUrl,
          banner: updatedBanner
        }
      });
    } catch (error: any) {
      logger.error('Upload banner image error:', error);
      
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

  /**
   * Reorder banners
   */
  static async reorder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Only admin can reorder banners
      if (req.user?.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'No tienes permisos para reordenar banners'
        });
        return;
      }

      const { bannerIds } = req.body;

      if (!Array.isArray(bannerIds)) {
        res.status(400).json({
          success: false,
          error: 'Se requiere un array de IDs de banners'
        });
        return;
      }

      await BannerModel.reorder(bannerIds);

      res.json({
        success: true,
        message: 'Banners reordenados exitosamente'
      });
    } catch (error: any) {
      logger.error('Reorder banners error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al reordenar banners'
      });
    }
  }
}
