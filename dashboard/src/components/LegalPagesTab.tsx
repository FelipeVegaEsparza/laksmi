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
  TextField,
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
      const response = await apiService.get<{ success: boolean; data: LegalPage[] }>('/legal-pages');
      const pages = response.data || [];

      setTermsPage(pages.find(p => p.page_type === 'terms') || null);
      setConsentPage(pages.find(p => p.page_type === 'consent') || null);
      setPrivacyPage(pages.find(p => p.page_type === 'privacy') || null);
    } catch (error) {
      console.error('Error fetching legal pages:', error);
      enqueueSnackbar('Error al cargar páginas legales', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (pageType: 'terms' | 'consent' | 'privacy') => {
    try {
      setSaving(true);
      let page: LegalPage | null = null;
      
      switch (pageType) {
        case 'terms':
          page = termsPage;
          break;
        case 'consent':
          page = consentPage;
          break;
        case 'privacy':
          page = privacyPage;
          break;
      }

      if (!page) {
        enqueueSnackbar('No hay datos para guardar', { variant: 'warning' });
        return;
      }

      await apiService.put(`/legal-pages/${pageType}`, {
        title: page.title,
        content: page.content,
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
              <TextField
                fullWidth
                label="Título"
                value={termsPage?.title || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTermsPage(prev => prev ? { ...prev, title: e.target.value } : null)}
              />
              
              <RichTextEditor
                label="Contenido"
                value={termsPage?.content || ''}
                onChange={(value) => setTermsPage(prev => prev ? { ...prev, content: value } : null)}
                placeholder="Escribe los términos y condiciones..."
                maxLength={50000}
              />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={() => handleSave('terms')}
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
              <TextField
                fullWidth
                label="Título"
                value={consentPage?.title || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConsentPage(prev => prev ? { ...prev, title: e.target.value } : null)}
              />
              
              <RichTextEditor
                label="Contenido"
                value={consentPage?.content || ''}
                onChange={(value) => setConsentPage(prev => prev ? { ...prev, content: value } : null)}
                placeholder="Escribe los consentimientos informados..."
                maxLength={50000}
              />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={() => handleSave('consent')}
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
              <TextField
                fullWidth
                label="Título"
                value={privacyPage?.title || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrivacyPage(prev => prev ? { ...prev, title: e.target.value } : null)}
              />
              
              <RichTextEditor
                label="Contenido"
                value={privacyPage?.content || ''}
                onChange={(value) => setPrivacyPage(prev => prev ? { ...prev, content: value } : null)}
                placeholder="Escribe la política de privacidad..."
                maxLength={50000}
              />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={() => handleSave('privacy')}
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
