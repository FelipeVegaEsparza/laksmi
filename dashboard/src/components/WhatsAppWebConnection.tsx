import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Chip,
  Paper,
  TextField,
} from '@mui/material';
import {
  WhatsApp as WhatsAppIcon,
  QrCode2 as QrCodeIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Send as SendIcon,
  PowerSettingsNew as PowerIcon,
} from '@mui/icons-material';
import { QRCodeSVG } from 'qrcode.react';
import { apiService } from '@/services/apiService';

interface WhatsAppStatus {
  status: 'disconnected' | 'qr' | 'connected' | 'error';
  message: string;
  qrCode: string;
  isReady: boolean;
}

export default function WhatsAppWebConnection() {
  const [status, setStatus] = useState<WhatsAppStatus>({
    status: 'disconnected',
    message: 'No conectado',
    qrCode: '',
    isReady: false,
  });
  const [loading, setLoading] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('¡Hola! Este es un mensaje de prueba desde Laksmi 🎉');
  const [sendingTest, setSendingTest] = useState(false);

  // Obtener estado cada 3 segundos
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await apiService.get<WhatsAppStatus>('/whatsapp-web/status');
      setStatus(response);
    } catch (error) {
      console.error('Error fetching WhatsApp status:', error);
    }
  };

  const handleConnect = async () => {
    try {
      setLoading(true);
      await apiService.post('/whatsapp-web/connect', {});
      setTimeout(fetchStatus, 2000); // Esperar 2 segundos y actualizar
    } catch (error: any) {
      console.error('Error connecting WhatsApp:', error);
      alert('Error al conectar WhatsApp: ' + (error.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setLoading(true);
      await apiService.post('/whatsapp-web/disconnect', {});
      await fetchStatus();
    } catch (error: any) {
      console.error('Error disconnecting WhatsApp:', error);
      alert('Error al desconectar WhatsApp: ' + (error.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const handleSendTest = async () => {
    if (!testPhone || !testMessage) {
      alert('Por favor ingresa un número y mensaje');
      return;
    }

    try {
      setSendingTest(true);
      const response = await apiService.post('/whatsapp-web/send-test', {
        phoneNumber: testPhone,
        message: testMessage,
      });

      if (response.success) {
        alert('✅ Mensaje enviado correctamente');
      } else {
        alert('❌ Error: ' + response.message);
      }
    } catch (error: any) {
      console.error('Error sending test message:', error);
      alert('Error al enviar mensaje: ' + (error.message || 'Error desconocido'));
    } finally {
      setSendingTest(false);
    }
  };

  const getStatusColor = () => {
    switch (status.status) {
      case 'connected':
        return 'success';
      case 'qr':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = () => {
    switch (status.status) {
      case 'connected':
        return <CheckCircleIcon color="success" />;
      case 'qr':
        return <QrCodeIcon color="warning" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return <PowerIcon />;
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        WhatsApp Web - Conexión
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom fontWeight="600">
          📱 Conecta tu WhatsApp personal o business
        </Typography>
        <Typography variant="body2">
          1. Haz clic en "Conectar WhatsApp"<br />
          2. Escanea el código QR con tu WhatsApp (como WhatsApp Web)<br />
          3. Tu WhatsApp quedará conectado y el bot responderá automáticamente
        </Typography>
      </Alert>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <WhatsAppIcon sx={{ fontSize: 40, color: '#25D366' }} />
              <Box>
                <Typography variant="h6">Estado de Conexión</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  {getStatusIcon()}
                  <Chip
                    label={status.message}
                    color={getStatusColor() as any}
                    size="small"
                  />
                </Box>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              {status.status === 'connected' ? (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<PowerIcon />}
                  onClick={handleDisconnect}
                  disabled={loading}
                >
                  Desconectar
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={loading ? <CircularProgress size={20} /> : <WhatsAppIcon />}
                  onClick={handleConnect}
                  disabled={loading || status.status === 'qr'}
                >
                  {status.status === 'qr' ? 'Esperando escaneo...' : 'Conectar WhatsApp'}
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchStatus}
                disabled={loading}
              >
                Actualizar
              </Button>
            </Box>
          </Box>

          {/* Mostrar QR Code */}
          {status.status === 'qr' && status.qrCode && (
            <Paper
              elevation={3}
              sx={{
                p: 3,
                textAlign: 'center',
                bgcolor: 'white',
                mt: 3,
              }}
            >
              <Typography variant="h6" gutterBottom color="primary">
                📱 Escanea este código QR con tu WhatsApp
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Abre WhatsApp → Menú (⋮) → Dispositivos vinculados → Vincular dispositivo
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <QRCodeSVG
                  value={status.qrCode}
                  size={300}
                  level="H"
                  includeMargin={true}
                />
              </Box>
              <Alert severity="warning" sx={{ mt: 2 }}>
                El código QR expira en 60 segundos. Si no lo escaneas a tiempo, haz clic en "Actualizar".
              </Alert>
            </Paper>
          )}

          {/* Mensaje de éxito */}
          {status.status === 'connected' && (
            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography variant="subtitle2" fontWeight="600">
                ✅ WhatsApp conectado correctamente
              </Typography>
              <Typography variant="body2">
                Tu WhatsApp está conectado y el bot responderá automáticamente a los mensajes entrantes.
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Enviar mensaje de prueba */}
      {status.status === 'connected' && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📤 Enviar Mensaje de Prueba
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <TextField
                fullWidth
                label="Número de WhatsApp"
                placeholder="+521234567890"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                helperText="Incluye el código de país (ej: +52 para México)"
              />
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Mensaje"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
              />
              <Button
                variant="contained"
                startIcon={sendingTest ? <CircularProgress size={20} /> : <SendIcon />}
                onClick={handleSendTest}
                disabled={sendingTest || !testPhone || !testMessage}
              >
                {sendingTest ? 'Enviando...' : 'Enviar Mensaje de Prueba'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
