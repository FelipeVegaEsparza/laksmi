import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken, requireAnyRole } from '../middleware/auth';
import logger from '../utils/logger';
import config from '../config';

const router = Router();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { type } = req.params;
    const typeDir = path.join(uploadsDir, type);
    
    if (!fs.existsSync(typeDir)) {
      fs.mkdirSync(typeDir, { recursive: true });
    }
    
    cb(null, typeDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes (JPEG, PNG, WebP, GIF).'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Maximum 5 files per request
  }
});

// AUTENTICACIÓN CONDICIONAL - Solo en producción
const conditionalAuth = (req: any, res: any, next: any) => {
  if (config.nodeEnv === 'production') {
    return authenticateToken(req, res, next);
  }
  next(); // Skip auth in development
};

/**
 * @route POST /api/v1/upload/:type
 * @desc Upload images for products or services
 * @access Public in dev, Private in prod
 */
router.post('/:type', (req, res, next) => {
  const { type } = req.params;
  
  logger.info(`Upload request received for type: ${type} from IP: ${req.ip}`);
  
  if (!['products', 'services'].includes(type)) {
    return res.status(400).json({
      success: false,
      error: 'Tipo no válido',
      message: 'Use "products" o "services".'
    });
  }
  
  return next();
}, conditionalAuth, upload.array('images', 5), (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    logger.info(`Processing ${files?.length || 0} files for upload`);
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No se recibieron archivos',
        message: 'Debe seleccionar al menos una imagen'
      });
    }

    const { type } = req.params;
    const uploadedFiles = files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      url: `/uploads/${type}/${file.filename}`
    }));

    logger.info(`Successfully uploaded ${files.length} images for ${type}`, {
      files: uploadedFiles.map(f => f.filename),
      totalSize: files.reduce((sum, f) => sum + f.size, 0)
    });

    return res.status(201).json({
      success: true,
      message: `${files.length} imagen(es) subida(s) exitosamente`,
      data: {
        files: uploadedFiles,
        urls: uploadedFiles.map(f => f.url)
      }
    });

  } catch (error: any) {
    logger.error('Error uploading files:', {
      error: error.message,
      stack: error.stack,
      type: req.params.type
    });
    
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: config.nodeEnv === 'development' ? error.message : 'Error al subir archivos'
    });
  }
});

/**
 * @route GET /api/v1/upload/:type
 * @desc List uploaded images for a type
 * @access Public in dev, Private in prod
 */
router.get('/:type', conditionalAuth, (req, res) => {
  try {
    const { type } = req.params;
    
    logger.info(`List request received for type: ${type}`);
    
    if (!['products', 'services'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Tipo no válido',
        message: 'Use "products" o "services".'
      });
    }

    const typeDir = path.join(uploadsDir, type);
    
    if (!fs.existsSync(typeDir)) {
      return res.json({
        success: true,
        data: [],
        message: `No hay imágenes para ${type}`
      });
    }

    const files = fs.readdirSync(typeDir)
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext);
      })
      .map(file => {
        const filePath = path.join(typeDir, file);
        const stats = fs.statSync(filePath);
        
        return {
          filename: file,
          url: `/uploads/${type}/${file}`,
          size: stats.size,
          createdAt: stats.birthtime
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    logger.info(`Found ${files.length} files for type ${type}`);

    return res.json({
      success: true,
      data: files,
      total: files.length
    });

  } catch (error: any) {
    logger.error('Error listing files:', {
      error: error.message,
      type: req.params.type
    });
    
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: config.nodeEnv === 'development' ? error.message : 'Error al listar archivos'
    });
  }
});

/**
 * @route DELETE /api/v1/upload/:type/:filename
 * @desc Delete an uploaded image
 * @access Private (requires auth)
 */
router.delete('/:type/:filename', authenticateToken, requireAnyRole, (req, res) => {
  try {
    const { type, filename } = req.params;
    
    if (!['products', 'services'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Tipo no válido',
        message: 'Use "products" o "services".'
      });
    }

    const filePath = path.join(uploadsDir, type, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Archivo no encontrado',
        message: `La imagen ${filename} no existe`
      });
    }

    fs.unlinkSync(filePath);
    
    logger.info(`Deleted image: ${type}/${filename}`, {
      user: (req as any).user?.id,
      ip: req.ip
    });

    return res.json({
      success: true,
      message: 'Imagen eliminada exitosamente'
    });

  } catch (error: any) {
    logger.error('Error deleting file:', {
      error: error.message,
      type: req.params.type,
      filename: req.params.filename
    });
    
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: config.nodeEnv === 'development' ? error.message : 'Error al eliminar archivo'
    });
  }
});

export default router;