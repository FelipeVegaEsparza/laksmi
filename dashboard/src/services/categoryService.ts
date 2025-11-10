import axios from 'axios'
import { Category, CreateCategoryData, UpdateCategoryData, CategoryUsage } from '../types/category'
import { ApiResponse } from '../types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

class CategoryService {
  private baseURL = `${API_URL}/api/v1/categories`

  private getAuthHeader() {
    const token = localStorage.getItem('token')
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  }

  async getCategories(type?: 'service' | 'product', isActive?: boolean): Promise<Category[]> {
    const params = new URLSearchParams()
    if (type) params.append('type', type)
    if (isActive !== undefined) params.append('isActive', String(isActive))

    const response = await axios.get<ApiResponse<Category[]>>(
      `${this.baseURL}?${params.toString()}`,
      this.getAuthHeader()
    )

    if (!response.data.success) {
      throw new Error(response.data.error || 'Error al obtener categorías')
    }

    return response.data.data
  }

  async getCategoryById(id: string): Promise<Category> {
    const response = await axios.get<ApiResponse<Category>>(
      `${this.baseURL}/${id}`,
      this.getAuthHeader()
    )

    if (!response.data.success) {
      throw new Error(response.data.error || 'Error al obtener categoría')
    }

    return response.data.data
  }

  async createCategory(data: CreateCategoryData): Promise<Category> {
    const response = await axios.post<ApiResponse<Category>>(
      this.baseURL,
      data,
      this.getAuthHeader()
    )

    if (!response.data.success) {
      throw new Error(response.data.error || 'Error al crear categoría')
    }

    return response.data.data
  }

  async updateCategory(id: string, data: UpdateCategoryData): Promise<Category> {
    const response = await axios.put<ApiResponse<Category>>(
      `${this.baseURL}/${id}`,
      data,
      this.getAuthHeader()
    )

    if (!response.data.success) {
      throw new Error(response.data.error || 'Error al actualizar categoría')
    }

    return response.data.data
  }

  async deleteCategory(id: string): Promise<void> {
    const response = await axios.delete<ApiResponse<void>>(
      `${this.baseURL}/${id}`,
      this.getAuthHeader()
    )

    if (!response.data.success) {
      throw new Error(response.data.error || 'Error al eliminar categoría')
    }
  }

  async getCategoryUsage(id: string): Promise<CategoryUsage> {
    const response = await axios.get<ApiResponse<CategoryUsage>>(
      `${this.baseURL}/${id}/usage`,
      this.getAuthHeader()
    )

    if (!response.data.success) {
      throw new Error(response.data.error || 'Error al obtener uso de categoría')
    }

    return response.data.data
  }
}

export const categoryService = new CategoryService()
