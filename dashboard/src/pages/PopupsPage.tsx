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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Alert,
  Chip,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
  Link as LinkIcon,
} from '@mui/icons-material'
import { apiService } from '@/services/apiService'
import { useSnackbar } from 'notistack'
import LoadingSpinner from '@/components/LoadingSpinner'
import ConfirmDialog from '@/components/ConfirmDialog'

interface Popup {
  id: string
  title: string
  imageUrl: string
  linkUrl: string
  displayOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function PopupsPage() {
  const [popups, setPopups] = useState<Popup[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingPopup, setEditingPopup] = useState<Popup | null>(null)
  const [selectedPopupId, setSelectedPopupId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const { enqueueSnackbar } = useSnackbar()

  const [formData, setFormData] = useState({
    title: '',
    imageUrl: '',
    linkUrl: '',
    displayOrder: 0,
    isActive: true,
  })

  useEffect(() => {
    fetchPopups()
  }, [])

  const fetchPopups = async () => {
    try {
      setLoading(true)
      const response = await apiService.get<Popup[]>('/popups')
      setPopups(response)
    } catch (error) {
      console.error('Error fetching popups:', error)
      enqueueSnackbar('Error al cargar popups', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (popup?: Popup) => {
    if (popup) {
      setEditingPopup(popup)
      setFormData({
        title: popup.title,
        imageUrl: popup.imageUrl,
        linkUrl: popup.linkUrl,
        displayOrder: popup.displayOrder,
        isActive: popup.isActive,
      })
    } else {
      setEditingPopup(null)
      setFormData({
        title: '',
        imageUrl: '',
        linkUrl: '',
        displayOrder: popups.length,
        isActive: true,
      })
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingPopup(null)
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      enqueueSnackbar('Por favor selecciona una imagen', { variant: 'error' })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      enqueueSnackbar('La imagen no debe superar 5MB', { variant: 'error' })
      return
    }

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('image', file)

      const response = await apiService.post<{ imageUrl: string }>('/popups/upload', formData)
      
      setFormData(prev => ({ ...prev, imageUrl: response.imageUrl }))
      enqueueSnackbar('Imagen subida exitosamente', { variant: 'success' })
    } catch (error) {
      console.error('Error uploading image:', error)
      enqueueSnackbar('Error al subir imagen', { variant: 'error' })
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.title || !formData.imageUrl || !formData.linkUrl) {
      enqueueSnackbar('Todos los campos son requeridos', { variant: 'warning' })
      return
    }

    try {
      if (editingPopup) {
        await apiService.put(`/popups/${editingPopup.id}`, formData)
        enqueueSnackbar('Popup actualizado exitosamente', { variant: 'success' })
      } else {
        await apiService.post('/popups', formData)
        enqueueSnackbar('Popup creado exitosamente', { variant: 'success' })
      }
      
      handleCloseDialog()
      fetchPopups()
    } catch (error) {
      console.error('Error saving popup:', error)
      enqueueSnackbar('Error al guardar popup', { variant: 'error' })
    }
  }

  const handleDeleteClick = (id: string) => {
    setSelectedPopupId(id)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedPopupId) return

    try {
      await apiService.delete(`/popups/${selectedPopupId}`)
      enqueueSnackbar('Popup eliminado exitosamente', { variant: 'success' })
      setDeleteDialogOpen(false)
      setSelectedPopupId(null)
      fetchPopups()
    } catch (error) {
      console.error('Error deleting popup:', error)
      enqueueSnackbar('Error al eliminar popup', { variant: 'error' })
    }
  }

  const getImageUrl = (imageUrl: string) => {
    if (imageUrl.startsWith('http')) return imageUrl
    const apiUrl = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3000'
    return `${apiUrl}${imageUrl}`
  }

  if (loading) {
    return <LoadingSpinner message="Cargando popups..." />
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="600">
          Gestión de Popups
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nuevo Popup
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Los popups se mostrarán en formato carrusel al cargar cualquier página del sitio web.
        Los popups activos se ordenan según el número de orden (menor = primero).
      </Alert>

      {popups.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No hay popups creados
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Crea tu primer popup para mostrar promociones en el sitio web
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Crear Primer Popup
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {popups.map((popup) => (
            <Grid item xs={12} sm={6} md={4} key={popup.id}>
              <Card>
                <CardMedia
                  component="img"
                  height="200"
                  image={getImageUrl(popup.imageUrl)}
                  alt={popup.title}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                    <Typography variant="h6" component="div" sx={{ flex: 1 }}>
                      {popup.title}
                    </Typography>
                    <Chip
                      label={popup.isActive ? 'Activo' : 'Inactivo'}
                      color={popup.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <LinkIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {popup.linkUrl}
                    </Typography>
                  </Box>

                  <Typography variant="caption" color="text.secondary">
                    Orden: {popup.displayOrder}
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenDialog(popup)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteClick(popup.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialog para crear/editar popup */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingPopup ? 'Editar Popup' : 'Nuevo Popup'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Título"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              helperText="Nombre descriptivo para identificar el popup"
            />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Imagen del Popup
              </Typography>
              {formData.imageUrl && (
                <Box sx={{ mb: 2 }}>
                  <img
                    src={getImageUrl(formData.imageUrl)}
                    alt="Preview"
                    style={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 8 }}
                  />
                </Box>
              )}
              <Button
                component="label"
                variant="outlined"
                startIcon={<UploadIcon />}
                disabled={uploading}
                fullWidth
              >
                {uploading ? 'Subiendo...' : formData.imageUrl ? 'Cambiar Imagen' : 'Subir Imagen'}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </Button>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                Formatos: JPG, PNG, GIF, WEBP (máx. 5MB)
              </Typography>
            </Box>

            <TextField
              fullWidth
              label="Link/URL"
              value={formData.linkUrl}
              onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
              helperText="URL a la que redirige al hacer clic en el popup"
              placeholder="https://ejemplo.com/promocion"
            />

            <TextField
              fullWidth
              type="number"
              label="Orden de visualización"
              value={formData.displayOrder}
              onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
              helperText="Número menor aparece primero en el carrusel"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
              }
              label="Popup activo"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!formData.title || !formData.imageUrl || !formData.linkUrl}
          >
            {editingPopup ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmación de eliminación */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Confirmar eliminación"
        message="¿Estás seguro de que quieres eliminar este popup? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteDialogOpen(false)
          setSelectedPopupId(null)
        }}
        severity="error"
      />
    </Box>
  )
}
