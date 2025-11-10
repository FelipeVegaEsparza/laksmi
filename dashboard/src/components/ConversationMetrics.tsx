import { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  WhatsApp as WhatsAppIcon,
  Web as WebIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material'
import { apiService } from '@/services/apiService'

interface ConversationMetrics {
  totalConversations: number
  activeConversations: number
  closedConversations: number
  escalatedConversations: number
  averageMessageCount: number
  channelStats: {
    web: number
    whatsapp: number
  }
  averageResponseTime: number
  escalationRate: number
  resolutionRate: number
  activeSessionsCount: number
  peakHours: Array<{ hour: number; count: number }>
}

interface ChannelAnalytics {
  web: { conversations: number; messages: number; avgDuration: number }
  whatsapp: { conversations: number; messages: number; avgDuration: number }
}

interface ConversationMetricsProps {
  refreshInterval?: number
}

export default function ConversationMetrics({ refreshInterval = 30000 }: ConversationMetricsProps) {
  const [metrics, setMetrics] = useState<ConversationMetrics | null>(null)
  const [channelAnalytics, setChannelAnalytics] = useState<ChannelAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchMetrics = async () => {
    try {
      const [metricsData, analyticsData] = await Promise.all([
        apiService.get<ConversationMetrics>('/v1/conversations/metrics'),
        apiService.get<ChannelAnalytics>('/v1/conversations/analytics/channels')
      ])
      
      setMetrics(metricsData)
      setChannelAnalytics(analyticsData)
    } catch (error) {
      console.error('Error fetching conversation metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
    
    const interval = setInterval(fetchMetrics, refreshInterval)
    return () => clearInterval(interval)
  }, [refreshInterval])

  if (loading || !metrics) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
        <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
          Cargando métricas...
        </Typography>
      </Box>
    )
  }

  const getEscalationColor = (rate: number) => {
    if (rate < 5) return 'success'
    if (rate < 15) return 'warning'
    return 'error'
  }

  const getResponseTimeColor = (time: number) => {
    if (time < 3) return 'success'
    if (time < 10) return 'warning'
    return 'error'
  }

  return (
    <Grid container spacing={2}>
      {/* Métricas principales */}
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Conversaciones Activas</Typography>
            </Box>
            <Typography variant="h3" color="primary">
              {metrics.activeSessionsCount}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Total: {metrics.totalConversations}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <ScheduleIcon color="info" sx={{ mr: 1 }} />
              <Typography variant="h6">Tiempo Respuesta</Typography>
            </Box>
            <Typography variant="h3" color={`${getResponseTimeColor(metrics.averageResponseTime)}.main`}>
              {metrics.averageResponseTime.toFixed(1)}s
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Promedio
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <WarningIcon color="warning" sx={{ mr: 1 }} />
              <Typography variant="h6">Tasa Escalación</Typography>
            </Box>
            <Typography variant="h3" color={`${getEscalationColor(metrics.escalationRate)}.main`}>
              {metrics.escalationRate.toFixed(1)}%
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {metrics.escalatedConversations} escaladas
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <CheckCircleIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="h6">Tasa Resolución</Typography>
            </Box>
            <Typography variant="h3" color="success.main">
              {metrics.resolutionRate.toFixed(1)}%
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {metrics.closedConversations} resueltas
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Analytics por canal */}
      {channelAnalytics && (
        <>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Rendimiento por Canal
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <WhatsAppIcon color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="WhatsApp"
                      secondary={
                        <Box>
                          <Typography variant="body2">
                            {channelAnalytics.whatsapp.conversations} conversaciones
                          </Typography>
                          <Typography variant="body2">
                            {channelAnalytics.whatsapp.messages} mensajes
                          </Typography>
                          <Typography variant="body2">
                            Duración promedio: {channelAnalytics.whatsapp.avgDuration} min
                          </Typography>
                        </Box>
                      }
                    />
                    <Chip
                      label={`${((channelAnalytics.whatsapp.conversations / (channelAnalytics.whatsapp.conversations + channelAnalytics.web.conversations)) * 100).toFixed(0)}%`}
                      color="success"
                      size="small"
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemIcon>
                      <WebIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Web Chat"
                      secondary={
                        <Box>
                          <Typography variant="body2">
                            {channelAnalytics.web.conversations} conversaciones
                          </Typography>
                          <Typography variant="body2">
                            {channelAnalytics.web.messages} mensajes
                          </Typography>
                          <Typography variant="body2">
                            Duración promedio: {channelAnalytics.web.avgDuration} min
                          </Typography>
                        </Box>
                      }
                    />
                    <Chip
                      label={`${((channelAnalytics.web.conversations / (channelAnalytics.whatsapp.conversations + channelAnalytics.web.conversations)) * 100).toFixed(0)}%`}
                      color="primary"
                      size="small"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Horas Pico de Actividad
                </Typography>
                <List>
                  {metrics.peakHours.slice(0, 5).map((peak, index) => (
                    <ListItem key={peak.hour}>
                      <ListItemText
                        primary={`${peak.hour}:00 - ${peak.hour + 1}:00`}
                        secondary={`${peak.count} conversaciones`}
                      />
                      <Chip
                        label={`#${index + 1}`}
                        color={index === 0 ? 'primary' : 'default'}
                        size="small"
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </>
      )}

      {/* Distribución por estado */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Distribución de Conversaciones
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">
                    {metrics.activeConversations}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Activas
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(metrics.activeConversations / metrics.totalConversations) * 100}
                    color="success"
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main">
                    {metrics.escalatedConversations}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Escaladas
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(metrics.escalatedConversations / metrics.totalConversations) * 100}
                    color="warning"
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main">
                    {metrics.closedConversations}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Cerradas
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(metrics.closedConversations / metrics.totalConversations) * 100}
                    color="info"
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}