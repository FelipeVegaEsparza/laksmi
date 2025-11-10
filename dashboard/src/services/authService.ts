import axios from 'axios'
import { LoginCredentials, User, ApiResponse } from '@/types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

interface LoginResponse {
  user: User
  accessToken: string
  refreshToken: string
  token?: string // For backward compatibility
}

class AuthService {
  private baseURL = `${API_URL}/api/v1/auth`

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await axios.post<ApiResponse<LoginResponse>>(
      `${this.baseURL}/login`,
      credentials
    )
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Login failed')
    }
    
    return response.data.data
  }

  async verifyToken(token: string): Promise<User> {
    const response = await axios.get<ApiResponse<User>>(
      `${this.baseURL}/verify`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Token verification failed')
    }
    
    return response.data.data
  }

  async refreshToken(): Promise<LoginResponse> {
    const token = localStorage.getItem('token')
    const response = await axios.post<ApiResponse<LoginResponse>>(
      `${this.baseURL}/refresh`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Token refresh failed')
    }
    
    return response.data.data
  }

  async logout(): Promise<void> {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        await axios.post(
          `${this.baseURL}/logout`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
      } catch (error) {
        // Ignore logout errors
        console.warn('Logout request failed:', error)
      }
    }
    localStorage.removeItem('token')
  }
}

export const authService = new AuthService()