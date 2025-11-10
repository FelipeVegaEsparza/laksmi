import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { AuthState, User, LoginCredentials } from '@/types'
import { authService } from '@/services/authService'

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'REFRESH_TOKEN'; payload: { user: User; token: string } }

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isLoading: true,
}

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
      }
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      }
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      }
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      }
    case 'REFRESH_TOKEN':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      }
    default:
      return state
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const user = await authService.verifyToken(token)
          dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } })
        } catch (error) {
          localStorage.removeItem('token')
          dispatch({ type: 'LOGIN_FAILURE' })
        }
      } else {
        dispatch({ type: 'LOGIN_FAILURE' })
      }
    }

    initAuth()
  }, [])

  const login = async (credentials: LoginCredentials) => {
    dispatch({ type: 'LOGIN_START' })
    try {
      const response = await authService.login(credentials)
      const token = response.accessToken || response.token
      if (!token) {
        throw new Error('No token received from server')
      }
      localStorage.setItem('token', token)
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user: response.user, token } })
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE' })
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    dispatch({ type: 'LOGOUT' })
  }

  const refreshToken = async () => {
    try {
      const { user, token } = await authService.refreshToken()
      if (!token) {
        throw new Error('No token received from refresh')
      }
      localStorage.setItem('token', token)
      dispatch({ type: 'REFRESH_TOKEN', payload: { user, token } })
    } catch (error) {
      logout()
      throw error
    }
  }

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    refreshToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}