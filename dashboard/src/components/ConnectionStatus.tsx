import { useState, useEffect } from 'react'
import {
  Box,
  Alert,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material'
import {
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import { API_CONFIG } from '@/config/api'

export default function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState(true)
  const [currentUrl, setCurrentUrl] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [customUrl, setCustomUrl] = useState('')
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    checkConnection()
    
    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000)
    return () => clearInterval(interval)
  }, [])

  const checkConnection = async () => {
    try {
      const url = await API_CONFIG.getApiUrl()
      setCurrentUrl(url)
      
      const isWorking = await API_CONFIG.testUrl(url)
      setIsConnected(isWorking)
      
      if (!isWorking) {
        console.warn('⚠️ API connection lost')
      }
    } catch (error) {
      setIsConnected(false)
      console.error('Connection check failed:', error)
    }
  }

  const testCustomUrl = async () => {
    if (!customUrl.trim()) return
    
    setTesting(true)
    try {
      const isWorking = await API_CONFIG.testUrl(customUrl.trim())
      
      if (isWorking) {
        API_CONFIG.activeUrl = customUrl.trim()
        setCurrentUrl(customUrl.trim())
        setIsConnected(true)
        setDialogOpen(false)
        
        // Update the API service
        window.location.reload() // Simple way to reinitialize everything
      } else {
        alert('No se pudo conectar a la URL especificada')
      }
    } catch (error) {
      alert('Error al probar la conexión')
    } finally {
      setTesting(false)
    }
  }

  if (isConnected) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip
          icon={<WifiIcon />}
          label="Conectado"
          color="success"
          size="small"
        />
        <Tooltip title="Configurar conexión">
          <IconButton size="small" onClick={() => setDialogOpen(true)}>
            <SettingsIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Configuración de Conexión</DialogTitle>
          <DialogContent>
            <Box sx={{ mb: 2 }}>
              <Alert severity="success">
                Conectado a: {currentUrl}
              </Alert>
            </Box>
            
            <TextField
              fullWidth
              label="URL personalizada del API"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="http://localhost:3000"
              helperText="Ingresa una URL alternativa si tienes problemas de conexión"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={testCustomUrl} disabled={testing || !customUrl.trim()}>
              {testing ? 'Probando...' : 'Probar y Conectar'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    )
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Alert 
        severity="error" 
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              color="inherit"
              size="small"
              onClick={checkConnection}
              startIcon={<RefreshIcon />}
            >
              Reintentar
            </Button>
            <Button
              color="inherit"
              size="small"
              onClick={() => setDialogOpen(true)}
              startIcon={<SettingsIcon />}
            >
              Configurar
            </Button>
          </Box>
        }
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WifiOffIcon />
          Sin conexión al servidor ({currentUrl || 'URL no configurada'})
        </Box>
      </Alert>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Configurar Conexión al Servidor</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Alert severity="warning">
              No se puede conectar al servidor. Verifica que el backend esté ejecutándose.
            </Alert>
          </Box>
          
          <TextField
            fullWidth
            label="URL del servidor"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="http://localhost:3000"
            helperText="URLs comunes: http://localhost:3000, http://127.0.0.1:3000"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button onClick={testCustomUrl} disabled={testing || !customUrl.trim()}>
            {testing ? 'Probando...' : 'Probar Conexión'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}