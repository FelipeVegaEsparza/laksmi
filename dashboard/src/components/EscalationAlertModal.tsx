import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material'
import { Warning as WarningIcon } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '@/contexts/NotificationContext'

export default function EscalationAlertModal() {
  const navigate = useNavigate()
  const { escalationAlert, dismissEscalationAlert } = useNotifications()

  const handleGoToConversation = () => {
    if (escalationAlert) {
      navigate(`/conversations?id=${escalationAlert.conversationId}`)
      dismissEscalationAlert()
    }
  }

  const handleDismiss = () => {
    dismissEscalationAlert()
  }

  return (
    <Dialog
      open={!!escalationAlert}
      onClose={handleDismiss}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          backgroundColor: '#ff9800',
          color: 'white',
          py: 3,
        }}
      >
        <WarningIcon sx={{ fontSize: 40 }} />
        <Typography variant="h5" component="div" sx={{ fontWeight: 700 }}>
          ¡Atención Requerida!
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            {escalationAlert?.clientName}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Solicita hablar con un ejecutivo
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button
          onClick={handleDismiss}
          variant="outlined"
          color="inherit"
          sx={{ minWidth: 100 }}
        >
          Después
        </Button>
        <Button
          onClick={handleGoToConversation}
          variant="contained"
          color="warning"
          sx={{
            minWidth: 150,
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(255, 152, 0, 0.3)',
          }}
        >
          Atender Ahora
        </Button>
      </DialogActions>
    </Dialog>
  )
}
