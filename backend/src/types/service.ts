export interface Service {
  id: string;
  name: string;
  category: string; // Categoría primaria (backward compatibility)
  categories: string[]; // Todas las categorías asignadas
  price: number;
  duration: number; // en minutos
  description?: string;
  benefits?: string; // Beneficios del servicio
  images: string[];
  requirements: string[];
  isActive: boolean;
  sessions?: number; // Cantidad de sesiones recomendadas
  tag?: string; // Etiqueta (Popular, Nuevo, Oferta, etc.)
  is_featured?: boolean; // Servicio destacado en homepage
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateServiceRequest {
  name: string;
  category: string; // Categoría primaria
  categories?: string[]; // Categorías adicionales (opcional)
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
  category?: string; // Actualizar categoría primaria
  categories?: string[]; // Actualizar todas las categorías
  price?: number;
  duration?: number;
  description?: string;
  benefits?: string;
  images?: string[];
  requirements?: string[];
  isActive?: boolean;
  sessions?: number;
  tag?: string;
  is_featured?: boolean;
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