import { Box, Typography, Card, Chip, IconButton, Stack, Button } from '@mui/material'
import { format, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { Booking } from '../types'
import { Edit as EditIcon, Block as BlockIcon, LockOpen as UnlockIcon } from '@mui/icons-material'

interface BoxCalendarProps {
  boxId: 'box1' | 'box2'
  boxName: string
  bookings: Booking[]
  blockedSlots: any[]
  selectedDate: Date
  onBookingClick: (booking: Booking) => void
  onEditBooking: (booking: Booking) => void
  onUnblockTime: (blockId: string) => void
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
  blockedSlots,
  selectedDate,
  onBookingClick,
  onEditBooking,
  onUnblockTime,
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

  // Filtrar bloques del día seleccionado
  const dayBlockedSlots = blockedSlots
    .filter(block => {
      const blockStart = new Date(block.startTime)
      return isSameDay(blockStart, selectedDate)
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())

  // Combinar citas y bloques para mostrarlos ordenados por hora
  const allItems = [
    ...boxBookings.map(b => ({ type: 'booking' as const, data: b, time: new Date(b.dateTime) })),
    ...dayBlockedSlots.map(b => ({ type: 'block' as const, data: b, time: new Date(b.startTime) }))
  ].sort((a, b) => a.time.getTime() - b.time.getTime())

  return (
    <Card sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        {boxName}
      </Typography>
      
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
      </Typography>

      <Box sx={{ mt: 2 }}>
        {allItems.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            Sin citas ni bloques programados
          </Typography>
        ) : (
          <Stack spacing={1}>
            {allItems.map((item, index) => {
              if (item.type === 'booking') {
                const booking = item.data as Booking
                return (
                  <Card
                    key={`booking-${booking.id}`}
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
                )
              } else {
                // Bloque de tiempo
                const block = item.data as any
                return (
                  <Card
                    key={`block-${block.id}`}
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      bgcolor: 'error.light',
                      borderLeft: 4,
                      borderLeftColor: 'error.main',
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Box sx={{ flex: 1 }}>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <BlockIcon fontSize="small" color="error" />
                          <Typography variant="body2" fontWeight="bold" color="error.dark">
                            {format(new Date(block.startTime), 'HH:mm')} - {format(new Date(block.endTime), 'HH:mm')}
                          </Typography>
                        </Stack>
                        <Typography variant="caption" color="error.dark" display="block" sx={{ mt: 0.5 }}>
                          🚫 HORARIO BLOQUEADO (Ambos boxes)
                        </Typography>
                        {block.reason && (
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                            Motivo: {block.reason}
                          </Typography>
                        )}
                      </Box>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<UnlockIcon />}
                        onClick={() => onUnblockTime(block.id)}
                        sx={{ fontSize: '0.7rem' }}
                      >
                        Desbloquear
                      </Button>
                    </Stack>
                  </Card>
                )
              }
            })}
          </Stack>
        )}
      </Box>
    </Card>
  )
}
