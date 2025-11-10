import { Alert, AlertTitle, Box, Button } from '@mui/material'
import { CloudOff, Refresh } from '@mui/icons-material'

export default function LocalModeAlert() {
  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <Alert 
      severity="info" 
      sx={{ mb: 2 }}
      action={
        <Button
          color="inherit"
          size="small"
          onClick={handleRefresh}
          startIcon={<Refresh />}
        >
          Reintentar
        </Button>
      }
    >
      <AlertTitle>Modo Local Activado</AlertTitle>
      <Box>
        Las imágenes se están guardando localmente en tu navegador. 
        Las imágenes se mostrarán inmediatamente y se mantendrán hasta que reinicies el navegador.
      </Box>
    </Alert>
  )
}