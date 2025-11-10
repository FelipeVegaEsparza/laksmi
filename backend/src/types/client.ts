export interface Client {
  id: string;
  phone: string;
  name: string;
  email?: string;
  allergies: string[];
  preferences: string[];
  loyaltyPoints: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateClientRequest {
  phone: string;
  name: string;
  email?: string;
  allergies?: string[];
  preferences?: string[];
}

export interface UpdateClientRequest {
  name?: string;
  email?: string;
  allergies?: string[];
  preferences?: string[];
}

export interface ClientFilters {
  search?: string; // Buscar por nombre, teléfono o email
  hasEmail?: boolean;
  minLoyaltyPoints?: number;
  page?: number;
  limit?: number;
}

export interface ClientResponse {
  id: string;
  phone: string;
  name: string;
  email?: string;
  allergies: string[];
  preferences: string[];
  loyaltyPoints: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedClientsResponse {
  clients: ClientResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}