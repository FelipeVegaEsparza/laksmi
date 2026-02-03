// Auth types
export interface User {
  id: string
  username: string
  email: string
  role: 'admin' | 'manager' | 'staff'
  isActive: boolean
  lastLogin?: Date
  createdAt: Date
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface LoginCredentials {
  username: string
  password: string
}

// Client types
export interface Client {
  id: string
  phone: string
  name: string
  email?: string
  allergies: string[]
  preferences: string[]
  loyaltyPoints: number
  createdAt: Date
  updatedAt: Date
}

// Service types
export interface Service {
  id: string
  name: string
  category: string // Categoría primaria (backward compatibility)
  categories: string[] // Todas las categorías asignadas
  price: number
  duration: number
  description: string
  benefits?: string
  images: string[]
  requirements: string[]
  isActive: boolean
  sessions?: number
  tag?: string
  is_featured?: boolean // Servicio destacado en homepage
  createdAt: Date
}

// Product types
export interface Product {
  id: string
  name: string
  category: string // Categoría primaria (backward compatibility)
  categories: string[] // Todas las categorías asignadas
  price: number
  stock: number
  minStock: number
  description?: string
  benefits?: string // Beneficios del producto (HTML con formato enriquecido)
  images: string[]
  ingredients: string[]
  compatibleServices: string[]
  paymentLink?: string
  isActive: boolean // Estado de activación del producto
  createdAt: Date
}

// Product Order types
export interface ProductOrder {
  id: string
  productId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  customerAddress: string
  quantity: number
  unitPrice: number
  totalPrice: number
  paymentStatus: 'pending' | 'paid'
  paymentLink?: string
  createdAt: Date
  updatedAt: Date
  productName?: string
  productImage?: string
}

export interface ProductOrderStats {
  totalOrders: number
  pendingOrders: number
  paidOrders: number
  totalRevenue: number
  pendingRevenue: number
}

// Booking types
export interface Booking {
  id: string
  clientId: string
  serviceId: string
  professionalId?: string
  box?: 'box1' | 'box2'
  dateTime: Date
  duration: number
  status: 'pending_payment' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
  notes?: string
  paymentAmount: number
  paymentMethod?: string
  paymentNotes?: string
  paidAt?: Date
  createdAt: Date
  client?: Client
  service?: Service
  professional?: Professional
}

// Professional types
export interface Professional {
  id: string
  name: string
  specialties: string[]
  schedule: any
  isActive: boolean
  createdAt: Date
}

// Conversation types
export interface Conversation {
  id: string
  clientId: string
  channel: 'web' | 'whatsapp'
  status: 'active' | 'closed' | 'escalated'
  context: any
  lastActivity: Date
  createdAt: Date
  client?: Client
  messages?: Message[]
  humanTakeoverActive?: boolean
  humanTakeoverAgentId?: string | null
  lastMessagePreview?: string
}

export interface Message {
  id: string
  conversationId: string
  senderType: 'client' | 'ai' | 'human'
  content: string
  mediaUrl?: string
  metadata?: any
  timestamp: Date
}

// Notification types
export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: Date
  read: boolean
}

// Dashboard metrics
export interface DashboardMetrics {
  totalClients: number
  todayBookings: number
  activeConversations: number
  monthlyRevenue: number
  conversionRate: number
  averageResponseTime: number
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Backend specific response for products
export interface ProductsPaginatedResponse {
  products: Product[]
  total: number
  page: number
  totalPages: number
}

// Form types
export interface ServiceFormData {
  name: string
  category: string // Categoría primaria
  categories?: string[] // Todas las categorías (opcional para backward compatibility)
  price: number
  duration: number
  description: string
  benefits?: string
  images: string[]
  requirements: string[]
  isActive: boolean
  sessions?: number
  tag?: string
}

export interface ProductFormData {
  name: string
  category: string // Categoría primaria
  categories?: string[] // Todas las categorías (opcional para backward compatibility)
  price: number
  stock: number
  minStock: number
  description?: string
  benefits?: string // Beneficios del producto (HTML con formato enriquecido)
  images: string[]
  ingredients: string[]
  compatibleServices: string[]
  paymentLink?: string
  isActive?: boolean // Estado de activación del producto
}

export interface ClientFormData {
  name: string
  phone: string
  email?: string
  allergies: string[]
  preferences: string[]
}

export interface BookingFormData {
  clientId: string
  serviceId: string
  professionalId?: string
  box?: 'box1' | 'box2'
  dateTime: Date
  notes?: string
  status?: 'pending_payment' | 'confirmed'
  paymentAmount?: number
  paymentMethod?: string
  paymentNotes?: string
}

// Twilio configuration
export interface TwilioConfig {
  accountSid: string
  authToken: string
  phoneNumber: string
  webhookUrl: string
  isConfigured: boolean
}