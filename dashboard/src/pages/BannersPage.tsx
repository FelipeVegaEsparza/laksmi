import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardMedia,
  Grid,
  IconButton,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Chip,
  Alert,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Image as ImageIcon,
} from '@mui/icons-material'
import { apiService } from '@/services/apiService'
import LoadingSpinner from '@/components/LoadingSpinner'
import { useSnackbar } from 'notistack'

interface Banner {
  id: string
  title: string
  description?: string
  link?: string
  imageUrl?: string
  order: number
  active: boolean
  createdAt: string
  updatedAt: string
}

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    link: '',
    active: true,
  })
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const { enqueueSnackbar } = useSnackbar()

  useEffect(() => {
    fetchBanners()
  }, [])

  const fetchBanners = async () => {
    try {
      setLoading(true)
      const response = await apiService.get<Banner[]>('/banners')
      setBanners(response)
    } catch (error) {
      console.error('Error fetching banners:', error)
      enqueueSnackbar('Error al cargar banners', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (banner?: Banner) => {
    if (banner) {
      setEditingBanner(banner)
      setFormData({
        title: banner.title,
        description: banner.description || '',
        link: banner.link || '',
        active: banner.active,
      })
      setImagePreview(banner.imageUrl ? getImageUrl(banner.imageUrl) : null)
    } else {
      setEditingBanner(null)
      setFormData({
        title: '',
        description: '',
        link: '',
        active: true,
      })
      setImagePreview(null)
    }
    setSelectedImage(null)
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingBanner(null)
    setSelectedImage(null)
    setImagePreview(null)
  }

  const handleImageSelect = (file: File) => {
    setSelectedImage(file)
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    try {
      let bannerId: string

      if (editingBanner) {
        await apiService.put(`/banners/${editingBanner.id}`, formData)
        bannerId = editingBanner.id
        enqueueSnackbar('Banner actualizado exitosamente', { variant: 'success' })
      } else {
        const newBanner = await apiService.post<Banner>('/banners', formData)
        bannerId = newBanner.id
        enqueueSnackbar('Banner creado exitosamente', { variant: 'success' })
      }

      // Upload image if selected
      if (selectedImage) {
        const imageFormData = new FormData()
        imageFormData.append('image', selectedImage)
        await apiService.post(`/banners/${bannerId}/upload-image`, imageFormData)
        enqueueSnackbar('Imagen subida exitosamente', { variant: 'success' })
      }

      handleCloseDialog()
      fetchBanners()
    } catch (error) {
      console.error('Error saving banner:', error)
      enqueueSnackbar('Error al guardar banner', { variant: 'error' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este banner?')) return

    try {
      await apiService.delete(`/banners/${id}`)
      enqueueSnackbar('Banner eliminado exitosamente', { variant: 'success' })
      fetchBanners()
    } catch (error) {
      console.error('Error deleting banner:', error)
      enqueueSnackbar('Error al eliminar banner', { variant: 'error' })
    }
  }

  const handleToggleActive = async (banner: Banner) => {
    try {
      await apiService.put(`/banners/${banner.id}`, { active: !banner.active })
      enqueueSnackbar('Estado actualizado', { variant: 'success' })
      fetchBanners()
    } catch (error) {
      console.error('Error toggling active:', error)
      enqueueSnackbar('Error al actualizar estado', { variant: 'error' })
    }
  }

  const handleImageUpload = async (bannerId: string, file: File) => {
    try {
      setUploadingImage(true)
      const formData = new FormData()
      formData.append('image', file)

      const response = await apiService.post(`/banners/${bannerId}/upload-image`, formData)
      enqueueSnackbar('Imagen subida exitosamente', { variant: 'success' })
      fetchBanners()
    } catch (error) {
      console.error('Error uploading image:', error)
      enqueueSnackbar('Error al subir imagen', { variant: 'error' })
    } finally {
      setUploadingImage(false)
    }
  }

  const handleMoveUp = async (index: number) => {
    if (index === 0) return
    const newBanners = [...banners]
    ;[newBanners[index], newBanners[index - 1]] = [newBanners[index - 1], newBanners[index]]
    await reorderBanners(newBanners)
  }

  const handleMoveDown = async (index: number) => {
    if (index === banners.length - 1) return
    const newBanners = [...banners]
    ;[newBanners[index], newBanners[index + 1]] = [newBanners[index + 1], newBanners[index]]
    await reorderBanners(newBanners)
  }

  const reorderBanners = async (newBanners: Banner[]) => {
    try {
      const bannerIds = newBanners.map(b => b.id)
      await apiService.post('/banners/reorder', { bannerIds })
      setBanners(newBanners)
      enqueueSnackbar('Orden actualizado', { variant: 'success' })
    } catch (error) {
      console.error('Error reordering:', error)
      enqueueSnackbar('Error al reordenar', { variant: 'error' })
      fetchBanners()
    }
  }

  const getImageUrl = (imageUrl?: string) => {
    if (!imageUrl) return null
    return imageUrl.startsWith('http') ? imageUrl : `http://localhost:3000${imageUrl}`
  }

  if (loading) {
    return <LoadingSpinner message="Cargando banners..." />
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="600">
          Banner Principal
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Agregar Banner
        </Button>
      </Box>

      {banners.length === 0 ? (
        <Alert severity="info">
          No hay banners configurados. Agrega tu primer banner para comenzar.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {banners.map((banner, index) => (
            <Grid item xs={12} md={6} lg={4} key={banner.id}>
              <Card>
                {banner.imageUrl ? (
                  <CardMedia
                    component="img"
                    height="200"
                    image={getImageUrl(banner.imageUrl) || ''}
                    alt={banner.title}
                    sx={{ objectFit: 'cover' }}
                  />
                ) : (
                  <Box
                    sx={{
                      height: 200,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'grey.200',
                    }}
                  >
                    <ImageIcon sx={{ fontSize: 60, color: 'grey.400' }} />
                  </Box>
                )}
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                    <Typography variant="h6" component="div">
                      {banner.title}
                    </Typography>
                    <Chip
                      label={banner.active ? 'Activo' : 'Inactivo'}
                      color={banner.active ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                  
                  {banner.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {banner.description}
                    </Typography>
                  )}

                  {banner.link && (
                    <Typography variant="caption" color="primary" sx={{ display: 'block', mb: 2 }}>
                      🔗 {banner.link}
                    </Typography>
                  )}

                  <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                    <Button
                      component="label"
                      size="small"
                      variant="outlined"
                      startIcon={<ImageIcon />}
                      disabled={uploadingImage}
                    >
                      {banner.imageUrl ? 'Cambiar' : 'Subir'} Imagen
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleImageUpload(banner.id, file)
                        }}
                      />
                    </Button>
                  </Stack>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                      >
                        <ArrowUpIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === banners.length - 1}
                      >
                        <ArrowDownIcon />
                      </IconButton>
                    </Box>
                    
                    <Box>
                      <Switch
                        checked={banner.active}
                        onChange={() => handleToggleActive(banner)}
                        size="small"
                      />
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(banner)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(banner.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialog for Add/Edit */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingBanner ? 'Editar Banner' : 'Agregar Banner'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="Título"
              fullWidth
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <TextField
              label="Descripción"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <TextField
              label="Link/URL"
              fullWidth
              placeholder="https://ejemplo.com"
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
            />
            
            {/* Image Upload Section */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Imagen del Banner
              </Typography>
              {imagePreview && (
                <Box
                  sx={{
                    width: '100%',
                    height: 200,
                    mb: 2,
                    borderRadius: 1,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </Box>
              )}
              <Button
                component="label"
                variant="outlined"
                startIcon={<ImageIcon />}
                fullWidth
              >
                {imagePreview ? 'Cambiar Imagen' : 'Seleccionar Imagen'}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageSelect(file)
                  }}
                />
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Formatos: JPG, PNG, GIF, WEBP (máx. 5MB)
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography>Activo:</Typography>
              <Switch
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!formData.title}
          >
            {editingBanner ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
