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
  { text: 'Base de Conocimientos', icon: <KnowledgeIcon />, path: '/knowledge' },
  { text: 'Banner Principal', icon: <BusinessIcon />, path: '/banners' },
  { text: 'Imágenes Destacadas', icon: <BusinessIcon />, path: '/featured-images' },
  { text: 'Popups Promocionales', icon: <BusinessIcon />, path: '/popups' },
  { text: 'Configuración Empresa', icon: <BusinessIcon />, path: '/company-settings' },
  { text: 'Usuarios', icon: <PeopleIcon />, path: '/users', adminOnly: true },
  { text: 'Configuración', icon: <SettingsIcon />, path: '/settings' },
] as Array<{ text: string; icon: JSX.Element; path: string; adminOnly?: boolean }>

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
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #1a237e 0%, #283593 100%)',
      }}
    >
      <Toolbar
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          py: 3,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
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
              objectFit: 'contain',
            }}
          />
        ) : (
          <Typography
            variant="h5"
            component="div"
            sx={{
              color: '#1a237e',
              fontWeight: 700,
              textAlign: 'center',
              px: 2,
              letterSpacing: '0.5px',
            }}
          >
            {companyName}
          </Typography>
        )}
      </Toolbar>

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)' }} />

      <List sx={{ px: 1.5, py: 2, flexGrow: 1, overflowY: 'auto' }}>
        {menuItems
          .filter((item) => !item.adminOnly || user?.role === 'admin')
          .map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path)
                if (isMobile) {
                  setMobileOpen(false)
                }
              }}
              sx={{
                borderRadius: 2,
                py: 1.2,
                px: 2,
                transition: 'all 0.2s ease-in-out',
                color: 'rgba(255, 255, 255, 0.7)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#fff',
                  transform: 'translateX(4px)',
                },
                '&.Mui-selected': {
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  color: '#fff',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 4,
                    height: '60%',
                    backgroundColor: '#fff',
                    borderRadius: '0 4px 4px 0',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: 'inherit',
                  minWidth: 40,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: '0.9rem',
                  fontWeight: location.pathname === item.path ? 600 : 400,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Box
        sx={{
          p: 2,
          borderTop: '1px solid rgba(255, 255, 255, 0.12)',
          background: 'rgba(0, 0, 0, 0.2)',
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: 'rgba(255, 255, 255, 0.5)',
            display: 'block',
            textAlign: 'center',
          }}
        >
          © 2026 {companyName}
        </Typography>
      </Box>
    </Box>
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
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              border: 'none',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              border: 'none',
              boxShadow: '4px 0 24px rgba(0, 0, 0, 0.12)',
            },
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