import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Card,
  Chip,
  IconButton,
  Stack,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material'
import {
  Add as AddIcon,
  ChevronLeft,
  ChevronRight,
  Today,
  Block as BlockIcon,
} from '@mui/icons-material'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, startOfWeek, endOfWeek, isSameMonth, isToday, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { Booking } from '../types'
import { apiService } from '../services/apiService'
import { useSnackbar } from 'notistack'
import LoadingSpinner from '../components/LoadingSpinner'
import BoxCalendar from '../components/BoxCalendar'

const statusColors: Record<string, 'default' | 'warning' | 'success' | 'error' | 'info'> = {
  pending_payment: 'warning',
  confirmed: 'info',
  completed: 'success',
  cancelled: 'error',
  no_show: 'default',
}

const statusLabels: Record<string, string> = {
  pending_payment: 'Pendiente de Pago',
  confirmed: 'Confirmada',
  completed: 'Completada',
  cancelled: 'Cancelada',
  no_show: 'No asistió',
}

export default function BookingsPageDualBox() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [blockedSlots, setBlockedSlots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [blockOpen, setBlockOpen] = useState(false)
  const [blockData, setBlockData] = useState({
    startTime: '',
    endTime: '',
    reason: ''
  })
  const [clients, setClients] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [newBooking, setNewBooking] = useState({
    clientId: '',
    serviceId: '',
    box: 'box1' as 'box1' | 'box2',
    dateTime: '',
    notes: '',
    status: 'pending_payment' as 'pending_payment' | 'confirmed',
    paymentAmount: 20000,
    paymentMethod: '',
    paymentNotes: '',
  })
  const [editedBooking, setEditedBooking] = useState<{
    dateTime: string;
    box: 'box1' | 'box2';
    status: string;
    notes: string;
  }>({
    dateTime: '',
    box: 'box1',
    status: '',
    notes: ''
  })
  const { enqueueSnackbar } = useSnackbar()

  useEffect(() => {
    fetchMonthBookings()
  }, [currentDate])

  useEffect(() => {
    fetchClientsAndServices()
  }, [])

  const fetchMonthBookings = async () => {
    try {
      setLoading(true)
      const start = format(startOfMonth(currentDate), 'yyyy-MM-dd')
      const end = format(endOfMonth(currentDate), 'yyyy-MM-dd')
      
      const [bookingsRes, blockedSlotsRes] = await Promise.all([
        apiService.getBookings({
          dateFrom: start,
          dateTo: end,
        }),
        apiService.get<any[]>(`/blocked-time-slots/range?startDate=${start}&endDate=${end}`)
      ])
      
      setBookings(bookingsRes.bookings || [])
      setBlockedSlots(blockedSlotsRes || [])
    } catch (error) {
      console.error('Error fetching bookings:', error)
      enqueueSnackbar('Error al cargar citas', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const fetchClientsAndServices = async () => {
    try {
      const [clientsRes, servicesRes] = await Promise.all([
        apiService.getClients({ limit: 1000 }),
        apiService.getServices({ limit: 1000 }),
      ])
      setClients(clientsRes.clients || [])
      setServices(servicesRes.services || [])
    } catch (error) {
      console.error('Error fetching clients and services:', error)
    }
  }

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const handleToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(new Date())
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
  }

  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking)
    setDetailsOpen(true)
  }

  const handleEditBooking = (booking: Booking) => {
    setSelectedBooking(booking)
    setEditedBooking({
      dateTime: format(new Date(booking.dateTime), "yyyy-MM-dd'T'HH:mm"),
      box: booking.box || 'box1',
      status: booking.status,
      notes: booking.notes || ''
    })
    setEditOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedBooking) return

    try {
      const updateData: any = {
        dateTime: new Date(editedBooking.dateTime).toISOString(),
        box: editedBooking.box,
        status: editedBooking.status,
        notes: editedBooking.notes
      }

      await apiService.updateBooking(selectedBooking.id, updateData)
      enqueueSnackbar('Cita actualizada correctamente', { variant: 'success' })
      setEditOpen(false)
      fetchMonthBookings()
    } catch (error: any) {
      console.error('Error updating booking:', error)
      const errorMessage = error?.response?.data?.error || error?.message || 'Error al actualizar la cita'
      enqueueSnackbar(errorMessage, { variant: 'error' })
    }
  }

  const handleCreateBooking = async () => {
    if (!newBooking.clientId || !newBooking.serviceId || !newBooking.dateTime) {
      enqueueSnackbar('Por favor completa todos los campos requeridos', { variant: 'warning' })
      return
    }

    try {
      await apiService.createBooking({
        ...newBooking,
        dateTime: new Date(newBooking.dateTime),
      })
      enqueueSnackbar('Cita creada correctamente', { variant: 'success' })
      setCreateOpen(false)
      setNewBooking({
        clientId: '',
        serviceId: '',
        box: 'box1',
        dateTime: '',
        notes: '',
        status: 'pending_payment',
        paymentAmount: 20000,
        paymentMethod: '',
        paymentNotes: '',
      })
      fetchMonthBookings()
    } catch (error: any) {
      console.error('Error creating booking:', error)
      const errorMessage = error?.response?.data?.error || error?.message || 'Error al crear la cita'
      enqueueSnackbar(errorMessage, { variant: 'error' })
    }
  }

  const handleBlockTime = async () => {
    if (!selectedDate || !blockData.startTime || !blockData.endTime) {
      enqueueSnackbar('Por favor completa todos los campos requeridos', { variant: 'warning' })
      return
    }

    try {
      const [startHour, startMinute] = blockData.startTime.split(':').map(Number)
      const [endHour, endMinute] = blockData.endTime.split(':').map(Number)
      
      const startDate = new Date(selectedDate)
      startDate.setHours(startHour, startMinute, 0, 0)
      
      const endDate = new Date(selectedDate)
      endDate.setHours(endHour, endMinute, 0, 0)

      await apiService.post('/blocked-time-slots', {
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        reason: blockData.reason
      })

      enqueueSnackbar('Horario bloqueado correctamente', { variant: 'success' })
      setBlockOpen(false)
      setBlockData({ startTime: '', endTime: '', reason: '' })
      fetchMonthBookings()
    } catch (error: any) {
      console.error('Error blocking time:', error)
      const errorMessage = error?.response?.data?.error || error?.message || 'Error al bloquear horario'
      enqueueSnackbar(errorMessage, { variant: 'error' })
    }
  }

  const handleUnblockTime = async (blockId: string) => {
    try {
      await apiService.delete(`/blocked-time-slots/${blockId}`)
      enqueueSnackbar('Horario desbloqueado correctamente', { variant: 'success' })
      fetchMonthBookings()
    } catch (error: any) {
      console.error('Error unblocking time:', error)
      const errorMessage = error?.response?.data?.error || error?.message || 'Error al desbloquear horario'
      enqueueSnackbar(errorMessage, { variant: 'error' })
    }
  }

  // Generar días del calendario
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { locale: es })
  const calendarEnd = endOfWeek(monthEnd, { locale: es })
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  // Contar citas por día
  const getBookingsForDay = (date: Date) => {
    return bookings.filter(b => isSameDay(new Date(b.dateTime), date))
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Gestión de Citas - 2 Boxes
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<BlockIcon />}
            onClick={() => setBlockOpen(true)}
          >
            Bloquear Horario
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
          >
            Nueva Cita
          </Button>
        </Stack>
      </Stack>

      {/* Navegación del calendario */}
      <Card sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1}>
            <IconButton onClick={handlePrevMonth}>
              <ChevronLeft />
            </IconButton>
            <Button onClick={handleToday} startIcon={<Today />}>
              Hoy
            </Button>
            <IconButton onClick={handleNextMonth}>
              <ChevronRight />
            </IconButton>
          </Stack>
          <Typography variant="h6">
            {format(currentDate, 'MMMM yyyy', { locale: es })}
          </Typography>
        </Stack>

        {/* Mini calendario */}
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={0.5}>
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
              <Grid item xs={12/7} key={day}>
                <Typography variant="caption" align="center" display="block" fontWeight="bold">
                  {day}
                </Typography>
              </Grid>
            ))}
            {calendarDays.map((day) => {
              const dayBookings = getBookingsForDay(day)
              const isSelected = isSameDay(day, selectedDate)
              const isCurrentMonth = isSameMonth(day, currentDate)
              
              return (
                <Grid item xs={12/7} key={day.toString()}>
                  <Box
                    onClick={() => handleDateClick(day)}
                    sx={{
                      p: 1,
                      textAlign: 'center',
                      cursor: 'pointer',
                      borderRadius: 1,
                      bgcolor: isSelected ? 'primary.main' : isToday(day) ? 'primary.light' : 'transparent',
                      color: isSelected ? 'white' : isCurrentMonth ? 'text.primary' : 'text.disabled',
                      '&:hover': {
                        bgcolor: isSelected ? 'primary.dark' : 'action.hover',
                      },
                    }}
                  >
                    <Typography variant="body2">{format(day, 'd')}</Typography>
                    {dayBookings.length > 0 && (
                      <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                        {dayBookings.length} cita{dayBookings.length > 1 ? 's' : ''}
                      </Typography>
                    )}
                  </Box>
                </Grid>
              )
            })}
          </Grid>
        </Box>
      </Card>

      {/* Calendarios de los 2 boxes */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <BoxCalendar
            boxId="box1"
            boxName="Box 1"
            bookings={bookings}
            blockedSlots={blockedSlots}
            selectedDate={selectedDate}
            onBookingClick={handleBookingClick}
            onEditBooking={handleEditBooking}
            onUnblockTime={handleUnblockTime}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <BoxCalendar
            boxId="box2"
            boxName="Box 2"
            bookings={bookings}
            blockedSlots={blockedSlots}
            selectedDate={selectedDate}
            onBookingClick={handleBookingClick}
            onEditBooking={handleEditBooking}
            onUnblockTime={handleUnblockTime}
          />
        </Grid>
      </Grid>

      {/* Dialog de detalles */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Detalles de la Cita</DialogTitle>
        <DialogContent>
          {selectedBooking && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Cliente</Typography>
                <Typography variant="body1">{selectedBooking.client?.name}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Servicio</Typography>
                <Typography variant="body1">{selectedBooking.service?.name}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Box</Typography>
                <Typography variant="body1">{selectedBooking.box === 'box1' ? 'Box 1' : selectedBooking.box === 'box2' ? 'Box 2' : 'Sin asignar'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Fecha y Hora</Typography>
                <Typography variant="body1">
                  {format(new Date(selectedBooking.dateTime), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Duración</Typography>
                <Typography variant="body1">{selectedBooking.duration} minutos</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Estado</Typography>
                <Chip
                  label={statusLabels[selectedBooking.status]}
                  color={statusColors[selectedBooking.status]}
                  size="small"
                />
              </Box>
              {selectedBooking.notes && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Notas</Typography>
                  <Typography variant="body1">{selectedBooking.notes}</Typography>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Cerrar</Button>
          <Button onClick={() => {
            setDetailsOpen(false)
            if (selectedBooking) handleEditBooking(selectedBooking)
          }} variant="contained">
            Editar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de edición */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Cita</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Fecha y Hora"
              type="datetime-local"
              value={editedBooking.dateTime}
              onChange={(e) => setEditedBooking({ ...editedBooking, dateTime: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <FormControl fullWidth>
              <InputLabel>Box</InputLabel>
              <Select
                value={editedBooking.box}
                label="Box"
                onChange={(e) => setEditedBooking({ ...editedBooking, box: e.target.value as 'box1' | 'box2' })}
              >
                <MenuItem value="box1">Box 1</MenuItem>
                <MenuItem value="box2">Box 2</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                value={editedBooking.status}
                label="Estado"
                onChange={(e) => setEditedBooking({ ...editedBooking, status: e.target.value })}
              >
                <MenuItem value="pending_payment">Pendiente de Pago</MenuItem>
                <MenuItem value="confirmed">Confirmada</MenuItem>
                <MenuItem value="completed">Completada</MenuItem>
                <MenuItem value="cancelled">Cancelada</MenuItem>
                <MenuItem value="no_show">No asistió</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Notas"
              multiline
              rows={3}
              value={editedBooking.notes}
              onChange={(e) => setEditedBooking({ ...editedBooking, notes: e.target.value })}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancelar</Button>
          <Button onClick={handleSaveEdit} variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de creación */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nueva Cita</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Cliente</InputLabel>
              <Select
                value={newBooking.clientId}
                label="Cliente"
                onChange={(e) => setNewBooking({ ...newBooking, clientId: e.target.value })}
              >
                {clients.map((client) => (
                  <MenuItem key={client.id} value={client.id}>
                    {client.name} - {client.phone}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Servicio</InputLabel>
              <Select
                value={newBooking.serviceId}
                label="Servicio"
                onChange={(e) => {
                  const service = services.find(s => s.id === e.target.value)
                  setNewBooking({ 
                    ...newBooking, 
                    serviceId: e.target.value,
                    paymentAmount: service?.price || 20000
                  })
                }}
              >
                {services.map((service) => (
                  <MenuItem key={service.id} value={service.id}>
                    {service.name} - ${service.price.toLocaleString()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Box</InputLabel>
              <Select
                value={newBooking.box}
                label="Box"
                onChange={(e) => setNewBooking({ ...newBooking, box: e.target.value as 'box1' | 'box2' })}
              >
                <MenuItem value="box1">Box 1</MenuItem>
                <MenuItem value="box2">Box 2</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Fecha y Hora"
              type="datetime-local"
              value={newBooking.dateTime}
              onChange={(e) => setNewBooking({ ...newBooking, dateTime: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                value={newBooking.status}
                label="Estado"
                onChange={(e) => setNewBooking({ ...newBooking, status: e.target.value as any })}
              >
                <MenuItem value="pending_payment">Pendiente de Pago</MenuItem>
                <MenuItem value="confirmed">Confirmada</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Notas"
              multiline
              rows={3}
              value={newBooking.notes}
              onChange={(e) => setNewBooking({ ...newBooking, notes: e.target.value })}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancelar</Button>
          <Button onClick={handleCreateBooking} variant="contained">
            Crear
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de bloqueo de horarios */}
      <Dialog open={blockOpen} onClose={() => setBlockOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Bloquear Horario</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Fecha seleccionada: {format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: es })}
            </Typography>
            <TextField
              label="Hora de inicio"
              type="time"
              fullWidth
              required
              value={blockData.startTime}
              onChange={(e) => setBlockData({ ...blockData, startTime: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Hora de fin"
              type="time"
              fullWidth
              required
              value={blockData.endTime}
              onChange={(e) => setBlockData({ ...blockData, endTime: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Motivo (opcional)"
              multiline
              rows={3}
              fullWidth
              value={blockData.reason}
              onChange={(e) => setBlockData({ ...blockData, reason: e.target.value })}
              placeholder="Ej: Vacaciones, Mantenimiento, Evento especial"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setBlockOpen(false)
            setBlockData({ startTime: '', endTime: '', reason: '' })
          }}>
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={handleBlockTime}
            disabled={!blockData.startTime || !blockData.endTime}
            startIcon={<BlockIcon />}
          >
            Bloquear
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
