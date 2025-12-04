import { Request, Response } from 'express';
import PopupModel, { CreatePopupRequest, UpdatePopupRequest } from '../models/PopupModel';
import { AuthenticatedRequest } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configurar multer para subida de imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/popups';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'popup-' + uniqueSuffix + path.extname(file.originalname));
  }
});

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif, webp)'));
    }
  }
});

class PopupController {
  // Obtener todos los popups (para dashboard)
  async getAll(req: AuthenticatedRequest, res: Response) {
    try {
      const popups = await PopupModel.findAll();
      res.json({
        success: true,
        data: popups
      });
    } catch (error) {
      console.error('Error fetching popups:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener popups'
      });
    }
  }

  // Obtener popups activos (para frontend público)
  async getActive(req: Request, res: Response) {
    try {
      const popups = await PopupModel.findActive();
      res.json({
        success: true,
        data: popups
      });
    } catch (error) {
      console.error('Error fetching active popups:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener popups activos'
      });
    }
  }

  // Obtener un popup por ID
  async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const popup = await PopupModel.findById(id);

      if (!popup) {
        return res.status(404).json({
          success: false,
          error: 'Popup no encontrado'
        });
      }

      res.json({
        success: true,
        data: popup
      });
    } catch (error) {
      console.error('Error fetching popup:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener popup'
      });
    }
  }

  // Crear popup
  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const data: CreatePopupRequest = req.body;

      // Validar datos requeridos
      if (!data.title || !data.imageUrl || !data.linkUrl) {
        return res.status(400).json({
          success: false,
          error: 'Título, imagen y link son requeridos'
        });
      }

      const popup = await PopupModel.create(data);

      res.status(201).json({
        success: true,
        data: popup,
        message: 'Popup creado exitosamente'
      });
    } catch (error) {
      console.error('Error creating popup:', error);
      res.status(500).json({
        success: false,
        error: 'Error al crear popup'
      });
    }
  }

  // Actualizar popup
  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const data: UpdatePopupRequest = req.body;

      const popup = await PopupModel.update(id, data);

      if (!popup) {
        return res.status(404).json({
          success: false,
          error: 'Popup no encontrado'
        });
      }

      res.json({
        success: true,
        data: popup,
        message: 'Popup actualizado exitosamente'
      });
    } catch (error) {
      console.error('Error updating popup:', error);
      res.status(500).json({
        success: false,
        error: 'Error al actualizar popup'
      });
    }
  }

  // Eliminar popup
  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      // Obtener popup para eliminar imagen
      const popup = await PopupModel.findById(id);
      if (popup && popup.imageUrl) {
        const imagePath = path.join(process.cwd(), popup.imageUrl);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }

      const deleted = await PopupModel.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Popup no encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Popup eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error deleting popup:', error);
      res.status(500).json({
        success: false,
        error: 'Error al eliminar popup'
      });
    }
  }

  // Subir imagen de popup
  async uploadImage(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No se proporcionó ninguna imagen'
        });
      }

      const imageUrl = `/uploads/popups/${req.file.filename}`;

      res.json({
        success: true,
        data: { imageUrl },
        message: 'Imagen subida exitosamente'
      });
    } catch (error) {
      console.error('Error uploading popup image:', error);
      res.status(500).json({
        success: false,
        error: 'Error al subir imagen'
      });
    }
  }
}

export default new PopupController();
