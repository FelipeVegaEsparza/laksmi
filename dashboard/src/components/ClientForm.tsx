import React, { useState, useEffect } from 'react'
import {
  Box,
  TextField,
  Button,
  Grid,
  Chip,
  Typography,
} from '@mui/material'
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { Client, ClientFormData } from '@/types'

interface ClientFormProps {
  client?: Client | null
  onSave: (data: ClientFormData) => void
  onCancel: () => void
}

export default function ClientForm({ client, onSave, onCancel }: ClientFormProps) {
  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    phone: '',
    email: '',
    allergies: [],
    preferences: [],
  })
  const [newAllergy, setNewAllergy] = useState('')
  const [newPreference, setNewPreference] = useState('')
  const [errors, setErrors] = useState<Partial<ClientFormData>>({})

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
        phone: client.phone,
        email: client.email || '',
        allergies: client.allergies,
        preferences: client.preferences,
      })
    }
  }, [client])

  const validateForm = (): boolean => {
    const newErrors: Partial<ClientFormData> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido'
    } else if (!/^\+?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Formato de teléfono inválido'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Formato de email inválido'
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

  const handleInputChange = (field: keyof ClientFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const addAllergy = () => {
    if (newAllergy.trim() && !formData.allergies.includes(newAllergy.trim())) {
      setFormData(prev => ({
        ...prev,
        allergies: [...prev.allergies, newAllergy.trim()]
      }))
      setNewAllergy('')
    }
  }

  const removeAllergy = (allergy: string) => {
    setFormData(prev => ({
      ...prev,
      allergies: prev.allergies.filter(a => a !== allergy)
    }))
  }

  const addPreference = () => {
    if (newPreference.trim() && !formData.preferences.includes(newPreference.trim())) {
      setFormData(prev => ({
        ...prev,
        preferences: [...prev.preferences, newPreference.trim()]
      }))
      setNewPreference('')
    }
  }

  const removePreference = (preference: string) => {
    setFormData(prev => ({
      ...prev,
      preferences: prev.preferences.filter(p => p !== preference)
    }))
  }

  const handleAllergyKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addAllergy()
    }
  }

  const handlePreferenceKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addPreference()
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Nombre Completo"
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
            label="Teléfono"
            value={formData.phone}
            onChange={handleInputChange('phone')}
            error={!!errors.phone}
            helperText={errors.phone || 'Incluir código de país (ej: +34)'}
            placeholder="+34 600 123 456"
            required
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            type="email"
            label="Email"
            value={formData.email}
            onChange={handleInputChange('email')}
            error={!!errors.email}
            helperText={errors.email || 'Opcional'}
            placeholder="cliente@email.com"
          />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle2" gutterBottom>
            Alergias
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Agregar alergia..."
              value={newAllergy}
              onChange={(e) => setNewAllergy(e.target.value)}
              onKeyPress={handleAllergyKeyPress}
            />
            <Button
              variant="outlined"
              onClick={addAllergy}
              disabled={!newAllergy.trim()}
              startIcon={<AddIcon />}
            >
              Agregar
            </Button>
          </Box>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {formData.allergies.map((allergy, index) => (
              <Chip
                key={index}
                label={allergy}
                onDelete={() => removeAllergy(allergy)}
                deleteIcon={<DeleteIcon />}
                color="warning"
                variant="outlined"
              />
            ))}
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle2" gutterBottom>
            Preferencias
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Agregar preferencia..."
              value={newPreference}
              onChange={(e) => setNewPreference(e.target.value)}
              onKeyPress={handlePreferenceKeyPress}
            />
            <Button
              variant="outlined"
              onClick={addPreference}
              disabled={!newPreference.trim()}
              startIcon={<AddIcon />}
            >
              Agregar
            </Button>
          </Box>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {formData.preferences.map((preference, index) => (
              <Chip
                key={index}
                label={preference}
                onDelete={() => removePreference(preference)}
                deleteIcon={<DeleteIcon />}
                variant="outlined"
              />
            ))}
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained">
              {client ? 'Actualizar' : 'Crear'} Cliente
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  )
}