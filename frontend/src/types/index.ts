// Types for the public website

export interface Service {
  id: string;
  slug: string; // URL-friendly identifier for SEO
  name: string;
  category: string; // Primary category (backward compatibility)
  categories?: string[]; // NEW: All assigned categories
  price: number;
  duration: number;
  description: string;
  benefits?: string;
  images: string[];
  requirements: string[];
  isActive: boolean;
  sessions?: number;
  tag?: string;
  is_featured?: boolean; // NEW: Highlighted service for homepage
}

export interface Product {
  id: string;
  name: string;
  category: string; // Primary category (backward compatibility)
  categories?: string[]; // NEW: All assigned categories
  price: number;
  stock: number;
  ingredients: string[];
  compatibleServices: string[];
  images: string[];
  description?: string;
  benefits?: string; // NEW: Product benefits (HTML with rich formatting)
  paymentLink?: string;
}

export interface Client {
  id?: string;
  phone: string;
  name: string;
  email?: string;
  allergies?: string[];
  preferences?: string[];
}

export interface Booking {
  id?: string;
  clientId?: string;
  serviceId: string;
  dateTime: Date;
  duration: number;
  status?: 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  client?: Client;
  service?: Service;
}

export interface CartItem {
  type: 'service' | 'product';
  item: Service | Product;
  quantity: number;
  selectedDateTime?: Date;
}

export interface AvailabilitySlot {
  dateTime: Date | string;
  available: boolean;
  professionalId?: string;
  timeSlot?: string; // HH:MM format for safe display
}

export interface BookingFormData {
  clientId: string;
  serviceId: string;
  dateTime: Date;
  notes?: string;
}

export interface BookingForm {
  name: string;
  phone: string;
  email?: string;
  allergies?: string;
  preferences?: string;
  notes?: string;
}

export interface ImageInfo {
  id: string;
  originalName: string;
  filename: string;
  url: string;
  thumbnailUrl: string;
  size: number;
  mimetype: string;
  width?: number;
  height?: number;
  createdAt: Date;
}

export interface ImageUploadOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}