import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  MenuItem,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
  Avatar,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  CalendarToday as CalendarIcon,
  Schedule as ScheduleIcon,
  Event as EventIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
} from '@mui/icons-material'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isSameMonth, isToday } from 'date-fns'
import { es } from 'date-fns/locale'
import { Booking, BookingFormData, Client, Service, Professional } from '../types'
import { apiService } from '../services/apiService'
// import { useNotifications } from '../contexts/NotificationContext'
import DataTable, { Column } from '../components/DataTable'
import FormModal from '../components/FormModal'
import BookingForm from '../components/BookingForm'
import LoadingSpinner from '../components/LoadingSpinner'

interface CalendarDay {
  date: Date
  bookings: Booking[]
  isCurrentMonth: boolean
  isToday: boolean
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [total, setTotal] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)
  const [viewMode, setViewMode] = useState<'calendar' | 'table'>('calendar')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [dayBookings, setDayBookings] = useState<Booking[]>([])
  const [dayModalOpen, setDayModalOpen] = useState(false)
  
  const showNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    console.log(`${type.toUpperCase()}: ${message}`)
  }

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm,
        status: statusFilter,
        date: dateFilter,
      }
      
      const response = await apiService.getBookings(params)
      setBookings(response.bookings || [])
      setTotal(response.total || 0)
    } catch (error) {
      console.error('Error fetching bookings:', error)
      showNotification('Error al cargar citas', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchMonthBookings = async (date: Date) => {
    try {
      const start = startOfMonth(date)
      const end = endOfMonth(date)
      
      const monthBookings = await apiService.get<Booking[]>('/bookings/month', {
        params: {
          start: start.toISOString(),
          end: end.toISOString(),
        }
      })
      
      return monthBookings
    } catch (error) {
      console.error('Error fetching month bookings:', error)
      return []
    }
  }

  useEffect(() => {
    if (viewMode === 'table') {
      fetchBookings()
    }
  }, [page, rowsPerPage, searchTerm, statusFilter, dateFilter, viewMode])

  const handleCreateBooking = () => {
    setEditingBooking(null)
    setModalOpen(true)
  }

  const handleEditBooking = (booking: Booking) => {
    setEditingBooking(booking)
    setModalOpen(true)
  }

  const handleDeleteBooking = async (booking: Booking) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar la cita de ${booking.client?.name}?`)) {
      try {
        await apiService.delete(`/bookings/${booking.id}`)
        showNotification('Cita eliminada correctamente', 'success')
        fetchBookings()
      } catch (error) {
        console.error('Error deleting booking:', error)
        showNotification('Error al eliminar cita', 'error')
      }
    }
  }

  const handleSaveBooking = async (formData: BookingFormData) => {
    try {
      if (editingBooking) {
        await apiService.put(`/bookings/${editingBooking.id}`, formData)
        showNotification('Cita actualizada correctamente', 'success')
      } else {
        await apiService.post('/bookings', formData)
        showNotification('Cita creada correctamente', 'success')
      }
      setModalOpen(false)
      fetchBookings()
    } catch (error) {
      console.error('Error saving booking:', error)
      showNotification('Error al guardar cita', 'error')
    }
  }

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return 'success'
      case 'cancelled':
        return 'error'
      case 'completed':
        return 'info'
      case 'no_show':
        return 'warning'
      default:
        return 'default'
    }
  }

  const getStatusLabel = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmada'
      case 'cancelled':
        return 'Cancelada'
      case 'completed':
        return 'Completada'
      case 'no_show':
        return 'No Show'
      default:
        return status
    }
  }

  // Calendar functionality
  const generateCalendarDays = async (date: Date): Promise<CalendarDay[]> => {
    const monthStart = startOfMonth(date)
    const monthEnd = endOfMonth(date)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
    
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
    const monthBookings = await fetchMonthBookings(date)
    
    return days.map(day => ({
      date: day,
      bookings: monthBookings.filter(booking => 
        isSameDay(new Date(booking.dateTime), day)
      ),
      isCurrentMonth: isSameMonth(day, date),
      isToday: isToday(day),
    }))
  }

  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([])

  useEffect(() => {
    if (viewMode === 'calendar') {
      generateCalendarDays(currentDate).then(setCalendarDays)
    }
  }, [currentDate, viewMode])

  const handlePrevMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1))
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const handleDayClick = (day: CalendarDay) => {
    setSelectedDate(day.date)
    setDayBookings(day.bookings)
    setDayModalOpen(true)
  }

  const columns: Column<Booking>[] = [
    {
      id: 'client',
      label: 'Cliente',
      minWidth: 200,
      format: (value: Client) => value?.name || 'Cliente desconocido',
    },
    {
      id: 'service',
      label: 'Servicio',
      minWidth: 200,
      format: (value: Service) => value?.name || 'Servicio desconocido',
    },
    {
      id: 'dateTime',
      label: 'Fecha y Hora',
      minWidth: 180,
      format: (value: Date) => format(new Date(value), 'dd/MM/yyyy HH:mm', { locale: es }),
    },
    {
      id: 'duration',
      label: 'Duración',
      minWidth: 100,
      align: 'center',
      format: (value: number) => `${value} min`,
    },
    {
      id: 'status',
      label: 'Estado',
      minWidth: 120,
      align: 'center',
      format: (value: Booking['status']) => (
        <Chip
          label={getStatusLabel(value)}
          color={getStatusColor(value)}
          size="small"
        />
      ),
    },
    {
      id: 'professional',
      label: 'Profesional',
      minWidth: 150,
      format: (value?: Professional) => value?.name || 'Sin asignar',
    },
  ]

  if (loading && bookings.length === 0 && viewMode === 'table') {
    return <LoadingSpinner message="Cargando citas..." />
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Gestión de Citas
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant={viewMode === 'calendar' ? 'contained' : 'outlined'}
            startIcon={<CalendarIcon />}
            onClick={() => setViewMode('calendar')}
          >
            Calendario
          </Button>
          <Button
            variant={viewMode === 'table' ? 'contained' : 'outlined'}
            startIcon={<EventIcon />}
            onClick={() => setViewMode('table')}
          >
            Lista
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateBooking}
          >
            Nueva Cita
          </Button>
        </Box>
      </Box>

      {viewMode === 'calendar' ? (
        <Box>
          {/* Calendar Header */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton onClick={handlePrevMonth}>
                  <ChevronLeftIcon />
                </IconButton>
                <Typography variant="h5">
                  {format(currentDate, 'MMMM yyyy', { locale: es })}
                </Typography>
                <IconButton onClick={handleNextMonth}>
                  <ChevronRightIcon />
                </IconButton>
              </Box>
              <Button
                variant="outlined"
                startIcon={<TodayIcon />}
                onClick={handleToday}
              >
                Hoy
              </Button>
            </Box>

            {/* Calendar Grid */}
            <Grid container spacing={1}>
              {/* Week headers */}
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                <Grid item xs key={day}>
                  <Box sx={{ p: 1, textAlign: 'center', fontWeight: 'bold' }}>
                    {day}
                  </Box>
                </Grid>
              ))}
              
              {/* Calendar days */}
              {calendarDays.map((day, index) => (
                <Grid item xs key={index}>
                  <Card
                    sx={{
                      minHeight: 120,
                      cursor: 'pointer',
                      opacity: day.isCurrentMonth ? 1 : 0.5,
                      bgcolor: day.isToday ? 'primary.light' : 'background.paper',
                      '&:hover': {
                        bgcolor: day.isToday ? 'primary.main' : 'action.hover',
                      },
                    }}
                    onClick={() => handleDayClick(day)}
                  >
                    <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: day.isToday ? 'bold' : 'normal',
                          color: day.isToday ? 'primary.contrastText' : 'text.primary',
                        }}
                      >
                        {format(day.date, 'd')}
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        {day.bookings.slice(0, 3).map((booking, idx) => (
                          <Chip
                            key={idx}
                            label={format(new Date(booking.dateTime), 'HH:mm')}
                            size="small"
                            color={getStatusColor(booking.status)}
                            sx={{ 
                              fontSize: '0.7rem', 
                              height: 20, 
                              mb: 0.25,
                              display: 'block',
                              width: 'fit-content',
                            }}
                          />
                        ))}
                        {day.bookings.length > 3 && (
                          <Typography variant="caption" color="text.secondary">
                            +{day.bookings.length - 3} más
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Box>
      ) : (
        <Box>
          {/* Filters for table view */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Buscar citas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                select
                label="Estado"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">Todos los estados</MenuItem>
                <MenuItem value="confirmed">Confirmada</MenuItem>
                <MenuItem value="cancelled">Cancelada</MenuItem>
                <MenuItem value="completed">Completada</MenuItem>
                <MenuItem value="no_show">No Show</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="date"
                label="Fecha"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
          </Grid>

          {/* Bookings Table */}
          <DataTable
            columns={columns}
            data={bookings}
            total={total}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={setPage}
            onRowsPerPageChange={setRowsPerPage}
            onEdit={handleEditBooking}
            onDelete={handleDeleteBooking}
            loading={loading}
            emptyMessage="No se encontraron citas"
            getRowId={(booking) => booking.id}
          />
        </Box>
      )}

      {/* Booking Form Modal */}
      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingBooking ? 'Editar Cita' : 'Nueva Cita'}
        maxWidth="md"
      >
        <BookingForm
          booking={editingBooking}
          onSave={handleSaveBooking}
          onCancel={() => setModalOpen(false)}
        />
      </FormModal>

      {/* Day Bookings Modal */}
      <Dialog
        open={dayModalOpen}
        onClose={() => setDayModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Citas del {selectedDate && format(selectedDate, 'dd/MM/yyyy', { locale: es })}
        </DialogTitle>
        <DialogContent>
          {dayBookings.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 2 }}>
              No hay citas programadas para este día
            </Typography>
          ) : (
            <List>
              {dayBookings.map((booking, index) => (
                <React.Fragment key={booking.id}>
                  <ListItem>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: `${getStatusColor(booking.status)}.main` }}>
                        <ScheduleIcon />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1">
                            {format(new Date(booking.dateTime), 'HH:mm')} - {booking.client?.name}
                          </Typography>
                          <Chip
                            label={getStatusLabel(booking.status)}
                            color={getStatusColor(booking.status)}
                            size="small"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2">
                            {booking.service?.name} ({booking.duration} min)
                          </Typography>
                          {booking.professional && (
                            <Typography variant="body2" color="text.secondary">
                              Profesional: {booking.professional.name}
                            </Typography>
                          )}
                          {booking.notes && (
                            <Typography variant="body2" color="text.secondary">
                              Notas: {booking.notes}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    <Box>
                      <Tooltip title="Editar">
                        <IconButton onClick={() => handleEditBooking(booking)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </ListItem>
                  {index < dayBookings.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDayModalOpen(false)}>Cerrar</Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setDayModalOpen(false)
              handleCreateBooking()
            }}
          >
            Nueva Cita
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}