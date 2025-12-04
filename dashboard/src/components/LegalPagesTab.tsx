import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  Tabs,
  Tab,
  Stack,
} from '@mui/material';
import { Save as SaveIcon, Description as DescriptionIcon } from '@mui/icons-material';
import { apiService } from '@/services/apiService';
import { useSnackbar } from 'notistack';
import RichTextEditor from './RichTextEditor';
import LoadingSpinner from './LoadingSpinner';

interface LegalPage {
  id: string;
  page_type: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`legal-tabpanel-${index}`}
      aria-labelledby={`legal-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function LegalPagesTab() {
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const [termsPage, setTermsPage] = useState<LegalPage | null>(null);
  const [consentPage, setConsentPage] = useState<LegalPage | null>(null);
  const [privacyPage, setPrivacyPage] = useState<LegalPage | null>(null);

  useEffect(() => {
    fetchLegalPages();
  }, []);

  const fetchLegalPages = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<LegalPage[]>('/legal-pages');
      console.log('Legal pages response:', response);
      
      // apiService.get ya extrae la data automáticamente
      const pages = Array.isArray(response) ? response : [];

      setTermsPage(pages.find(p => p.page_type === 'terms') || null);
      setConsentPage(pages.find(p => p.page_type === 'consent') || null);
      setPrivacyPage(pages.find(p => p.page_type === 'privacy') || null);
      
      console.log('Terms page:', pages.find(p => p.page_type === 'terms'));
      console.log('Consent page:', pages.find(p => p.page_type === 'consent'));
      console.log('Privacy page:', pages.find(p => p.page_type === 'privacy'));
    } catch (error) {
      console.error('Error fetching legal pages:', error);
      enqueueSnackbar('Error al cargar páginas legales', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (pageType: 'terms' | 'consent' | 'privacy', title: string) => {
    try {
      setSaving(true);
      let content: string = '';
      
      switch (pageType) {
        case 'terms':
          content = termsPage?.content || '';
          break;
        case 'consent':
          content = consentPage?.content || '';
          break;
        case 'privacy':
          content = privacyPage?.content || '';
          break;
      }

      if (!content || content.trim() === '') {
        enqueueSnackbar('El contenido no puede estar vacío', { variant: 'warning' });
        return;
      }

      console.log('Saving page:', { pageType, title, content: content.substring(0, 100) });

      await apiService.put(`/legal-pages/${pageType}`, {
        title: title,
        content: content,
      });

      enqueueSnackbar('Página guardada exitosamente', { variant: 'success' });
      await fetchLegalPages();
    } catch (error) {
      console.error('Error saving legal page:', error);
      enqueueSnackbar('Error al guardar página', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  if (loading) {
    return <LoadingSpinner message="Cargando páginas legales..." />;
  }

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Edita el contenido de las páginas legales que se muestran en el footer del sitio público.
          Usa el editor de texto enriquecido para dar formato al contenido.
        </Typography>
      </Alert>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={handleTabChange} aria-label="legal pages tabs">
            <Tab icon={<DescriptionIcon />} label="Términos y Condiciones" iconPosition="start" />
            <Tab icon={<DescriptionIcon />} label="Consentimientos Informados" iconPosition="start" />
            <Tab icon={<DescriptionIcon />} label="Política de Privacidad" iconPosition="start" />
          </Tabs>
        </Box>

        {/* Términos y Condiciones */}
        <TabPanel value={currentTab} index={0}>
          <CardContent>
            <Stack spacing={3}>
              <Alert severity="info">
                <Typography variant="body2">
                  Usa el editor para dar formato al texto. El contenido se guardará en HTML y se mostrará con el formato en el sitio público.
                </Typography>
              </Alert>
              
              <Typography variant="h6" gutterBottom>
                Términos y Condiciones
              </Typography>
              
              <RichTextEditor
                label="Contenido"
                value={termsPage?.content || ''}
                onChange={(value) => {
                  console.log('📝 Contenido cambiado - Términos:', value.substring(0, 100));
                  setTermsPage(prev => prev ? { ...prev, content: value } : null);
                }}
                placeholder="Escribe los términos y condiciones..."
                maxLength={50000}
              />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={() => handleSave('terms', 'Términos y Condiciones')}
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </TabPanel>

        {/* Consentimientos Informados */}
        <TabPanel value={currentTab} index={1}>
          <CardContent>
            <Stack spacing={3}>
              <Alert severity="info">
                <Typography variant="body2">
                  Usa el editor para dar formato al texto. El contenido se guardará en HTML y se mostrará con el formato en el sitio público.
                </Typography>
              </Alert>
              
              <Typography variant="h6" gutterBottom>
                Consentimientos Informados
              </Typography>
              
              <RichTextEditor
                label="Contenido"
                value={consentPage?.content || ''}
                onChange={(value) => {
                  console.log('📝 Contenido cambiado - Consentimientos:', value.substring(0, 100));
                  setConsentPage(prev => prev ? { ...prev, content: value } : null);
                }}
                placeholder="Escribe los consentimientos informados..."
                maxLength={50000}
              />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={() => handleSave('consent', 'Consentimientos Informados')}
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </TabPanel>

        {/* Política de Privacidad */}
        <TabPanel value={currentTab} index={2}>
          <CardContent>
            <Stack spacing={3}>
              <Alert severity="info">
                <Typography variant="body2">
                  Usa el editor para dar formato al texto. El contenido se guardará en HTML y se mostrará con el formato en el sitio público.
                </Typography>
              </Alert>
              
              <Typography variant="h6" gutterBottom>
                Política de Privacidad
              </Typography>
              
              <RichTextEditor
                label="Contenido"
                value={privacyPage?.content || ''}
                onChange={(value) => {
                  console.log('📝 Contenido cambiado - Privacidad:', value.substring(0, 100));
                  setPrivacyPage(prev => prev ? { ...prev, content: value } : null);
                }}
                placeholder="Escribe la política de privacidad..."
                maxLength={50000}
              />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={() => handleSave('privacy', 'Política de Privacidad')}
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </TabPanel>
      </Card>
    </Box>
  );
}
