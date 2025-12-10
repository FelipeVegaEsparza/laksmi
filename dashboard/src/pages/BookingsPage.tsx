import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Card,
  Chip,
  IconButton,
  Stack,
  Paper,
  Tabs,
  Tab,
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Menu,
} from '@mui/material'
import {
  Add as AddIcon,
  ChevronLeft,
  ChevronRight,
  Today,
  CalendarMonth,
  ViewList,
  Event,
  Schedule,
  Person,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Block as BlockIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, startOfWeek, endOfWeek, isSameMonth, isToday, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { Booking } from '../types'
import { apiService } from '../services/apiService'
import { useSnackbar } from 'notistack'
import LoadingSpinner from '../components/LoadingSpinner'
import ConfirmDialog from '../components/ConfirmDialog'

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

const statusIcons: Record<string, string> = {
  pending_payment: '⚠️',
  confirmed: '✅',
  completed: '🔵',
  cancelled: '❌',
  no_show: '👻',
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [blockedSlots, setBlockedSlots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
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
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [clients, setClients] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [professionals] = useState<any[]>([]) // TODO: Cargar profesionales desde API
  const [newBooking, setNewBooking] = useState({
    clientId: '',
    serviceId: '',
    professionalId: '',
    dateTime: '',
    notes: '',
    status: 'pending_payment' as 'pending_payment' | 'confirmed',
    paymentAmount: 20000,
    paymentMethod: '',
    paymentNotes: '',
  })
  const [editedBooking, setEditedBooking] = useState<{
    dateTime: string;
    status: string;
    notes: string;
  }>({
    dateTime: '',
    status: '',
    notes: ''
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [bookingToDelete, setBookingToDelete] = useState<string | null>(null)
  const [statusChangeDialog, setStatusChangeDialog] = useState(false)
  const [bookingToChangeStatus, setBookingToChangeStatus] = useState<{booking: Booking, newStatus: string} | null>(null)
  const { enqueueSnackbar} = useSnackbar()

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
      
      // Cargar citas
      const bookingsRes = await apiService.getBookings({
        dateFrom: start,
        dateTo: end,
      })
      setBookings(bookingsRes.bookings || [])
      
      // Cargar bloques bloqueados
      try {
        const blockedRes = await apiService.get(`/blocked-time-slots/range?startDate=${start}&endDate=${end}`) as any
        setBlockedSlots(Array.isArray(blockedRes) ? blockedRes : [])
      } catch (blockedError) {
        console.error('Error fetching blocked slots:', blockedError)
        setBlockedSlots([])
      }
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
  const handleToday = () => setCurrentDate(new Date())

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

  const handleBlockTime = async () => {
    if (!selectedDate || !blockData.startTime || !blockData.endTime) {
      enqueueSnackbar('Por favor completa todos los campos requeridos', { variant: 'warning' })
      return
    }

    try {
      // Crear fechas en hora local de Chile
      // Parseamos la fecha seleccionada y las horas ingresadas
      const [startHour, startMinute] = blockData.startTime.split(':').map(Number)
      const [endHour, endMinute] = blockData.endTime.split(':').map(Number)
      
      // Crear objetos Date en hora local del navegador
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

  const handleUpdateStatus = async (bookingId: string, newStatus: Booking['status']) => {
    try {
      await apiService.updateBooking(bookingId, { status: newStatus })
      enqueueSnackbar('Estado actualizado correctamente', { variant: 'success' })
      fetchMonthBookings()
    } catch (error) {
      console.error('Error updating booking status:', error)
      enqueueSnackbar('Error al actualizar el estado', { variant: 'error' })
    }
  }

  const handleDeleteBooking = (bookingId: string) => {
    setBookingToDelete(bookingId)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteBooking = async () => {
    if (!bookingToDelete) return
    
    try {
      await apiService.deleteBooking(bookingToDelete)
      enqueueSnackbar('Cita eliminada correctamente', { variant: 'success' })
      fetchMonthBookings()
      setDetailsOpen(false)
      setDeleteDialogOpen(false)
      setBookingToDelete(null)
    } catch (error) {
      console.error('Error deleting booking:', error)
      enqueueSnackbar('Error al eliminar la cita', { variant: 'error' })
      setDeleteDialogOpen(false)
      setBookingToDelete(null)
    }
  }

  const cancelDeleteBooking = () => {
    setDeleteDialogOpen(false)
    setBookingToDelete(null)
  }

  const handleChangeStatus = (booking: Booking, newStatus: string) => {
    setBookingToChangeStatus({ booking, newStatus })
    setStatusChangeDialog(true)
  }

  const confirmStatusChange = async () => {
    if (!bookingToChangeStatus) return

    try {
      const updateData: any = {
        status: bookingToChangeStatus.newStatus
      }

      // Si cambia a confirmed, registrar la fecha de pago
      if (bookingToChangeStatus.newStatus === 'confirmed') {
        updateData.paidAt = new Date().toISOString()
      }

      await apiService.put(`/bookings/${bookingToChangeStatus.booking.id}`, updateData)
      enqueueSnackbar('Estado actualizado correctamente', { variant: 'success' })
      setStatusChangeDialog(false)
      setBookingToChangeStatus(null)
      fetchMonthBookings()
    } catch (error: any) {
      console.error('Error updating status:', error)
      const errorMessage = error?.response?.data?.error || error?.message || 'Error al actualizar estado'
      enqueueSnackbar(errorMessage, { variant: 'error' })
    }
  }

  const cancelStatusChange = () => {
    setStatusChangeDialog(false)
    setBookingToChangeStatus(null)
  }

  const handleCreateBooking = async () => {
    if (!newBooking.clientId || !newBooking.serviceId || !newBooking.dateTime) {
      enqueueSnackbar('Por favor completa todos los campos requeridos', { variant: 'warning' })
      return
    }

    try {
      const bookingData: any = {
        clientId: newBooking.clientId,
        serviceId: newBooking.serviceId,
        dateTime: new Date(newBooking.dateTime).toISOString(),
        status: newBooking.status,
        paymentAmount: newBooking.paymentAmount,
      }

      // Solo agregar campos opcionales si tienen valor
      if (newBooking.professionalId) {
        bookingData.preferredProfessionalId = newBooking.professionalId
      }
      
      if (newBooking.notes) {
        bookingData.notes = newBooking.notes
      }

      if (newBooking.paymentMethod) {
        bookingData.paymentMethod = newBooking.paymentMethod
      }

      if (newBooking.paymentNotes) {
        bookingData.paymentNotes = newBooking.paymentNotes
      }

      console.log('📤 Enviando datos de cita:', bookingData)
      const response = await apiService.post('/bookings', bookingData)
      console.log('✅ Respuesta del servidor:', response)
      
      enqueueSnackbar('Cita creada correctamente', { variant: 'success' })
      setCreateOpen(false)
      setNewBooking({
        clientId: '',
        serviceId: '',
        professionalId: '',
        dateTime: '',
        notes: '',
        status: 'pending_payment',
        paymentAmount: 20000,
        paymentMethod: '',
        paymentNotes: '',
      })
      fetchMonthBookings()
    } catch (error: any) {
      console.error('❌ Error creating booking:', error)
      console.error('Error response:', error.response?.data)
      
      const errorDetails = error.response?.data?.details || ''
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Error desconocido'
      
      const fullMessage = errorDetails 
        ? `${errorMessage}: ${errorDetails}`
        : errorMessage
      
      enqueueSnackbar(`Error al crear la cita: ${fullMessage}`, { variant: 'error' })
    }
  }

  const getBookingsForDate = (date: Date) => {
    return bookings.filter(booking => 
      isSameDay(new Date(booking.dateTime), date)
    )
  }

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

    const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

    return (
      <Paper sx={{ p: 3 }}>
        {/* Calendar Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight="600">
            {format(currentDate, 'MMMM yyyy', { locale: es })}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              startIcon={<Today />}
              onClick={handleToday}
              variant="outlined"
            >
              Hoy
            </Button>
            <IconButton onClick={handlePrevMonth} size="small">
              <ChevronLeft />
            </IconButton>
            <IconButton onClick={handleNextMonth} size="small">
              <ChevronRight />
            </IconButton>
          </Stack>
        </Box>

        {/* Week Days */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, mb: 1 }}>
          {weekDays.map(day => (
            <Box key={day} sx={{ textAlign: 'center', py: 1 }}>
              <Typography variant="caption" fontWeight="600" color="text.secondary">
                {day}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Calendar Days */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
          {days.map(day => {
            const dayBookings = getBookingsForDate(day)
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isCurrentDay = isToday(day)
            const isSelected = selectedDate && isSameDay(day, selectedDate)

            return (
              <Paper
                key={day.toString()}
                onClick={() => handleDateClick(day)}
                elevation={isSelected ? 3 : 1}
                sx={{
                  aspectRatio: '1',
                  p: 1.5,
                  cursor: 'pointer',
                  bgcolor: isSelected ? 'primary.50' : isCurrentDay ? 'action.selected' : 'background.paper',
                  border: 2,
                  borderColor: isCurrentDay ? 'primary.main' : isSelected ? 'primary.light' : 'transparent',
                  opacity: isCurrentMonth ? 1 : 0.3,
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    bgcolor: isSelected ? 'primary.100' : 'action.hover',
                    transform: 'scale(1.02)',
                    boxShadow: 3,
                    borderColor: 'primary.light',
                  },
                }}
              >
                <Typography
                  variant="body2"
                  fontWeight={isCurrentDay ? '700' : '500'}
                  color={isCurrentDay ? 'primary.main' : 'text.primary'}
                  sx={{ mb: 1 }}
                >
                  {format(day, 'd')}
                </Typography>
                
                <Stack spacing={0.5} sx={{ flex: 1, overflow: 'hidden' }}>
                  {dayBookings.slice(0, 2).map(booking => (
                    <Chip
                      key={booking.id}
                      label={format(new Date(booking.dateTime), 'HH:mm')}
                      size="small"
                      color={statusColors[booking.status]}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleBookingClick(booking)
                      }}
                      sx={{ 
                        height: 22, 
                        fontSize: '0.7rem',
                        fontWeight: 500,
                        '& .MuiChip-label': { px: 1 }
                      }}
                    />
                  ))}
                  {dayBookings.length > 2 && (
                    <Typography variant="caption" color="primary.main" fontWeight="600" sx={{ textAlign: 'center', fontSize: '0.65rem' }}>
                      +{dayBookings.length - 2}
                    </Typography>
                  )}
                </Stack>
              </Paper>
            )
          })}
        </Box>
      </Paper>
    )
  }

  const getBlockedSlotsForDate = (date: Date) => {
    return blockedSlots.filter(slot => {
      const slotStart = new Date(slot.startTime)
      return isSameDay(slotStart, date)
    })
  }

  const handleDeleteBlockedSlot = async (slotId: string) => {
    if (!confirm('¿Desbloquear este horario?')) return
    
    try {
      await apiService.delete(`/blocked-time-slots/${slotId}`)
      enqueueSnackbar('Horario desbloqueado correctamente', { variant: 'success' })
      fetchMonthBookings()
    } catch (error) {
      console.error('Error deleting blocked slot:', error)
      enqueueSnackbar('Error al desbloquear horario', { variant: 'error' })
    }
  }

  const renderDayDetails = () => {
    if (!selectedDate) {
      return (
        <Paper sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{ textAlign: 'center' }}>
            <CalendarMonth sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Selecciona un día
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Haz clic en un día del calendario para ver sus citas
            </Typography>
          </Box>
        </Paper>
      )
    }

    const dayBookings = getBookingsForDate(selectedDate).sort((a, b) => 
      new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
    )
    
    const dayBlocked = getBlockedSlotsForDate(selectedDate)

    return (
      <Paper sx={{ p: 3, height: '100%', maxHeight: 'calc(100vh - 300px)', overflow: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h6" fontWeight="600">
              {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {dayBookings.length} {dayBookings.length === 1 ? 'cita' : 'citas'}
              {dayBlocked.length > 0 && ` • ${dayBlocked.length} bloqueado${dayBlocked.length === 1 ? '' : 's'}`}
            </Typography>
          </Box>
          <Button 
            size="small" 
            startIcon={<AddIcon />} 
            variant="outlined"
            onClick={(e) => setAnchorEl(e.currentTarget)}
          >
            Agregar
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
          >
            <MenuItem onClick={() => {
              setAnchorEl(null)
              setCreateOpen(true)
            }}>
              <AddIcon sx={{ mr: 1 }} fontSize="small" />
              Crear Cita
            </MenuItem>
            <MenuItem onClick={() => {
              setAnchorEl(null)
              setBlockOpen(true)
            }}>
              <BlockIcon sx={{ mr: 1 }} fontSize="small" />
              Bloquear Horario
            </MenuItem>
          </Menu>
        </Box>
        
        {dayBookings.length === 0 && dayBlocked.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Event sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography color="text.secondary">
              No hay citas programadas
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1.5}>
            {dayBlocked.map(slot => (
              <Card
                key={slot.id}
                variant="outlined"
                sx={{
                  borderLeft: 4,
                  borderLeftColor: 'error.main',
                  bgcolor: 'error.50',
                }}
              >
                <Box sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BlockIcon sx={{ fontSize: 20, color: 'error.main' }} />
                      <Typography variant="h6" fontWeight="600" color="error.main">
                        {format(new Date(slot.startTime), 'HH:mm')} - {format(new Date(slot.endTime), 'HH:mm')}
                      </Typography>
                    </Box>
                    <Chip
                      label="Bloqueado"
                      size="small"
                      color="error"
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                  
                  {slot.reason && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {slot.reason}
                    </Typography>
                  )}
                  
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDeleteBlockedSlot(slot.id)}
                  >
                    Desbloquear
                  </Button>
                </Box>
              </Card>
            ))}
            
            {dayBookings.map(booking => (
              <Card
                key={booking.id}
                variant="outlined"
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  borderLeft: 4,
                  borderLeftColor: `${statusColors[booking.status]}.main`,
                  '&:hover': {
                    boxShadow: 3,
                    transform: 'translateX(4px)',
                    bgcolor: 'action.hover',
                  },
                }}
                onClick={() => handleBookingClick(booking)}
              >
                <Box sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Schedule sx={{ fontSize: 20, color: 'primary.main' }} />
                      <Typography variant="h6" fontWeight="600">
                        {format(new Date(booking.dateTime), 'HH:mm')}
                      </Typography>
                    </Box>
                    <Chip
                      label={statusLabels[booking.status]}
                      size="small"
                      color={statusColors[booking.status]}
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                  
                  <Stack spacing={0.5}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" fontWeight="500">
                        {booking.client?.name || 'Cliente no disponible'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Event sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {booking.service?.name || 'Servicio no disponible'}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Card>
            ))}
          </Stack>
        )}
      </Paper>
    )
  }

  if (loading) {
    return <LoadingSpinner message="Cargando citas..." />
  }

  const getMonthStats = () => {
    const total = bookings.length
    const confirmed = bookings.filter(b => b.status === 'confirmed').length
    const completed = bookings.filter(b => b.status === 'completed').length
    const cancelled = bookings.filter(b => b.status === 'cancelled').length
    const noShow = bookings.filter(b => b.status === 'no_show').length
    return { total, confirmed, completed, cancelled, noShow }
  }

  const stats = getMonthStats()

  const getFilteredBookings = () => {
    if (statusFilter === 'all') return bookings
    return bookings.filter(b => b.status === statusFilter)
  }

  const renderListView = () => {
    const filteredBookings = getFilteredBookings()
    const paginatedBookings = filteredBookings.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    )

    return (
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight="600">
            Lista de Citas
          </Typography>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Filtrar por estado</InputLabel>
            <Select
              value={statusFilter}
              label="Filtrar por estado"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">Todas</MenuItem>
              <MenuItem value="pending_payment">⚠️ Pendientes de Pago</MenuItem>
              <MenuItem value="confirmed">✅ Confirmadas</MenuItem>
              <MenuItem value="completed">🔵 Completadas</MenuItem>
              <MenuItem value="cancelled">❌ Canceladas</MenuItem>
              <MenuItem value="no_show">👻 No asistió</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Fecha y Hora</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell>Servicio</TableCell>
                <TableCell>Duración</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedBookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No hay citas para mostrar
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedBookings.map((booking) => (
                  <TableRow
                    key={booking.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleBookingClick(booking)}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="500">
                        {format(new Date(booking.dateTime), "d 'de' MMM, yyyy", { locale: es })}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(booking.dateTime), 'HH:mm')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {booking.client?.name || 'N/A'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {booking.client?.phone || ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {booking.service?.name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {booking.duration} min
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${statusIcons[booking.status]} ${statusLabels[booking.status]}`}
                        size="small"
                        color={statusColors[booking.status]}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        {booking.status === 'pending_payment' && (
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleChangeStatus(booking, 'confirmed')
                            }}
                            sx={{ minWidth: 'auto', px: 1.5, fontSize: '0.75rem' }}
                          >
                            Confirmar Pago
                          </Button>
                        )}
                        {booking.status === 'confirmed' && (
                          <>
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleChangeStatus(booking, 'completed')
                              }}
                              sx={{ minWidth: 'auto', px: 1.5, fontSize: '0.75rem' }}
                            >
                              Completar
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="warning"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleChangeStatus(booking, 'no_show')
                              }}
                              sx={{ minWidth: 'auto', px: 1.5, fontSize: '0.75rem' }}
                            >
                              No Asistió
                            </Button>
                          </>
                        )}
                        {(booking.status === 'pending_payment' || booking.status === 'confirmed') && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleChangeStatus(booking, 'cancelled')
                            }}
                            sx={{ minWidth: 'auto', px: 1.5, fontSize: '0.75rem' }}
                          >
                            Cancelar
                          </Button>
                        )}
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditBooking(booking)
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteBooking(booking.id)
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filteredBookings.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10))
            setPage(0)
          }}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </Paper>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="600">
          Gestión de Citas
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <Tabs value={viewMode} onChange={(_, v) => setViewMode(v)} sx={{ minHeight: 40 }}>
            <Tab icon={<CalendarMonth />} iconPosition="start" label="Calendario" value="calendar" />
            <Tab icon={<ViewList />} iconPosition="start" label="Lista" value="list" />
          </Tabs>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            size="large"
            onClick={() => setCreateOpen(true)}
          >
            Nueva Cita
          </Button>
        </Stack>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
            <Box sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary" fontWeight="600">
                Total del Mes
              </Typography>
              <Typography variant="h4" fontWeight="700" color="primary.main">
                {stats.total}
              </Typography>
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'info.50', border: '1px solid', borderColor: 'info.200' }}>
            <Box sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary" fontWeight="600">
                Confirmadas
              </Typography>
              <Typography variant="h4" fontWeight="700" color="info.main">
                {stats.confirmed}
              </Typography>
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.50', border: '1px solid', borderColor: 'success.200' }}>
            <Box sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary" fontWeight="600">
                Completadas
              </Typography>
              <Typography variant="h4" fontWeight="700" color="success.main">
                {stats.completed}
              </Typography>
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'error.50', border: '1px solid', borderColor: 'error.200' }}>
            <Box sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary" fontWeight="600">
                Canceladas
              </Typography>
              <Typography variant="h4" fontWeight="700" color="error.main">
                {stats.cancelled}
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Content */}
      {viewMode === 'calendar' ? (
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            {renderCalendar()}
          </Grid>
          <Grid item xs={12} lg={4}>
            {renderDayDetails()}
          </Grid>
        </Grid>
      ) : (
        renderListView()
      )}

      {/* Booking Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Detalles de la Cita</DialogTitle>
        <DialogContent>
          {selectedBooking && (
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight="600">
                  Estado
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={statusLabels[selectedBooking.status]}
                    color={statusColors[selectedBooking.status]}
                  />
                </Box>
              </Box>
              
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight="600">
                  Fecha y Hora
                </Typography>
                <Typography variant="body1">
                  {format(new Date(selectedBooking.dateTime), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight="600">
                  Duración
                </Typography>
                <Typography variant="body1">{selectedBooking.duration} minutos</Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight="600">
                  Cliente
                </Typography>
                <Typography variant="body1">
                  {selectedBooking.client?.name || 'No disponible'}
                </Typography>
                {selectedBooking.client?.phone && (
                  <Typography variant="body2" color="text.secondary">
                    {selectedBooking.client.phone}
                  </Typography>
                )}
                {selectedBooking.client?.email && (
                  <Typography variant="body2" color="text.secondary">
                    {selectedBooking.client.email}
                  </Typography>
                )}
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight="600">
                  Servicio
                </Typography>
                <Typography variant="body1">
                  {selectedBooking.service?.name || 'No disponible'}
                </Typography>
                {selectedBooking.service?.price && (
                  <Typography variant="body2" color="text.secondary">
                    ${selectedBooking.service.price}
                  </Typography>
                )}
              </Box>

              {selectedBooking.professional && (
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight="600">
                    Profesional
                  </Typography>
                  <Typography variant="body1">{selectedBooking.professional.name}</Typography>
                </Box>
              )}

              {selectedBooking.notes && (
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight="600">
                    Notas
                  </Typography>
                  <Typography variant="body2">{selectedBooking.notes}</Typography>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Cerrar</Button>
          <Box sx={{ flex: 1 }} />
          {selectedBooking?.status === 'confirmed' && (
            <>
              <Button
                color="success"
                onClick={() => {
                  handleUpdateStatus(selectedBooking.id, 'completed')
                  setDetailsOpen(false)
                }}
              >
                Completar
              </Button>
              <Button
                color="error"
                onClick={() => {
                  handleUpdateStatus(selectedBooking.id, 'cancelled')
                  setDetailsOpen(false)
                }}
              >
                Cancelar
              </Button>
            </>
          )}
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => {
              if (selectedBooking) {
                handleDeleteBooking(selectedBooking.id)
              }
            }}
          >
            Eliminar
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setDetailsOpen(false)
              handleEditBooking(selectedBooking!)
            }}
          >
            Editar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Booking Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Cita</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Fecha y Hora"
              type="datetime-local"
              fullWidth
              value={editedBooking.dateTime}
              onChange={(e) => setEditedBooking({ ...editedBooking, dateTime: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                value={editedBooking.status}
                label="Estado"
                onChange={(e) => setEditedBooking({ ...editedBooking, status: e.target.value })}
              >
                <MenuItem value="pending_payment">⚠️ Pendiente de Pago</MenuItem>
                <MenuItem value="confirmed">✅ Confirmada</MenuItem>
                <MenuItem value="completed">🔵 Completada</MenuItem>
                <MenuItem value="cancelled">❌ Cancelada</MenuItem>
                <MenuItem value="no_show">👻 No asistió</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Notas"
              multiline
              rows={3}
              fullWidth
              value={editedBooking.notes}
              onChange={(e) => setEditedBooking({ ...editedBooking, notes: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={handleSaveEdit}
            disabled={!editedBooking.dateTime}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Booking Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nueva Cita</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <FormControl fullWidth required>
              <InputLabel>Cliente</InputLabel>
              <Select
                value={newBooking.clientId}
                label="Cliente"
                onChange={(e) => setNewBooking({ ...newBooking, clientId: e.target.value })}
              >
                <MenuItem value="">
                  <em>Selecciona un cliente</em>
                </MenuItem>
                {clients.map((client) => (
                  <MenuItem key={client.id} value={client.id}>
                    {client.name} - {client.phone}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>Servicio</InputLabel>
              <Select
                value={newBooking.serviceId}
                label="Servicio"
                onChange={(e) => setNewBooking({ ...newBooking, serviceId: e.target.value })}
              >
                <MenuItem value="">
                  <em>Selecciona un servicio</em>
                </MenuItem>
                {services.map((service) => (
                  <MenuItem key={service.id} value={service.id}>
                    {service.name} - ${service.price} ({service.duration} min)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Fecha y Hora"
              type="datetime-local"
              fullWidth
              required
              value={newBooking.dateTime}
              onChange={(e) => setNewBooking({ ...newBooking, dateTime: e.target.value })}
              InputLabelProps={{ shrink: true }}
              inputProps={{
                min: format(new Date(), "yyyy-MM-dd'T'HH:mm")
              }}
            />

            <FormControl fullWidth>
              <InputLabel>Profesional (Opcional)</InputLabel>
              <Select
                value={newBooking.professionalId}
                label="Profesional (Opcional)"
                onChange={(e) => setNewBooking({ ...newBooking, professionalId: e.target.value })}
              >
                <MenuItem value="">
                  <em>Sin asignar</em>
                </MenuItem>
                {professionals.map((professional) => (
                  <MenuItem key={professional.id} value={professional.id}>
                    {professional.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                💳 Información de Pago
              </Typography>
              
              <Stack spacing={2} sx={{ mt: 1.5 }}>
                <FormControl fullWidth required>
                  <InputLabel>Estado Inicial</InputLabel>
                  <Select
                    value={newBooking.status}
                    label="Estado Inicial"
                    onChange={(e) => setNewBooking({ ...newBooking, status: e.target.value as 'pending_payment' | 'confirmed' })}
                  >
                    <MenuItem value="pending_payment">⚠️ Pendiente de Pago</MenuItem>
                    <MenuItem value="confirmed">✅ Confirmada (Ya pagó)</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="Monto a Pagar"
                  type="number"
                  fullWidth
                  required
                  value={newBooking.paymentAmount}
                  onChange={(e) => setNewBooking({ ...newBooking, paymentAmount: Number(e.target.value) })}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                  }}
                />

                <TextField
                  label="Método de Pago (Opcional)"
                  fullWidth
                  value={newBooking.paymentMethod}
                  onChange={(e) => setNewBooking({ ...newBooking, paymentMethod: e.target.value })}
                  placeholder="Ej: Transferencia, Mercado Pago, Efectivo"
                />

                <TextField
                  label="Notas de Pago (Opcional)"
                  multiline
                  rows={2}
                  fullWidth
                  value={newBooking.paymentNotes}
                  onChange={(e) => setNewBooking({ ...newBooking, paymentNotes: e.target.value })}
                  placeholder="Ej: Comprobante recibido, Referencia #123"
                />
              </Stack>
            </Box>

            <TextField
              label="Notas de la Cita (Opcional)"
              multiline
              rows={3}
              fullWidth
              value={newBooking.notes}
              onChange={(e) => setNewBooking({ ...newBooking, notes: e.target.value })}
              placeholder="Agregar notas adicionales sobre la cita..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setCreateOpen(false)
            setNewBooking({
              clientId: '',
              serviceId: '',
              professionalId: '',
              dateTime: '',
              notes: '',
              status: 'pending_payment',
              paymentAmount: 20000,
              paymentMethod: '',
              paymentNotes: '',
            })
          }}>
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={handleCreateBooking}
            disabled={!newBooking.clientId || !newBooking.serviceId || !newBooking.dateTime}
          >
            Crear Cita
          </Button>
        </DialogActions>
      </Dialog>

      {/* Block Time Dialog */}
      <Dialog open={blockOpen} onClose={() => setBlockOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Bloquear Horario</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Bloquea un rango de tiempo para que no esté disponible para reservas.
              {selectedDate && ` Fecha: ${format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })}`}
            </Typography>

            <TextField
              label="Hora de Inicio"
              type="time"
              fullWidth
              required
              value={blockData.startTime}
              onChange={(e) => setBlockData({ ...blockData, startTime: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Hora de Fin"
              type="time"
              fullWidth
              required
              value={blockData.endTime}
              onChange={(e) => setBlockData({ ...blockData, endTime: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Motivo (Opcional)"
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

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Eliminar Cita"
        message="¿Estás seguro de que deseas eliminar esta cita? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={confirmDeleteBooking}
        onCancel={cancelDeleteBooking}
        severity="error"
        icon={<DeleteIcon sx={{ fontSize: 28 }} />}
      />

      {/* Confirm Status Change Dialog */}
      <ConfirmDialog
        open={statusChangeDialog}
        title="Cambiar Estado de Reserva"
        message={bookingToChangeStatus ? `¿Confirmas cambiar el estado a "${statusLabels[bookingToChangeStatus.newStatus]}"?` : ''}
        confirmText="Confirmar"
        cancelText="Cancelar"
        onConfirm={confirmStatusChange}
        onCancel={cancelStatusChange}
        severity={bookingToChangeStatus?.newStatus === 'cancelled' ? 'error' : 'warning'}
      />
    </Box>
  )
}
