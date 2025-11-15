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
} from '@mui/material'
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { Service, ServiceFormData } from '@/types'
import ImageUpload from './ImageUpload'
import RichTextEditor from './RichTextEditor'

const SERVICE_CATEGORIES = [
  'Facial',
  'Corporal',
  'Spa',
  'Masajes',
  'Tratamientos',
  'Otros'
]

interface ServiceFormProps {
  service?: Service | null
  onSave: (data: ServiceFormData) => void
  onCancel: () => void
}

export default function ServiceForm({ service, onSave, onCancel }: ServiceFormProps) {
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    category: '',
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
  const [newRequirement, setNewRequirement] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (service) {
      console.log('📝 Cargando servicio en formulario:')
      console.log('   Description:', service.description?.substring(0, 200))
      console.log('   Benefits:', service.benefits?.substring(0, 200))
      console.log('   Description tiene HTML?:', service.description?.includes('<'))
      console.log('   Benefits tiene HTML?:', service.benefits?.includes('<'))
      
      setFormData({
        name: service.name,
        category: service.category,
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
  }, [service])

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
        category: formData.category,
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
            {SERVICE_CATEGORIES.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="number"
            label="Precio"
            value={formData.price}
            onChange={handleInputChange('price')}
            error={!!errors.price}
            helperText={errors.price || 'Precio máximo: $10,000,000'}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            inputProps={{ min: 0, max: 10000000, step: 1000 }}
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