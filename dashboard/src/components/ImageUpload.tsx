import React, { useState, useRef } from 'react'
import {
  Box,
  Button,
  Typography,
  IconButton,
  Card,
  CardActions,
  Grid,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material'
import BasicImage from '@/components/BasicImage'
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  Add as AddIcon,
} from '@mui/icons-material'
import LocalModeAlert from './LocalModeAlert'
import { uploadService } from '@/services/uploadService'

interface ImageUploadProps {
  images: string[]
  onChange: (images: string[]) => void
  type: 'products' | 'services'
  maxImages?: number
  maxSizeKB?: number
  acceptedTypes?: string[]
  label?: string
  helperText?: string
}

export default function ImageUpload({
  images,
  onChange,
  type,
  maxImages = 5,
  maxSizeKB = 2048, // 2MB
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  label = 'Imágenes',
  helperText = 'Arrastra imágenes aquí o haz clic para seleccionar'
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const validateFile = (file: File): string | null => {
    return uploadService.validateFile(file, maxSizeKB)
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    if (files.length === 0) return

    if (images.length + files.length > maxImages) {
      setError(`Máximo ${maxImages} imágenes permitidas`)
      return
    }

    setError(null)
    setUploading(true)

    try {
      // Validate all files first
      for (const file of files) {
        const validationError = validateFile(file)
        if (validationError) {
          setError(validationError)
          setUploading(false)
          return
        }
      }

      // Upload files to server
      const uploadResponse = await uploadService.uploadImages(type, files)
      const newImageUrls = uploadResponse.urls

      onChange([...images, ...newImageUrls])
    } catch (error: any) {
      console.error('Error uploading images:', error)
      setError(error.message || 'Error al subir las imágenes')
    } finally {
      setUploading(false)
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onChange(newImages)
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const files = Array.from(event.dataTransfer.files)
    
    // Simulate file input change
    const input = fileInputRef.current
    if (input) {
      const dt = new DataTransfer()
      files.forEach(file => dt.items.add(file))
      input.files = dt.files
      
      // Trigger change event
      const changeEvent = new Event('change', { bubbles: true })
      input.dispatchEvent(changeEvent)
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        {label}
        {images.length > 0 && (
          <Chip 
            size="small" 
            label={`${images.length}/${maxImages}`} 
            sx={{ ml: 1 }}
          />
        )}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Upload Area */}
      {images.length < maxImages && (
        <Box
          sx={{
            border: '2px dashed',
            borderColor: 'grey.300',
            borderRadius: 2,
            p: 3,
            textAlign: 'center',
            cursor: 'pointer',
            mb: 2,
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: 'action.hover',
            },
          }}
          onClick={handleFileSelect}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {uploading ? (
            <Box>
              <CircularProgress size={40} />
              <Typography variant="body2" sx={{ mt: 1 }}>
                Procesando imágenes...
              </Typography>
            </Box>
          ) : (
            <Box>
              <UploadIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
              <Typography variant="body1" gutterBottom>
                {helperText}
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={(e) => {
                  e.stopPropagation()
                  handleFileSelect()
                }}
              >
                Seleccionar Imágenes
              </Button>
              <Typography variant="caption" display="block" sx={{ mt: 1, color: 'grey.600' }}>
                Máximo {maxImages} imágenes, {maxSizeKB}KB cada una
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <Grid container spacing={2}>
          {images.map((image, index) => (
            <Grid item xs={6} sm={4} md={3} key={index}>
              <Card>
                <Box sx={{ height: 120, overflow: 'hidden' }}>
                  <BasicImage
                    src={uploadService.getImageUrl(image)}
                    alt={`Imagen ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </Box>
                <CardActions sx={{ justifyContent: 'center', p: 1 }}>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleRemoveImage(index)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {images.length === 0 && (
        <Box
          sx={{
            textAlign: 'center',
            py: 4,
            color: 'grey.500',
          }}
        >
          <ImageIcon sx={{ fontSize: 48, mb: 1 }} />
          <Typography variant="body2">
            No hay imágenes seleccionadas
          </Typography>
        </Box>
      )}
    </Box>
  )
}