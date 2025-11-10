import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Grid,
  Chip,

  TextField,
  InputAdornment,
  Card,
  CardContent,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material'
import {
  Add as AddIcon,
  Search as SearchIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  EventNote as EventNoteIcon,
  Star as StarIcon,
  Warning as WarningIcon,
  History as HistoryIcon,
} from '@mui/icons-material'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Client, ClientFormData, Booking } from '@/types'
import { apiService } from '@/services/apiService'
import { useNotifications } from '@/contexts/NotificationContext'
import DataTable, { Column } from '@/components/DataTable'
import FormModal from '@/components/FormModal'
import ClientForm from '@/components/ClientForm'
import LoadingSpinner from '@/components/LoadingSpinner'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [total, setTotal] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clientHistory, setClientHistory] = useState<Booking[]>([])
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [historyTab, setHistoryTab] = useState(0)
  
  useNotifications() // For future use
  
  const showNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    // This would typically be handled by a toast library or notification system
    console.log(`${type.toUpperCase()}: ${message}`)
  }

  const fetchClients = async () => {
    try {
      setLoading(true)
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm,
      }
      
      const response = await apiService.getClients(params)
      setClients(response.clients || [])
      setTotal(response.pagination?.total || 0)
    } catch (error) {
      console.error('Error fetching clients:', error)
      showNotification('Error al cargar clientes', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchClientHistory = async (clientId: string) => {
    try {
      const history = await apiService.get<Booking[]>(`/clients/${clientId}/history`)
      setClientHistory(history)
    } catch (error) {
      console.error('Error fetching client history:', error)
      showNotification('Error al cargar historial del cliente', 'error')
    }
  }

  useEffect(() => {
    fetchClients()
  }, [page, rowsPerPage, searchTerm])

  const handleCreateClient = () => {
    setEditingClient(null)
    setModalOpen(true)
  }

  const handleEditClient = (client: Client) => {
    setEditingClient(client)
    setModalOpen(true)
  }

  const handleViewClient = (client: Client) => {
    setSelectedClient(client)
    setHistoryTab(0)
    fetchClientHistory(client.id)
    setHistoryModalOpen(true)
  }

  const handleDeleteClient = async (client: Client) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar el cliente "${client.name}"?`)) {
      try {
        await apiService.delete(`/clients/${client.id}`)
        showNotification('Cliente eliminado correctamente', 'success')
        fetchClients()
      } catch (error) {
        console.error('Error deleting client:', error)
        showNotification('Error al eliminar cliente', 'error')
      }
    }
  }

  const handleSaveClient = async (formData: ClientFormData) => {
    try {
      if (editingClient) {
        await apiService.put(`/clients/${editingClient.id}`, formData)
        showNotification('Cliente actualizado correctamente', 'success')
      } else {
        await apiService.post('/clients', formData)
        showNotification('Cliente creado correctamente', 'success')
      }
      setModalOpen(false)
      fetchClients()
    } catch (error) {
      console.error('Error saving client:', error)
      showNotification('Error al guardar cliente', 'error')
    }
  }

  const getLoyaltyLevel = (points: number) => {
    if (points >= 1000) return { label: 'VIP', color: 'primary' as const }
    if (points >= 500) return { label: 'Gold', color: 'warning' as const }
    if (points >= 100) return { label: 'Silver', color: 'info' as const }
    return { label: 'Bronze', color: 'default' as const }
  }

  const getBookingStatusColor = (status: Booking['status']) => {
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

  const columns: Column<Client>[] = [
    {
      id: 'name',
      label: 'Nombre',
      minWidth: 200,
    },
    {
      id: 'phone',
      label: 'Teléfono',
      minWidth: 150,
      format: (value: string) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PhoneIcon fontSize="small" />
          {value}
        </Box>
      ),
    },
    {
      id: 'email',
      label: 'Email',
      minWidth: 200,
      format: (value?: string) => value ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmailIcon fontSize="small" />
          {value}
        </Box>
      ) : '-',
    },
    {
      id: 'loyaltyPoints',
      label: 'Puntos',
      minWidth: 120,
      align: 'center',
      format: (value: number) => {
        const level = getLoyaltyLevel(value)
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2">{value}</Typography>
            <Chip
              label={level.label}
              color={level.color}
              size="small"
              icon={<StarIcon />}
            />
          </Box>
        )
      },
    },
    {
      id: 'createdAt',
      label: 'Registro',
      minWidth: 120,
      format: (value: Date) => format(new Date(value), 'dd/MM/yyyy', { locale: es }),
    },
  ]

  if (loading && clients.length === 0) {
    return <LoadingSpinner message="Cargando clientes..." />
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Gestión de Clientes
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateClient}
        >
          Nuevo Cliente
        </Button>
      </Box>

      {/* Search */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            placeholder="Buscar por nombre, teléfono o email..."
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
      </Grid>

      {/* Clients Table */}
      <DataTable
        columns={columns}
        data={clients}
        total={total}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
        onView={handleViewClient}
        onEdit={handleEditClient}
        onDelete={handleDeleteClient}
        loading={loading}
        emptyMessage="No se encontraron clientes"
        getRowId={(client) => client.id}
      />

      {/* Client Form Modal */}
      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
        maxWidth="md"
      >
        <ClientForm
          client={editingClient}
          onSave={handleSaveClient}
          onCancel={() => setModalOpen(false)}
        />
      </FormModal>

      {/* Client History Modal */}
      <FormModal
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        title={`Historial de ${selectedClient?.name}`}
        maxWidth="lg"
      >
        {selectedClient && (
          <Box>
            {/* Client Info Card */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      Información del Cliente
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon fontSize="small" />
                        <Typography>{selectedClient.phone}</Typography>
                      </Box>
                      {selectedClient.email && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EmailIcon fontSize="small" />
                          <Typography>{selectedClient.email}</Typography>
                        </Box>
                      )}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <StarIcon fontSize="small" />
                        <Typography>{selectedClient.loyaltyPoints} puntos</Typography>
                        <Chip
                          label={getLoyaltyLevel(selectedClient.loyaltyPoints).label}
                          color={getLoyaltyLevel(selectedClient.loyaltyPoints).color}
                          size="small"
                        />
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      Preferencias y Alergias
                    </Typography>
                    {selectedClient.preferences.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Preferencias:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selectedClient.preferences.map((pref, index) => (
                            <Chip key={index} label={pref} size="small" variant="outlined" />
                          ))}
                        </Box>
                      </Box>
                    )}
                    {selectedClient.allergies.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Alergias:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selectedClient.allergies.map((allergy, index) => (
                            <Chip
                              key={index}
                              label={allergy}
                              size="small"
                              color="warning"
                              icon={<WarningIcon />}
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* History Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={historyTab} onChange={(_, newValue) => setHistoryTab(newValue)}>
                <Tab label="Historial de Citas" icon={<HistoryIcon />} />
                <Tab label="Estadísticas" icon={<EventNoteIcon />} />
              </Tabs>
            </Box>

            <TabPanel value={historyTab} index={0}>
              <List>
                {clientHistory.length === 0 ? (
                  <ListItem>
                    <ListItemText
                      primary="No hay historial de citas"
                      secondary="Las citas aparecerán aquí cuando se registren"
                    />
                  </ListItem>
                ) : (
                  clientHistory.map((booking, index) => (
                    <React.Fragment key={booking.id}>
                      <ListItem>
                        <ListItemIcon>
                          <EventNoteIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={booking.service?.name || 'Servicio desconocido'}
                          secondary={
                            <Box>
                              <Typography variant="body2" component="span">
                                {format(new Date(booking.dateTime), 'dd/MM/yyyy HH:mm', { locale: es })}
                              </Typography>
                              {booking.notes && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                  Notas: {booking.notes}
                                </Typography>
                              )}
                              <Box sx={{ mt: 0.5 }}>
                                <Chip
                                  size="small"
                                  label={booking.status}
                                  color={getBookingStatusColor(booking.status)}
                                  variant="outlined"
                                />
                              </Box>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < clientHistory.length - 1 && <Divider />}
                    </React.Fragment>
                  ))
                )}
              </List>
            </TabPanel>

            <TabPanel value={historyTab} index={1}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="primary">
                        {clientHistory.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total de Citas
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="success.main">
                        {clientHistory.filter(b => b.status === 'completed').length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Citas Completadas
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="error.main">
                        {clientHistory.filter(b => b.status === 'cancelled' || b.status === 'no_show').length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Citas Canceladas/No Show
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </TabPanel>
          </Box>
        )}
      </FormModal>
    </Box>
  )
}