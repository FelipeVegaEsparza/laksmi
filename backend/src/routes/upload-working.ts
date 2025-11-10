import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import logger from '../utils/logger';

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

/**
 * @route POST /api/v1/upload-working/:type
 * @desc Upload images - WORKING VERSION
 * @access Public (no auth required)
 */
router.post('/:type', (req, res, next) => {
  const { type } = req.params;
  
  logger.info(`Upload request received for type: ${type}`);
  
  if (!['products', 'services'].includes(type)) {
    return res.status(400).json({
      success: false,
      message: 'Tipo no válido. Use "products" o "services".'
    });
  }
  
  return next();
}, upload.array('images', 5), (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    logger.info(`Processing ${files?.length || 0} files`);
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se recibieron archivos'
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
      files: uploadedFiles.map(f => f.filename)
    });

    return res.json({
      success: true,
      message: `${files.length} imagen(es) subida(s) exitosamente`,
      data: {
        files: uploadedFiles,
        urls: uploadedFiles.map(f => f.url)
      }
    });

  } catch (error) {
    logger.error('Error uploading files:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al subir archivos'
    });
  }
});

/**
 * @route GET /api/v1/upload-working/:type
 * @desc List uploaded images - WORKING VERSION
 * @access Public (no auth required)
 */
router.get('/:type', (req, res) => {
  try {
    const { type } = req.params;
    
    logger.info(`List request received for type: ${type}`);
    
    if (!['products', 'services'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo no válido. Use "products" o "services".'
      });
    }

    const typeDir = path.join(uploadsDir, type);
    
    if (!fs.existsSync(typeDir)) {
      return res.json({
        success: true,
        data: []
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
      data: files
    });

  } catch (error) {
    logger.error('Error listing files:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al listar archivos'
    });
  }
});

export default router;