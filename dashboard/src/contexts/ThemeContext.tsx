import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createTheme, ThemeProvider as MuiThemeProvider, Theme } from '@mui/material/styles'
import { apiService } from '@/services/apiService'

interface ThemeContextType {
  theme: Theme
  refreshTheme: () => Promise<void>
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useAppTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useAppTheme must be used within ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(createDefaultTheme())

  useEffect(() => {
    loadTheme()
  }, [])

  const loadTheme = async () => {
    try {
      const settings = await apiService.get<any>('/company-settings')
      const newTheme = createTheme({
        palette: {
          primary: {
            main: settings.dashboardPrimaryColor || '#e91e63',
          },
          secondary: {
            main: settings.dashboardSecondaryColor || '#9c27b0',
          },
          background: {
            default: settings.dashboardBackgroundColor || '#fafafa',
            paper: '#ffffff',
          },
          text: {
            primary: settings.dashboardTextColor || '#333333',
            secondary: '#666666',
          },
        },
        typography: {
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
          h4: { fontWeight: 600 },
          h5: { fontWeight: 600 },
          h6: { fontWeight: 600 },
        },
        components: {
          MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundColor: '#ffffff',
                color: settings.dashboardTextColor || '#333333',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              },
            },
          },
          MuiDrawer: {
            styleOverrides: {
              paper: {
                backgroundColor: '#f8f9fa',
                borderRight: '1px solid #e0e0e0',
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                borderRadius: 8,
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                textTransform: 'none',
                fontWeight: 500,
              },
            },
          },
        },
      })
      setTheme(newTheme)
    } catch (error) {
      console.error('Error loading theme:', error)
    }
  }

  const refreshTheme = async () => {
    await loadTheme()
  }

  return (
    <ThemeContext.Provider value={{ theme, refreshTheme }}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  )
}

function createDefaultTheme(): Theme {
  return createTheme({
    palette: {
      primary: {
        main: '#e91e63',
      },
      secondary: {
        main: '#9c27b0',
      },
      background: {
        default: '#fafafa',
        paper: '#ffffff',
      },
      text: {
        primary: '#333333',
        secondary: '#666666',
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h4: { fontWeight: 600 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: '#ffffff',
            color: '#333333',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: '#f8f9fa',
            borderRight: '1px solid #e0e0e0',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            borderRadius: 8,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 500,
          },
        },
      },
    },
  })
}
