import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
} from '@mui/material'
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  Chat as ChatIcon,
  Refresh as RefreshIcon,
  Support as TakeoverIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
} from '@mui/icons-material'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { apiService } from '@/services/apiService'
import { useNotifications } from '@/contexts/NotificationContext'
import LoadingSpinner from '@/components/LoadingSpinner'

interface Escalation {
  escalationId: string
  conversationId: string
  reason: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  timestamp: Date
  humanAgentId?: string
  status: 'pending' | 'assigned' | 'resolved'
  clientId: string
  summary: string
  actionRequired?: string[]
  estimatedComplexity?: 'low' | 'medium' | 'high'
  suggestedResponse?: string
}

interface EscalationStats {
  totalEscalations: number
  pendingEscalations: number
  assignedEscalations: number
  resolvedEscalations: number
  escalationsByReason: Record<string, number>
  escalationsByPriority: Record<string, number>
}

export default function EscalationsPage() {
  const [escalations, setEscalations] = useState<Escalation[]>([])
  const [stats, setStats] = useState<EscalationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedEscalation, setSelectedEscalation] = useState<Escalation | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [resolveModalOpen, setResolveModalOpen] = useState(false)
  const [resolution, setResolution] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(true)
  
  useNotifications() // For future use
  
  const showNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    console.log(`${type.toUpperCase()}: ${message}`)
  }

  const fetchEscalations = async () => {
    try {
      setLoading(true)
      const params = {
        priority: filterPriority,
        status: filterStatus,
      }
      
      const [escalationsResponse, statsResponse] = await Promise.all([
        apiService.get<Escalation[]>('/escalations', { params }),
        apiService.get<EscalationStats>('/escalations/stats')
      ])
      
      // El apiService.get ya extrae response.data.data, así que debería funcionar
      setEscalations(Array.isArray(escalationsResponse) ? escalationsResponse : [])
      setStats(statsResponse || null)
    } catch (error) {
      console.error('Error fetching escalations:', error)
      showNotification('Error al cargar escalaciones', 'error')
      // Establecer valores por defecto en caso de error
      setEscalations([])
      setStats({
        totalEscalations: 0,
        pendingEscalations: 0,
        assignedEscalations: 0,
        resolvedEscalations: 0,
        escalationsByReason: {},
        escalationsByPriority: {}
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEscalations()
  }, [filterPriority, filterStatus])

  // Auto-refresh cada 30 segundos
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchEscalations()
    }, 30000)

    return () => clearInterval(interval)
  }, [autoRefresh, filterPriority, filterStatus])

  const handleTakeControl = async (escalation: Escalation) => {
    try {
      await apiService.post(`/escalations/${escalation.escalationId}/take-control`)
      showNotification('Control tomado exitosamente', 'success')
      fetchEscalations()
      
      // Abrir conversación en nueva pestaña o modal
      window.open(`/conversations/${escalation.conversationId}`, '_blank')
    } catch (error) {
      console.error('Error taking control:', error)
      showNotification('Error al tomar control', 'error')
    }
  }

  const handleAssignAgent = async (agentId: string) => {
    if (!selectedEscalation) return
    
    try {
      await apiService.post(`/escalations/${selectedEscalation.escalationId}/assign`, {
        humanAgentId: agentId
      })
      showNotification('Agente asignado exitosamente', 'success')
      setAssignModalOpen(false)
      fetchEscalations()
    } catch (error) {
      console.error('Error assigning agent:', error)
      showNotification('Error al asignar agente', 'error')
    }
  }

  const handleResolveEscalation = async () => {
    if (!selectedEscalation || !resolution.trim()) return
    
    try {
      await apiService.post(`/escalations/${selectedEscalation.escalationId}/resolve`, {
        resolution: resolution.trim()
      })
      showNotification('Escalación resuelta exitosamente', 'success')
      setResolveModalOpen(false)
      setResolution('')
      fetchEscalations()
    } catch (error) {
      console.error('Error resolving escalation:', error)
      showNotification('Error al resolver escalación', 'error')
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'error'
      case 'high':
        return 'warning'
      case 'medium':
        return 'info'
      case 'low':
        return 'default'
      default:
        return 'default'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <ErrorIcon />
      case 'high':
        return <WarningIcon />
      case 'medium':
        return <InfoIcon />
      case 'low':
        return <CheckCircleIcon />
      default:
        return <InfoIcon />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning'
      case 'assigned':
        return 'info'
      case 'resolved':
        return 'success'
      default:
        return 'default'
    }
  }

  const getComplexityColor = (complexity?: string) => {
    switch (complexity) {
      case 'high':
        return 'error'
      case 'medium':
        return 'warning'
      case 'low':
        return 'success'
      default:
        return 'default'
    }
  }

  if (loading && escalations.length === 0) {
    return <LoadingSpinner message="Cargando escalaciones..." />
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Sistema de Escalaciones
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title={autoRefresh ? 'Desactivar auto-actualización' : 'Activar auto-actualización'}>
            <IconButton
              color={autoRefresh ? 'primary' : 'default'}
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? <PauseIcon /> : <PlayArrowIcon />}
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchEscalations}
          >
            Actualizar
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Escalaciones
                </Typography>
                <Typography variant="h4">
                  {stats.totalEscalations}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Pendientes
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {stats.pendingEscalations}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Asignadas
                </Typography>
                <Typography variant="h4" color="info.main">
                  {stats.assignedEscalations}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Resueltas
                </Typography>
                <Typography variant="h4" color="success.main">
                  {stats.resolvedEscalations}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            select
            label="Prioridad"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <MenuItem value="">Todas las prioridades</MenuItem>
            <MenuItem value="urgent">Urgente</MenuItem>
            <MenuItem value="high">Alta</MenuItem>
            <MenuItem value="medium">Media</MenuItem>
            <MenuItem value="low">Baja</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            select
            label="Estado"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <MenuItem value="">Todos los estados</MenuItem>
            <MenuItem value="pending">Pendiente</MenuItem>
            <MenuItem value="assigned">Asignada</MenuItem>
            <MenuItem value="resolved">Resuelta</MenuItem>
          </TextField>
        </Grid>
      </Grid>

      {/* Escalations List */}
      <Grid container spacing={2}>
        {escalations.map((escalation) => (
          <Grid item xs={12} md={6} lg={4} key={escalation.escalationId}>
            <Card 
              sx={{ 
                height: '100%',
                border: escalation.priority === 'urgent' ? '2px solid' : 'none',
                borderColor: 'error.main'
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getPriorityIcon(escalation.priority)}
                    <Chip
                      label={escalation.priority.toUpperCase()}
                      color={getPriorityColor(escalation.priority)}
                      size="small"
                    />
                  </Box>
                  <Chip
                    label={escalation.status}
                    color={getStatusColor(escalation.status)}
                    size="small"
                  />
                </Box>

                <Typography variant="h6" gutterBottom>
                  {escalation.reason.replace('_', ' ').toUpperCase()}
                </Typography>

                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  {escalation.summary}
                </Typography>

                {escalation.estimatedComplexity && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" display="block">
                      Complejidad estimada:
                    </Typography>
                    <Chip
                      label={escalation.estimatedComplexity}
                      color={getComplexityColor(escalation.estimatedComplexity)}
                      size="small"
                    />
                  </Box>
                )}

                <Typography variant="caption" color="textSecondary">
                  {format(new Date(escalation.timestamp), 'dd/MM/yyyy HH:mm', { locale: es })}
                </Typography>

                {escalation.humanAgentId && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <PersonIcon fontSize="small" />
                    <Typography variant="caption">
                      Asignado a: {escalation.humanAgentId}
                    </Typography>
                  </Box>
                )}
              </CardContent>

              <CardActions>
                <Button
                  size="small"
                  startIcon={<ChatIcon />}
                  onClick={() => {
                    setSelectedEscalation(escalation)
                    setDetailModalOpen(true)
                  }}
                >
                  Ver Detalles
                </Button>
                
                {escalation.status === 'pending' && (
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<TakeoverIcon />}
                    onClick={() => handleTakeControl(escalation)}
                  >
                    Tomar Control
                  </Button>
                )}

                {escalation.status === 'assigned' && !escalation.humanAgentId && (
                  <Button
                    size="small"
                    startIcon={<AssignmentIcon />}
                    onClick={() => {
                      setSelectedEscalation(escalation)
                      setAssignModalOpen(true)
                    }}
                  >
                    Asignar
                  </Button>
                )}

                {escalation.status === 'assigned' && (
                  <Button
                    size="small"
                    color="success"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => {
                      setSelectedEscalation(escalation)
                      setResolveModalOpen(true)
                    }}
                  >
                    Resolver
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {escalations.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="textSecondary">
            No hay escalaciones activas
          </Typography>
        </Box>
      )}

      {/* Detail Modal */}
      <Dialog
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Detalles de Escalación
        </DialogTitle>
        <DialogContent>
          {selectedEscalation && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">ID de Escalación:</Typography>
                  <Typography variant="body2">{selectedEscalation.escalationId}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Prioridad:</Typography>
                  <Chip
                    label={selectedEscalation.priority}
                    color={getPriorityColor(selectedEscalation.priority)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Razón:</Typography>
                  <Typography variant="body2">{selectedEscalation.reason}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Estado:</Typography>
                  <Chip
                    label={selectedEscalation.status}
                    color={getStatusColor(selectedEscalation.status)}
                    size="small"
                  />
                </Grid>
              </Grid>

              <Typography variant="subtitle2" gutterBottom>
                Resumen:
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {selectedEscalation.summary}
              </Typography>

              {selectedEscalation.actionRequired && selectedEscalation.actionRequired.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Acciones Requeridas:
                  </Typography>
                  <List dense>
                    {selectedEscalation.actionRequired.map((action, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <AssignmentIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={action} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {selectedEscalation.suggestedResponse && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Respuesta Sugerida:
                  </Typography>
                  <Alert severity="info">
                    {selectedEscalation.suggestedResponse}
                  </Alert>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailModalOpen(false)}>
            Cerrar
          </Button>
          {selectedEscalation?.status === 'pending' && (
            <Button
              variant="contained"
              startIcon={<TakeoverIcon />}
              onClick={() => {
                setDetailModalOpen(false)
                handleTakeControl(selectedEscalation)
              }}
            >
              Tomar Control
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Assign Agent Modal */}
      <Dialog
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Asignar Agente</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            select
            label="Seleccionar Agente"
            sx={{ mt: 2 }}
          >
            <MenuItem value="agent1">Agente 1</MenuItem>
            <MenuItem value="agent2">Agente 2</MenuItem>
            <MenuItem value="agent3">Agente 3</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignModalOpen(false)}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={() => handleAssignAgent('agent1')}>
            Asignar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Resolve Escalation Modal */}
      <Dialog
        open={resolveModalOpen}
        onClose={() => setResolveModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Resolver Escalación</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Descripción de la resolución"
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            sx={{ mt: 2 }}
            placeholder="Describe cómo se resolvió la escalación..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResolveModalOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleResolveEscalation}
            disabled={!resolution.trim()}
          >
            Resolver
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}