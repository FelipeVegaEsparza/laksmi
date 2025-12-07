import React, { useState, useEffect } from 'react'
import {
  Box,
  TextField,
  MenuItem,
  FormControlLabel,
  Switch,
  Button,
  Grid,
  Chip,
  Typography,
  InputAdornment,
  FormHelperText,
  FormControl,
  InputLabel,
} from '@mui/material'
import { Add as AddIcon, Delete as DeleteIcon, Star as StarIcon, ArrowUpward, ArrowDownward } from '@mui/icons-material'
import { Service, ServiceFormData } from '@/types'
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

interface ServiceFormProps {
  service?: Service | null
  onSave: (data: ServiceFormData) => void
  onCancel: () => void
}

export default function ServiceForm({ service, onSave, onCancel }: ServiceFormProps) {
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    category: '',
    categories: [],
    price: 0,
    duration: 60,
    description: '',
    benefits: '',
    images: [],
    requirements: [],
    isActive: true,
    sessions: 1,
    tag: '',
  })
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [newRequirement, setNewRequirement] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    // Cargar categorías desde el backend
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true)
        const response = await apiService.get<any>('/categories?type=service&isActive=true')
        const categoriesData = response.data || response
        let cats = Array.isArray(categoriesData) ? categoriesData : []
        
        // Si estamos editando y la categoría del servicio no está en la lista, agregarla
        if (service && service.category) {
          const categoryExists = cats.some(c => c.name === service.category)
          if (!categoryExists) {
            console.warn(`⚠️ Categoría "${service.category}" no encontrada en la lista, agregándola temporalmente`)
            cats = [...cats, { id: service.category, name: service.category, type: 'service', isActive: true }]
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
  }, [service])

  useEffect(() => {
    if (service) {
      console.log('📝 Cargando servicio en formulario:')
      console.log('   Categoría del servicio:', `"${service.category}"`)
      console.log('   Categorías del servicio:', service.categories)
      console.log('   Categorías disponibles:', categories.map(c => `"${c.name}"`))
      console.log('   Description:', service.description?.substring(0, 200))
      console.log('   Benefits:', service.benefits?.substring(0, 200))
      console.log('   Description tiene HTML?:', service.description?.includes('<'))
      console.log('   Benefits tiene HTML?:', service.benefits?.includes('<'))
      
      // Use categories array if available, otherwise fall back to single category
      const serviceCategories = service.categories && service.categories.length > 0 
        ? service.categories 
        : [service.category]
      
      setFormData({
        name: service.name,
        category: service.category,
        categories: serviceCategories,
        price: service.price,
        duration: service.duration,
        description: service.description || '',
        benefits: service.benefits || '',
        images: service.images || [],
        requirements: service.requirements,
        isActive: service.isActive,
        sessions: service.sessions || 1,
        tag: service.tag || '',
      })
    }
  }, [service, categories])

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

    if (formData.duration <= 0) {
      newErrors.duration = 'La duración debe ser mayor a 0'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('🔍 ServiceForm - Enviando datos completos:', {
      isEditing: !!service,
      serviceId: service?.id,
      formData: formData
    })
    if (validateForm()) {
      // Limpiar datos antes de enviar - NO hacer trim en HTML (description y benefits)
      const cleanedData: any = {
        name: formData.name.trim(),
        category: formData.categories && formData.categories.length > 0 ? formData.categories[0] : '',
        categories: formData.categories || [],
        price: Number(formData.price),
        duration: Number(formData.duration),
        description: formData.description || '',
        benefits: formData.benefits || '',
        images: Array.isArray(formData.images) ? formData.images : [],
        requirements: Array.isArray(formData.requirements) ? formData.requirements : [],
        isActive: Boolean(formData.isActive),
        sessions: Number(formData.sessions) || 1,
      }
      
      // Solo agregar tag si tiene valor
      if (formData.tag && formData.tag.trim() !== '') {
        cleanedData.tag = formData.tag.trim()
      }
      
      console.log('📤 ServiceForm - Datos a enviar:')
      console.log('   Primary category:', cleanedData.category)
      console.log('   All categories:', cleanedData.categories)
      console.log('   Description preview:', cleanedData.description?.substring(0, 200))
      console.log('   Benefits preview:', cleanedData.benefits?.substring(0, 200))
      console.log('   Description es HTML?:', cleanedData.description?.includes('<'))
      console.log('   Benefits es HTML?:', cleanedData.benefits?.includes('<'))
      onSave(cleanedData)
    }
  }

  const handleInputChange = (field: keyof ServiceFormData) => (
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

  const handleSwitchChange = (field: keyof ServiceFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.checked }))
  }

  const addRequirement = () => {
    const requirements = Array.isArray(formData.requirements) ? formData.requirements : []
    if (newRequirement.trim() && !requirements.includes(newRequirement.trim())) {
      setFormData(prev => ({
        ...prev,
        requirements: [...requirements, newRequirement.trim()]
      }))
      setNewRequirement('')
    }
  }

  const removeRequirement = (requirement: string) => {
    setFormData(prev => ({
      ...prev,
      requirements: Array.isArray(prev.requirements) 
        ? prev.requirements.filter(req => req !== requirement)
        : []
    }))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addRequirement()
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

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Nombre del Servicio"
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

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="number"
            label="Precio"
            value={formData.price}
            onChange={handleInputChange('price')}
            error={!!errors.price}
            helperText={errors.price || 'Ingresa el precio del servicio'}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            inputProps={{ min: 0, step: 'any' }}
            required
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="number"
            label="Duración (minutos)"
            value={formData.duration}
            onChange={handleInputChange('duration')}
            error={!!errors.duration}
            helperText={errors.duration}
            inputProps={{ min: 1, step: 1 }}
            required
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="number"
            label="Cantidad de Sesiones"
            value={formData.sessions}
            onChange={handleInputChange('sessions')}
            helperText="Número de sesiones recomendadas para el tratamiento"
            inputProps={{ min: 1, step: 1 }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            select
            label="Etiqueta"
            value={formData.tag || ''}
            onChange={handleInputChange('tag')}
            helperText="Etiqueta opcional para destacar el servicio"
          >
            <MenuItem value="">Sin etiqueta</MenuItem>
            <MenuItem value="Popular">Popular</MenuItem>
            <MenuItem value="Nuevo">Nuevo</MenuItem>
            <MenuItem value="Oferta">Oferta</MenuItem>
            <MenuItem value="Recomendado">Recomendado</MenuItem>
          </TextField>
        </Grid>

        <Grid item xs={12}>
          <RichTextEditor
            label="Descripción *"
            value={formData.description}
            onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
            placeholder="Describe el servicio en detalle..."
            error={!!errors.description}
            helperText={errors.description || 'Descripción detallada del servicio'}
            maxLength={5000}
          />
        </Grid>

        <Grid item xs={12}>
          <RichTextEditor
            label="Beneficios"
            value={formData.benefits || ''}
            onChange={(value) => setFormData(prev => ({ ...prev, benefits: value }))}
            placeholder="Lista los beneficios del servicio..."
            helperText="Beneficios del servicio (opcional)"
            maxLength={5000}
          />
        </Grid>

        <Grid item xs={12}>
          <ImageUpload
            images={formData.images}
            onChange={(images) => setFormData(prev => ({ ...prev, images }))}
            type="services"
            maxImages={5}
            label="Imágenes del Servicio"
            helperText="Sube imágenes del servicio para mostrar a los clientes"
          />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle2" gutterBottom>
            Requisitos Previos
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Agregar requisito..."
              value={newRequirement}
              onChange={(e) => setNewRequirement(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <Button
              variant="outlined"
              onClick={addRequirement}
              disabled={!newRequirement.trim()}
              startIcon={<AddIcon />}
            >
              Agregar
            </Button>
          </Box>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {Array.isArray(formData.requirements) && formData.requirements.map((requirement, index) => (
              <Chip
                key={index}
                label={requirement}
                onDelete={() => removeRequirement(requirement)}
                deleteIcon={<DeleteIcon />}
                variant="outlined"
              />
            ))}
          </Box>
        </Grid>

        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.isActive}
                onChange={handleSwitchChange('isActive')}
              />
            }
            label="Servicio activo"
          />
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained">
              {service ? 'Actualizar' : 'Crear'} Servicio
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  )
}