import React, { useState, useEffect } from 'react'
import {
  Box,
  TextField,
  Button,
  Grid,
  Typography,
  Autocomplete,
  Alert,
} from '@mui/material'
import { format } from 'date-fns'
import { Booking, BookingFormData, Client, Service, Professional } from '@/types'
import { apiService } from '@/services/apiService'

interface BookingFormProps {
  booking?: Booking | null
  onSave: (data: BookingFormData) => void
  onCancel: () => void
}

export default function BookingForm({ booking, onSave, onCancel }: BookingFormProps) {
  const [formData, setFormData] = useState<BookingFormData>({
    clientId: '',
    serviceId: '',
    professionalId: '',
    dateTime: new Date(),
    notes: '',
  })
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null)
  const [availability, setAvailability] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (booking) {
      setFormData({
        clientId: booking.clientId,
        serviceId: booking.serviceId,
        professionalId: booking.professionalId || '',
        dateTime: new Date(booking.dateTime),
        notes: booking.notes || '',
      })
      
      // Set selected items for autocompletes
      if (booking.client) setSelectedClient(booking.client)
      if (booking.service) setSelectedService(booking.service)
      if (booking.professional) setSelectedProfessional(booking.professional)
    }
  }, [booking])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      const [clientsData, servicesData, professionalsData] = await Promise.all([
        apiService.get<Client[]>('/clients'),
        apiService.get<Service[]>('/services?active=true'),
        apiService.get<Professional[]>('/professionals?active=true'),
      ])
      
      setClients(clientsData)
      setServices(servicesData)
      setProfessionals(professionalsData)
    } catch (error) {
      console.error('Error fetching initial data:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkAvailability = async () => {
    if (formData.serviceId && formData.dateTime) {
      try {
        const availabilityData = await apiService.get<string[]>('/bookings/availability', {
          params: {
            serviceId: formData.serviceId,
            date: formData.dateTime.toISOString().split('T')[0],
            professionalId: formData.professionalId || undefined,
          }
        })
        setAvailability(availabilityData)
      } catch (error) {
        console.error('Error checking availability:', error)
      }
    }
  }

  useEffect(() => {
    checkAvailability()
  }, [formData.serviceId, formData.dateTime, formData.professionalId])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.clientId) {
      newErrors.clientId = 'El cliente es requerido'
    }

    if (!formData.serviceId) {
      newErrors.serviceId = 'El servicio es requerido'
    }

    if (!formData.dateTime) {
      newErrors.dateTime = 'La fecha y hora son requeridas'
    } else if (formData.dateTime < new Date()) {
      newErrors.dateTime = 'La fecha no puede ser en el pasado'
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

  const handleClientChange = (_event: any, newValue: Client | null) => {
    setSelectedClient(newValue)
    setFormData(prev => ({ ...prev, clientId: newValue?.id || '' }))
    if (errors.clientId) {
      setErrors(prev => ({ ...prev, clientId: '' }))
    }
  }

  const handleServiceChange = (_event: any, newValue: Service | null) => {
    setSelectedService(newValue)
    setFormData(prev => ({ ...prev, serviceId: newValue?.id || '' }))
    if (errors.serviceId) {
      setErrors(prev => ({ ...prev, serviceId: '' }))
    }
  }

  const handleProfessionalChange = (_event: any, newValue: Professional | null) => {
    setSelectedProfessional(newValue)
    setFormData(prev => ({ ...prev, professionalId: newValue?.id || '' }))
  }

  const handleDateTimeChange = (newValue: Date | null) => {
    if (newValue) {
      setFormData(prev => ({ ...prev, dateTime: newValue }))
      if (errors.dateTime) {
        setErrors(prev => ({ ...prev, dateTime: '' }))
      }
    }
  }

  const handleNotesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, notes: e.target.value }))
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <Typography>Cargando datos...</Typography>
      </Box>
    )
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Autocomplete
              options={clients}
              getOptionLabel={(option) => `${option.name} (${option.phone})`}
              value={selectedClient}
              onChange={handleClientChange}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Cliente"
                  error={!!errors.clientId}
                  helperText={errors.clientId}
                  required
                />
              )}
              isOptionEqualToValue={(option, value) => option.id === value.id}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Autocomplete
              options={services}
              getOptionLabel={(option) => `${option.name} (${option.duration} min - €${option.price})`}
              value={selectedService}
              onChange={handleServiceChange}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Servicio"
                  error={!!errors.serviceId}
                  helperText={errors.serviceId}
                  required
                />
              )}
              isOptionEqualToValue={(option, value) => option.id === value.id}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="datetime-local"
              label="Fecha y Hora"
              value={format(formData.dateTime, "yyyy-MM-dd'T'HH:mm")}
              onChange={(e) => handleDateTimeChange(new Date(e.target.value))}
              error={!!errors.dateTime}
              helperText={errors.dateTime}
              required
              InputLabelProps={{
                shrink: true,
              }}
              inputProps={{
                min: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Autocomplete
              options={professionals}
              getOptionLabel={(option) => option.name}
              value={selectedProfessional}
              onChange={handleProfessionalChange}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Profesional"
                  helperText="Opcional - Se asignará automáticamente si no se selecciona"
                />
              )}
              isOptionEqualToValue={(option, value) => option.id === value.id}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notas"
              value={formData.notes}
              onChange={handleNotesChange}
              placeholder="Notas adicionales sobre la cita..."
            />
          </Grid>

          {selectedClient && selectedClient.allergies.length > 0 && (
            <Grid item xs={12}>
              <Alert severity="warning">
                <Typography variant="subtitle2" gutterBottom>
                  Alergias del cliente:
                </Typography>
                <Typography variant="body2">
                  {selectedClient.allergies.join(', ')}
                </Typography>
              </Alert>
            </Grid>
          )}

          {availability.length > 0 && (
            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="subtitle2" gutterBottom>
                  Horarios disponibles para este día:
                </Typography>
                <Typography variant="body2">
                  {availability.join(', ')}
                </Typography>
              </Alert>
            </Grid>
          )}

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button variant="outlined" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="submit" variant="contained">
                {booking ? 'Actualizar' : 'Crear'} Cita
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
  )
}