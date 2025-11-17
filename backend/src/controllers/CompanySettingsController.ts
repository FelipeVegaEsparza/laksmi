import { Request, Response } from 'express';
import { CompanySettingsModel, UpdateCompanySettingsRequest } from '../models/CompanySettings';
import { AuthenticatedRequest } from '../middleware/auth';
import logger from '../utils/logger';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configurar multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/company');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes.'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

export class CompanySettingsController {
  /**
   * Obtener configuración de la empresa
   */
  static async getSettings(req: Request, res: Response): Promise<void> {
    try {
      const settings = await CompanySettingsModel.getSettings();

      if (!settings) {
        res.status(404).json({
          success: false,
          error: 'Configuración no encontrada'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Configuración obtenida exitosamente',
        data: settings
      });
    } catch (error: any) {
      logger.error('Get company settings error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener configuración'
      });
    }
  }

  /**
   * Actualizar configuración de la empresa
   */
  static async updateSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Solo admin puede actualizar
      if (req.user?.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'No tienes permisos para actualizar la configuración'
        });
        return;
      }

      const updates: UpdateCompanySettingsRequest = req.body;

      const settings = await CompanySettingsModel.updateSettings(updates);

      if (!settings) {
        res.status(500).json({
          success: false,
          error: 'Error al actualizar configuración'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Configuración actualizada exitosamente',
        data: settings
      });
    } catch (error: any) {
      logger.error('Update company settings error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al actualizar configuración'
      });
    }
  }

  /**
   * Subir logo de la empresa
   */
  static async uploadLogo(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Solo admin puede subir logo
      if (req.user?.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'No tienes permisos para subir el logo'
        });
        return;
      }

      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'No se proporcionó ningún archivo'
        });
        return;
      }

      // Construir URL del logo (sin escapar)
      const logoUrl = `/uploads/company/${req.file.filename}`;

      // Actualizar la configuración con la nueva URL del logo
      // Nota: La URL no debe ser sanitizada ya que es una ruta de archivo válida
      const settings = await CompanySettingsModel.updateSettings({ logoUrl });

      // Eliminar el logo anterior si existe
      const oldSettings = await CompanySettingsModel.getSettings();
      if (oldSettings?.logoUrl && oldSettings.logoUrl !== logoUrl) {
        const oldLogoPath = path.join(__dirname, '../../', oldSettings.logoUrl);
        if (fs.existsSync(oldLogoPath)) {
          fs.unlinkSync(oldLogoPath);
        }
      }

      res.json({
        success: true,
        message: 'Logo subido exitosamente',
        data: {
          logoUrl,
          settings
        }
      });
    } catch (error: any) {
      logger.error('Upload logo error:', error);
      
      // Eliminar el archivo si hubo error
      if (req.file) {
        const filePath = req.file.path;
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      res.status(500).json({
        success: false,
        error: error.message || 'Error al subir logo'
      });
    }
  }

  /**
   * Eliminar logo de la empresa
   */
  static async deleteLogo(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Solo admin puede eliminar logo
      if (req.user?.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'No tienes permisos para eliminar el logo'
        });
        return;
      }

      const settings = await CompanySettingsModel.getSettings();
      
      if (settings?.logoUrl) {
        const logoPath = path.join(__dirname, '../../', settings.logoUrl);
        if (fs.existsSync(logoPath)) {
          fs.unlinkSync(logoPath);
        }
      }

      // Actualizar la configuración para remover el logo
      const updatedSettings = await CompanySettingsModel.updateSettings({ logoUrl: null as any });

      res.json({
        success: true,
        message: 'Logo eliminado exitosamente',
        data: updatedSettings
      });
    } catch (error: any) {
      logger.error('Delete logo error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al eliminar logo'
      });
    }
  }

  /**
   * Inicializar horarios por defecto del local
   */
  static async initBusinessHours(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Solo admin puede inicializar horarios
      if (req.user?.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'No tienes permisos para inicializar horarios'
        });
        return;
      }

      const defaultBusinessHours = {
        monday: {
          isOpen: true,
          openTime: '09:00',
          closeTime: '20:00',
          lunchStart: '13:00',
          lunchEnd: '14:00'
        },
        tuesday: {
          isOpen: true,
          openTime: '09:00',
          closeTime: '20:00',
          lunchStart: '13:00',
          lunchEnd: '14:00'
        },
        wednesday: {
          isOpen: true,
          openTime: '09:00',
          closeTime: '20:00',
          lunchStart: '13:00',
          lunchEnd: '14:00'
        },
        thursday: {
          isOpen: true,
          openTime: '09:00',
          closeTime: '20:00',
          lunchStart: '13:00',
          lunchEnd: '14:00'
        },
        friday: {
          isOpen: true,
          openTime: '09:00',
          closeTime: '20:00',
          lunchStart: '13:00',
          lunchEnd: '14:00'
        },
        saturday: {
          isOpen: true,
          openTime: '09:00',
          closeTime: '14:00',
          lunchStart: '',
          lunchEnd: ''
        },
        sunday: {
          isOpen: false,
          openTime: '',
          closeTime: '',
          lunchStart: '',
          lunchEnd: ''
        }
      };

      const updatedSettings = await CompanySettingsModel.updateSettings({ 
        businessHours: defaultBusinessHours 
      });

      logger.info('Business hours initialized successfully');

      res.json({
        success: true,
        message: 'Horarios del local inicializados exitosamente',
        data: updatedSettings
      });
    } catch (error: any) {
      logger.error('Init business hours error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al inicializar horarios'
      });
    }
  }
}
