import { apiService } from './apiService'
import { Conversation } from '@/types'

export interface ConversationAlert {
  id: string
  type: 'new_conversation' | 'escalation' | 'long_wait' | 'error'
  conversationId: string
  clientName?: string
  message: string
  timestamp: Date
  priority: 'low' | 'medium' | 'high' | 'urgent'
}

export interface MonitorStats {
  activeConversations: number
  pendingEscalations: number
  averageWaitTime: number
  systemHealth: 'healthy' | 'warning' | 'critical'
}

class ConversationMonitorService {
  private eventSource: EventSource | null = null
  private alertCallbacks: Array<(alert: ConversationAlert) => void> = []
  private statsCallbacks: Array<(stats: MonitorStats) => void> = []
  private isConnected = false

  /**
   * Inicializar conexión SSE para actualizaciones en tiempo real
   */
  connect(): void {
    if (this.isConnected) return

    const token = localStorage.getItem('token')
    if (!token) {
      console.error('No token available for SSE connection')
      return
    }

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    this.eventSource = new EventSource(`${API_URL}/api/v1/conversations/stream?token=${token}`)

    this.eventSource.onopen = () => {
      console.log('Conversation monitor SSE connected')
      this.isConnected = true
    }

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        this.handleSSEMessage(data)
      } catch (error) {
        console.error('Error parsing SSE message:', error)
      }
    }

    this.eventSource.onerror = (error) => {
      console.error('SSE connection error:', error)
      this.isConnected = false
      
      // Reconectar después de 5 segundos
      setTimeout(() => {
        if (!this.isConnected) {
          this.connect()
        }
      }, 5000)
    }
  }

  /**
   * Desconectar SSE
   */
  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
      this.isConnected = false
    }
  }

  /**
   * Manejar mensajes SSE
   */
  private handleSSEMessage(data: any): void {
    switch (data.type) {
      case 'alert':
        this.notifyAlert(data.payload)
        break
      case 'stats':
        this.notifyStats(data.payload)
        break
      case 'conversation_update':
        // Manejar actualizaciones de conversación
        break
    }
  }

  /**
   * Suscribirse a alertas
   */
  onAlert(callback: (alert: ConversationAlert) => void): () => void {
    this.alertCallbacks.push(callback)
    
    return () => {
      const index = this.alertCallbacks.indexOf(callback)
      if (index > -1) {
        this.alertCallbacks.splice(index, 1)
      }
    }
  }

  /**
   * Suscribirse a estadísticas
   */
  onStats(callback: (stats: MonitorStats) => void): () => void {
    this.statsCallbacks.push(callback)
    
    return () => {
      const index = this.statsCallbacks.indexOf(callback)
      if (index > -1) {
        this.statsCallbacks.splice(index, 1)
      }
    }
  }

  /**
   * Notificar alerta a suscriptores
   */
  private notifyAlert(alert: ConversationAlert): void {
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert)
      } catch (error) {
        console.error('Error in alert callback:', error)
      }
    })
  }

  /**
   * Notificar estadísticas a suscriptores
   */
  private notifyStats(stats: MonitorStats): void {
    this.statsCallbacks.forEach(callback => {
      try {
        callback(stats)
      } catch (error) {
        console.error('Error in stats callback:', error)
      }
    })
  }

  /**
   * Obtener conversaciones activas
   */
  async getActiveConversations(limit = 20): Promise<Conversation[]> {
    return apiService.get<Conversation[]>(`/v1/conversations/active?limit=${limit}`)
  }

  /**
   * Obtener métricas del monitor
   */
  async getMetrics(dateFrom?: Date, dateTo?: Date): Promise<any> {
    const params = new URLSearchParams()
    if (dateFrom) params.append('dateFrom', dateFrom.toISOString())
    if (dateTo) params.append('dateTo', dateTo.toISOString())
    
    return apiService.get(`/v1/conversations/metrics?${params.toString()}`)
  }

  /**
   * Obtener analytics por canal
   */
  async getChannelAnalytics(dateFrom?: Date, dateTo?: Date): Promise<any> {
    const params = new URLSearchParams()
    if (dateFrom) params.append('dateFrom', dateFrom.toISOString())
    if (dateTo) params.append('dateTo', dateTo.toISOString())
    
    return apiService.get(`/v1/conversations/analytics/channels?${params.toString()}`)
  }

  /**
   * Obtener estadísticas de tiempo de respuesta
   */
  async getResponseTimeStats(dateFrom?: Date, dateTo?: Date, channel?: string): Promise<any> {
    const params = new URLSearchParams()
    if (dateFrom) params.append('dateFrom', dateFrom.toISOString())
    if (dateTo) params.append('dateTo', dateTo.toISOString())
    if (channel) params.append('channel', channel)
    
    return apiService.get(`/v1/conversations/analytics/response-time?${params.toString()}`)
  }

  /**
   * Tomar control de una conversación
   */
  async takeoverConversation(conversationId: string): Promise<void> {
    return apiService.post(`/v1/takeover/${conversationId}/start`)
  }

  /**
   * Enviar mensaje en conversación controlada
   */
  async sendMessage(conversationId: string, content: string): Promise<void> {
    return apiService.post(`/v1/takeover/${conversationId}/message`, { content })
  }

  /**
   * Finalizar control de conversación
   */
  async endTakeover(conversationId: string, resolution?: string): Promise<void> {
    return apiService.post(`/v1/takeover/${conversationId}/end`, { resolution })
  }

  /**
   * Escalar conversación
   */
  async escalateConversation(
    conversationId: string, 
    reason: string, 
    priority: string = 'medium'
  ): Promise<void> {
    return apiService.post(`/v1/escalations/conversation/${conversationId}`, {
      reason,
      priority,
      summary: `Escalación manual desde monitor`
    })
  }

  /**
   * Cerrar conversación
   */
  async closeConversation(conversationId: string, reason?: string): Promise<void> {
    return apiService.post(`/v1/conversations/${conversationId}/close`, { reason })
  }

  /**
   * Reabrir conversación
   */
  async reopenConversation(conversationId: string): Promise<void> {
    return apiService.post(`/v1/conversations/${conversationId}/reopen`)
  }

  /**
   * Exportar conversaciones
   */
  async exportConversations(filters: {
    dateFrom?: Date
    dateTo?: Date
    status?: string
    channel?: string
  }): Promise<Blob> {
    const params = new URLSearchParams()
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom.toISOString())
    if (filters.dateTo) params.append('dateTo', filters.dateTo.toISOString())
    if (filters.status) params.append('status', filters.status)
    if (filters.channel) params.append('channel', filters.channel)

    const response = await fetch(`/api/v1/conversations/export?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })

    if (!response.ok) {
      throw new Error('Error exporting conversations')
    }

    return response.blob()
  }

  /**
   * Estado de conexión
   */
  get connected(): boolean {
    return this.isConnected
  }
}

export const conversationMonitorService = new ConversationMonitorService()