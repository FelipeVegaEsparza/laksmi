export interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: number; // en minutos
  description?: string;
  images: string[];
  requirements: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateServiceRequest {
  name: string;
  category: string;
  price: number;
  duration: number;
  description?: string;
  images?: string[];
  requirements?: string[];
  isActive?: boolean;
}

export interface UpdateServiceRequest {
  name?: string;
  category?: string;
  price?: number;
  duration?: number;
  description?: string;
  images?: string[];
  requirements?: string[];
  isActive?: boolean;
}

export interface ServiceFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minDuration?: number;
  maxDuration?: number;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ServiceCategory {
  name: string;
  description: string;
  serviceCount: number;
}

export interface ServiceStats {
  totalServices: number;
  activeServices: number;
  categoriesCount: number;
  averagePrice: number;
  averageDuration: number;
  popularCategories: ServiceCategory[];
}