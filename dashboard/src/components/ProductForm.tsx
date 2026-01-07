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
  FormHelperText,
  FormControl,
  InputLabel,
  FormControlLabel,
  Switch,
} from '@mui/material'
import { Add as AddIcon, Delete as DeleteIcon, Star as StarIcon, ArrowUpward, ArrowDownward } from '@mui/icons-material'
import { Product, ProductFormData, Service } from '@/types'
import { apiService } from '@/services/apiService'
import ImageUpload from './ImageUpload'
import RichTextEditor from './RichTextEditor'
import Select, { MultiValue, StylesConfig } from 'react-select'

interface Category {
  id: string
  name: string
  type: 'service' | 'product'
  isActive: boolean
}

interface CategoryOption {
  value: string
  label: string
}

interface ProductFormProps {
  product?: Product | null
  onSave: (data: ProductFormData) => void
  onCancel: () => void
}

export default function ProductForm({ product, onSave, onCancel }: ProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    category: '',
    categories: [],
    price: 0,
    stock: 0,
    minStock: 5,
    description: '',
    benefits: '',
    images: [],
    ingredients: [],
    compatibleServices: [],
    paymentLink: '',
    isActive: true,
  })
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [newIngredient, setNewIngredient] = useState('')
  const [services, setServices] = useState<Service[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (product) {
      // Use categories array if available, otherwise fall back to single category
      const productCategories = product.categories && product.categories.length > 0 
        ? product.categories 
        : [product.category]
      
      setFormData({
        name: product.name,
        category: product.category,
        categories: productCategories,
        price: product.price,
        stock: product.stock,
        minStock: product.minStock,
        description: product.description || '',
        benefits: product.benefits || '',
        images: product.images || [],
        ingredients: product.ingredients,
        compatibleServices: product.compatibleServices,
        paymentLink: product.paymentLink || '',
        isActive: product.isActive !== undefined ? product.isActive : true,
      })
    }
  }, [product])

  useEffect(() => {
    // Cargar categorías desde el backend
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true)
        const response = await apiService.get<any>('/categories?type=product&isActive=true')
        const categoriesData = response.data || response
        let cats = Array.isArray(categoriesData) ? categoriesData : []
        
        // Si estamos editando y la categoría del producto no está en la lista, agregarla
        if (product && product.category) {
          const categoryExists = cats.some(c => c.name === product.category)
          if (!categoryExists) {
            console.warn(`⚠️ Categoría "${product.category}" no encontrada en la lista, agregándola temporalmente`)
            cats = [...cats, { id: product.category, name: product.category, type: 'product', isActive: true }]
          }
        }
        
        setCategories(cats)
      } catch (error) {
        console.error('Error cargando categorías:', error)
        setCategories([])
      } finally {
        setLoadingCategories(false)
      }
    }
    fetchCategories()

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

    if (!formData.categories || formData.categories.length === 0) {
      newErrors.categories = 'Debe seleccionar al menos una categoría'
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
      // Prepare data with categories array
      const cleanedData: any = {
        name: formData.name.trim(),
        category: formData.categories && formData.categories.length > 0 ? formData.categories[0] : '',
        categories: formData.categories || [],
        price: Number(formData.price),
        stock: Number(formData.stock),
        minStock: Number(formData.minStock),
        description: formData.description || '',
        benefits: formData.benefits || '',
        images: Array.isArray(formData.images) ? formData.images : [],
        ingredients: Array.isArray(formData.ingredients) ? formData.ingredients : [],
        compatibleServices: Array.isArray(formData.compatibleServices) ? formData.compatibleServices : [],
        paymentLink: formData.paymentLink?.trim() || '',
        isActive: formData.isActive !== undefined ? formData.isActive : true,
      }
      
      onSave(cleanedData)
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

  const handleCategoriesChange = (selectedOptions: MultiValue<CategoryOption>) => {
    const selectedCategories = selectedOptions.map(option => option.value)
    setFormData(prev => ({
      ...prev,
      categories: selectedCategories,
      category: selectedCategories.length > 0 ? selectedCategories[0] : ''
    }))
    
    // Clear error when user selects categories
    if (errors.categories) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.categories
        return newErrors
      })
    }
  }

  const moveCategoryUp = (index: number) => {
    if (index === 0) return
    const newCategories = [...(formData.categories || [])]
    const temp = newCategories[index]
    newCategories[index] = newCategories[index - 1]
    newCategories[index - 1] = temp
    setFormData(prev => ({
      ...prev,
      categories: newCategories,
      category: newCategories[0]
    }))
  }

  const moveCategoryDown = (index: number) => {
    const cats = formData.categories || []
    if (index === cats.length - 1) return
    const newCategories = [...cats]
    const temp = newCategories[index]
    newCategories[index] = newCategories[index + 1]
    newCategories[index + 1] = temp
    setFormData(prev => ({
      ...prev,
      categories: newCategories,
      category: newCategories[0]
    }))
  }

  // Convert categories to options for react-select
  const categoryOptions: CategoryOption[] = categories.map(cat => ({
    value: cat.name,
    label: cat.name
  }))

  const selectedCategoryOptions: CategoryOption[] = (formData.categories || []).map(cat => ({
    value: cat,
    label: cat
  }))

  // Custom styles for react-select to match MUI theme
  const selectStyles: StylesConfig<CategoryOption, true> = {
    control: (base, state) => ({
      ...base,
      minHeight: '56px',
      borderColor: errors.categories ? '#d32f2f' : (state.isFocused ? '#1976d2' : 'rgba(0, 0, 0, 0.23)'),
      borderWidth: errors.categories ? '2px' : '1px',
      boxShadow: state.isFocused ? '0 0 0 1px #1976d2' : 'none',
      '&:hover': {
        borderColor: errors.categories ? '#d32f2f' : 'rgba(0, 0, 0, 0.87)'
      }
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: '#e3f2fd',
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: '#1976d2',
      fontWeight: 500,
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: '#1976d2',
      ':hover': {
        backgroundColor: '#1976d2',
        color: 'white',
      },
    }),
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
        
        <Grid item xs={12}>
          <FormControl fullWidth error={!!errors.categories}>
            <InputLabel shrink sx={{ backgroundColor: 'white', px: 0.5, ml: -0.5 }}>
              Categorías *
            </InputLabel>
            <Box sx={{ mt: 2 }}>
              <Select
                isMulti
                options={categoryOptions}
                value={selectedCategoryOptions}
                onChange={handleCategoriesChange}
                isDisabled={loadingCategories}
                placeholder={loadingCategories ? "Cargando categorías..." : "Selecciona una o más categorías"}
                styles={selectStyles}
                noOptionsMessage={() => "No hay categorías disponibles"}
              />
            </Box>
            {errors.categories && (
              <FormHelperText error>{errors.categories}</FormHelperText>
            )}
            {!errors.categories && (
              <FormHelperText>
                Selecciona una o más categorías. La primera será la categoría principal.
              </FormHelperText>
            )}
          </FormControl>
        </Grid>

        {/* Category badges with reordering */}
        {formData.categories && formData.categories.length > 0 && (
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Orden de Categorías
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
              {formData.categories.map((category, index) => (
                <Box key={category} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Chip
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {index === 0 && <StarIcon sx={{ fontSize: 16 }} />}
                        {category}
                        {index === 0 && (
                          <Typography variant="caption" sx={{ ml: 0.5, fontWeight: 'bold' }}>
                            (Principal)
                          </Typography>
                        )}
                      </Box>
                    }
                    color={index === 0 ? 'primary' : 'default'}
                    variant={index === 0 ? 'filled' : 'outlined'}
                  />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                    <Button
                      size="small"
                      onClick={() => moveCategoryUp(index)}
                      disabled={index === 0}
                      sx={{ minWidth: 'auto', p: 0.25, height: '20px' }}
                    >
                      <ArrowUpward sx={{ fontSize: 16 }} />
                    </Button>
                    <Button
                      size="small"
                      onClick={() => moveCategoryDown(index)}
                      disabled={index === formData.categories!.length - 1}
                      sx={{ minWidth: 'auto', p: 0.25, height: '20px' }}
                    >
                      <ArrowDownward sx={{ fontSize: 16 }} />
                    </Button>
                  </Box>
                </Box>
              ))}
            </Box>
            <FormHelperText>
              Usa las flechas para reordenar. La primera categoría es la principal y se usa para compatibilidad.
            </FormHelperText>
          </Grid>
        )}

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            type="number"
            label="Precio"
            value={formData.price}
            onChange={handleInputChange('price')}
            error={!!errors.price}
            helperText={errors.price || 'Ingresa el precio del producto'}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            inputProps={{ min: 0, step: 'any' }}
            required
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Link de Pago"
            value={formData.paymentLink}
            onChange={handleInputChange('paymentLink')}
            error={!!errors.paymentLink}
            helperText={errors.paymentLink || 'URL del link de pago (ej: Flow, Mercado Pago, etc.)'}
            placeholder="https://..."
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
          <RichTextEditor
            label="Descripción"
            value={formData.description || ''}
            onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
            error={!!errors.description}
            placeholder="Describe el producto en detalle..."
            helperText={errors.description || 'Descripción detallada del producto'}
          />
        </Grid>

        <Grid item xs={12}>
          <RichTextEditor
            label="Beneficios"
            value={formData.benefits || ''}
            onChange={(value) => setFormData(prev => ({ ...prev, benefits: value }))}
            placeholder="Lista los beneficios del producto..."
            helperText="Beneficios del producto (opcional)"
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
          <FormControlLabel
            control={
              <Switch
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                color="primary"
              />
            }
            label="Producto activo"
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