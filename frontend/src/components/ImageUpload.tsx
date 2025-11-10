'use client';

import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { imageService } from '@/services/imageService';
import { ImageInfo, ImageUploadOptions } from '@/types';

interface ImageUploadProps {
  type: 'service' | 'product';
  entityId: string;
  currentImages?: string[];
  onImagesChange?: (images: string[]) => void;
  maxImages?: number;
  options?: ImageUploadOptions;
  className?: string;
}

const ImageUpload = ({
  type,
  entityId,
  currentImages = [],
  onImagesChange,
  maxImages = 5,
  options = {},
  className = ''
}: ImageUploadProps) => {
  const [images, setImages] = useState<string[]>(currentImages);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    
    // Validar archivos
    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of fileArray) {
      const validation = imageService.validateImageFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    }

    if (errors.length > 0) {
      alert(`Errores en archivos:\n${errors.join('\n')}`);
    }

    if (validFiles.length === 0) return;

    // Verificar límite de imágenes
    if (images.length + validFiles.length > maxImages) {
      alert(`Solo puedes subir un máximo de ${maxImages} imágenes. Actualmente tienes ${images.length}.`);
      return;
    }

    setUploading(true);

    try {
      if (validFiles.length === 1) {
        // Subir una sola imagen
        const result = await imageService.uploadImage(validFiles[0], type, entityId, options);
        const newImages = [...images, result.image.url];
        setImages(newImages);
        onImagesChange?.(newImages);
      } else {
        // Subir múltiples imágenes
        const result = await imageService.uploadMultipleImages(validFiles, type, entityId, options);
        const newImageUrls = result.uploaded.map(item => item.image.url);
        const newImages = [...images, ...newImageUrls];
        setImages(newImages);
        onImagesChange?.(newImages);

        if (result.errors.length > 0) {
          const errorMessages = result.errors.map(err => `${err.filename}: ${err.error}`);
          alert(`Algunos archivos no se pudieron subir:\n${errorMessages.join('\n')}`);
        }
      }
    } catch (error) {
      console.error('Error subiendo imágenes:', error);
      alert('Error al subir imágenes. Por favor, intenta de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async (imageUrl: string) => {
    try {
      // Extraer nombre de archivo de la URL
      const filename = imageUrl.split('/').pop();
      if (filename) {
        await imageService.deleteImage(type, filename);
      }

      const newImages = images.filter(img => img !== imageUrl);
      setImages(newImages);
      onImagesChange?.(newImages);
    } catch (error) {
      console.error('Error eliminando imagen:', error);
      alert('Error al eliminar imagen. Por favor, intenta de nuevo.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Área de subida */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${dragOver ? 'border-rose-500 bg-rose-50' : 'border-gray-300 hover:border-rose-400'}
          ${uploading ? 'pointer-events-none opacity-50' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={uploading}
        />

        {uploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 text-rose-500 animate-spin mb-2" />
            <p className="text-gray-600">Subiendo imágenes...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-gray-600 mb-1">
              Arrastra imágenes aquí o haz clic para seleccionar
            </p>
            <p className="text-sm text-gray-500">
              Máximo {maxImages} imágenes, 5MB cada una
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Formatos: JPEG, PNG, GIF, WebP
            </p>
          </div>
        )}
      </div>

      {/* Galería de imágenes */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((imageUrl, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={imageService.getThumbnailUrl(imageUrl)}
                  alt={`Imagen ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback a imagen original si thumbnail no existe
                    const target = e.target as HTMLImageElement;
                    target.src = imageUrl;
                  }}
                />
              </div>
              
              {/* Botón de eliminar */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveImage(imageUrl);
                }}
                className="
                  absolute top-2 right-2 bg-red-500 text-white rounded-full p-1
                  opacity-0 group-hover:opacity-100 transition-opacity
                  hover:bg-red-600
                "
                title="Eliminar imagen"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Overlay con información */}
              <div className="
                absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20
                transition-all duration-200 rounded-lg flex items-center justify-center
              ">
                <ImageIcon className="
                  h-6 w-6 text-white opacity-0 group-hover:opacity-100
                  transition-opacity duration-200
                " />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Información adicional */}
      <div className="text-sm text-gray-500">
        {images.length} de {maxImages} imágenes subidas
      </div>
    </div>
  );
};

export default ImageUpload;