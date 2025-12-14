import React, { useState, useEffect } from 'react'
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  useTheme,
  useMediaQuery,
  Switch,
  Tooltip,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  EventNote as EventNoteIcon,
  Inventory as InventoryIcon,
  Chat as ChatIcon,
  Warning as WarningIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  AccountCircle,
  Logout,
  Category as CategoryIcon,
  MenuBook as KnowledgeIcon,
  Business as BusinessIcon,
} from '@mui/icons-material'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/contexts/NotificationContext'
import NotificationPanel from './NotificationPanel'
import ConnectionStatus from './ConnectionStatus'
import { useCompanySettings } from '@/hooks/useCompanySettings'

const drawerWidth = 240

interface LayoutProps {
  children: React.ReactNode
}

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Clientes', icon: <PeopleIcon />, path: '/clients' },
  { text: 'Citas', icon: <EventNoteIcon />, path: '/bookings' },
  { text: 'Servicios', icon: <InventoryIcon />, path: '/services' },
  { text: 'Productos', icon: <InventoryIcon />, path: '/products' },
  { text: 'Órdenes de Productos', icon: <InventoryIcon />, path: '/product-orders' },
  { text: 'Categorías', icon: <CategoryIcon />, path: '/categories' },
  { text: 'Conversaciones', icon: <ChatIcon />, path: '/conversations' },
  { text: 'Escalaciones', icon: <WarningIcon />, path: '/escalations' },
  { text: 'Base de Conocimientos', icon: <KnowledgeIcon />, path: '/knowledge' },
  { text: 'Banner Principal', icon: <BusinessIcon />, path: '/banners' },
  { text: 'Imágenes Destacadas', icon: <BusinessIcon />, path: '/featured-images' },
  { text: 'Popups Promocionales', icon: <BusinessIcon />, path: '/popups' },
  { text: 'Configuración Empresa', icon: <BusinessIcon />, path: '/company-settings' },
  { text: 'Configuración', icon: <SettingsIcon />, path: '/settings' },
]

export default function Layout({ children }: LayoutProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null)
  const [logoError, setLogoError] = useState(false)
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [loadingMaintenance, setLoadingMaintenance] = useState(false)
  
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const { unreadCount } = useNotifications()
  const { logoUrl: companyLogo, companyName, loading: logoLoading } = useCompanySettings()
  
  console.log('🎨 Layout render - Logo:', companyLogo, 'Name:', companyName, 'Loading:', logoLoading, 'Error:', logoError)

  // Cargar estado inicial del modo mantenimiento
  useEffect(() => {
    const fetchMaintenanceMode = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/company-settings`)
        const data = await response.json()
        if (data.success && data.data) {
          setMaintenanceMode(data.data.maintenanceMode || false)
        }
      } catch (error) {
        console.error('Error fetching maintenance mode:', error)
      }
    }
    fetchMaintenanceMode()
  }, [])

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleMaintenanceModeToggle = async () => {
    setLoadingMaintenance(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/company-settings/maintenance-mode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ maintenanceMode: !maintenanceMode })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setMaintenanceMode(!maintenanceMode)
      } else {
        console.error('Error toggling maintenance mode:', data.error)
        alert('Error al cambiar el modo mantenimiento')
      }
    } catch (error) {
      console.error('Error toggling maintenance mode:', error)
      alert('Error al cambiar el modo mantenimiento')
    } finally {
      setLoadingMaintenance(false)
    }
  }

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget)
  }

  const handleNotificationClose = () => {
    setNotificationAnchor(null)
  }

  const handleLogout = () => {
    logout()
    handleMenuClose()
    navigate('/login')
  }

  const drawer = (
    <div>
      <Toolbar 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          gap: 1,
          py: 3
        }}
      >
        {companyLogo && !logoError ? (
          <Box
            component="img"
            src={companyLogo}
            alt={companyName}
            onError={() => {
              console.error('❌ Layout - Error loading logo, showing fallback')
              setLogoError(true)
            }}
            sx={{
              height: 80,
              width: 'auto',
              maxWidth: '90%',
              objectFit: 'contain'
            }}
          />
        ) : (
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              color: 'primary.main', 
              fontWeight: 'bold',
              textAlign: 'center',
              px: 2
            }}
          >
            {companyName}
          </Typography>
        )}
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path)
                if (isMobile) {
                  setMobileOpen(false)
                }
              }}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'primary.light',
                  color: 'primary.contrastText',
                  '&:hover': {
                    backgroundColor: 'primary.main',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: location.pathname === item.path ? 'primary.contrastText' : 'inherit',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Dashboard Administrativo
          </Typography>
          
          {/* Maintenance Mode Toggle */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              backgroundColor: maintenanceMode ? '#fff3e0' : '#e8f5e9',
              borderRadius: 2,
              px: 2,
              py: 0.5,
              mr: 2,
              border: maintenanceMode ? '2px solid #ff9800' : '2px solid #4caf50',
            }}
          >
            <Tooltip title={maintenanceMode ? "El sitio está en mantenimiento. Click para activar" : "El sitio está activo. Click para poner en mantenimiento"}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: maintenanceMode ? '#e65100' : '#2e7d32',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    display: { xs: 'none', md: 'block' }
                  }}
                >
                  Sitio:
                </Typography>
                <Switch
                  checked={maintenanceMode}
                  onChange={handleMaintenanceModeToggle}
                  disabled={loadingMaintenance}
                  size="small"
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#ff9800',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#ff9800',
                    },
                    '& .MuiSwitch-track': {
                      backgroundColor: '#4caf50',
                    },
                  }}
                />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: maintenanceMode ? '#e65100' : '#2e7d32',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    minWidth: '100px',
                    textAlign: 'left'
                  }}
                >
                  {maintenanceMode ? '🔧 Mantenimiento' : '✅ Activo'}
                </Typography>
              </Box>
            </Tooltip>
          </Box>
          
          {/* Connection Status */}
          <ConnectionStatus />
          
          {/* Notifications */}
          <IconButton
            size="large"
            aria-label="show notifications"
            color="inherit"
            onClick={handleNotificationClick}
          >
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          {/* User Menu */}
          <IconButton
            size="large"
            edge="end"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenuClick}
            color="inherit"
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
              {user?.username?.charAt(0)?.toUpperCase() || 'U'}
            </Avatar>
          </IconButton>
          
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleMenuClose}>
              <ListItemIcon>
                <AccountCircle fontSize="small" />
              </ListItemIcon>
              <ListItemText>
                <Typography variant="body2">{user?.username}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.role}
                </Typography>
              </ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              Cerrar Sesión
            </MenuItem>
          </Menu>

          {/* Notification Panel */}
          <NotificationPanel
            anchorEl={notificationAnchor}
            open={Boolean(notificationAnchor)}
            onClose={handleNotificationClose}
          />
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  )
}