import React, { useState, useEffect } from 'react'
import {
  Box,
  TextField,
  MenuItem,
  Button,
  Grid,
  Chip,
  Typography,
  InputAdornment,
  Autocomplete,
} from '@mui/material'
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { Product, ProductFormData, Service } from '@/types'
import { apiService } from '@/services/apiService'
import ImageUpload from './ImageUpload'

const PRODUCT_CATEGORIES = [
  'Cremas',
  'Serums',
  'Limpiadores',
  'Mascarillas',
  'Aceites',
  'Herramientas',
  'Otros'
]

interface ProductFormProps {
  product?: Product | null
  onSave: (data: ProductFormData) => void
  onCancel: () => void
}

export default function ProductForm({ product, onSave, onCancel }: ProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    category: '',
    price: 0,
    stock: 0,
    minStock: 5,
    description: '',
    images: [],
    ingredients: [],
    compatibleServices: [],
  })
  const [newIngredient, setNewIngredient] = useState('')
  const [services, setServices] = useState<Service[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        category: product.category,
        price: product.price,
        stock: product.stock,
        minStock: product.minStock,
        description: product.description || '',
        images: product.images || [],
        ingredients: product.ingredients,
        compatibleServices: product.compatibleServices,
      })
    }
  }, [product])

  useEffect(() => {
    // Fetch services for compatibility selection
    const fetchServices = async () => {
      try {
        const response = await apiService.get<any>('/services?active=true')
        // Asegurarse de que sea un array
        const servicesArray = Array.isArray(response) 
          ? response 
          : (response?.services || response?.data?.services || [])
        setServices(servicesArray)
      } catch (error) {
        console.error('Error fetching services:', error)
        setServices([]) // Establecer array vacío en caso de error
      }
    }
    fetchServices()
  }, [])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido'
    }

    if (!formData.category) {
      newErrors.category = 'La categoría es requerida'
    }

    if (formData.price <= 0) {
      newErrors.price = 'El precio debe ser mayor a 0'
    }

    if (formData.stock < 0) {
      newErrors.stock = 'El stock no puede ser negativo'
    }

    if (formData.minStock < 0) {
      newErrors.minStock = 'El stock mínimo no puede ser negativo'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSave(formData)
    }
  }

  const handleInputChange = (field: keyof ProductFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const addIngredient = () => {
    if (newIngredient.trim() && !formData.ingredients.includes(newIngredient.trim())) {
      setFormData(prev => ({
        ...prev,
        ingredients: [...prev.ingredients, newIngredient.trim()]
      }))
      setNewIngredient('')
    }
  }

  const removeIngredient = (ingredient: string) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter(ing => ing !== ingredient)
    }))
  }

  const handleServicesChange = (_event: any, newValue: Service[]) => {
    setFormData(prev => ({
      ...prev,
      compatibleServices: newValue.map(service => service.id)
    }))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addIngredient()
    }
  }

  const selectedServices = Array.isArray(services) 
    ? services.filter(service => formData.compatibleServices.includes(service.id))
    : []

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Nombre del Producto"
            value={formData.name}
            onChange={handleInputChange('name')}
            error={!!errors.name}
            helperText={errors.name}
            required
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            select
            label="Categoría"
            value={formData.category}
            onChange={handleInputChange('category')}
            error={!!errors.category}
            helperText={errors.category}
            required
          >
            {PRODUCT_CATEGORIES.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            type="number"
            label="Precio"
            value={formData.price}
            onChange={handleInputChange('price')}
            error={!!errors.price}
            helperText={errors.price}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            inputProps={{ min: 0, step: 0.01 }}
            required
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            type="number"
            label="Stock Actual"
            value={formData.stock}
            onChange={handleInputChange('stock')}
            error={!!errors.stock}
            helperText={errors.stock}
            inputProps={{ min: 0, step: 1 }}
            required
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            type="number"
            label="Stock Mínimo"
            value={formData.minStock}
            onChange={handleInputChange('minStock')}
            error={!!errors.minStock}
            helperText={errors.minStock || 'Nivel para alertas de reposición'}
            inputProps={{ min: 0, step: 1 }}
            required
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Descripción"
            value={formData.description}
            onChange={handleInputChange('description')}
            error={!!errors.description}
            helperText={errors.description || 'Descripción detallada del producto'}
          />
        </Grid>

        <Grid item xs={12}>
          <ImageUpload
            images={formData.images}
            onChange={(images) => setFormData(prev => ({ ...prev, images }))}
            type="products"
            maxImages={5}
            label="Imágenes del Producto"
            helperText="Sube imágenes del producto para mostrar en la tienda"
          />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle2" gutterBottom>
            Ingredientes
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Agregar ingrediente..."
              value={newIngredient}
              onChange={(e) => setNewIngredient(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <Button
              variant="outlined"
              onClick={addIngredient}
              disabled={!newIngredient.trim()}
              startIcon={<AddIcon />}
            >
              Agregar
            </Button>
          </Box>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {formData.ingredients.map((ingredient, index) => (
              <Chip
                key={index}
                label={ingredient}
                onDelete={() => removeIngredient(ingredient)}
                deleteIcon={<DeleteIcon />}
                variant="outlined"
              />
            ))}
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle2" gutterBottom>
            Servicios Compatibles
          </Typography>
          <Autocomplete
            multiple
            options={services}
            getOptionLabel={(option) => option.name}
            value={selectedServices}
            onChange={handleServicesChange}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Seleccionar servicios compatibles..."
                helperText="Servicios donde se puede usar este producto"
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  variant="outlined"
                  label={option.name}
                  {...getTagProps({ index })}
                  key={option.id}
                />
              ))
            }
          />
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained">
              {product ? 'Actualizar' : 'Crear'} Producto
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  )
}