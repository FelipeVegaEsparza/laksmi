import axios from 'axios';
import { Service, Product, Booking, BookingFormData, AvailabilitySlot } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Services API
export const servicesApi = {
  getAll: async (): Promise<Service[]> => {
    const response = await api.get('/services/public');
    return response.data.data?.services || response.data.data || response.data;
  },

  getById: async (id: string): Promise<Service> => {
    const response = await api.get(`/services/public/${id}`);
    return response.data.data || response.data;
  },

  getByCategory: async (category: string): Promise<Service[]> => {
    const response = await api.get(`/services/public/category/${category}`);
    return response.data.data || response.data;
  },

  getCategories: async (): Promise<Array<{ id: string; name: string }>> => {
    const response = await api.get('/categories/public?type=service&isActive=true');
    const categories = response.data.data || response.data;
    return categories.map((cat: { name: string }) => ({ id: cat.name, name: cat.name }));
  },

  getPopular: async (): Promise<Service[]> => {
    const response = await api.get('/services/popular');
    return response.data.data || response.data;
  },

  search: async (query: string): Promise<Service[]> => {
    const response = await api.get(`/services/search?q=${encodeURIComponent(query)}`);
    return response.data.data || response.data;
  },
};

// Products API
export const productsApi = {
  getAll: async (): Promise<Product[]> => {
    const response = await api.get('/products/public');
    return response.data.data?.products || response.data.data || response.data;
  },

  getById: async (id: string): Promise<Product> => {
    const response = await api.get(`/products/public/${id}`);
    return response.data.data || response.data;
  },

  getByCategory: async (category: string): Promise<Product[]> => {
    const response = await api.get(`/products/public/category/${category}`);
    return response.data.data || response.data;
  },

  getCategories: async (): Promise<Array<{ id: string; name: string }>> => {
    const response = await api.get('/categories/public?type=product&isActive=true');
    const categories = response.data.data || response.data;
    return categories.map((cat: { name: string }) => ({ id: cat.name, name: cat.name }));
  },
};

// Clients API
export const clientsApi = {
  findOrCreate: async (clientData: {
    name: string;
    phone: string;
    email?: string;
    allergies?: string[];
    preferences?: string[];
  }) => {
    const response = await api.post('/clients/public/find-or-create', clientData);
    return response.data.data || response.data;
  },
};

// Bookings API
export const bookingsApi = {
  getAvailability: async (serviceId: string, date: string): Promise<AvailabilitySlot[]> => {
    try {
      // Crear dateFrom y dateTo para el día seleccionado
      const dateFrom = `${date}T00:00:00`;
      const dateTo = `${date}T23:59:59`;
      
      console.log('Making availability request:', { serviceId, dateFrom, dateTo });
      
      const response = await api.get(`/bookings/availability?serviceId=${serviceId}&dateFrom=${dateFrom}&dateTo=${dateTo}`);
      
      console.log('Availability response:', response.data);
      
      const availability = response.data.data || response.data;
      
      // Si la respuesta tiene slots, devolverlos directamente
      if (availability && availability.slots) {
        return availability.slots;
      }
      
      // Si no hay slots, devolver array vacío
      return [];
    } catch (error) {
      console.error('Error in getAvailability:', error);
      throw error;
    }
  },

  create: async (bookingData: BookingFormData): Promise<Booking> => {
    const response = await api.post('/bookings/public', bookingData);
    return response.data;
  },

  getById: async (id: string): Promise<Booking> => {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  },
};

// Chat API (for web widget)
export const chatApi = {
  sendMessage: async (message: string, clientId?: string): Promise<{ response: string; conversationId: string }> => {
    const payload = {
      content: message,
      clientId: clientId || '',
      channel: 'web'
    };
    console.log('Sending chat message:', payload);
    const response = await api.post('/ai/message', payload);
    console.log('Chat response:', response.data);
    return response.data.data || response.data;
  },

  getConversation: async (clientId: string): Promise<{ messages: Array<{ content: string; sender: string; timestamp: Date }> }> => {
    const response = await api.get(`/ai/conversations/${clientId}`);
    return response.data.data || response.data;
  },
};

export default api;