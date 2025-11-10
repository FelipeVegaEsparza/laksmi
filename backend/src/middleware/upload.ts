import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// Crear directorios si no existen
const createUploadDirs = () => {
  const dirs = [
    'uploads',
    'uploads/services',
    'uploads/products',
    'uploads/temp'
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Inicializar directorios
createUploadDirs();

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    const uploadType = req.params.type || req.body.type || 'temp';
    let uploadPath = 'uploads/temp';

    switch (uploadType) {
      case 'service':
      case 'services':
        uploadPath = 'uploads/services';
        break;
      case 'product':
      case 'products':
        uploadPath = 'uploads/products';
        break;
      default:
        uploadPath = 'uploads/temp';
    }

    cb(null, uploadPath);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    // Generar nombre único con timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension);
    const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9]/g, '_');
    
    cb(null, `${sanitizedBaseName}_${uniqueSuffix}${extension}`);
  }
});

// Filtro de archivos
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Tipos de archivo permitidos
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen (JPEG, JPG, PNG, GIF, WebP)'));
  }
};

// Configuración de multer
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
    files: 5 // Máximo 5 archivos por vez
  },
  fileFilter: fileFilter
});

// Middleware para subir una sola imagen
export const uploadSingle = upload.single('image');

// Middleware para subir múltiples imágenes
export const uploadMultiple = upload.array('images', 5);

// Función para eliminar archivo
export const deleteFile = (filePath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err && err.code !== 'ENOENT') {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

// Función para mover archivo de temp a destino final
export const moveFile = (oldPath: string, newPath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    fs.rename(oldPath, newPath, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

// Función para obtener información de archivo
export const getFileInfo = (filePath: string) => {
  try {
    const stats = fs.statSync(filePath);
    return {
      exists: true,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime
    };
  } catch (error) {
    return {
      exists: false,
      size: 0,
      created: null,
      modified: null
    };
  }
};