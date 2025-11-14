import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
} from '@mui/material'
import {
  Warning as WarningIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  severity?: 'warning' | 'error' | 'info'
  icon?: React.ReactNode
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  severity = 'warning',
  icon,
}) => {
  const getColor = () => {
    switch (severity) {
      case 'error':
        return '#d32f2f'
      case 'warning':
        return '#ed6c02'
      case 'info':
        return '#0288d1'
      default:
        return '#ed6c02'
    }
  }

  const getBackgroundColor = () => {
    switch (severity) {
      case 'error':
        return '#ffebee'
      case 'warning':
        return '#fff3e0'
      case 'info':
        return '#e3f2fd'
      default:
        return '#fff3e0'
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        },
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <IconButton
          onClick={onCancel}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'grey.500',
          }}
        >
          <CloseIcon />
        </IconButton>

        <DialogTitle sx={{ pt: 3, pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                backgroundColor: getBackgroundColor(),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: getColor(),
              }}
            >
              {icon || <WarningIcon sx={{ fontSize: 28 }} />}
            </Box>
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pb: 2 }}>
          <Typography variant="body1" color="text.secondary" sx={{ pl: 8 }}>
            {message}
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={onCancel}
            variant="outlined"
            color="inherit"
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
              px: 3,
            }}
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            variant="contained"
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
              px: 3,
              backgroundColor: getColor(),
              '&:hover': {
                backgroundColor: getColor(),
                filter: 'brightness(0.9)',
              },
            }}
          >
            {confirmText}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}

export default ConfirmDialog
