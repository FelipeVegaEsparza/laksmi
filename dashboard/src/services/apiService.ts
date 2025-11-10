import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import { ApiResponse, PaginatedResponse } from '@/types'
import { API_CONFIG } from '@/config/api'

// Get initial API URL
const getInitialApiUrl = () => {
  return API_CONFIG.activeUrl || import.meta.env.VITE_API_URL || 'http://localhost:3000'
}

const API_URL = getInitialApiUrl()

class ApiService {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: `${API_URL}/api/v1`,
      timeout: 10000,
    })
    
    this.setupInterceptors()
  }
  
  // Method to update the base URL when a working URL is found
  async updateBaseUrl() {
    try {
      const workingUrl = await API_CONFIG.getApiUrl()
      this.client.defaults.baseURL = `${workingUrl}/api/v1`
      console.log(`📡 API base URL updated to: ${workingUrl}/api/v1`)
    } catch (error) {
      console.error('Failed to update API base URL:', error)
    }
  }
  
  private setupInterceptors() {

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token')
          window.location.href = '/login'
          return Promise.reject(error)
        }
        
        // Handle network errors
        if (error.code === 'ERR_NAME_NOT_RESOLVED' || 
            error.code === 'ERR_NETWORK' || 
            error.code === 'ECONNREFUSED' ||
            error.message?.includes('Network Error')) {
          
          console.warn('🔄 Network error detected, attempting to reconnect...', error.code)
          
          try {
            // Try to find a working URL
            await this.updateBaseUrl()
            
            // Retry the original request with the new base URL
            const originalRequest = error.config
            if (originalRequest && !originalRequest._retry) {
              originalRequest._retry = true
              return this.client.request(originalRequest)
            }
          } catch (reconnectError) {
            console.error('❌ Failed to reconnect to API:', reconnectError)
          }
        }
        
        return Promise.reject(error)
      }
    )
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<ApiResponse<T>>(url, config)
    if (!response.data.success) {
      throw new Error(response.data.error || 'Request failed')
    }
    return response.data.data
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.post<ApiResponse<T>>(url, data, config)
      if (!response.data.success) {
        throw new Error(response.data.error || 'Request failed')
      }
      return response.data.data
    } catch (error: any) {
      // Si el error es de parsing JSON, intentar obtener el texto de la respuesta
      if (error.message?.includes('JSON')) {
        console.error('Error parsing JSON response:', error)
        throw new Error('El servidor devolvió una respuesta inválida')
      }
      throw error
    }
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config)
    if (!response.data.success) {
      throw new Error(response.data.error || 'Request failed')
    }
    return response.data.data
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<ApiResponse<T>>(url, config)
    if (!response.data.success) {
      throw new Error(response.data.error || 'Request failed')
    }
    return response.data.data
  }

  async getPaginated<T>(
    url: string,
    params?: Record<string, any>
  ): Promise<PaginatedResponse<T>> {
    const response = await this.client.get<ApiResponse<PaginatedResponse<T>>>(url, {
      params,
    })
    if (!response.data.success) {
      throw new Error(response.data.error || 'Request failed')
    }
    return response.data.data
  }

  // Specific method for products API that returns different structure
  async getProducts(params?: Record<string, any>): Promise<{ products: any[]; total: number; page: number; totalPages: number }> {
    const response = await this.client.get<ApiResponse<any>>('/products', {
      params,
    })
    if (!response.data.success) {
      throw new Error(response.data.error || 'Request failed')
    }
    return response.data.data
  }

  // Specific method for clients API
  async getClients(params?: Record<string, any>): Promise<{ clients: any[]; pagination: any }> {
    const response = await this.client.get<ApiResponse<any>>('/clients', {
      params,
    })
    if (!response.data.success) {
      throw new Error(response.data.error || 'Request failed')
    }
    return response.data.data
  }

  // Specific method for services API
  async getServices(params?: Record<string, any>): Promise<{ services: any[]; pagination: any }> {
    const response = await this.client.get<ApiResponse<any>>('/services/public', {
      params,
    })
    if (!response.data.success) {
      throw new Error(response.data.error || 'Request failed')
    }
    return response.data.data
  }

  // Specific method for bookings API
  async getBookings(params?: Record<string, any>): Promise<{ bookings: any[]; total: number; page: number; totalPages: number }> {
    const response = await this.client.get<ApiResponse<any>>('/bookings', {
      params,
    })
    if (!response.data.success) {
      throw new Error(response.data.error || 'Request failed')
    }
    return response.data.data
  }

  // Update booking
  async updateBooking(id: string, data: any): Promise<any> {
    return this.put(`/bookings/${id}`, data)
  }

  // Delete booking
  async deleteBooking(id: string): Promise<any> {
    return this.delete(`/bookings/${id}`)
  }
}

export const apiService = new ApiService()