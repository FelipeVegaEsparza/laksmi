import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Paper,
  Typography,
  Tabs,
  Tab,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Chip,
  Alert,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
} from '@mui/icons-material'
import { categoryService } from '../services/categoryService'
import { Category, CreateCategoryData, UpdateCategoryData } from '../types/category'
import { useSnackbar } from 'notistack'

export default function CategoriesPage() {
  const [tab, setTab] = useState<'service' | 'product'>('service')
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState<CreateCategoryData>({
    name: '',
    type: 'service',
    description: '',
  })
  const [usageInfo, setUsageInfo] = useState<{ services: number; products: number } | null>(null)
  const { enqueueSnackbar } = useSnackbar()

  useEffect(() => {
    loadCategories()
  }, [tab])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const data = await categoryService.getCategories(tab)
      setCategories(data)
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Error al cargar categorías', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category)
      setFormData({
        name: category.name,
        type: category.type,
        description: category.description || '',
      })
    } else {
      setEditingCategory(null)
      setFormData({
        name: '',
        type: tab,
        description: '',
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingCategory(null)
    setUsageInfo(null)
  }

  const handleSubmit = async () => {
    try {
      if (editingCategory) {
        await categoryService.updateCategory(editingCategory.id, {
          name: formData.name,
          description: formData.description,
        })
        enqueueSnackbar('Categoría actualizada exitosamente', { variant: 'success' })
      } else {
        await categoryService.createCategory(formData)
        enqueueSnackbar('Categoría creada exitosamente', { variant: 'success' })
      }
      handleCloseDialog()
      loadCategories()
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Error al guardar categoría', { variant: 'error' })
    }
  }

  const handleDelete = async (category: Category) => {
    if (!window.confirm(`¿Estás seguro de eliminar la categoría "${category.name}"?`)) {
      return
    }

    try {
      // Verificar uso antes de eliminar
      const usage = await categoryService.getCategoryUsage(category.id)
      if (usage.services > 0 || usage.products > 0) {
        enqueueSnackbar(
          `No se puede eliminar. La categoría está siendo usada por ${usage.services} servicios y ${usage.products} productos`,
          { variant: 'warning' }
        )
        return
      }

      await categoryService.deleteCategory(category.id)
      enqueueSnackbar('Categoría eliminada exitosamente', { variant: 'success' })
      loadCategories()
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Error al eliminar categoría', { variant: 'error' })
    }
  }

  const handleToggleActive = async (category: Category) => {
    try {
      await categoryService.updateCategory(category.id, {
        isActive: !category.isActive,
      })
      enqueueSnackbar('Estado actualizado exitosamente', { variant: 'success' })
      loadCategories()
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Error al actualizar estado', { variant: 'error' })
    }
  }

  const handleShowUsage = async (category: Category) => {
    try {
      const usage = await categoryService.getCategoryUsage(category.id)
      setUsageInfo(usage)
      setEditingCategory(category)
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Error al obtener información', { variant: 'error' })
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Gestión de Categorías</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nueva Categoría
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(_, value) => setTab(value)}>
          <Tab label="Servicios" value="service" />
          <Tab label="Productos" value="product" />
        </Tabs>
      </Paper>

      {loading ? (
        <Typography>Cargando...</Typography>
      ) : categories.length === 0 ? (
        <Alert severity="info">No hay categorías de {tab === 'service' ? 'servicios' : 'productos'}</Alert>
      ) : (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {categories.map((category) => (
            <Paper key={category.id} sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                <Typography variant="h6">{category.name}</Typography>
                <Chip
                  label={category.isActive ? 'Activa' : 'Inactiva'}
                  color={category.isActive ? 'success' : 'default'}
                  size="small"
                />
              </Box>
              
              {category.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {category.description}
                </Typography>
              )}

              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton size="small" onClick={() => handleShowUsage(category)} title="Ver uso">
                  <InfoIcon />
                </IconButton>
                <IconButton size="small" onClick={() => handleOpenDialog(category)} title="Editar">
                  <EditIcon />
                </IconButton>
                <IconButton size="small" onClick={() => handleDelete(category)} title="Eliminar" color="error">
                  <DeleteIcon />
                </IconButton>
                <FormControlLabel
                  control={
                    <Switch
                      checked={category.isActive}
                      onChange={() => handleToggleActive(category)}
                      size="small"
                    />
                  }
                  label=""
                  sx={{ ml: 'auto' }}
                />
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      {/* Dialog para crear/editar */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nombre"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Descripción"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={!formData.name.trim()}>
            {editingCategory ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para mostrar uso */}
      <Dialog open={!!usageInfo} onClose={() => setUsageInfo(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Uso de Categoría</DialogTitle>
        <DialogContent>
          {usageInfo && editingCategory && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {editingCategory.name}
              </Typography>
              <Typography>
                Servicios: <strong>{usageInfo.services}</strong>
              </Typography>
              <Typography>
                Productos: <strong>{usageInfo.products}</strong>
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUsageInfo(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
