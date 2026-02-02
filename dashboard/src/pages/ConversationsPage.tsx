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
} from '@mui/icons-material'
import { format, isToday, isYesterday } from 'date-fns'
import { es } from 'date-fns/locale'
import { Conversation, Message } from '@/types'
import { apiService } from '@/services/apiService'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [conversationMessages, setConversationMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [previousMessageCount, setPreviousMessageCount] = useState(0)
  const originalTitleRef = React.useRef<string>('')

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

  // Detectar nuevos mensajes en la conversación seleccionada
  useEffect(() => {
    if (conversationMessages.length > previousMessageCount && previousMessageCount > 0) {
      const newMessagesCount = conversationMessages.length - previousMessageCount
      // Solo contar mensajes del cliente o AI como no leídos
      const newClientMessages = conversationMessages
        .slice(-newMessagesCount)
        .filter(msg => msg.senderType === 'client' || msg.senderType === 'ai')
      
      if (newClientMessages.length > 0) {
        setUnreadCount(prev => prev + newClientMessages.length)
      }
    }
    setPreviousMessageCount(conversationMessages.length)
  }, [conversationMessages])

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
        limit: 100,
      }
      
      const response = await apiService.getConversations(params)
      setConversations(response?.data || [])
    } catch (error) {
      console.error('Error fetching conversations:', error)
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
    fetchConversationMessages(conversation.id)
  }

  const handleSendMessage = async () => {
    if (!selectedConversation || !newMessage.trim() || sending) return
    
    try {
      setSending(true)
      
      // Primero tomar control de la conversación si no está escalada
      if (selectedConversation.status !== 'escalated') {
        console.log('Tomando control de la conversación...')
        await apiService.post(`/takeover/${selectedConversation.id}/start`)
        // Actualizar el estado local de la conversación
        setSelectedConversation({
          ...selectedConversation,
          status: 'escalated'
        })
      }
      
      // Luego enviar el mensaje
      console.log('Enviando mensaje:', newMessage)
      await apiService.post(`/takeover/${selectedConversation.id}/message`, {
        content: newMessage
      })
      
      setNewMessage('')
      fetchConversationMessages(selectedConversation.id)
      fetchConversations() // Actualizar lista de conversaciones
    } catch (error: any) {
      console.error('Error sending message:', error)
      alert(`Error al enviar mensaje: ${error.message || 'Error desconocido'}`)
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
          <TextField
            fullWidth
            size="small"
            select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="active">Activas</MenuItem>
            <MenuItem value="escalated">Escaladas</MenuItem>
            <MenuItem value="closed">Cerradas</MenuItem>
            <MenuItem value="">Todas</MenuItem>
          </TextField>
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
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {getLastMessage(conversation)}
                        </Typography>
                        {conversation.status === 'escalated' && (
                          <Chip 
                            label="Escalada" 
                            size="small" 
                            color="warning" 
                            sx={{ mt: 0.5, height: 20 }}
                          />
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
      </Paper>

      {/* Chat (Derecha) */}
      {selectedConversation ? (
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
              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                {selectedConversation.client?.name || 'Cliente desconocido'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {selectedConversation.status === 'escalated' 
                  ? '🟢 Control humano activo' 
                  : selectedConversation.client?.phone || 'Sin teléfono'}
              </Typography>
            </Box>
            <Chip 
              label={selectedConversation.status === 'active' ? 'Activa' : selectedConversation.status === 'escalated' ? 'Escalada' : 'Cerrada'}
              color={selectedConversation.status === 'active' ? 'success' : selectedConversation.status === 'escalated' ? 'warning' : 'default'}
              size="small"
            />
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
      )}
    </Box>
  )
}