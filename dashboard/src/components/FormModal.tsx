import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
} from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'

interface FormModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  onSubmit?: () => void
  onCancel?: () => void
  submitLabel?: string
  cancelLabel?: string
  submitDisabled?: boolean
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  fullWidth?: boolean
}

export default function FormModal({
  open,
  onClose,
  title,
  children,
  onSubmit,
  onCancel,
  submitLabel = 'Guardar',
  cancelLabel = 'Cancelar',
  submitDisabled = false,
  maxWidth = 'sm',
  fullWidth = true,
}: FormModalProps) {
  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      onClose()
    }
  }

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit()
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {title}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        <Box sx={{ pt: 1 }}>
          {children}
        </Box>
      </DialogContent>
      
      {(onSubmit || onCancel) && (
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={handleCancel} variant="outlined">
            {cancelLabel}
          </Button>
          {onSubmit && (
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={submitDisabled}
            >
              {submitLabel}
            </Button>
          )}
        </DialogActions>
      )}
    </Dialog>
  )
}