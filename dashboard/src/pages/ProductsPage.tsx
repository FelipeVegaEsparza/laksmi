import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Grid,
  Chip,
  TextField,
  MenuItem,
  InputAdornment,
  Alert,
} from '@mui/material'
import {
  Add as AddIcon,

  Search as SearchIcon,
  Warning as WarningIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material'
import { Product, ProductFormData } from '@/types'
import { Category } from '@/types/category'
import { apiService } from '@/services/apiService'
import { categoryService } from '@/services/categoryService'
import { useNotifications } from '@/contexts/NotificationContext'
import DataTable, { Column } from '@/components/DataTable'
import FormModal from '@/components/FormModal'
import ProductForm from '@/components/ProductForm'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [total, setTotal] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [stockFilter, setStockFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([])
  
  useNotifications() // For future use
  
  const showNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    // This would typically be handled by a toast library or notification system
    console.log(`${type.toUpperCase()}: ${message}`)
  }

  const fetchCategories = async () => {
    try {
      const data = await categoryService.getCategories('product', true)
      setCategories(data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm,
        category: categoryFilter,
        stockFilter,
      }
      
      const response = await apiService.getProducts(params)
      setProducts(response.products || [])
      setTotal(response.total || 0)
      
      // Get low stock products for alerts
      const products = response.products || []
      const lowStock = products.filter(product => product.stock <= product.minStock)
      setLowStockProducts(lowStock)
    } catch (error) {
      console.error('Error fetching products:', error)
      showNotification('Error al cargar productos', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [page, rowsPerPage, searchTerm, categoryFilter, stockFilter])

  const handleCreateProduct = () => {
    setEditingProduct(null)
    setModalOpen(true)
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setModalOpen(true)
  }

  const handleDeleteProduct = async (product: Product) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar el producto "${product.name}"?`)) {
      try {
        await apiService.delete(`/products/${product.id}`)
        showNotification('Producto eliminado correctamente', 'success')
        fetchProducts()
      } catch (error) {
        console.error('Error deleting product:', error)
        showNotification('Error al eliminar producto', 'error')
      }
    }
  }

  const handleSaveProduct = async (formData: ProductFormData) => {
    try {
      if (editingProduct) {
        await apiService.put(`/products/${editingProduct.id}`, formData)
        showNotification('Producto actualizado correctamente', 'success')
      } else {
        await apiService.post('/products', formData)
        showNotification('Producto creado correctamente', 'success')
      }
      setModalOpen(false)
      fetchProducts()
    } catch (error) {
      console.error('Error saving product:', error)
      showNotification('Error al guardar producto', 'error')
    }
  }

  const getStockStatus = (product: Product) => {
    if (product.stock === 0) {
      return { label: 'Sin stock', color: 'error' as const }
    } else if (product.stock <= product.minStock) {
      return { label: 'Stock bajo', color: 'warning' as const }
    } else {
      return { label: 'En stock', color: 'success' as const }
    }
  }

  const columns: Column<Product>[] = [
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
      format: (value: number) => `€${value.toFixed(2)}`,
    },
    {
      id: 'stock',
      label: 'Stock',
      minWidth: 120,
      align: 'center',
      format: (value: number, product?: Product) => {
        if (!product) return value
        const status = getStockStatus(product)
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2">{value}</Typography>
            <Chip
              label={status.label}
              color={status.color}
              size="small"
              icon={value <= product.minStock ? <WarningIcon /> : <InventoryIcon />}
            />
          </Box>
        )
      },
    },
    {
      id: 'minStock',
      label: 'Stock Mín.',
      minWidth: 100,
      align: 'center',
    },
  ]

  if (loading && products.length === 0) {
    return <LoadingSpinner message="Cargando productos..." />
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Gestión de Productos
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateProduct}
        >
          Nuevo Producto
        </Button>
      </Box>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Productos con stock bajo ({lowStockProducts.length}):
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {lowStockProducts.map((product) => (
              <Chip
                key={product.id}
                label={`${product.name} (${product.stock})`}
                size="small"
                color="warning"
                variant="outlined"
              />
            ))}
          </Box>
        </Alert>
      )}

      {/* Filters */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            placeholder="Buscar productos..."
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
          <TextField
            fullWidth
            select
            label="Estado de Stock"
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="in_stock">En stock</MenuItem>
            <MenuItem value="low_stock">Stock bajo</MenuItem>
            <MenuItem value="out_of_stock">Sin stock</MenuItem>
          </TextField>
        </Grid>
      </Grid>

      {/* Products Table */}
      <DataTable
        columns={columns}
        data={products}
        total={total}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
        onEdit={handleEditProduct}
        onDelete={handleDeleteProduct}
        loading={loading}
        emptyMessage="No se encontraron productos"
        getRowId={(product) => product.id}
      />

      {/* Product Form Modal */}
      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
        maxWidth="md"
      >
        <ProductForm
          product={editingProduct}
          onSave={handleSaveProduct}
          onCancel={() => setModalOpen(false)}
        />
      </FormModal>
    </Box>
  )
}