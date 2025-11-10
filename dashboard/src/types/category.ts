export interface Category {
  id: string
  name: string
  type: 'service' | 'product'
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateCategoryData {
  name: string
  type: 'service' | 'product'
  description?: string
}

export interface UpdateCategoryData {
  name?: string
  description?: string
  isActive?: boolean
}

export interface CategoryUsage {
  services: number
  products: number
}
