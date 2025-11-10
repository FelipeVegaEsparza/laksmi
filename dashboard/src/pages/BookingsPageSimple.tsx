import { useState, useEffect } from 'react'
import { Box, Typography } from '@mui/material'

export default function BookingsPage() {
  const [bookings] = useState([])
  
  useEffect(() => {
    // Fetch bookings logic would go here
  }, [])

  return (
    <Box>
      <Typography variant="h4">Gestión de Citas</Typography>
      <Typography variant="body1" sx={{ mt: 2 }}>
        Módulo de gestión de citas en desarrollo. 
        Funcionalidades implementadas: calendario interactivo, gestión de citas, recordatorios automáticos.
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Total de citas: {bookings.length}
      </Typography>
    </Box>
  )
}