import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Grid,
  Chip,
  TextField,
  MenuItem,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tabs,
  Tab,
  Paper,
} from '@mui/material'
import {
  Search as SearchIcon,
  WhatsApp as WhatsAppIcon,
  Web as WebIcon,
  Person as PersonIcon,
  SmartToy as AIIcon,
  Support as SupportIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Stop as StopIcon,
  Dashboard as DashboardIcon,
  Chat as ChatIcon,
} from '@mui/icons-material'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Conversation, Message } from '@/types'
import { apiService } from '@/services/apiService'
import { useNotifications } from '@/contexts/NotificationContext'
import { useConversationMonitor } from '@/hooks/useConversationMonitor'
import DataTable, { Column } from '@/components/DataTable'
import LoadingSpinner from '@/components/LoadingSpinner'
import ConversationMetrics from '@/components/ConversationMetrics'
import ConversationAlerts from '@/components/ConversationAlerts'

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [total, setTotal] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [channelFilter, setChannelFilter] = useState('')
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [conversationMessages, setConversationMessages] = useState<Message[]>([])
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [takeoverModalOpen, setTakeoverModalOpen] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [currentTab, setCurrentTab] = useState(0)
  
  // Hook del monitor de conversaciones
  const {
    alerts,
    clearAlerts,
    removeAlert,
  } = useConversationMonitor({
    autoConnect: true,
    refreshInterval: 30000
  })
  
  useNotifications() // For future use
  
  const showNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    console.log(`${type.toUpperCase()}: ${message}`)
  }

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm,
        status: statusFilter,
        channel: channelFilter,
      }
      
      const response = await apiService.getConversations(params)
      setConversations(response?.data || [])
      setTotal(response?.total || 0)
    } catch (error) {
      console.error('Error fetching conversations:', error)
      showNotification('Error al cargar conversaciones', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchConversationMessages = async (conversationId: string) => {
    try {
      const messages = await apiService.get<Message[]>(`/conversations/${conversationId}/messages`)
      setConversationMessages(Array.isArray(messages) ? messages : [])
    } catch (error) {
      console.error('Error fetching conversation messages:', error)
      showNotification('Error al cargar mensajes', 'error')
      setConversationMessages([])
    }
  }

  useEffect(() => {
    fetchConversations()
  }, [page, rowsPerPage, searchTerm, statusFilter, channelFilter])

  const handleViewConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation)
    fetchConversationMessages(conversation.id)
    setDetailModalOpen(true)
  }

  const handleTakeoverConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation)
    setTakeoverModalOpen(true)
  }

  const handleConfirmTakeover = async () => {
    if (!selectedConversation) return
    
    try {
      await apiService.post(`/takeover/${selectedConversation.id}/start`)
      showNotification('Control de conversación tomado exitosamente', 'success')
      setTakeoverModalOpen(false)
      fetchConversations()
    } catch (error) {
      console.error('Error taking over conversation:', error)
      showNotification('Error al tomar control de la conversación', 'error')
    }
  }

  const handleEscalateConversation = async (conversation: Conversation, reason: string, priority: string) => {
    try {
      await apiService.post(`/escalations/conversation/${conversation.id}`, {
        reason,
        priority,
        summary: `Escalación manual de conversación con ${conversation.client?.name}`
      })
      showNotification('Conversación escalada exitosamente', 'success')
      fetchConversations()
    } catch (error) {
      console.error('Error escalating conversation:', error)
      showNotification('Error al escalar conversación', 'error')
    }
  }

  const handleSendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return
    
    try {
      await apiService.post(`/takeover/${selectedConversation.id}/message`, {
        content: newMessage
      })
      setNewMessage('')
      fetchConversationMessages(selectedConversation.id)
      showNotification('Mensaje enviado correctamente', 'success')
    } catch (error) {
      console.error('Error sending message:', error)
      showNotification('Error al enviar mensaje', 'error')
    }
  }

  const handleEndTakeover = async () => {
    if (!selectedConversation) return
    
    try {
      await apiService.post(`/takeover/${selectedConversation.id}/end`, {
        resolution: 'Conversación resuelta por agente humano'
      })
      showNotification('Control devuelto al sistema IA', 'success')
      setDetailModalOpen(false)
      fetchConversations()
    } catch (error) {
      console.error('Error ending takeover:', error)
      showNotification('Error al finalizar control', 'error')
    }
  }

  const getStatusColor = (status: Conversation['status']) => {
    switch (status) {
      case 'active':
        return 'success'
      case 'closed':
        return 'default'
      case 'escalated':
        return 'warning'
      default:
        return 'default'
    }
  }

  const getStatusLabel = (status: Conversation['status']) => {
    switch (status) {
      case 'active':
        return 'Activa'
      case 'closed':
        return 'Cerrada'
      case 'escalated':
        return 'Escalada'
      default:
        return status
    }
  }

  const getChannelIcon = (channel: Conversation['channel']) => {
    return channel === 'whatsapp' ? <WhatsAppIcon /> : <WebIcon />
  }

  const getSenderIcon = (senderType: Message['senderType']) => {
    switch (senderType) {
      case 'client':
        return <PersonIcon />
      case 'ai':
        return <AIIcon />
      case 'human':
        return <SupportIcon />
      default:
        return <PersonIcon />
    }
  }

  const columns: Column<Conversation>[] = [
    {
      id: 'client',
      label: 'Cliente',
      minWidth: 200,
      format: (value: any) => value?.name || 'Cliente desconocido',
    },
    {
      id: 'channel',
      label: 'Canal',
      minWidth: 100,
      align: 'center',
      format: (value: Conversation['channel']) => (
        <Chip
          icon={getChannelIcon(value)}
          label={value === 'whatsapp' ? 'WhatsApp' : 'Web'}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      id: 'status',
      label: 'Estado',
      minWidth: 120,
      align: 'center',
      format: (value: Conversation['status']) => (
        <Chip
          label={getStatusLabel(value)}
          color={getStatusColor(value)}
          size="small"
        />
      ),
    },
    {
      id: 'lastActivity',
      label: 'Última Actividad',
      minWidth: 180,
      format: (value: Date) => format(new Date(value), 'dd/MM/yyyy HH:mm', { locale: es }),
    },
    {
      id: 'createdAt',
      label: 'Iniciada',
      minWidth: 120,
      format: (value: Date) => format(new Date(value), 'dd/MM/yyyy', { locale: es }),
    },
  ]

  if (loading && conversations.length === 0) {
    return <LoadingSpinner message="Cargando conversaciones..." />
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Monitor de Conversaciones
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchConversations}
        >
          Actualizar
        </Button>
      </Box>

      {/* Tabs para alternar entre métricas y conversaciones */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={(_, newValue) => setCurrentTab(newValue)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab
            icon={<DashboardIcon />}
            label="Métricas en Tiempo Real"
            iconPosition="start"
          />
          <Tab
            icon={<ChatIcon />}
            label="Lista de Conversaciones"
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Contenido según tab seleccionado */}
      {currentTab === 0 && (
        <Box>
          {/* Alertas del sistema */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12}>
              <ConversationAlerts
                alerts={alerts}
                onRemoveAlert={removeAlert}
                onClearAlerts={clearAlerts}
                onAlertClick={() => {
                  // Cambiar a tab de conversaciones y filtrar por la conversación
                  setCurrentTab(1)
                  // Aquí podrías agregar lógica para filtrar por conversación específica
                }}
              />
            </Grid>
          </Grid>

          {/* Métricas en tiempo real */}
          <ConversationMetrics refreshInterval={30000} />
        </Box>
      )}

      {currentTab === 1 && (
        <Box>

      {/* Filters */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            placeholder="Buscar conversaciones..."
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
            <MenuItem value="active">Activa</MenuItem>
            <MenuItem value="closed">Cerrada</MenuItem>
            <MenuItem value="escalated">Escalada</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            select
            label="Canal"
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
          >
            <MenuItem value="">Todos los canales</MenuItem>
            <MenuItem value="whatsapp">WhatsApp</MenuItem>
            <MenuItem value="web">Web</MenuItem>
          </TextField>
        </Grid>
      </Grid>

        {/* Conversations Table */}
        <DataTable
          columns={columns}
          data={conversations}
          total={total}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={setRowsPerPage}
          onView={handleViewConversation}
          onEdit={handleTakeoverConversation}
          loading={loading}
          emptyMessage="No se encontraron conversaciones"
          getRowId={(conversation) => conversation.id}
        />
        </Box>
      )}

      {/* Conversation Detail Modal */}
      <Dialog
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {selectedConversation && getChannelIcon(selectedConversation.channel)}
              <Typography variant="h6">
                Conversación con {selectedConversation?.client?.name}
              </Typography>
            </Box>
            {selectedConversation && (
              <Chip
                label={getStatusLabel(selectedConversation.status)}
                color={getStatusColor(selectedConversation.status)}
                size="small"
              />
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ height: 400, overflow: 'auto', mb: 2 }}>
            <List>
              {conversationMessages.map((message, index) => (
                <React.Fragment key={message.id}>
                  <ListItem alignItems="flex-start">
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: message.senderType === 'client' ? 'primary.main' : 'secondary.main' }}>
                        {getSenderIcon(message.senderType)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle2">
                            {message.senderType === 'client' ? 'Cliente' : 
                             message.senderType === 'ai' ? 'IA' : 'Agente Humano'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {format(new Date(message.timestamp), 'HH:mm', { locale: es })}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {message.content}
                        </Typography>
                      }
                    />
                  </ListItem>
                  {index < conversationMessages.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Box>
          
          {selectedConversation?.status === 'escalated' && (
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <TextField
                fullWidth
                multiline
                rows={2}
                placeholder="Escribir mensaje..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <Button
                variant="contained"
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                sx={{ minWidth: 100 }}
              >
                Enviar
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailModalOpen(false)}>Cerrar</Button>
          
          {selectedConversation?.status === 'active' && (
            <>
              <Button
                color="warning"
                startIcon={<WarningIcon />}
                onClick={() => {
                  handleEscalateConversation(selectedConversation, 'complex_request', 'medium')
                  setDetailModalOpen(false)
                }}
              >
                Escalar
              </Button>
              <Button
                variant="contained"
                startIcon={<SupportIcon />}
                onClick={() => {
                  setDetailModalOpen(false)
                  handleTakeoverConversation(selectedConversation)
                }}
              >
                Tomar Control
              </Button>
            </>
          )}
          
          {selectedConversation?.status === 'escalated' && (
            <Button
              color="success"
              startIcon={<StopIcon />}
              onClick={handleEndTakeover}
            >
              Finalizar Control
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Takeover Confirmation Modal */}
      <Dialog
        open={takeoverModalOpen}
        onClose={() => setTakeoverModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon color="warning" />
            Tomar Control de Conversación
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Al tomar control de esta conversación, el agente IA se desactivará y podrás responder directamente al cliente.
          </Alert>
          <Typography variant="body1">
            ¿Estás seguro de que quieres tomar control de la conversación con{' '}
            <strong>{selectedConversation?.client?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTakeoverModalOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleConfirmTakeover}
            startIcon={<SupportIcon />}
          >
            Tomar Control
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}