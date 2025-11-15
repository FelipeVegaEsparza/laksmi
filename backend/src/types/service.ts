export interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: number; // en minutos
  description?: string;
  benefits?: string; // Beneficios del servicio
  images: string[];
  requirements: string[];
  isActive: boolean;
  sessions?: number; // Cantidad de sesiones recomendadas
  tag?: string; // Etiqueta (Popular, Nuevo, Oferta, etc.)
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateServiceRequest {
  name: string;
  category: string;
  price: number;
  duration: number;
  description?: string;
  benefits?: string;
  images?: string[];
  requirements?: string[];
  isActive?: boolean;
  sessions?: number;
  tag?: string;
}

export interface UpdateServiceRequest {
  name?: string;
  category?: string;
  price?: number;
  duration?: number;
  description?: string;
  benefits?: string;
  images?: string[];
  requirements?: string[];
  isActive?: boolean;
  sessions?: number;
  tag?: string;
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