export enum ChatState {
  GREETING = 'greeting',
  SERVICE_CATEGORY = 'service_category',
  SERVICE_LIST = 'service_list',
  SERVICE_DETAIL = 'service_detail',
  FREE_QUERY = 'free_query',
  BOOKING = 'booking',
  ESCALATION = 'escalation'
}

export enum StateType {
  GREETING = 'greeting',
  SERVICE_CATEGORY = 'service_category',
  SERVICE_LIST = 'service_list',
  SERVICE_DETAIL = 'service_detail',
  FREE_QUERY = 'free_query',
  BOOKING = 'booking',
  ESCALATION = 'escalation'
}

export interface ChatContext {
  currentState: ChatState;
  previousState: ChatState | null;
  selectedCategory: string | null;
  selectedServiceId: string | null;
  selectedServiceName: string | null;
  selectedServiceSlug: string | null;
  selectedServicePrice: number | null;
  serviceOptions: ServiceOption[];
  lastBotMessage: string | null;
  lastUserMessage: string | null;
  awaitingOption: 'category' | 'service' | 'detail' | 'booking' | null;
  queryCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceOption {
  id: string;
  name: string;
  slug: string;
  price: number;
  category: string;
}

export interface CategoryOption {
  id: string;
  name: string;
  serviceCount: number;
}

export interface ProcessMessageRequest {
  content: string;
  clientId: string;
  channel: 'web' | 'whatsapp';
  mediaUrl?: string;
  metadata?: {
    phone?: string;
    serviceId?: string;
    serviceName?: string;
    serviceSlug?: string;
    email?: string;
    twilioSid?: string;
    twilioFrom?: string;
    twilioTo?: string;
  };
}

export interface ProcessMessageResponse {
  response: {
    message: string;
    intent: string;
    entities: any[];
    needsHumanEscalation: boolean;
    metadata?: Record<string, any>;
  };
  conversationId: string;
  clientId: string;
  messageId: string;
  processingTime: number;
}

export interface Service {
  id: string;
  name: string;
  slug: string;
  price: number;
  duration: number;
  sessions: number;
  category: string;
  description: string;
  benefits: string;
}

export interface Category {
  id: string;
  name: string;
  serviceCount: number;
}

export interface StateResponse {
  message: string;
  nextState: ChatState;
  metadata?: Record<string, any>;
}

export interface StateContext {
  clientId: string;
  conversationId: string;
  channel: 'web' | 'whatsapp';
  chatContext: ChatContext;
  userMessage: string;
  services: Service[];
  categories: { name: string; count: number }[];
}

export type TransitionHandler = (
  message: string,
  context: StateContext
) => Promise<StateResponse | null>;
