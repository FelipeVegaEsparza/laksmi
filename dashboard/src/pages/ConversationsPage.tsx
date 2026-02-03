import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Chip,
  TextField,
  MenuItem,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemButton,
  Avatar,
  Divider,
  Button,
  IconButton,
  Paper,
  Badge,
  Switch,
  FormControlLabel,
  Tooltip,
} from '@mui/material'
import {
  Search as SearchIcon,
  WhatsApp as WhatsAppIcon,
  Web as WebIcon,
  Person as PersonIcon,
  SmartToy as AIIcon,
  Support as SupportIcon,
  Send as SendIcon,
  MoreVert as MoreVertIcon,
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  PanTool as PanToolIcon,
} from '@mui/icons-material'
import { format, isToday, isYesterday } from 'date-fns'
import { es } from 'date-fns/locale'
import { Conversation, Message, Client, ClientFormData } from '@/types'
import { apiService } from '@/services/apiService'
import LoadingSpinner from '@/components/LoadingSpinner'
import ClientForm from '@/components/ClientForm'
import FormModal from '@/components/FormModal'
import { useNotifications } from '@/contexts/NotificationContext'

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('') // Default to showing ALL conversations
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [conversationMessages, setConversationMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const originalTitleRef = React.useRef<string>('')
  const [aiEnabled, setAiEnabled] = useState<Record<string, boolean>>({}) // Track AI status per conversation

  // Client editing state
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [clientModalOpen, setClientModalOpen] = useState(false)

  const { showNotification } = useNotifications()

  // Guardar el título original al montar
  useEffect(() => {
    originalTitleRef.current = document.title
  }, [])

  // Actualizar título de la pestaña cuando hay mensajes no leídos
  useEffect(() => {
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) ${originalTitleRef.current}`
    } else {
      document.title = originalTitleRef.current
    }

    return () => {
      document.title = originalTitleRef.current
    }
  }, [unreadCount])

  // Resetear contador cuando el usuario interactúa con la página
  useEffect(() => {
    const resetUnreadCount = () => {
      setUnreadCount(0)
    }

    window.addEventListener('focus', resetUnreadCount)
    window.addEventListener('click', resetUnreadCount)

    return () => {
      window.removeEventListener('focus', resetUnreadCount)
      window.removeEventListener('click', resetUnreadCount)
    }
  }, [])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const params = {
        search: searchTerm,
        status: statusFilter,
        limit: 1000, // Increased limit to ensure all conversations are loaded
      }

      const response = await apiService.getConversations(params)
      setConversations(response?.data || [])
    } catch (error) {
      console.error('Error fetching conversations:', error)
      showNotification('Error al cargar conversaciones', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchConversationMessages = async (conversationId: string) => {
    try {
      // Fetch specifically with a high limit to show history
      const messages = await apiService.get<Message[]>(`/conversations/${conversationId}/messages?limit=500`)
      const newMessages = Array.isArray(messages) ? messages : []

      // Detectar mensajes nuevos comparando con el estado anterior
      if (conversationMessages.length > 0 && newMessages.length > conversationMessages.length) {
        const newMessagesCount = newMessages.length - conversationMessages.length
        const recentMessages = newMessages.slice(-newMessagesCount)

        // Solo contar mensajes del cliente o AI como no leídos (no los del agente)
        const unreadMessages = recentMessages.filter(msg =>
          msg.senderType === 'client' || msg.senderType === 'ai'
        )

        if (unreadMessages.length > 0) {
          console.log('🔔 New unread messages detected:', unreadMessages.length)
          setUnreadCount(prev => prev + unreadMessages.length)
        }
      }

      setConversationMessages(newMessages)
    } catch (error) {
      console.error('Error fetching conversation messages:', error)
      setConversationMessages([])
    }
  }

  useEffect(() => {
    fetchConversations()
    const interval = setInterval(fetchConversations, 10000) // Refresh every 10s
    return () => clearInterval(interval)
  }, [searchTerm, statusFilter])

  useEffect(() => {
    if (selectedConversation) {
      fetchConversationMessages(selectedConversation.id)
      const interval = setInterval(() => {
        fetchConversationMessages(selectedConversation.id)
      }, 5000) // Refresh messages every 5s
      return () => clearInterval(interval)
    }
  }, [selectedConversation])

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation)
    setConversationMessages([])

    // Resetear contador de no leídos al seleccionar conversación
    setUnreadCount(0)
  }

  const handleEditClient = () => {
    if (selectedConversation?.client) {
      setEditingClient(selectedConversation.client)
      setClientModalOpen(true)
    }
  }

  const handleSaveClient = async (formData: ClientFormData) => {
    try {
      if (editingClient) {
        await apiService.put(`/clients/${editingClient.id}`, formData)
        showNotification('Cliente actualizado correctamente', 'success')

        // Actualizar conversación seleccionada con los nuevos datos
        if (selectedConversation && selectedConversation.client?.id === editingClient.id) {
          const updatedClient = {
            ...selectedConversation.client,
            ...formData,
            // Asegurarse de parsear arrays si el backend los devuelve como tal
            allergies: Array.isArray(formData.allergies) ? formData.allergies : [],
            preferences: Array.isArray(formData.preferences) ? formData.preferences : []
          }

          setSelectedConversation({
            ...selectedConversation,
            client: updatedClient as Client
          })
        }

        setClientModalOpen(false)
        fetchConversations() // Recargar lista para ver cambios
      }
    } catch (error) {
      console.error('Error saving client:', error)
      showNotification('Error al actualizar cliente', 'error')
    }
  }


  const handleToggleAI = async (conversationId: string, enabled: boolean) => {
    try {
      if (enabled) {
        // Activar AI - finalizar control humano
        await apiService.post(`/human-takeover/${conversationId}/end`, {
          resolution: 'Control devuelto a IA por el agente'
        })
        console.log('✅ AI activada para conversación:', conversationId)
      } else {
        // Desactivar AI - tomar control humano
        await apiService.post(`/human-takeover/${conversationId}/start`)
        console.log('🙋 Control humano activado para conversación:', conversationId)
      }

      // Actualizar estado local
      setAiEnabled(prev => ({
        ...prev,
        [conversationId]: enabled
      }))

      // Actualizar la conversación en la lista
      if (selectedConversation && selectedConversation.id === conversationId) {
        setSelectedConversation({
          ...selectedConversation,
          status: enabled ? 'active' : 'escalated'
        })
      }

      // Refrescar lista de conversaciones
      fetchConversations()
    } catch (error) {
      console.error('Error toggling AI:', error)
      alert('Error al cambiar el estado de la IA')
    }
  }

  const handleSendMessage = async () => {
    if (!selectedConversation || !newMessage.trim() || sending) return

    try {
      setSending(true)

      // SIEMPRE intentar asegurar el control humano antes de enviar.
      // Esto maneja casos donde:
      // 1. La IA escaló la conversación (status='escalated') pero ningún agente tiene el control asignado.
      // 2. La sesión previa expiró.
      // 3. El estado local está desincronizado.
      // El backend maneja la idempotencia: si ya tengo control, devuelve éxito.
      try {
        await apiService.post(`/human-takeover/${selectedConversation.id}/start`)

        // Actualizar estado local para reflejar que tenemos el control
        setSelectedConversation(prev => prev ? ({
          ...prev,
          status: 'escalated',
          humanTakeoverActive: true
        }) : null)

        // Desactivar AI
        setAiEnabled(prev => ({
          ...prev,
          [selectedConversation.id]: false
        }))
      } catch (error: any) {
        // Si el error es porque otro agente tiene el control, mostrarlo y salir
        if (error.response?.data?.error?.includes('otro agente')) {
          showNotification('Otro agente tiene el control de esta conversación', 'error')
          setSending(false)
          return
        }
        // Si falla por otra razón, intentamos enviar el mensaje de todas formas 
        // (el backend validará nuevamente) o dejamos que el siguiente bloque falle.
        console.warn('Advertencia al tomar control:', error)
      }

      // Luego enviar el mensaje
      console.log('Enviando mensaje:', newMessage)
      await apiService.post(`/human-takeover/${selectedConversation.id}/message`, {
        content: newMessage
      })

      setNewMessage('')
      fetchConversationMessages(selectedConversation.id)
      fetchConversations() // Actualizar lista de conversaciones
    } catch (error: any) {
      console.error('Error sending message:', error)
      showNotification(`Error al enviar mensaje: ${error.message || 'Error desconocido'}`, 'error')
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatMessageTime = (date: Date) => {
    const messageDate = new Date(date)
    if (isToday(messageDate)) {
      return format(messageDate, 'HH:mm', { locale: es })
    } else if (isYesterday(messageDate)) {
      return 'Ayer'
    } else {
      return format(messageDate, 'dd/MM/yyyy', { locale: es })
    }
  }

  const getLastMessage = (conversation: Conversation) => {
    // This would ideally come from the API
    return 'Último mensaje...'
  }

  if (loading && conversations.length === 0) {
    return <LoadingSpinner message="Cargando conversaciones..." />
  }

  return (
    <Box sx={{ height: 'calc(100vh - 100px)', display: 'flex', bgcolor: '#f0f2f5' }}>
      {/* Lista de Conversaciones (Izquierda) */}
      <Paper
        sx={{
          width: { xs: '100%', md: selectedConversation ? '35%' : '100%' },
          display: { xs: selectedConversation ? 'none' : 'flex', md: 'flex' },
          flexDirection: 'column',
          borderRadius: 0,
          borderRight: '1px solid #e0e0e0',
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2, bgcolor: '#00a884', color: 'white' }}>
          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            Conversaciones
          </Typography>
        </Box>

        {/* Filtros */}
        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Buscar conversación..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 1 }}
          />
        </Box>

        {/* Lista de Conversaciones */}
        <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
          {conversations.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No hay conversaciones {statusFilter && `${statusFilter === 'active' ? 'activas' : statusFilter}`}
              </Typography>
            </Box>
          ) : (
            conversations.map((conversation) => (
              <React.Fragment key={conversation.id}>
                <ListItemButton
                  selected={selectedConversation?.id === conversation.id}
                  onClick={() => handleSelectConversation(conversation)}
                  sx={{
                    py: 2,
                    px: 2,
                    '&.Mui-selected': {
                      bgcolor: '#f0f2f5',
                    },
                    '&:hover': {
                      bgcolor: '#f5f6f6',
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Badge
                      color={conversation.status === 'active' ? 'success' : conversation.status === 'escalated' ? 'warning' : 'default'}
                      variant="dot"
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    >
                      <Avatar sx={{ bgcolor: '#00a884' }}>
                        {conversation.channel === 'whatsapp' ? <WhatsAppIcon /> : <WebIcon />}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                          {conversation.client?.name || 'Cliente desconocido'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatMessageTime(conversation.lastActivity || conversation.createdAt)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box>
                        {conversation.client?.phone && (
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                            {conversation.client.phone}
                          </Typography>
                        )}
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {getLastMessage(conversation)}
                        </Typography>
                        {conversation.status === 'escalated' && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, color: '#f57c00' }}>
                            <PanToolIcon sx={{ fontSize: 16 }} />
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>Solicita atención</Typography>
                          </Box>
                        )}
                      </Box>
                    }
                  />
                </ListItemButton>
                <Divider />
              </React.Fragment>
            ))
          )}
        </List>
      </Paper >

      {/* Chat (Derecha) */}
      {
        selectedConversation ? (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              bgcolor: '#efeae2',
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h100v100H0z\' fill=\'%23efeae2\'/%3E%3Cpath d=\'M0 0L50 50M50 50L100 0M0 100L50 50M50 50L100 100\' stroke=\'%23d9d9d9\' stroke-width=\'0.5\' opacity=\'0.1\'/%3E%3C/svg%3E")',
            }}
          >
            {/* Chat Header */}
            <Paper
              sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                borderRadius: 0,
                bgcolor: '#f0f2f5',
              }}
            >
              <IconButton
                sx={{ display: { xs: 'block', md: 'none' } }}
                onClick={() => setSelectedConversation(null)}
              >
                <ArrowBackIcon />
              </IconButton>
              <Avatar sx={{ bgcolor: '#00a884' }}>
                {selectedConversation.channel === 'whatsapp' ? <WhatsAppIcon /> : <WebIcon />}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                    {selectedConversation.client?.name || 'Cliente desconocido'}
                  </Typography>
                  <IconButton size="small" onClick={handleEditClient}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {selectedConversation.status === 'escalated' ? '🙋 Control humano activo' : '🤖 IA activa'}
                  {selectedConversation.client?.phone && ` • ${selectedConversation.client.phone}`}
                </Typography>
              </Box>

              {/* AI Toggle Switch */}
              <Tooltip title={aiEnabled[selectedConversation.id] ? "La IA está respondiendo automáticamente" : "Control humano activo - La IA no responderá"}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={aiEnabled[selectedConversation.id] ?? (selectedConversation.status !== 'escalated')}
                      onChange={(e) => handleToggleAI(selectedConversation.id, e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 500 }}>
                        {aiEnabled[selectedConversation.id] ?? (selectedConversation.status !== 'escalated') ? '🤖 IA' : '🙋 Humano'}
                      </Typography>
                    </Box>
                  }
                  labelPlacement="start"
                  sx={{ m: 0 }}
                />
              </Tooltip>


              <IconButton>
                <MoreVertIcon />
              </IconButton>
            </Paper>

            {/* Mensajes */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
              {conversationMessages.length === 0 ? (
                <Box sx={{ textAlign: 'center', mt: 4 }}>
                  <Typography color="text.secondary">
                    No hay mensajes en esta conversación
                  </Typography>
                </Box>
              ) : (
                conversationMessages.map((message) => {
                  const isClient = message.senderType === 'client'
                  const isAI = message.senderType === 'ai'

                  return (
                    <Box
                      key={message.id}
                      sx={{
                        display: 'flex',
                        justifyContent: isClient ? 'flex-start' : 'flex-end',
                        mb: 1,
                      }}
                    >
                      <Paper
                        sx={{
                          maxWidth: '70%',
                          p: 1.5,
                          bgcolor: isClient ? 'white' : '#d9fdd3',
                          borderRadius: 2,
                          boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
                        }}
                      >
                        {!isClient && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                            {isAI ? <AIIcon sx={{ fontSize: 14, color: '#00a884' }} /> : <SupportIcon sx={{ fontSize: 14, color: '#00a884' }} />}
                            <Typography variant="caption" sx={{ color: '#00a884', fontWeight: 500 }}>
                              {isAI ? 'Bot IA' : 'Agente'}
                            </Typography>
                          </Box>
                        )}
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {message.content}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            display: 'block',
                            textAlign: 'right',
                            color: 'text.secondary',
                            mt: 0.5,
                            fontSize: '0.7rem',
                          }}
                        >
                          {format(new Date(message.timestamp), 'HH:mm', { locale: es })}
                        </Typography>
                      </Paper>
                    </Box>
                  )
                })
              )}
            </Box>

            {/* Input de Mensaje */}
            <Paper
              sx={{
                p: 1.5,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                borderRadius: 0,
                bgcolor: '#f0f2f5',
              }}
            >
              {selectedConversation.status !== 'escalated' && (
                <Box sx={{ px: 1, py: 0.5, bgcolor: '#fff3cd', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    💡 Al enviar un mensaje, tomarás control de esta conversación automáticamente
                  </Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                <TextField
                  fullWidth
                  multiline
                  maxRows={4}
                  placeholder={sending ? "Enviando..." : "Escribe un mensaje..."}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={sending}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'white',
                      borderRadius: 3,
                    },
                  }}
                />
                <IconButton
                  color="primary"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sending}
                  sx={{
                    bgcolor: '#00a884',
                    color: 'white',
                    '&:hover': {
                      bgcolor: '#008f6f',
                    },
                    '&.Mui-disabled': {
                      bgcolor: '#e0e0e0',
                    },
                  }}
                >
                  <SendIcon />
                </IconButton>
              </Box>
            </Paper>
          </Box>
        ) : (
          <Box
            sx={{
              flex: 1,
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#f8f9fa',
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <WhatsAppIcon sx={{ fontSize: 120, color: '#00a884', opacity: 0.3, mb: 2 }} />
              <Typography variant="h5" color="text.secondary" gutterBottom>
                Selecciona una conversación
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Elige una conversación de la lista para ver los mensajes
              </Typography>
            </Box>
          </Box>
        )
      }

      {/* Edit Client Modal */}
      <FormModal
        open={clientModalOpen}
        onClose={() => setClientModalOpen(false)}
        title="Editar Cliente"
        maxWidth="md"
      >
        <ClientForm
          client={editingClient}
          onSave={handleSaveClient}
          onCancel={() => setClientModalOpen(false)}
        />
      </FormModal>
    </Box >
  )
}