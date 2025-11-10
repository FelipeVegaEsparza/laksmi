import { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Badge,
  Collapse,
  Button,
  Alert,
} from '@mui/material'
import {
  Notifications as NotificationsIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  NewReleases as NewIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Clear as ClearIcon,
} from '@mui/icons-material'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ConversationAlert } from '@/services/conversationMonitorService'

interface ConversationAlertsProps {
  alerts: ConversationAlert[]
  onRemoveAlert: (alertId: string) => void
  onClearAlerts: () => void
  onAlertClick?: (alert: ConversationAlert) => void
}

export default function ConversationAlerts({
  alerts,
  onRemoveAlert,
  onClearAlerts,
  onAlertClick
}: ConversationAlertsProps) {
  const [expanded, setExpanded] = useState(true)

  const getAlertIcon = (type: ConversationAlert['type']) => {
    switch (type) {
      case 'new_conversation':
        return <NewIcon color="info" />
      case 'escalation':
        return <WarningIcon color="warning" />
      case 'long_wait':
        return <InfoIcon color="info" />
      case 'error':
        return <ErrorIcon color="error" />
      default:
        return <InfoIcon />
    }
  }

  const getAlertColor = (priority: ConversationAlert['priority']) => {
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

  const getPriorityLabel = (priority: ConversationAlert['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'Urgente'
      case 'high':
        return 'Alta'
      case 'medium':
        return 'Media'
      case 'low':
        return 'Baja'
      default:
        return priority
    }
  }

  const getTypeLabel = (type: ConversationAlert['type']) => {
    switch (type) {
      case 'new_conversation':
        return 'Nueva Conversación'
      case 'escalation':
        return 'Escalación'
      case 'long_wait':
        return 'Tiempo de Espera'
      case 'error':
        return 'Error del Sistema'
      default:
        return type
    }
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <NotificationsIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Alertas del Sistema</Typography>
          </Box>
          <Alert severity="success">
            No hay alertas activas. El sistema está funcionando correctamente.
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Badge badgeContent={alerts.length} color="error" sx={{ mr: 2 }}>
              <NotificationsIcon />
            </Badge>
            <Typography variant="h6">Alertas del Sistema</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              startIcon={<ClearIcon />}
              onClick={onClearAlerts}
              disabled={alerts.length === 0}
            >
              Limpiar Todo
            </Button>
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>

        <Collapse in={expanded}>
          <List>
            {alerts.slice(0, 10).map((alert) => (
              <ListItem
                key={alert.id}
                sx={{
                  border: '1px solid',
                  borderColor: `${getAlertColor(alert.priority)}.light`,
                  borderRadius: 1,
                  mb: 1,
                  cursor: onAlertClick ? 'pointer' : 'default',
                  '&:hover': onAlertClick ? {
                    backgroundColor: 'action.hover'
                  } : {}
                }}
                onClick={() => onAlertClick?.(alert)}
              >
                <ListItemIcon>
                  {getAlertIcon(alert.type)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="subtitle2">
                        {getTypeLabel(alert.type)}
                      </Typography>
                      <Chip
                        label={getPriorityLabel(alert.priority)}
                        color={getAlertColor(alert.priority)}
                        size="small"
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        {alert.message}
                      </Typography>
                      {alert.clientName && (
                        <Typography variant="caption" color="textSecondary">
                          Cliente: {alert.clientName}
                        </Typography>
                      )}
                      <Typography variant="caption" display="block" color="textSecondary">
                        {format(new Date(alert.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: es })}
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemoveAlert(alert.id)
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>

          {alerts.length > 10 && (
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Mostrando 10 de {alerts.length} alertas
              </Typography>
              <Button size="small" onClick={onClearAlerts}>
                Ver todas las alertas
              </Button>
            </Box>
          )}
        </Collapse>
      </CardContent>
    </Card>
  )
}