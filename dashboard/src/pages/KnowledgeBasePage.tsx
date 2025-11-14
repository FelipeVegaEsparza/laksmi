import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  Pagination,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Article as ArticleIcon,
  QuestionAnswer as FAQIcon,
  Science as TechIcon,
  LocalPharmacy as IngredientIcon,
  Category as CategoryIcon,
  Search as SearchIcon,
} from '@mui/icons-material'
import { apiService } from '@/services/apiService'
import { useSnackbar } from 'notistack'
import LoadingSpinner from '@/components/LoadingSpinner'
import ConfirmDialog from '@/components/ConfirmDialog'

interface Category {
  id: string
  name: string
  description: string
  icon: string
  displayOrder: number
  isActive: boolean
}

interface FAQ {
  id: string
  categoryId: string
  question: string
  answer: string
  keywords: string[]
  displayOrder: number
  viewCount: number
  helpfulCount: number
  isActive: boolean
}



interface Technology {
  id: string
  name: string
  description: string
  benefits: string[]
  applications: string[]
  imageUrl?: string
  isActive: boolean
}

interface Ingredient {
  id: string
  name: string
  description: string
  benefits: string[]
  precautions?: string
  isActive: boolean
}

export default function KnowledgeBasePage() {
  const [currentTab, setCurrentTab] = useState(0)
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [faqs, setFAQs] = useState<FAQ[]>([])
  const [technologies, setTechnologies] = useState<Technology[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  
  // Dialog states
  const [faqDialogOpen, setFaqDialogOpen] = useState(false)
  const [techDialogOpen, setTechDialogOpen] = useState(false)
  const [ingredientDialogOpen, setIngredientDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  
  // Delete confirmation states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: 'faq' | 'tech' | 'ingredient'; name: string } | null>(null)
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('recent')
  const [showInactive, setShowInactive] = useState(false)
  
  // Pagination
  const [page, setPage] = useState(1)
  const itemsPerPage = 10
  
  const { enqueueSnackbar } = useSnackbar()

  useEffect(() => {
    fetchData()
  }, [currentTab])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Siempre cargar categorías
      const categoriesData = await apiService.get<Category[]>('/knowledge/categories')
      setCategories(categoriesData)
      
      // Cargar datos según el tab actual
      switch (currentTab) {
        case 0: // FAQs
          const faqsData = await apiService.get<FAQ[]>('/knowledge/faqs')
          setFAQs(faqsData)
          break
        case 1: // Artículos
          // Por ahora no hay endpoint para listar todos los artículos
          break
        case 2: // Tecnologías
          const techData = await apiService.get<Technology[]>('/knowledge/technologies')
          setTechnologies(techData)
          break
        case 3: // Ingredientes
          const ingData = await apiService.get<Ingredient[]>('/knowledge/ingredients')
          setIngredients(ingData)
          break
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      enqueueSnackbar('Error al cargar datos', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFAQ = () => {
    setSelectedItem({
      categoryId: categories[0]?.id || '',
      question: '',
      answer: '',
      keywords: [],
      displayOrder: 0,
    })
    setIsEditing(false)
    setFaqDialogOpen(true)
  }

  const handleEditFAQ = (faq: FAQ) => {
    setSelectedItem(faq)
    setIsEditing(true)
    setFaqDialogOpen(true)
  }

  const handleSaveFAQ = async () => {
    try {
      if (isEditing) {
        await apiService.put(`/knowledge/faqs/${selectedItem.id}`, selectedItem)
        enqueueSnackbar('FAQ actualizada correctamente', { variant: 'success' })
      } else {
        await apiService.post('/knowledge/faqs', selectedItem)
        enqueueSnackbar('FAQ creada correctamente', { variant: 'success' })
      }
      setFaqDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error('Error saving FAQ:', error)
      enqueueSnackbar('Error al guardar FAQ', { variant: 'error' })
    }
  }

  const handleDeleteFAQ = (id: string, question: string) => {
    setItemToDelete({ id, type: 'faq', name: question })
    setDeleteDialogOpen(true)
  }

  const handleCreateTechnology = () => {
    setSelectedItem({
      name: '',
      description: '',
      benefits: [],
      applications: [],
      imageUrl: '',
    })
    setIsEditing(false)
    setTechDialogOpen(true)
  }

  const handleEditTechnology = (tech: Technology) => {
    setSelectedItem(tech)
    setIsEditing(true)
    setTechDialogOpen(true)
  }

  const handleSaveTechnology = async () => {
    try {
      if (isEditing) {
        await apiService.put(`/knowledge/technologies/${selectedItem.id}`, selectedItem)
        enqueueSnackbar('Tecnología actualizada correctamente', { variant: 'success' })
      } else {
        await apiService.post('/knowledge/technologies', selectedItem)
        enqueueSnackbar('Tecnología creada correctamente', { variant: 'success' })
      }
      setTechDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error('Error saving technology:', error)
      enqueueSnackbar('Error al guardar tecnología', { variant: 'error' })
    }
  }

  const handleDeleteTechnology = (id: string, name: string) => {
    setItemToDelete({ id, type: 'tech', name })
    setDeleteDialogOpen(true)
  }
  
  const handleDeleteIngredient = (id: string, name: string) => {
    setItemToDelete({ id, type: 'ingredient', name })
    setDeleteDialogOpen(true)
  }
  
  const confirmDelete = async () => {
    if (!itemToDelete) return
    
    try {
      const { id, type } = itemToDelete
      
      switch (type) {
        case 'faq':
          await apiService.delete(`/knowledge/faqs/${id}`)
          enqueueSnackbar('FAQ eliminada correctamente', { variant: 'success' })
          break
        case 'tech':
          await apiService.delete(`/knowledge/technologies/${id}`)
          enqueueSnackbar('Tecnología eliminada correctamente', { variant: 'success' })
          break
        case 'ingredient':
          await apiService.delete(`/knowledge/ingredients/${id}`)
          enqueueSnackbar('Ingrediente eliminado correctamente', { variant: 'success' })
          break
      }
      
      setDeleteDialogOpen(false)
      setItemToDelete(null)
      fetchData()
    } catch (error) {
      console.error('Error deleting item:', error)
      enqueueSnackbar('Error al eliminar tecnología', { variant: 'error' })
    }
  }

  const handleCreateIngredient = () => {
    setSelectedItem({
      name: '',
      description: '',
      benefits: [],
      precautions: '',
    })
    setIsEditing(false)
    setIngredientDialogOpen(true)
  }

  const handleEditIngredient = (ing: Ingredient) => {
    setSelectedItem(ing)
    setIsEditing(true)
    setIngredientDialogOpen(true)
  }

  const handleSaveIngredient = async () => {
    try {
      if (isEditing) {
        await apiService.put(`/knowledge/ingredients/${selectedItem.id}`, selectedItem)
        enqueueSnackbar('Ingrediente actualizado correctamente', { variant: 'success' })
      } else {
        await apiService.post('/knowledge/ingredients', selectedItem)
        enqueueSnackbar('Ingrediente creado correctamente', { variant: 'success' })
      }
      setIngredientDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error('Error saving ingredient:', error)
      enqueueSnackbar('Error al guardar ingrediente', { variant: 'error' })
    }
  }

  const cancelDelete = () => {
    setDeleteDialogOpen(false)
    setItemToDelete(null)
  }

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || 'Sin categoría'
  }

  // Filter and sort functions
  const getFilteredAndSortedFAQs = () => {
    let filtered = [...faqs]
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(faq =>
        faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }
    
    // Filter by category
    if (filterCategory !== 'all') {
      filtered = filtered.filter(faq => faq.categoryId === filterCategory)
    }
    
    // Filter by active status
    if (!showInactive) {
      filtered = filtered.filter(faq => faq.isActive)
    }
    
    // Sort
    switch (sortBy) {
      case 'recent':
        // Assuming newer items have higher IDs
        filtered.sort((a, b) => b.id.localeCompare(a.id))
        break
      case 'popular':
        filtered.sort((a, b) => b.viewCount - a.viewCount)
        break
      case 'helpful':
        filtered.sort((a, b) => b.helpfulCount - a.helpfulCount)
        break
      case 'alphabetical':
        filtered.sort((a, b) => a.question.localeCompare(b.question))
        break
    }
    
    return filtered
  }

  const getFilteredAndSortedTechnologies = () => {
    let filtered = [...technologies]
    
    if (searchTerm) {
      filtered = filtered.filter(tech =>
        tech.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tech.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    if (!showInactive) {
      filtered = filtered.filter(tech => tech.isActive)
    }
    
    filtered.sort((a, b) => a.name.localeCompare(b.name))
    
    return filtered
  }

  const getFilteredAndSortedIngredients = () => {
    let filtered = [...ingredients]
    
    if (searchTerm) {
      filtered = filtered.filter(ing =>
        ing.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ing.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    if (!showInactive) {
      filtered = filtered.filter(ing => ing.isActive)
    }
    
    filtered.sort((a, b) => a.name.localeCompare(b.name))
    
    return filtered
  }

  // Get paginated items
  const getPaginatedItems = (items: any[]) => {
    const startIndex = (page - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return items.slice(startIndex, endIndex)
  }

  // Reset pagination when filters change
  useEffect(() => {
    setPage(1)
  }, [searchTerm, filterCategory, sortBy, showInactive, currentTab])

  if (loading && currentTab === 0) {
    return <LoadingSpinner message="Cargando base de conocimientos..." />
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="600">
          Base de Conocimientos
        </Typography>
      </Box>

      {/* Info Alert */}
      <Alert severity="info" sx={{ mb: 3 }}>
        Gestiona el contenido que el chatbot usa para responder preguntas de los clientes.
        Toda la información aquí se usa automáticamente en las conversaciones.
      </Alert>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <FAQIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight="700" color="primary.main">
                    {faqs.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    FAQs
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.50', border: '1px solid', borderColor: 'success.200' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TechIcon sx={{ fontSize: 40, color: 'success.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight="700" color="success.main">
                    {technologies.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Tecnologías
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'info.50', border: '1px solid', borderColor: 'info.200' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <IngredientIcon sx={{ fontSize: 40, color: 'info.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight="700" color="info.main">
                    {ingredients.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Ingredientes
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'warning.50', border: '1px solid', borderColor: 'warning.200' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CategoryIcon sx={{ fontSize: 40, color: 'warning.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight="700" color="warning.main">
                    {categories.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Categorías
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={(_, newValue) => setCurrentTab(newValue)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab icon={<FAQIcon />} label="FAQs" iconPosition="start" />
          <Tab icon={<ArticleIcon />} label="Artículos" iconPosition="start" />
          <Tab icon={<TechIcon />} label="Tecnologías" iconPosition="start" />
          <Tab icon={<IngredientIcon />} label="Ingredientes" iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Content */}
      <Paper sx={{ p: 3 }}>
        {/* Search and Filters */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            {currentTab === 0 && (
              <>
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Categoría</InputLabel>
                    <Select
                      value={filterCategory}
                      label="Categoría"
                      onChange={(e) => setFilterCategory(e.target.value)}
                    >
                      <MenuItem value="all">Todas</MenuItem>
                      {categories.map((cat) => (
                        <MenuItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Ordenar por</InputLabel>
                    <Select
                      value={sortBy}
                      label="Ordenar por"
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <MenuItem value="recent">Más recientes</MenuItem>
                      <MenuItem value="popular">Más vistas</MenuItem>
                      <MenuItem value="helpful">Más útiles</MenuItem>
                      <MenuItem value="alphabetical">A-Z</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}
            
            <Grid item xs={12} md={currentTab === 0 ? 2 : 4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={showInactive}
                    onChange={(e) => setShowInactive(e.target.checked)}
                  />
                }
                label="Mostrar inactivos"
              />
            </Grid>
            
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setSearchTerm('')
                  setFilterCategory('all')
                  setSortBy('recent')
                  setShowInactive(false)
                }}
              >
                Limpiar filtros
              </Button>
            </Grid>
          </Grid>
        </Box>

        {/* FAQs Tab */}
        {currentTab === 0 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                Preguntas Frecuentes
                <Chip
                  label={`${getFilteredAndSortedFAQs().length} resultados`}
                  size="small"
                  sx={{ ml: 2 }}
                />
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateFAQ}
              >
                Nueva FAQ
              </Button>
            </Box>
            
            {loading ? (
              <LoadingSpinner />
            ) : getFilteredAndSortedFAQs().length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <FAQIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography color="text.secondary">
                  {searchTerm || filterCategory !== 'all'
                    ? 'No se encontraron resultados con los filtros aplicados.'
                    : 'No hay FAQs creadas. Crea la primera para empezar.'}
                </Typography>
              </Box>
            ) : (
              <>
                <List>
                  {getPaginatedItems(getFilteredAndSortedFAQs()).map((faq) => (
                    <ListItem
                      key={faq.id}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1,
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="subtitle1" fontWeight="600">
                              {faq.question}
                            </Typography>
                            <Chip
                              label={getCategoryName(faq.categoryId)}
                              size="small"
                              variant="outlined"
                            />
                            {!faq.isActive && (
                              <Chip label="Inactiva" size="small" color="error" />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              {faq.answer.substring(0, 150)}...
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                              <Typography variant="caption" color="text.secondary">
                                {faq.viewCount} vistas • {faq.helpfulCount} útiles
                              </Typography>
                              {faq.keywords.length > 0 && (
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  {faq.keywords.slice(0, 3).map((keyword: string, idx: number) => (
                                    <Chip key={idx} label={keyword} size="small" variant="outlined" />
                                  ))}
                                </Box>
                              )}
                            </Box>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Tooltip title="Ver detalles">
                          <IconButton
                            edge="end"
                            onClick={() => {
                              setSelectedItem(faq)
                              setViewDialogOpen(true)
                            }}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <IconButton
                            edge="end"
                            onClick={() => handleEditFAQ(faq)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton
                            edge="end"
                            onClick={() => handleDeleteFAQ(faq.id, faq.question)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
                
                {/* Pagination */}
                {getFilteredAndSortedFAQs().length > itemsPerPage && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Pagination
                      count={Math.ceil(getFilteredAndSortedFAQs().length / itemsPerPage)}
                      page={page}
                      onChange={(_, value) => setPage(value)}
                      color="primary"
                    />
                  </Box>
                )}
              </>
            )}
          </Box>
        )}

        {/* Articles Tab */}
        {currentTab === 1 && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <ArticleIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Gestión de Artículos
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Funcionalidad en desarrollo
            </Typography>
          </Box>
        )}

        {/* Technologies Tab */}
        {currentTab === 2 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                Tecnologías y Equipos
                <Chip
                  label={`${getFilteredAndSortedTechnologies().length} resultados`}
                  size="small"
                  sx={{ ml: 2 }}
                />
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateTechnology}
              >
                Nueva Tecnología
              </Button>
            </Box>
            
            {loading ? (
              <LoadingSpinner />
            ) : getFilteredAndSortedTechnologies().length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <TechIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography color="text.secondary">
                  {searchTerm
                    ? 'No se encontraron resultados con los filtros aplicados.'
                    : 'No hay tecnologías registradas.'}
                </Typography>
              </Box>
            ) : (
              <>
                <Grid container spacing={2}>
                  {getPaginatedItems(getFilteredAndSortedTechnologies()).map((tech) => (
                    <Grid item xs={12} md={6} key={tech.id}>
                      <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="h6">
                                {tech.name}
                              </Typography>
                              {!tech.isActive && (
                                <Chip label="Inactiva" size="small" color="error" />
                              )}
                            </Box>
                            <Box>
                              <Tooltip title="Editar">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditTechnology(tech)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Eliminar">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteTechnology(tech.id, tech.name)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {tech.description.length > 150
                              ? `${tech.description.substring(0, 150)}...`
                              : tech.description}
                          </Typography>
                          {tech.benefits.length > 0 && (
                            <Box sx={{ mb: 1 }}>
                              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                                Beneficios:
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                {tech.benefits.slice(0, 3).map((benefit: string, idx: number) => (
                                  <Chip key={idx} label={benefit} size="small" color="success" />
                                ))}
                                {tech.benefits.length > 3 && (
                                  <Chip label={`+${tech.benefits.length - 3}`} size="small" />
                                )}
                              </Box>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
                
                {/* Pagination */}
                {getFilteredAndSortedTechnologies().length > itemsPerPage && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Pagination
                      count={Math.ceil(getFilteredAndSortedTechnologies().length / itemsPerPage)}
                      page={page}
                      onChange={(_, value) => setPage(value)}
                      color="primary"
                    />
                  </Box>
                )}
              </>
            )}
          </Box>
        )}

        {/* Ingredients Tab */}
        {currentTab === 3 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                Ingredientes Activos
                <Chip
                  label={`${getFilteredAndSortedIngredients().length} resultados`}
                  size="small"
                  sx={{ ml: 2 }}
                />
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateIngredient}
              >
                Nuevo Ingrediente
              </Button>
            </Box>
            
            {loading ? (
              <LoadingSpinner />
            ) : getFilteredAndSortedIngredients().length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <IngredientIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography color="text.secondary">
                  {searchTerm
                    ? 'No se encontraron resultados con los filtros aplicados.'
                    : 'No hay ingredientes registrados.'}
                </Typography>
              </Box>
            ) : (
              <>
                <Grid container spacing={2}>
                  {getPaginatedItems(getFilteredAndSortedIngredients()).map((ing) => (
                    <Grid item xs={12} md={6} key={ing.id}>
                      <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="h6">
                                {ing.name}
                              </Typography>
                              {!ing.isActive && (
                                <Chip label="Inactivo" size="small" color="error" />
                              )}
                            </Box>
                            <Box>
                              <Tooltip title="Editar">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditIngredient(ing)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Eliminar">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteIngredient(ing.id, ing.name)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {ing.description.length > 150
                              ? `${ing.description.substring(0, 150)}...`
                              : ing.description}
                          </Typography>
                          {ing.benefits.length > 0 && (
                            <Box sx={{ mb: 1 }}>
                              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                                Beneficios:
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                {ing.benefits.slice(0, 3).map((benefit: string, idx: number) => (
                                  <Chip key={idx} label={benefit} size="small" color="info" />
                                ))}
                                {ing.benefits.length > 3 && (
                                  <Chip label={`+${ing.benefits.length - 3}`} size="small" />
                                )}
                              </Box>
                            </Box>
                          )}
                          {ing.precautions && (
                            <Alert severity="warning" sx={{ mt: 1 }}>
                              <Typography variant="caption">
                                {ing.precautions.length > 100
                                  ? `${ing.precautions.substring(0, 100)}...`
                                  : ing.precautions}
                              </Typography>
                            </Alert>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
                
                {/* Pagination */}
                {getFilteredAndSortedIngredients().length > itemsPerPage && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Pagination
                      count={Math.ceil(getFilteredAndSortedIngredients().length / itemsPerPage)}
                      page={page}
                      onChange={(_, value) => setPage(value)}
                      color="primary"
                    />
                  </Box>
                )}
              </>
            )}
          </Box>
        )}
      </Paper>

      {/* FAQ Dialog */}
      <Dialog open={faqDialogOpen} onClose={() => setFaqDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {isEditing ? 'Editar FAQ' : 'Nueva FAQ'}
          <Typography variant="caption" display="block" color="text.secondary">
            Las FAQs ayudan al chatbot a responder preguntas comunes de los clientes
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              select
              label="Categoría"
              value={selectedItem?.categoryId || ''}
              onChange={(e) => setSelectedItem({ ...selectedItem, categoryId: e.target.value })}
              fullWidth
              required
              helperText="Selecciona la categoría más apropiada"
            >
              {categories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.name}
                </MenuItem>
              ))}
            </TextField>
            
            <TextField
              label="Pregunta"
              value={selectedItem?.question || ''}
              onChange={(e) => setSelectedItem({ ...selectedItem, question: e.target.value })}
              fullWidth
              required
              helperText={`${selectedItem?.question?.length || 0} caracteres`}
              error={selectedItem?.question && selectedItem.question.length < 10}
            />
            
            <TextField
              label="Respuesta"
              value={selectedItem?.answer || ''}
              onChange={(e) => setSelectedItem({ ...selectedItem, answer: e.target.value })}
              fullWidth
              multiline
              rows={6}
              required
              helperText={`${selectedItem?.answer?.length || 0} caracteres - Sé claro y conciso`}
              error={selectedItem?.answer && selectedItem.answer.length < 20}
            />
            
            <TextField
              label="Palabras clave (separadas por coma)"
              value={selectedItem?.keywords?.join(', ') || ''}
              onChange={(e) => setSelectedItem({
                ...selectedItem,
                keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)
              })}
              fullWidth
              helperText="Ej: precio, costo, tratamiento facial - Ayuda al chatbot a encontrar esta FAQ"
              placeholder="palabra1, palabra2, palabra3"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={selectedItem?.isActive !== false}
                  onChange={(e) => setSelectedItem({ ...selectedItem, isActive: e.target.checked })}
                />
              }
              label="FAQ activa (visible para el chatbot)"
            />
            
            <TextField
              label="Orden de visualización"
              type="number"
              value={selectedItem?.displayOrder || 0}
              onChange={(e) => setSelectedItem({ ...selectedItem, displayOrder: parseInt(e.target.value) || 0 })}
              fullWidth
              helperText="Menor número = mayor prioridad"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFaqDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSaveFAQ}
            disabled={
              !selectedItem?.question ||
              !selectedItem?.answer ||
              !selectedItem?.categoryId ||
              selectedItem.question.length < 10 ||
              selectedItem.answer.length < 20
            }
          >
            {isEditing ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Technology Dialog */}
      <Dialog open={techDialogOpen} onClose={() => setTechDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {isEditing ? 'Editar Tecnología' : 'Nueva Tecnología'}
          <Typography variant="caption" display="block" color="text.secondary">
            Información sobre equipos y tecnologías usadas en tratamientos
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Nombre de la Tecnología"
              value={selectedItem?.name || ''}
              onChange={(e) => setSelectedItem({ ...selectedItem, name: e.target.value })}
              fullWidth
              required
              placeholder="Ej: Láser CO2 Fraccionado"
              helperText={`${selectedItem?.name?.length || 0} caracteres`}
            />
            
            <TextField
              label="Descripción"
              value={selectedItem?.description || ''}
              onChange={(e) => setSelectedItem({ ...selectedItem, description: e.target.value })}
              fullWidth
              multiline
              rows={5}
              required
              placeholder="Describe qué es y cómo funciona esta tecnología..."
              helperText={`${selectedItem?.description?.length || 0} caracteres - Explica de forma clara`}
            />
            
            <TextField
              label="Beneficios (separados por coma)"
              value={selectedItem?.benefits?.join(', ') || ''}
              onChange={(e) => setSelectedItem({
                ...selectedItem,
                benefits: e.target.value.split(',').map(b => b.trim()).filter(b => b)
              })}
              fullWidth
              multiline
              rows={2}
              placeholder="Rejuvenecimiento, Reducción de arrugas, Mejora textura"
              helperText="Lista los principales beneficios de esta tecnología"
            />
            
            <TextField
              label="Aplicaciones (separadas por coma)"
              value={selectedItem?.applications?.join(', ') || ''}
              onChange={(e) => setSelectedItem({
                ...selectedItem,
                applications: e.target.value.split(',').map(a => a.trim()).filter(a => a)
              })}
              fullWidth
              multiline
              rows={2}
              placeholder="Tratamiento facial, Cicatrices, Manchas"
              helperText="¿Para qué se usa esta tecnología?"
            />
            
            <TextField
              label="URL de imagen (opcional)"
              value={selectedItem?.imageUrl || ''}
              onChange={(e) => setSelectedItem({ ...selectedItem, imageUrl: e.target.value })}
              fullWidth
              placeholder="https://ejemplo.com/imagen.jpg"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={selectedItem?.isActive !== false}
                  onChange={(e) => setSelectedItem({ ...selectedItem, isActive: e.target.checked })}
                />
              }
              label="Tecnología activa (visible para el chatbot)"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTechDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSaveTechnology}
            disabled={!selectedItem?.name || !selectedItem?.description}
          >
            {isEditing ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Ingredient Dialog */}
      <Dialog open={ingredientDialogOpen} onClose={() => setIngredientDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {isEditing ? 'Editar Ingrediente' : 'Nuevo Ingrediente'}
          <Typography variant="caption" display="block" color="text.secondary">
            Información sobre ingredientes activos usados en productos y tratamientos
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Nombre del Ingrediente"
              value={selectedItem?.name || ''}
              onChange={(e) => setSelectedItem({ ...selectedItem, name: e.target.value })}
              fullWidth
              required
              placeholder="Ej: Ácido Hialurónico"
              helperText={`${selectedItem?.name?.length || 0} caracteres`}
            />
            
            <TextField
              label="Descripción"
              value={selectedItem?.description || ''}
              onChange={(e) => setSelectedItem({ ...selectedItem, description: e.target.value })}
              fullWidth
              multiline
              rows={5}
              required
              placeholder="Describe qué es este ingrediente y sus propiedades..."
              helperText={`${selectedItem?.description?.length || 0} caracteres - Explica de forma clara`}
            />
            
            <TextField
              label="Beneficios (separados por coma)"
              value={selectedItem?.benefits?.join(', ') || ''}
              onChange={(e) => setSelectedItem({
                ...selectedItem,
                benefits: e.target.value.split(',').map(b => b.trim()).filter(b => b)
              })}
              fullWidth
              multiline
              rows={2}
              placeholder="Hidratación profunda, Anti-edad, Relleno natural"
              helperText="Lista los principales beneficios de este ingrediente"
            />
            
            <TextField
              label="Precauciones"
              value={selectedItem?.precautions || ''}
              onChange={(e) => setSelectedItem({ ...selectedItem, precautions: e.target.value })}
              fullWidth
              multiline
              rows={3}
              placeholder="Contraindicaciones, efectos secundarios, advertencias..."
              helperText="Información importante sobre el uso seguro"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={selectedItem?.isActive !== false}
                  onChange={(e) => setSelectedItem({ ...selectedItem, isActive: e.target.checked })}
                />
              }
              label="Ingrediente activo (visible para el chatbot)"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIngredientDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSaveIngredient}
            disabled={!selectedItem?.name || !selectedItem?.description}
          >
            {isEditing ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Detalles Completos
          {selectedItem && !selectedItem.isActive && (
            <Chip label="Inactivo" size="small" color="error" sx={{ ml: 2 }} />
          )}
        </DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Box sx={{ mt: 1 }}>
              {/* Question/Name */}
              <Typography variant="h6" gutterBottom color="primary">
                {selectedItem.question || selectedItem.name}
              </Typography>
              
              {/* Category for FAQs */}
              {selectedItem.categoryId && (
                <Chip
                  label={getCategoryName(selectedItem.categoryId)}
                  size="small"
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
              )}
              
              {/* Answer/Description */}
              <Paper sx={{ p: 2, bgcolor: 'grey.50', mb: 2 }}>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {selectedItem.answer || selectedItem.description}
                </Typography>
              </Paper>
              
              {/* Keywords */}
              {selectedItem.keywords && selectedItem.keywords.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Palabras clave:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {selectedItem.keywords.map((keyword: string, idx: number) => (
                      <Chip key={idx} label={keyword} size="small" color="primary" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              )}
              
              {/* Benefits */}
              {selectedItem.benefits && selectedItem.benefits.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Beneficios:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {selectedItem.benefits.map((benefit: string, idx: number) => (
                      <Chip key={idx} label={benefit} size="small" color="success" />
                    ))}
                  </Box>
                </Box>
              )}
              
              {/* Applications */}
              {selectedItem.applications && selectedItem.applications.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Aplicaciones:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {selectedItem.applications.map((app: string, idx: number) => (
                      <Chip key={idx} label={app} size="small" color="info" />
                    ))}
                  </Box>
                </Box>
              )}
              
              {/* Precautions */}
              {selectedItem.precautions && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Precauciones:
                  </Typography>
                  <Typography variant="body2">
                    {selectedItem.precautions}
                  </Typography>
                </Alert>
              )}
              
              {/* Stats for FAQs */}
              {selectedItem.viewCount !== undefined && (
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Chip
                    icon={<ViewIcon />}
                    label={`${selectedItem.viewCount} vistas`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={`${selectedItem.helpfulCount} útiles`}
                    size="small"
                    variant="outlined"
                    color="success"
                  />
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Cerrar</Button>
          {selectedItem && (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => {
                setViewDialogOpen(false)
                if (selectedItem.question) {
                  handleEditFAQ(selectedItem)
                } else if (selectedItem.benefits) {
                  if (selectedItem.applications) {
                    handleEditTechnology(selectedItem)
                  } else {
                    handleEditIngredient(selectedItem)
                  }
                }
              }}
            >
              Editar
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Confirmar eliminación"
        message={`¿Estás seguro de que quieres eliminar "${itemToDelete?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        severity="error"
      />
    </Box>
  )
}
