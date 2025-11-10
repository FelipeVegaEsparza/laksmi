import React from 'react'
import {
  Menu,

  Typography,
  Box,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Button,
  Divider,
} from '@mui/material'
import {
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Close as CloseIcon,
  MarkEmailRead as MarkReadIcon,
} from '@mui/icons-material'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useNotifications } from '@/contexts/NotificationContext'
import { Notification } from '@/types'

interface NotificationPanelProps {
  anchorEl: HTMLElement | null
  open: boolean
  onClose: () => void
}

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'success':
      return <SuccessIcon color="success" />
    case 'warning':
      return <WarningIcon color="warning" />
    case 'error':
      return <ErrorIcon color="error" />
    default:
      return <InfoIcon color="info" />
  }
}

const getNotificationColor = (type: Notification['type']) => {
  switch (type) {
    case 'success':
      return 'success'
    case 'warning':
      return 'warning'
    case 'error':
      return 'error'
    default:
      return 'info'
  }
}

export default function NotificationPanel({ anchorEl, open, onClose }: NotificationPanelProps) {
  const { notifications, markAsRead, markAllAsRead, clearNotification } = useNotifications()

  const handleMarkAsRead = (id: string, event: React.MouseEvent) => {
    event.stopPropagation()
    markAsRead(id)
  }

  const handleClearNotification = (id: string, event: React.MouseEvent) => {
    event.stopPropagation()
    clearNotification(id)
  }

  const handleMarkAllAsRead = () => {
    markAllAsRead()
  }

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 400,
          maxHeight: 500,
        },
      }}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Notificaciones</Typography>
          {notifications.some(n => !n.read) && (
            <Button size="small" onClick={handleMarkAllAsRead} startIcon={<MarkReadIcon />}>
              Marcar todas como leídas
            </Button>
          )}
        </Box>
      </Box>

      {notifications.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No hay notificaciones
          </Typography>
        </Box>
      ) : (
        <List sx={{ p: 0, maxHeight: 400, overflow: 'auto' }}>
          {notifications.map((notification, index) => (
            <React.Fragment key={notification.id}>
              <ListItem
                sx={{
                  backgroundColor: notification.read ? 'transparent' : 'action.hover',
                  '&:hover': {
                    backgroundColor: 'action.selected',
                  },
                }}
              >
                <ListItemIcon>
                  {getNotificationIcon(notification.type)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                        {notification.title}
                      </Typography>
                      {!notification.read && (
                        <Chip
                          size="small"
                          label="Nuevo"
                          color={getNotificationColor(notification.type)}
                          variant="outlined"
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        {notification.message}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format(notification.timestamp, 'dd/MM/yyyy HH:mm', { locale: es })}
                      </Typography>
                    </Box>
                  }
                />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {!notification.read && (
                    <IconButton
                      size="small"
                      onClick={(e) => handleMarkAsRead(notification.id, e)}
                      title="Marcar como leída"
                    >
                      <MarkReadIcon fontSize="small" />
                    </IconButton>
                  )}
                  <IconButton
                    size="small"
                    onClick={(e) => handleClearNotification(notification.id, e)}
                    title="Eliminar notificación"
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              </ListItem>
              {index < notifications.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      )}
    </Menu>
  )
}