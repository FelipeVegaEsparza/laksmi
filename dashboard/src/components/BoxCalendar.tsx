import { Box, Typography, Card, Chip, IconButton, Stack } from '@mui/material'
import { format, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { Booking } from '../types'
import { Edit as EditIcon } from '@mui/icons-material'

interface BoxCalendarProps {
  boxId: 'box1' | 'box2'
  boxName: string
  bookings: Booking[]
  selectedDate: Date
  onBookingClick: (booking: Booking) => void
  onEditBooking: (booking: Booking) => void
}

const statusColors: Record<string, 'default' | 'warning' | 'success' | 'error' | 'info'> = {
  pending_payment: 'warning',
  confirmed: 'info',
  completed: 'success',
  cancelled: 'error',
  no_show: 'default',
}

const statusLabels: Record<string, string> = {
  pending_payment: 'Pendiente',
  confirmed: 'Confirmada',
  completed: 'Completada',
  cancelled: 'Cancelada',
  no_show: 'No asistió',
}

export default function BoxCalendar({
  boxId,
  boxName,
  bookings,
  selectedDate,
  onBookingClick,
  onEditBooking,
}: BoxCalendarProps) {
  // Filtrar citas del box específico para el día seleccionado
  // También incluir citas sin box (NULL) para mostrarlas y poder asignarlas
  const boxBookings = bookings
    .filter(b => {
      const isSameDate = isSameDay(new Date(b.dateTime), selectedDate)
      // Mostrar citas del box específico O citas sin box asignado
      const isCorrectBox = b.box === boxId || b.box === null || b.box === undefined
      return isSameDate && isCorrectBox
    })
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())

  return (
    <Card sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        {boxName}
      </Typography>
      
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
      </Typography>

      <Box sx={{ mt: 2 }}>
        {boxBookings.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            Sin citas programadas
          </Typography>
        ) : (
          <Stack spacing={1}>
            {boxBookings.map((booking) => (
              <Card
                key={booking.id}
                variant="outlined"
                sx={{
                  p: 1.5,
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                  borderLeft: 4,
                  borderLeftColor: statusColors[booking.status] + '.main',
                }}
                onClick={() => onBookingClick(booking)}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight="bold">
                      {format(new Date(booking.dateTime), 'HH:mm')} - {booking.service?.name || 'Servicio sin nombre'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {booking.client?.name || 'Cliente sin nombre'}
                    </Typography>
                    {(!booking.box || booking.box === null) && (
                      <Typography variant="caption" color="warning.main" display="block" sx={{ fontWeight: 'bold' }}>
                        ⚠️ Sin box asignado - Asignar manualmente
                      </Typography>
                    )}
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={statusLabels[booking.status]}
                        color={statusColors[booking.status]}
                        size="small"
                        sx={{ fontSize: '0.7rem', height: 20 }}
                      />
                    </Box>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEditBooking(booking)
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Card>
            ))}
          </Stack>
        )}
      </Box>
    </Card>
  )
}
