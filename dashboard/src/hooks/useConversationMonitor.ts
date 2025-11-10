import { useState, useEffect, useCallback } from 'react'
import { conversationMonitorService, ConversationAlert, MonitorStats } from '@/services/conversationMonitorService'
import { Conversation } from '@/types'

export interface UseConversationMonitorOptions {
  autoConnect?: boolean
  refreshInterval?: number
}

export interface ConversationMonitorState {
  activeConversations: Conversation[]
  alerts: ConversationAlert[]
  stats: MonitorStats | null
  loading: boolean
  connected: boolean
  error: string | null
}

export function useConversationMonitor(options: UseConversationMonitorOptions = {}) {
  const { autoConnect = true, refreshInterval = 30000 } = options

  const [state, setState] = useState<ConversationMonitorState>({
    activeConversations: [],
    alerts: [],
    stats: null,
    loading: true,
    connected: false,
    error: null
  })

  // Manejar nuevas alertas
  const handleAlert = useCallback((alert: ConversationAlert) => {
    setState(prev => ({
      ...prev,
      alerts: [alert, ...prev.alerts.slice(0, 49)] // Mantener solo las últimas 50 alertas
    }))
  }, [])

  // Manejar actualizaciones de estadísticas
  const handleStats = useCallback((stats: MonitorStats) => {
    setState(prev => ({
      ...prev,
      stats,
      connected: conversationMonitorService.connected
    }))
  }, [])

  // Cargar datos iniciales
  const loadData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const [conversations, metrics] = await Promise.all([
        conversationMonitorService.getActiveConversations(20),
        conversationMonitorService.getMetrics()
      ])

      setState(prev => ({
        ...prev,
        activeConversations: conversations,
        stats: {
          activeConversations: metrics.activeSessionsCount || 0,
          pendingEscalations: metrics.escalatedConversations || 0,
          averageWaitTime: metrics.averageResponseTime || 0,
          systemHealth: metrics.escalationRate > 20 ? 'critical' : 
                       metrics.escalationRate > 10 ? 'warning' : 'healthy'
        },
        loading: false,
        connected: conversationMonitorService.connected
      }))
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Error loading conversation data'
      }))
    }
  }, [])

  // Conectar al servicio de monitor
  const connect = useCallback(() => {
    conversationMonitorService.connect()
    setState(prev => ({ ...prev, connected: conversationMonitorService.connected }))
  }, [])

  // Desconectar del servicio de monitor
  const disconnect = useCallback(() => {
    conversationMonitorService.disconnect()
    setState(prev => ({ ...prev, connected: false }))
  }, [])

  // Limpiar alertas
  const clearAlerts = useCallback(() => {
    setState(prev => ({ ...prev, alerts: [] }))
  }, [])

  // Remover alerta específica
  const removeAlert = useCallback((alertId: string) => {
    setState(prev => ({
      ...prev,
      alerts: prev.alerts.filter(alert => alert.id !== alertId)
    }))
  }, [])

  // Tomar control de conversación
  const takeoverConversation = useCallback(async (conversationId: string) => {
    try {
      await conversationMonitorService.takeoverConversation(conversationId)
      await loadData() // Recargar datos
    } catch (error: any) {
      throw new Error(error.message || 'Error taking over conversation')
    }
  }, [loadData])

  // Escalar conversación
  const escalateConversation = useCallback(async (
    conversationId: string, 
    reason: string, 
    priority: string = 'medium'
  ) => {
    try {
      await conversationMonitorService.escalateConversation(conversationId, reason, priority)
      await loadData() // Recargar datos
    } catch (error: any) {
      throw new Error(error.message || 'Error escalating conversation')
    }
  }, [loadData])

  // Cerrar conversación
  const closeConversation = useCallback(async (conversationId: string, reason?: string) => {
    try {
      await conversationMonitorService.closeConversation(conversationId, reason)
      await loadData() // Recargar datos
    } catch (error: any) {
      throw new Error(error.message || 'Error closing conversation')
    }
  }, [loadData])

  // Efectos
  useEffect(() => {
    // Suscribirse a alertas y estadísticas
    const unsubscribeAlert = conversationMonitorService.onAlert(handleAlert)
    const unsubscribeStats = conversationMonitorService.onStats(handleStats)

    return () => {
      unsubscribeAlert()
      unsubscribeStats()
    }
  }, [handleAlert, handleStats])

  useEffect(() => {
    // Conectar automáticamente si está habilitado
    if (autoConnect) {
      connect()
    }

    // Cargar datos iniciales
    loadData()

    return () => {
      if (autoConnect) {
        disconnect()
      }
    }
  }, [autoConnect, connect, disconnect, loadData])

  useEffect(() => {
    // Configurar intervalo de actualización
    if (refreshInterval > 0) {
      const interval = setInterval(loadData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [refreshInterval, loadData])

  return {
    // Estado
    ...state,
    
    // Acciones
    connect,
    disconnect,
    loadData,
    clearAlerts,
    removeAlert,
    takeoverConversation,
    escalateConversation,
    closeConversation,
    
    // Servicios
    monitorService: conversationMonitorService
  }
}