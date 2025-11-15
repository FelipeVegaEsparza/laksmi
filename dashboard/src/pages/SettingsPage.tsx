import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  Switch,
  FormControlLabel,
  Alert,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  Paper,
} from '@mui/material'
import {
  Save as SaveIcon,
  Science as TestIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  WhatsApp as WhatsAppIcon,
  Phone as PhoneIcon,
  Key as KeyIcon,

  Refresh as RefreshIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ContentCopy as CopyIcon,
  OpenInNew as OpenInNewIcon,
  Info as InfoIcon,
} from '@mui/icons-material'
import { TwilioConfig } from '@/types'
import { apiService } from '@/services/apiService'
import { useNotifications } from '@/contexts/NotificationContext'
import LoadingSpinner from '@/components/LoadingSpinner'
import ConfirmDialog from '@/components/ConfirmDialog'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

interface WhatsAppTemplate {
  id: string
  name: string
  language: string
  status: 'approved' | 'pending' | 'rejected'
  category: string
  components: any[]
}

export default function SettingsPage() {
  const [tabValue, setTabValue] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [twilioConfig, setTwilioConfig] = useState<TwilioConfig>({
    accountSid: '',
    authToken: '',
    phoneNumber: '',
    webhookUrl: '',
    isConfigured: false,
  })
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown')
  const [testResult, setTestResult] = useState<string>('')
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([])
  const [templateModalOpen, setTemplateModalOpen] = useState(false)
  const [deleteTemplateDialogOpen, setDeleteTemplateDialogOpen] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null)
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    category: 'UTILITY',
    language: 'es',
    body: '',
  })
  
  useNotifications() // For future use
  
  const showNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    console.log(`${type.toUpperCase()}: ${message}`)
  }

  useEffect(() => {
    fetchTwilioConfig()
    fetchWhatsAppTemplates()
  }, [])

  const fetchTwilioConfig = async () => {
    try {
      setLoading(true)
      const config = await apiService.get<TwilioConfig>('/settings/twilio')
      setTwilioConfig(config)
      if (config.isConfigured) {
        checkConnection()
      }
    } catch (error) {
      console.error('Error fetching Twilio config:', error)
      showNotification('Error al cargar configuración de Twilio', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchWhatsAppTemplates = async () => {
    try {
      const templatesData = await apiService.get<WhatsAppTemplate[]>('/settings/whatsapp-templates')
      setTemplates(templatesData)
    } catch (error) {
      console.error('Error fetching WhatsApp templates:', error)
    }
  }

  const checkConnection = async () => {
    try {
      const status = await apiService.get<{ connected: boolean; message: string }>('/settings/twilio/test-connection')
      setConnectionStatus(status.connected ? 'connected' : 'error')
      setTestResult(status.message)
    } catch (error) {
      setConnectionStatus('error')
      setTestResult('Error al verificar conexión')
    }
  }

  const handleSaveTwilioConfig = async () => {
    try {
      setSaving(true)
      await apiService.put('/settings/twilio', twilioConfig)
      
      // Marcar como configurado si todos los campos están llenos
      if (twilioConfig.accountSid && twilioConfig.authToken && twilioConfig.phoneNumber) {
        setTwilioConfig(prev => ({ ...prev, isConfigured: true }))
      }
      
      showNotification('Configuración de Twilio guardada correctamente', 'success')
      await checkConnection()
    } catch (error) {
      console.error('Error saving Twilio config:', error)
      showNotification('Error al guardar configuración de Twilio', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleTestTwilio = async () => {
    try {
      setTesting(true)
      const result = await apiService.post<{ success: boolean; message: string }>('/settings/twilio/test', {
        testPhoneNumber: '+34600000000', // Test number
      })
      setTestResult(result.message)
      showNotification(
        result.success ? 'Prueba de Twilio exitosa' : 'Error en prueba de Twilio',
        result.success ? 'success' : 'error'
      )
    } catch (error) {
      console.error('Error testing Twilio:', error)
      showNotification('Error al probar Twilio', 'error')
      setTestResult('Error al realizar la prueba')
    } finally {
      setTesting(false)
    }
  }

  const handleCreateTemplate = async () => {
    try {
      await apiService.post('/settings/whatsapp-templates', newTemplate)
      showNotification('Plantilla creada correctamente', 'success')
      setTemplateModalOpen(false)
      setNewTemplate({ name: '', category: 'UTILITY', language: 'es', body: '' })
      fetchWhatsAppTemplates()
    } catch (error) {
      console.error('Error creating template:', error)
      showNotification('Error al crear plantilla', 'error')
    }
  }

  const handleDeleteTemplate = (templateId: string) => {
    setTemplateToDelete(templateId)
    setDeleteTemplateDialogOpen(true)
  }

  const confirmDeleteTemplate = async () => {
    if (!templateToDelete) return

    try {
      await apiService.delete(`/settings/whatsapp-templates/${templateToDelete}`)
      showNotification('Plantilla eliminada correctamente', 'success')
      setDeleteTemplateDialogOpen(false)
      setTemplateToDelete(null)
      fetchWhatsAppTemplates()
    } catch (error) {
      console.error('Error deleting template:', error)
      showNotification('Error al eliminar plantilla', 'error')
    }
  }

  const cancelDeleteTemplate = () => {
    setDeleteTemplateDialogOpen(false)
    setTemplateToDelete(null)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon color="success" />
      case 'pending':
        return <RefreshIcon color="warning" />
      case 'rejected':
        return <ErrorIcon color="error" />
      default:
        return <ErrorIcon />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success'
      case 'pending':
        return 'warning'
      case 'rejected':
        return 'error'
      default:
        return 'default'
    }
  }

  if (loading) {
    return <LoadingSpinner message="Cargando configuración..." />
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Configuración del Sistema
      </Typography>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Twilio WhatsApp" icon={<WhatsAppIcon />} />
          <Tab label="Plantillas WhatsApp" />
          <Tab label="General" />
        </Tabs>
      </Box>

      {/* Twilio Configuration Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Configuración de Twilio WhatsApp
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Account SID"
                      value={twilioConfig.accountSid}
                      onChange={(e) => setTwilioConfig(prev => ({ ...prev, accountSid: e.target.value }))}
                      InputProps={{
                        startAdornment: <KeyIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                      }}
                      placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Auth Token"
                      type="password"
                      value={twilioConfig.authToken}
                      onChange={(e) => setTwilioConfig(prev => ({ ...prev, authToken: e.target.value }))}
                      InputProps={{
                        startAdornment: <KeyIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                      }}
                      placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Número de WhatsApp"
                      value={twilioConfig.phoneNumber}
                      onChange={(e) => setTwilioConfig(prev => ({ ...prev, phoneNumber: e.target.value }))}
                      InputProps={{
                        startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                      }}
                      placeholder="+14155238886"
                      helperText="Número de WhatsApp Business proporcionado por Twilio"
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom fontWeight="600">
                        📍 Webhook URL para configurar en Twilio Console
                      </Typography>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1, 
                        bgcolor: 'grey.100', 
                        p: 1.5, 
                        borderRadius: 1, 
                        mt: 1,
                        mb: 1
                      }}>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', flex: 1, wordBreak: 'break-all' }}>
                          {window.location.hostname.includes('localhost') 
                            ? `${window.location.origin.replace(':3002', ':3000')}/api/v1/twilio/webhook/receive`
                            : `${window.location.protocol}//laksmi-backend.0ieu13.easypanel.host/api/v1/twilio/webhook/receive`
                          }
                        </Typography>
                        <IconButton 
                          size="small" 
                          onClick={() => {
                            const webhookUrl = window.location.hostname.includes('localhost')
                              ? `${window.location.origin.replace(':3002', ':3000')}/api/v1/twilio/webhook/receive`
                              : `${window.location.protocol}//laksmi-backend.0ieu13.easypanel.host/api/v1/twilio/webhook/receive`;
                            navigator.clipboard.writeText(webhookUrl);
                            showNotification('URL copiada al portapapeles', 'success');
                          }}
                          title="Copiar URL"
                        >
                          <CopyIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      <Typography variant="caption" display="block">
                        1. Copia esta URL (click en el icono de copiar)
                      </Typography>
                      <Typography variant="caption" display="block">
                        2. Ve a <a href="https://console.twilio.com/us1/develop/sms/settings/whatsapp-sandbox" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', fontWeight: 600 }}>
                          Twilio Console → WhatsApp Sandbox <OpenInNewIcon sx={{ fontSize: 12, verticalAlign: 'middle' }} />
                        </a>
                      </Typography>
                      <Typography variant="caption" display="block">
                        3. Pega la URL en el campo "When a message comes in"
                      </Typography>
                    </Alert>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleSaveTwilioConfig}
                        disabled={saving}
                      >
                        {saving ? 'Guardando...' : 'Guardar Configuración'}
                      </Button>
                      
                      <Button
                        variant="outlined"
                        startIcon={<TestIcon />}
                        onClick={handleTestTwilio}
                        disabled={testing || !twilioConfig.accountSid || !twilioConfig.authToken || !twilioConfig.phoneNumber}
                      >
                        {testing ? 'Probando...' : 'Probar Conexión'}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Estado de Conexión
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  {connectionStatus === 'connected' && (
                    <>
                      <CheckCircleIcon color="success" />
                      <Typography color="success.main">Conectado</Typography>
                    </>
                  )}
                  {connectionStatus === 'error' && (
                    <>
                      <ErrorIcon color="error" />
                      <Typography color="error.main">Error de Conexión</Typography>
                    </>
                  )}
                  {connectionStatus === 'unknown' && (
                    <>
                      <RefreshIcon color="warning" />
                      <Typography color="warning.main">Estado Desconocido</Typography>
                    </>
                  )}
                </Box>
                
                {testResult && (
                  <Alert severity={connectionStatus === 'connected' ? 'success' : 'error'} sx={{ mt: 2 }}>
                    {testResult}
                  </Alert>
                )}
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" gutterBottom>
                  Configuración Requerida:
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      {twilioConfig.accountSid ? <CheckCircleIcon color="success" /> : <ErrorIcon color="error" />}
                    </ListItemIcon>
                    <ListItemText primary="Account SID" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      {twilioConfig.authToken ? <CheckCircleIcon color="success" /> : <ErrorIcon color="error" />}
                    </ListItemIcon>
                    <ListItemText primary="Auth Token" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      {twilioConfig.phoneNumber ? <CheckCircleIcon color="success" /> : <ErrorIcon color="error" />}
                    </ListItemIcon>
                    <ListItemText primary="Número WhatsApp" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      {twilioConfig.webhookUrl ? <CheckCircleIcon color="success" /> : <ErrorIcon color="error" />}
                    </ListItemIcon>
                    <ListItemText primary="Webhook URL" />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📚 Guía Rápida
                </Typography>
                
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                  Paso 1: Obtener credenciales
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Ve a <a href="https://console.twilio.com/" target="_blank" rel="noopener noreferrer">Twilio Console</a> y copia tu Account SID y Auth Token
                </Typography>
                
                <Typography variant="subtitle2" gutterBottom>
                  Paso 2: Configurar WhatsApp
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Activa el WhatsApp Sandbox y anota tu número de WhatsApp
                </Typography>
                
                <Typography variant="subtitle2" gutterBottom>
                  Paso 3: Configurar Webhook
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Copia el Webhook URL de arriba y pégalo en la configuración del Sandbox
                </Typography>
                
                <Typography variant="subtitle2" gutterBottom>
                  Paso 4: Guardar y probar
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Guarda la configuración y usa el botón "Probar Conexión"
                </Typography>
                
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<OpenInNewIcon />}
                  href="https://console.twilio.com/"
                  target="_blank"
                  sx={{ mt: 2 }}
                >
                  Abrir Twilio Console
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        <Alert severity="warning" sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            ⚠️ Importante para desarrollo local
          </Typography>
          <Typography variant="body2">
            Si estás trabajando en local (localhost), necesitas usar <strong>ngrok</strong> para exponer tu servidor:
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', p: 1, borderRadius: 1, mt: 1 }}>
            ngrok http 3000
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Luego usa la URL de ngrok como base para tu Webhook URL.
          </Typography>
        </Alert>
      </TabPanel>

      {/* WhatsApp Templates Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            Plantillas de WhatsApp Business
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setTemplateModalOpen(true)}
          >
            Nueva Plantilla
          </Button>
        </Box>

        <Grid container spacing={3}>
          {templates.map((template) => (
            <Grid item xs={12} md={6} key={template.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {template.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        <Chip
                          label={template.status}
                          color={getStatusColor(template.status) as any}
                          size="small"
                          icon={getStatusIcon(template.status)}
                        />
                        <Chip label={template.category} size="small" variant="outlined" />
                        <Chip label={template.language} size="small" variant="outlined" />
                      </Box>
                    </Box>
                    <Box>
                      <IconButton size="small">
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDeleteTemplate(template.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary">
                    Componentes: {template.components.length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {templates.length === 0 && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No hay plantillas configuradas
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Las plantillas de WhatsApp Business te permiten enviar mensajes pre-aprobados
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setTemplateModalOpen(true)}
              sx={{ mt: 2 }}
            >
              Crear Primera Plantilla
            </Button>
          </Paper>
        )}
      </TabPanel>

      {/* General Settings Tab */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Configuración General
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Notificaciones en tiempo real"
                  />
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Escalación automática de conversaciones"
                  />
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Recordatorios automáticos de citas"
                  />
                  <FormControlLabel
                    control={<Switch />}
                    label="Modo de mantenimiento"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Configuración de IA
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Tiempo de respuesta máximo (segundos)"
                    type="number"
                    defaultValue={3}
                  />
                  <TextField
                    fullWidth
                    label="Máximo de intentos de comprensión"
                    type="number"
                    defaultValue={3}
                  />
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Aprendizaje automático habilitado"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Template Creation Modal */}
      <Dialog
        open={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Nueva Plantilla de WhatsApp</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre de la plantilla"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                placeholder="appointment_reminder"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Categoría"
                value={newTemplate.category}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value }))}
                SelectProps={{ native: true }}
              >
                <option value="UTILITY">Utilidad</option>
                <option value="MARKETING">Marketing</option>
                <option value="AUTHENTICATION">Autenticación</option>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Contenido del mensaje"
                value={newTemplate.body}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, body: e.target.value }))}
                placeholder="Hola {{1}}, te recordamos tu cita para {{2}} el {{3}} a las {{4}}."
                helperText="Usa {{1}}, {{2}}, etc. para variables dinámicas"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTemplateModalOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateTemplate}
            disabled={!newTemplate.name || !newTemplate.body}
          >
            Crear Plantilla
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Delete Template Dialog */}
      <ConfirmDialog
        open={deleteTemplateDialogOpen}
        title="Confirmar eliminación"
        message="¿Estás seguro de que quieres eliminar esta plantilla? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={confirmDeleteTemplate}
        onCancel={cancelDeleteTemplate}
        severity="error"
      />
    </Box>
  )
}