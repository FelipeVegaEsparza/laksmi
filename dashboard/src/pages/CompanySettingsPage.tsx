import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Avatar,
  IconButton,
  Alert,
  Divider,
  Stack,
  Paper,
  Tabs,
  Tab,
} from '@mui/material'
import {
  Save as SaveIcon,
  Upload as UploadIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  Palette as PaletteIcon,
  Share as ShareIcon,
  ContactMail as ContactIcon,
  Payment as PaymentIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material'
import { apiService } from '@/services/apiService'
import LoadingSpinner from '@/components/LoadingSpinner'
import { useSnackbar } from 'notistack'
import { useAppTheme } from '@/contexts/ThemeContext'
import ConfirmDialog from '@/components/ConfirmDialog'
import BusinessHoursForm from '@/components/BusinessHoursForm'
import LegalPagesTab from '@/components/LegalPagesTab'

interface DaySchedule {
  isOpen: boolean
  openTime: string
  closeTime: string
  lunchStart: string
  lunchEnd: string
}

interface BusinessHours {
  monday: DaySchedule
  tuesday: DaySchedule
  wednesday: DaySchedule
  thursday: DaySchedule
  friday: DaySchedule
  saturday: DaySchedule
  sunday: DaySchedule
}

interface CompanySettings {
  id: string
  companyName: string
  companyDescription?: string
  logoUrl?: string
  contactAddress?: string
  contactEmail?: string
  contactPhone?: string
  contactWhatsapp?: string
  paymentLink?: string
  paymentInstructions?: string
  facebookUrl?: string
  instagramUrl?: string
  tiktokUrl?: string
  xUrl?: string
  businessHours?: BusinessHours
  dashboardPrimaryColor: string
  dashboardSecondaryColor: string
  dashboardBackgroundColor: string
  dashboardTextColor: string
  frontendPrimaryColor: string
  frontendSecondaryColor: string
  frontendBackgroundColor: string
  frontendTextColor: string
}

export default function CompanySettingsPage() {
  const [settings, setSettings] = useState<CompanySettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [deleteLogoDialogOpen, setDeleteLogoDialogOpen] = useState(false)
  const [currentTab, setCurrentTab] = useState(0)
  const { enqueueSnackbar } = useSnackbar()
  const { refreshTheme } = useAppTheme()

  console.log('🏢 CompanySettingsPage mounted')
  console.log('Current settings state:', settings)

  useEffect(() => {
    console.log('🔄 useEffect triggered - fetching settings')
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await apiService.get<CompanySettings>('/company-settings')
      console.log('Settings loaded:', response)
      console.log('Logo URL:', response?.logoUrl)
      setSettings(response)
    } catch (error) {
      console.error('Error fetching settings:', error)
      enqueueSnackbar('Error al cargar configuración', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!settings) return

    try {
      setSaving(true)
      await apiService.put('/company-settings', settings)
      await refreshTheme() // Refresh theme with new colors
      enqueueSnackbar('Configuración guardada exitosamente. Los colores se aplicarán en toda la aplicación.', { variant: 'success' })
    } catch (error) {
      console.error('Error saving settings:', error)
      enqueueSnackbar('Error al guardar configuración', { variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      enqueueSnackbar('Por favor selecciona una imagen', { variant: 'error' })
      return
    }

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      enqueueSnackbar('La imagen no debe superar 5MB', { variant: 'error' })
      return
    }

    try {
      setUploadingLogo(true)
      const formData = new FormData()
      formData.append('logo', file)

      const response = await apiService.post<any>('/company-settings/logo', formData)
      
      // El apiService.post ya extrae data, así que response contiene { logoUrl, settings }
      if (response.settings) {
        setSettings(response.settings)
      } else if (response.logoUrl) {
        setSettings(prev => prev ? { ...prev, logoUrl: response.logoUrl } : null)
      }
      
      enqueueSnackbar('Logo subido exitosamente', { variant: 'success' })
    } catch (error) {
      console.error('Error uploading logo:', error)
      enqueueSnackbar('Error al subir logo', { variant: 'error' })
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleDeleteLogo = () => {
    setDeleteLogoDialogOpen(true)
  }

  const confirmDeleteLogo = async () => {
    try {
      await apiService.delete('/company-settings/logo')
      setSettings(prev => prev ? { ...prev, logoUrl: undefined } : null)
      enqueueSnackbar('Logo eliminado exitosamente', { variant: 'success' })
      setDeleteLogoDialogOpen(false)
    } catch (error) {
      console.error('Error deleting logo:', error)
      enqueueSnackbar('Error al eliminar logo', { variant: 'error' })
    }
  }

  const cancelDeleteLogo = () => {
    setDeleteLogoDialogOpen(false)
  }

  if (loading) {
    return <LoadingSpinner message="Cargando configuración..." />
  }

  if (!settings) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">No se pudo cargar la configuración</Alert>
      </Box>
    )
  }

  const getLogoUrl = () => {
    if (!settings.logoUrl) return null
    
    console.log('Building logo URL from:', settings.logoUrl)
    
    const url = settings.logoUrl.startsWith('http') 
      ? settings.logoUrl 
      : `http://localhost:3000${settings.logoUrl}`
    
    console.log('Final logo URL:', url)
    return url
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue)
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="600">
          Configuración de la Empresa
        </Typography>
        {currentTab === 0 && (
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        )}
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange} aria-label="company settings tabs">
          <Tab label="Configuración General" />
          <Tab icon={<DescriptionIcon />} label="Páginas Legales" iconPosition="start" />
        </Tabs>
      </Box>

      {/* Tab 0: Configuración General */}
      {currentTab === 0 && (
        <>
        <Grid container spacing={3}>
        {/* Información de la Empresa */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BusinessIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Información de la Empresa</Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />

              {/* Logo */}
              <Box sx={{ mb: 3, textAlign: 'center' }}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Logo de la Empresa
                </Typography>
                <Avatar
                  src={getLogoUrl() || undefined}
                  sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
                >
                  <BusinessIcon sx={{ fontSize: 60 }} />
                </Avatar>
                <Stack direction="row" spacing={1} justifyContent="center">
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<UploadIcon />}
                    disabled={uploadingLogo}
                  >
                    {uploadingLogo ? 'Subiendo...' : 'Subir Logo'}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleLogoUpload}
                    />
                  </Button>
                  {settings.logoUrl && (
                    <IconButton
                      color="error"
                      onClick={handleDeleteLogo}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Formatos: JPG, PNG, GIF, WEBP (máx. 5MB)
                </Typography>
              </Box>

              <TextField
                fullWidth
                label="Nombre de la Empresa"
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Descripción"
                multiline
                rows={4}
                value={settings.companyDescription || ''}
                onChange={(e) => setSettings({ ...settings, companyDescription: e.target.value })}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Datos de Contacto */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ContactIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Datos de Contacto</Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />

              <TextField
                fullWidth
                label="Dirección"
                placeholder="Calle Principal 123, Ciudad, País"
                value={settings.contactAddress || ''}
                onChange={(e) => setSettings({ ...settings, contactAddress: e.target.value })}
                sx={{ mb: 2 }}
                multiline
                rows={2}
              />

              <TextField
                fullWidth
                label="Correo Electrónico"
                type="email"
                placeholder="contacto@tuempresa.com"
                value={settings.contactEmail || ''}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Número Telefónico"
                placeholder="+34 123 456 789"
                value={settings.contactPhone || ''}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="WhatsApp"
                placeholder="+56912345678"
                value={settings.contactWhatsapp || ''}
                onChange={(e) => setSettings({ ...settings, contactWhatsapp: e.target.value })}
                helperText="Número de WhatsApp para contacto (incluye código de país)"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Información de Pagos */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PaymentIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Información de Pagos</Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />

              <Alert severity="info" sx={{ mb: 3 }}>
                Esta información se enviará en el correo de confirmación cuando una reserva esté pendiente de pago.
              </Alert>

              <TextField
                fullWidth
                label="Link de Pago"
                placeholder="https://mpago.la/tu-link o https://flow.cl/tu-link"
                value={settings.paymentLink || ''}
                onChange={(e) => setSettings({ ...settings, paymentLink: e.target.value })}
                sx={{ mb: 2 }}
                helperText="URL de MercadoPago, Flow, Webpay u otro sistema de pago"
              />

              <TextField
                fullWidth
                label="Instrucciones de Pago"
                multiline
                rows={6}
                placeholder="Ejemplo:&#10;&#10;Puedes pagar mediante:&#10;1. Transferencia bancaria a:&#10;   - Banco: Banco Estado&#10;   - Cuenta: 12345678&#10;   - RUT: 12.345.678-9&#10;   - Nombre: Tu Empresa SpA&#10;&#10;2. MercadoPago usando el botón de arriba&#10;&#10;Envía el comprobante por WhatsApp al +56912345678"
                value={settings.paymentInstructions || ''}
                onChange={(e) => setSettings({ ...settings, paymentInstructions: e.target.value })}
                helperText="Instrucciones detalladas sobre cómo realizar el pago (datos bancarios, métodos aceptados, etc.)"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Redes Sociales */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ShareIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Redes Sociales</Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />

              <TextField
                fullWidth
                label="Facebook"
                placeholder="https://facebook.com/tu-empresa"
                value={settings.facebookUrl || ''}
                onChange={(e) => setSettings({ ...settings, facebookUrl: e.target.value })}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Instagram"
                placeholder="https://instagram.com/tu-empresa"
                value={settings.instagramUrl || ''}
                onChange={(e) => setSettings({ ...settings, instagramUrl: e.target.value })}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="TikTok"
                placeholder="https://tiktok.com/@tu-empresa"
                value={settings.tiktokUrl || ''}
                onChange={(e) => setSettings({ ...settings, tiktokUrl: e.target.value })}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="X (Twitter)"
                placeholder="https://x.com/tu-empresa"
                value={settings.xUrl || ''}
                onChange={(e) => setSettings({ ...settings, xUrl: e.target.value })}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Colores del Dashboard */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PaletteIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Colores del Dashboard</Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Color Primario"
                    type="color"
                    value={settings.dashboardPrimaryColor}
                    onChange={(e) => setSettings({ ...settings, dashboardPrimaryColor: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Color Secundario"
                    type="color"
                    value={settings.dashboardSecondaryColor}
                    onChange={(e) => setSettings({ ...settings, dashboardSecondaryColor: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Color de Fondo"
                    type="color"
                    value={settings.dashboardBackgroundColor}
                    onChange={(e) => setSettings({ ...settings, dashboardBackgroundColor: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Color de Texto"
                    type="color"
                    value={settings.dashboardTextColor}
                    onChange={(e) => setSettings({ ...settings, dashboardTextColor: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>

              <Paper sx={{ p: 2, mt: 2, bgcolor: settings.dashboardBackgroundColor }}>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Vista Previa
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: settings.dashboardPrimaryColor,
                      borderRadius: 1,
                    }}
                  />
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: settings.dashboardSecondaryColor,
                      borderRadius: 1,
                    }}
                  />
                  <Box
                    sx={{
                      flex: 1,
                      height: 40,
                      bgcolor: settings.dashboardBackgroundColor,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      px: 1,
                    }}
                  >
                    <Typography sx={{ color: settings.dashboardTextColor, fontSize: '0.875rem' }}>
                      Texto de ejemplo
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </CardContent>
          </Card>
        </Grid>

        {/* Colores del Frontend */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PaletteIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Colores del Frontend</Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Color Primario"
                    type="color"
                    value={settings.frontendPrimaryColor}
                    onChange={(e) => setSettings({ ...settings, frontendPrimaryColor: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Color Secundario"
                    type="color"
                    value={settings.frontendSecondaryColor}
                    onChange={(e) => setSettings({ ...settings, frontendSecondaryColor: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Color de Fondo"
                    type="color"
                    value={settings.frontendBackgroundColor}
                    onChange={(e) => setSettings({ ...settings, frontendBackgroundColor: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Color de Texto"
                    type="color"
                    value={settings.frontendTextColor}
                    onChange={(e) => setSettings({ ...settings, frontendTextColor: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>

              <Paper sx={{ p: 2, mt: 2, bgcolor: settings.frontendBackgroundColor }}>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Vista Previa
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: settings.frontendPrimaryColor,
                      borderRadius: 1,
                    }}
                  />
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: settings.frontendSecondaryColor,
                      borderRadius: 1,
                    }}
                  />
                  <Box
                    sx={{
                      flex: 1,
                      height: 40,
                      bgcolor: settings.frontendBackgroundColor,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      px: 1,
                    }}
                  >
                    <Typography sx={{ color: settings.frontendTextColor, fontSize: '0.875rem' }}>
                      Texto de ejemplo
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </CardContent>
          </Card>
        </Grid>

        {/* Horarios del Local */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <BusinessHoursForm
                businessHours={settings.businessHours}
                onChange={(businessHours) => setSettings({ ...settings, businessHours })}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Guardando...' : 'Guardar Todos los Cambios'}
        </Button>
      </Box>
      </>
      )}

      {/* Tab 1: Páginas Legales */}
      {currentTab === 1 && (
        <LegalPagesTab />
      )}

      {/* Confirm Delete Logo Dialog */}
      <ConfirmDialog
        open={deleteLogoDialogOpen}
        title="Confirmar eliminación"
        message="¿Estás seguro de que quieres eliminar el logo? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={confirmDeleteLogo}
        onCancel={cancelDeleteLogo}
        severity="error"
      />
    </Box>
  )
}
