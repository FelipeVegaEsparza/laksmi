import React, { useEffect, useState } from 'react'
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material'
import {
  People as PeopleIcon,
  EventNote as EventNoteIcon,
  Chat as ChatIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
} from '@mui/icons-material'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { DashboardMetrics, Booking, Conversation } from '@/types'
import { apiService } from '@/services/apiService'
import LoadingSpinner from '@/components/LoadingSpinner'

interface MetricCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  color: string
  subtitle?: string
}

function MetricCard({ title, value, icon, color, subtitle }: MetricCardProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="overline">
              {title}
            </Typography>
            <Typography variant="h4" component="h2" sx={{ color }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ color, opacity: 0.7 }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [recentBookings, setRecentBookings] = useState<Booking[]>([])
  const [activeConversations, setActiveConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [metricsData, bookingsData, conversationsData] = await Promise.all([
        apiService.get<DashboardMetrics>('/dashboard/metrics'),
        apiService.get<Booking[]>('/dashboard/recent-bookings'),
        apiService.get<Conversation[]>('/dashboard/active-conversations'),
      ])
      
      setMetrics(metricsData)
      setRecentBookings(bookingsData)
      setActiveConversations(conversationsData)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

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

  const getConversationStatusColor = (status: Conversation['status']) => {
    switch (status) {
      case 'active':
        return 'success'
      case 'escalated':
        return 'warning'
      case 'closed':
        return 'default'
      default:
        return 'default'
    }
  }

  if (loading && !metrics) {
    return <LoadingSpinner message="Cargando dashboard..." />
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Dashboard
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Última actualización: {format(lastUpdated, 'HH:mm:ss')}
          </Typography>
          <Tooltip title="Actualizar datos">
            <IconButton onClick={fetchDashboardData} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Clientes"
            value={metrics?.totalClients || 0}
            icon={<PeopleIcon sx={{ fontSize: 40 }} />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Citas Hoy"
            value={metrics?.todayBookings || 0}
            icon={<EventNoteIcon sx={{ fontSize: 40 }} />}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Conversaciones Activas"
            value={metrics?.activeConversations || 0}
            icon={<ChatIcon sx={{ fontSize: 40 }} />}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Ingresos del Mes"
            value={`€${metrics?.monthlyRevenue?.toLocaleString() || 0}`}
            icon={<MoneyIcon sx={{ fontSize: 40 }} />}
            color="#9c27b0"
          />
        </Grid>
      </Grid>

      {/* Performance Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Tasa de Conversión"
            value={`${metrics?.conversionRate || 0}%`}
            icon={<TrendingUpIcon sx={{ fontSize: 40 }} />}
            color="#d32f2f"
            subtitle="Visitantes a clientes"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Tiempo de Respuesta"
            value={`${metrics?.averageResponseTime || 0}s`}
            icon={<SpeedIcon sx={{ fontSize: 40 }} />}
            color="#388e3c"
            subtitle="Promedio del agente IA"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Bookings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Citas Recientes
            </Typography>
            <List sx={{ maxHeight: 320, overflow: 'auto' }}>
              {recentBookings.length === 0 ? (
                <ListItem>
                  <ListItemText
                    primary="No hay citas recientes"
                    secondary="Las citas aparecerán aquí cuando se registren"
                  />
                </ListItem>
              ) : (
                recentBookings.map((booking) => (
                  <ListItem key={booking.id} divider>
                    <ListItemIcon>
                      <EventNoteIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={booking.client?.name || 'Cliente desconocido'}
                      secondary={
                        <Box>
                          <Typography variant="body2" component="span">
                            {booking.service?.name} - {format(new Date(booking.dateTime), 'dd/MM/yyyy HH:mm', { locale: es })}
                          </Typography>
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
                ))
              )}
            </List>
          </Paper>
        </Grid>

        {/* Active Conversations */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Conversaciones Activas
            </Typography>
            <List sx={{ maxHeight: 320, overflow: 'auto' }}>
              {activeConversations.length === 0 ? (
                <ListItem>
                  <ListItemText
                    primary="No hay conversaciones activas"
                    secondary="Las conversaciones aparecerán aquí cuando los clientes inicien chat"
                  />
                </ListItem>
              ) : (
                activeConversations.map((conversation) => (
                  <ListItem key={conversation.id} divider>
                    <ListItemIcon>
                      {conversation.status === 'escalated' ? (
                        <WarningIcon color="warning" />
                      ) : (
                        <ChatIcon />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={conversation.client?.name || 'Cliente desconocido'}
                      secondary={
                        <Box>
                          <Typography variant="body2" component="span">
                            Canal: {conversation.channel} - {format(new Date(conversation.lastActivity), 'dd/MM/yyyy HH:mm', { locale: es })}
                          </Typography>
                          <Box sx={{ mt: 0.5 }}>
                            <Chip
                              size="small"
                              label={conversation.status}
                              color={getConversationStatusColor(conversation.status)}
                              variant="outlined"
                            />
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                ))
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}