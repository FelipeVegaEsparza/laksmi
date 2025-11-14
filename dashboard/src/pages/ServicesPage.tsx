import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  MenuItem,
  InputAdornment,
} from '@mui/material'
import BasicImage from '@/components/BasicImage'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,

} from '@mui/icons-material'
import { Service, ServiceFormData } from '@/types'
import { Category } from '@/types/category'
import { apiService } from '@/services/apiService'
import { categoryService } from '@/services/categoryService'
import { useNotifications } from '@/contexts/NotificationContext'
import DataTable, { Column } from '@/components/DataTable'
import FormModal from '@/components/FormModal'
import ConfirmDialog from '@/components/ConfirmDialog'
import { formatPrice } from '@/utils/currency'
import ServiceForm from '@/components/ServiceForm'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [total, setTotal] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null)
  
  useNotifications() // For future use
  
  const showNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    // Log to console for debugging
    console.log(`${type.toUpperCase()}: ${message}`)
    
    // Show browser alert for now (can be replaced with toast library later)
    if (type === 'error') {
      alert(`❌ Error: ${message}`)
    } else if (type === 'success') {
      alert(`✅ Éxito: ${message}`)
    } else if (type === 'warning') {
      alert(`⚠️ Advertencia: ${message}`)
    } else {
      alert(`ℹ️ Info: ${message}`)
    }
  }

  const fetchCategories = async () => {
    try {
      const data = await categoryService.getCategories('service', true)
      setCategories(data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchServices = async () => {
    try {
      setLoading(true)
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm,
        category: categoryFilter,
      }
      
      const response = await apiService.getServices(params)
      setServices(response.services || [])
      setTotal(response.pagination?.total || 0)
    } catch (error) {
      console.error('Error fetching services:', error)
      showNotification('Error al cargar servicios', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchServices()
  }, [page, rowsPerPage, searchTerm, categoryFilter])

  const handleCreateService = () => {
    setEditingService(null)
    setModalOpen(true)
  }

  const handleEditService = (service: Service) => {
    setEditingService(service)
    setModalOpen(true)
  }

  const handleDeleteService = (service: Service) => {
    setServiceToDelete(service)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteService = async () => {
    if (!serviceToDelete) return
    
    try {
      await apiService.delete(`/services/${serviceToDelete.id}`)
      showNotification('Servicio eliminado correctamente', 'success')
      fetchServices()
      setDeleteDialogOpen(false)
      setServiceToDelete(null)
    } catch (error) {
      console.error('Error deleting service:', error)
      showNotification('Error al eliminar servicio', 'error')
      setDeleteDialogOpen(false)
      setServiceToDelete(null)
    }
  }

  const cancelDeleteService = () => {
    setDeleteDialogOpen(false)
    setServiceToDelete(null)
  }

  const handleSaveService = async (formData: ServiceFormData) => {
    console.log('🔍 ServicesPage - Datos recibidos del form:', formData)
    console.log('🔍 ServicesPage - Modo:', editingService ? 'EDITAR' : 'CREAR')
    
    try {
      if (editingService) {
        console.log('🔄 Enviando PUT a:', `/services/${editingService.id}`)
        await apiService.put(`/services/${editingService.id}`, formData)
        showNotification('Servicio actualizado correctamente', 'success')
      } else {
        console.log('🔄 Enviando POST a:', '/services')
        await apiService.post('/services', formData)
        showNotification('Servicio creado correctamente', 'success')
      }
      setModalOpen(false)
      fetchServices()
    } catch (error: any) {
      console.error('Error saving service:', error)
      
      // Extraer mensaje específico del error
      let errorMessage = 'Error al guardar servicio'
      
      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error?.message) {
        errorMessage = error.message
      }
      
      showNotification(errorMessage, 'error')
    }
  }

  const columns: Column<Service>[] = [
    {
      id: 'name',
      label: 'Nombre',
      minWidth: 200,
    },
    {
      id: 'category',
      label: 'Categoría',
      minWidth: 120,
      format: (value: string) => (
        <Chip label={value} size="small" variant="outlined" />
      ),
    },
    {
      id: 'price',
      label: 'Precio',
      minWidth: 100,
      align: 'right',
      format: (value: number) => formatPrice(value),
    },
    {
      id: 'duration',
      label: 'Duración',
      minWidth: 100,
      align: 'center',
      format: (value: number) => `${value} min`,
    },
    {
      id: 'isActive',
      label: 'Estado',
      minWidth: 100,
      align: 'center',
      format: (value: boolean) => (
        <Chip
          label={value ? 'Activo' : 'Inactivo'}
          color={value ? 'success' : 'default'}
          size="small"
        />
      ),
    },
  ]

  if (loading && services.length === 0) {
    return <LoadingSpinner message="Cargando servicios..." />
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Gestión de Servicios
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateService}
        >
          Nuevo Servicio
        </Button>
      </Box>

      {/* Filters */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            placeholder="Buscar servicios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            select
            label="Categoría"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <MenuItem value="">Todas las categorías</MenuItem>
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.name}>
                {category.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} md={3}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant={viewMode === 'table' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('table')}
              fullWidth
            >
              Tabla
            </Button>
            <Button
              variant={viewMode === 'cards' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('cards')}
              fullWidth
            >
              Tarjetas
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* Content */}
      {viewMode === 'table' ? (
        <DataTable
          columns={columns}
          data={services}
          total={total}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={setRowsPerPage}
          onEdit={handleEditService}
          onDelete={handleDeleteService}
          loading={loading}
          emptyMessage="No se encontraron servicios"
          getRowId={(service) => service.id}
        />
      ) : (
        <Grid container spacing={3}>
          {services.map((service) => (
            <Grid item xs={12} sm={6} md={4} key={service.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {service.images && service.images.length > 0 && (
                  <Box sx={{ height: 200, overflow: 'hidden' }}>
                    <BasicImage
                      src={service.images[0]}
                      alt={service.name}
                      className="w-full h-full object-cover"
                    />
                  </Box>
                )}
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" component="h2" noWrap>
                      {service.name}
                    </Typography>
                    <Box>
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => handleEditService(service)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton size="small" onClick={() => handleDeleteService(service)} color="error">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip label={service.category} size="small" variant="outlined" />
                    <Chip
                      label={service.isActive ? 'Activo' : 'Inactivo'}
                      color={service.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {service.description}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" color="primary">
                      {formatPrice(service.price)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {service.duration} min
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Service Form Modal */}
      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
        maxWidth="md"
      >
        <ServiceForm
          service={editingService}
          onSave={handleSaveService}
          onCancel={() => setModalOpen(false)}
        />
      </FormModal>

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Eliminar Servicio"
        message={`¿Estás seguro de que deseas eliminar el servicio "${serviceToDelete?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={confirmDeleteService}
        onCancel={cancelDeleteService}
        severity="error"
        icon={<DeleteIcon sx={{ fontSize: 28 }} />}
      />
    </Box>
  )
}