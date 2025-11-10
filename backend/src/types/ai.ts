export interface Message {
  id: string;
  conversationId: string;
  senderType: 'client' | 'ai' | 'human';
  content: string;
  mediaUrl?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  clientId: string;
  channel: ConversationChannel;
  status: ConversationStatus;
  context: ConversationContext;
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationContext {
  currentIntent?: string;
  currentFlow?: string;
  flowStep?: number;
  pendingBooking?: PendingBooking;
  userPreferences?: UserPreferences;
  lastMessages: Message[];
  variables: Record<string, any>;
  escalationReason?: string;
  humanAgentId?: string;
  closureReason?: string;
}

export interface PendingBooking {
  serviceId?: string;
  serviceName?: string;
  preferredDate?: string;
  preferredTime?: string;
  preferredProfessionalId?: string;
  notes?: string;
  step: BookingStep;
}

export interface UserPreferences {
  preferredLanguage: string;
  preferredChannel: ConversationChannel;
  communicationStyle: 'formal' | 'casual';
  timezone: string;
}

export type ConversationChannel = 'web' | 'whatsapp';
export type ConversationStatus = 'active' | 'closed' | 'escalated' | 'waiting';
export type BookingStep = 'service_selection' | 'date_selection' | 'time_selection' | 'confirmation' | 'completed';

export interface Intent {
  name: string;
  confidence: number;
  entities: Entity[];
}

export interface Entity {
  type: EntityType;
  value: string;
  confidence: number;
  start?: number;
  end?: number;
}

export type EntityType = 
  | 'service_name'
  | 'date'
  | 'time'
  | 'professional_name'
  | 'client_name'
  | 'phone_number'
  | 'email'
  | 'price'
  | 'duration'
  | 'location';

export interface IntentClassificationResult {
  intent: Intent;
  entities: Entity[];
  confidence: number;
  needsHumanEscalation: boolean;
  suggestedResponse?: string;
}

export interface DialogFlow {
  name: string;
  steps: DialogStep[];
  isActive: boolean;
}

export interface DialogStep {
  id: string;
  name: string;
  prompt: string;
  expectedEntities: EntityType[];
  validationRules?: ValidationRule[];
  nextSteps: NextStepCondition[];
  fallbackStep?: string;
}

export interface ValidationRule {
  type: 'required' | 'format' | 'range' | 'custom';
  message: string;
  params?: Record<string, any>;
}

export interface NextStepCondition {
  condition: string;
  nextStep: string;
}

export interface AIResponse {
  message: string;
  intent?: string;
  entities?: Entity[];
  actions?: AIAction[];
  needsHumanEscalation?: boolean;
  conversationEnded?: boolean;
  metadata?: Record<string, any>;
}

export interface AIAction {
  type: AIActionType;
  params: Record<string, any>;
}

export type AIActionType = 
  | 'book_appointment'
  | 'check_availability'
  | 'get_services'
  | 'get_client_info'
  | 'send_notification'
  | 'escalate_to_human'
  | 'end_conversation';

export interface MessageRouterConfig {
  defaultChannel: ConversationChannel;
  maxMessageLength: number;
  supportedMediaTypes: string[];
  rateLimitPerMinute: number;
}

export interface ContextManagerConfig {
  sessionTimeoutMinutes: number;
  maxMessagesInContext: number;
  persistContextToDatabase: boolean;
  contextCleanupIntervalMinutes: number;
}

export interface NLUConfig {
  confidenceThreshold: number;
  fallbackIntent: string;
  supportedLanguages: string[];
  entityExtractionEnabled: boolean;
}

export interface DialogManagerConfig {
  defaultFlow: string;
  maxFlowSteps: number;
  escalationThreshold: number;
  enableFallbacks: boolean;
}

export interface AIAgentConfig {
  messageRouter: MessageRouterConfig;
  contextManager: ContextManagerConfig;
  nlu: NLUConfig;
  dialogManager: DialogManagerConfig;
}

export interface ProcessMessageRequest {
  content: string;
  clientId: string;
  channel: ConversationChannel;
  mediaUrl?: string;
  metadata?: Record<string, any>;
}

export interface ProcessMessageResponse {
  response: AIResponse;
  conversationId: string;
  messageId: string;
  processingTime: number;
}

export interface EscalationRequest {
  conversationId: string;
  reason: EscalationReason;
  priority: EscalationPriority;
  summary: string;
  clientContext: Record<string, any>;
}

export type EscalationReason = 
  | 'low_confidence'
  | 'failed_attempts'
  | 'complaint'
  | 'complex_request'
  | 'technical_issue'
  | 'payment_issue'
  | 'client_request';

export type EscalationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface AIMetrics {
  totalMessages: number;
  successfulResponses: number;
  escalatedConversations: number;
  averageResponseTime: number;
  intentAccuracy: number;
  conversationCompletionRate: number;
  topIntents: Array<{ intent: string; count: number }>;
  channelStats: Record<ConversationChannel, ChannelMetrics>;
}

export interface ChannelMetrics {
  totalMessages: number;
  activeConversations: number;
  averageSessionDuration: number;
  satisfactionScore: number;
}

export interface ConversationSummary {
  conversationId: string;
  clientId: string;
  channel: ConversationChannel;
  startTime: Date;
  endTime?: Date;
  messageCount: number;
  intents: string[];
  outcome: ConversationOutcome;
  escalated: boolean;
  satisfaction?: number;
}

export type ConversationOutcome = 
  | 'booking_completed'
  | 'information_provided'
  | 'issue_resolved'
  | 'escalated'
  | 'abandoned'
  | 'ongoing';

export interface KnowledgeBase {
  faqs: FAQ[];
  services: ServiceInfo[];
  policies: PolicyInfo[];
  procedures: ProcedureInfo[];
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[];
  isActive: boolean;
}

export interface ServiceInfo {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  requirements: string[];
  benefits: string[];
}

export interface PolicyInfo {
  id: string;
  title: string;
  content: string;
  category: string;
  lastUpdated: Date;
}

export interface ProcedureInfo {
  id: string;
  name: string;
  steps: string[];
  category: string;
  estimatedTime: number;
}