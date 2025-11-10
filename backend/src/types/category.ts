export interface Category {
  id: string;
  name: string;
  type: 'service' | 'product';
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCategoryRequest {
  name: string;
  type: 'service' | 'product';
  description?: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface CategoryFilters {
  type?: 'service' | 'product';
  isActive?: boolean;
  search?: string;
}
