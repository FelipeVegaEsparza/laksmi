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
} from '@mui/icons-material'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, startOfWeek, endOfWeek, isSameMonth, isToday, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { Booking } from '../types'
import { apiService } from '../services/apiService'
import { useSnackbar } from 'notistack'
import LoadingSpinner from '../components/LoadingSpinner'

const statusColors: Record<string, 'default' | 'warning' | 'success' | 'error' | 'info'> = {
  confirmed: 'info',
  completed: 'success',
  cancelled: 'error',
  no_show: 'warning',
}

const statusLabels: Record<string, string> = {
  confirmed: 'Confirmada',
  completed: 'Completada',
  cancelled: 'Cancelada',
  no_show: 'No asistió',
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
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
      
      const response = await apiService.getBookings({
        startDate: start,
        endDate: end,
      })
      
      setBookings(response.bookings || [])
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
    setEditOpen(true)
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

  const handleDeleteBooking = async (bookingId: string) => {
    if (!window.confirm('¿Estás seguro de eliminar esta cita?')) return
    
    try {
      await apiService.deleteBooking(bookingId)
      enqueueSnackbar('Cita eliminada correctamente', { variant: 'success' })
      fetchMonthBookings()
      setDetailsOpen(false)
    } catch (error) {
      console.error('Error deleting booking:', error)
      enqueueSnackbar('Error al eliminar la cita', { variant: 'error' })
    }
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
      }

      // Solo agregar campos opcionales si tienen valor
      if (newBooking.professionalId) {
        bookingData.preferredProfessionalId = newBooking.professionalId
      }
      
      if (newBooking.notes) {
        bookingData.notes = newBooking.notes
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

    return (
      <Paper sx={{ p: 3, height: '100%', maxHeight: 'calc(100vh - 300px)', overflow: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h6" fontWeight="600">
              {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {dayBookings.length} {dayBookings.length === 1 ? 'cita' : 'citas'}
            </Typography>
          </Box>
          <Button 
            size="small" 
            startIcon={<AddIcon />} 
            variant="outlined"
            onClick={() => setCreateOpen(true)}
          >
            Agregar
          </Button>
        </Box>
        
        {dayBookings.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Event sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography color="text.secondary">
              No hay citas programadas
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1.5}>
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
              <MenuItem value="confirmed">Confirmadas</MenuItem>
              <MenuItem value="completed">Completadas</MenuItem>
              <MenuItem value="cancelled">Canceladas</MenuItem>
              <MenuItem value="no_show">No asistió</MenuItem>
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
                        label={statusLabels[booking.status]}
                        size="small"
                        color={statusColors[booking.status]}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        {booking.status === 'confirmed' && (
                          <IconButton
                            size="small"
                            color="success"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleUpdateStatus(booking.id, 'completed')
                            }}
                            title="Marcar como completada"
                          >
                            <CheckCircleIcon fontSize="small" />
                          </IconButton>
                        )}
                        {booking.status === 'confirmed' && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleUpdateStatus(booking.id, 'cancelled')
                            }}
                            title="Cancelar cita"
                          >
                            <CancelIcon fontSize="small" />
                          </IconButton>
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
              defaultValue={selectedBooking ? format(new Date(selectedBooking.dateTime), "yyyy-MM-dd'T'HH:mm") : ''}
              InputLabelProps={{ shrink: true }}
            />
            
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                defaultValue={selectedBooking?.status || 'confirmed'}
                label="Estado"
              >
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
              fullWidth
              defaultValue={selectedBooking?.notes || ''}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={() => {
            enqueueSnackbar('Funcionalidad de edición en desarrollo', { variant: 'info' })
            setEditOpen(false)
          }}>
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

            <TextField
              label="Notas (Opcional)"
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
    </Box>
  )
}
