import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  TextField,
  Button,
  Switch,
  Stack,
  Alert,
} from '@mui/material'
import {
  Save as SaveIcon,
  Image as ImageIcon,
} from '@mui/icons-material'
import { apiService } from '@/services/apiService'
import LoadingSpinner from '@/components/LoadingSpinner'
import { useSnackbar } from 'notistack'

interface FeaturedImage {
  id: string
  slot: number
  title: string
  description?: string
  imageUrl?: string
  active: boolean
}

export default function FeaturedImagesPage() {
  const [image1, setImage1] = useState<FeaturedImage | null>(null)
  const [image2, setImage2] = useState<FeaturedImage | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<number | null>(null)
  const [uploadingImage, setUploadingImage] = useState<number | null>(null)
  const { enqueueSnackbar } = useSnackbar()

  useEffect(() => {
    fetchImages()
  }, [])

  const fetchImages = async () => {
    try {
      setLoading(true)
      const response = await apiService.get<FeaturedImage[]>('/featured-images')
      const images = response
      setImage1(images.find(img => img.slot === 1) || null)
      setImage2(images.find(img => img.slot === 2) || null)
    } catch (error) {
      console.error('Error fetching featured images:', error)
      enqueueSnackbar('Error al cargar imágenes destacadas', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (slot: number) => {
    const image = slot === 1 ? image1 : image2
    if (!image) return

    try {
      setSaving(slot)
      await apiService.put(`/featured-images/${slot}`, {
        title: image.title,
        description: image.description,
        active: image.active,
      })
      enqueueSnackbar(`Imagen Destacada ${slot} actualizada exitosamente`, { variant: 'success' })
      fetchImages()
    } catch (error) {
      console.error('Error saving:', error)
      enqueueSnackbar('Error al guardar', { variant: 'error' })
    } finally {
      setSaving(null)
    }
  }

  const handleImageUpload = async (slot: number, file: File) => {
    try {
      setUploadingImage(slot)
      const formData = new FormData()
      formData.append('image', file)

      await apiService.post(`/featured-images/${slot}/upload-image`, formData)
      enqueueSnackbar('Imagen subida exitosamente', { variant: 'success' })
      fetchImages()
    } catch (error) {
      console.error('Error uploading image:', error)
      enqueueSnackbar('Error al subir imagen', { variant: 'error' })
    } finally {
      setUploadingImage(null)
    }
  }

  const getImageUrl = (imageUrl?: string) => {
    if (!imageUrl) return null
    return imageUrl.startsWith('http') ? imageUrl : `http://localhost:3000${imageUrl}`
  }

  const renderImageCard = (image: FeaturedImage | null, slot: number) => {
    if (!image) return null

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Imagen Destacada {slot}
          </Typography>

          {image.imageUrl ? (
            <CardMedia
              component="img"
              height="200"
              image={getImageUrl(image.imageUrl) || ''}
              alt={image.title}
              sx={{ objectFit: 'cover', mb: 2, borderRadius: 1 }}
            />
          ) : (
            <Box
              sx={{
                height: 200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'grey.200',
                mb: 2,
                borderRadius: 1,
              }}
            >
              <ImageIcon sx={{ fontSize: 60, color: 'grey.400' }} />
            </Box>
          )}

          <Stack spacing={2}>
            <Button
              component="label"
              variant="outlined"
              startIcon={<ImageIcon />}
              fullWidth
              disabled={uploadingImage === slot}
            >
              {uploadingImage === slot ? 'Subiendo...' : image.imageUrl ? 'Cambiar Imagen' : 'Subir Imagen'}
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleImageUpload(slot, file)
                }}
              />
            </Button>

            <TextField
              label="Título"
              fullWidth
              required
              value={image.title}
              onChange={(e) => {
                if (slot === 1) {
                  setImage1({ ...image, title: e.target.value })
                } else {
                  setImage2({ ...image, title: e.target.value })
                }
              }}
            />

            <TextField
              label="Descripción"
              fullWidth
              multiline
              rows={3}
              value={image.description || ''}
              onChange={(e) => {
                if (slot === 1) {
                  setImage1({ ...image, description: e.target.value })
                } else {
                  setImage2({ ...image, description: e.target.value })
                }
              }}
            />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography>Activo:</Typography>
              <Switch
                checked={image.active}
                onChange={(e) => {
                  if (slot === 1) {
                    setImage1({ ...image, active: e.target.checked })
                  } else {
                    setImage2({ ...image, active: e.target.checked })
                  }
                }}
              />
            </Box>

            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={() => handleSave(slot)}
              disabled={saving === slot || !image.title}
              fullWidth
            >
              {saving === slot ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return <LoadingSpinner message="Cargando imágenes destacadas..." />
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="600" sx={{ mb: 3 }}>
        Imágenes Destacadas
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Estas imágenes aparecerán debajo del banner principal en la página de inicio.
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          {renderImageCard(image1, 1)}
        </Grid>
        <Grid item xs={12} md={6}>
          {renderImageCard(image2, 2)}
        </Grid>
      </Grid>
    </Box>
  )
}
