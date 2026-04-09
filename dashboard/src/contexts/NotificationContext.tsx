import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { Notification } from '@/types'
import { useAuth } from './AuthContext'

interface ConversationStateCache {
  status: 'active' | 'escalated' | 'resolved' | 'closed' | 'waiting'
  humanTakeoverActive: boolean
  agentId?: string
  lastUpdate: Date
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearNotification: (id: string) => void
  showNotification: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void
  getConversationState: (conversationId: string) => ConversationStateCache | undefined
  subscribeToConversationUpdates: (callback: (conversationId: string) => void) => () => void
  audioEnabled: boolean
  toggleAudio: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

type NotificationAction =
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'MARK_AS_READ'; payload: string }
  | { type: 'MARK_ALL_AS_READ' }
  | { type: 'CLEAR_NOTIFICATION'; payload: string }
  | { type: 'SET_NOTIFICATIONS'; payload: Notification[] }
  | { type: 'UPDATE_CONVERSATION_STATE'; payload: { conversationId: string; state: ConversationStateCache } }

interface NotificationState {
  notifications: Notification[]
  conversationStateCache: Map<string, ConversationStateCache>
}

const initialState: NotificationState = {
  notifications: [],
  conversationStateCache: new Map(),
}

function notificationReducer(state: NotificationState, action: NotificationAction): NotificationState {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
      }
    case 'MARK_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload
            ? { ...notification, read: true }
            : notification
        ),
      }
    case 'MARK_ALL_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification => ({
          ...notification,
          read: true,
        })),
      }
    case 'CLEAR_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(notification => notification.id !== action.payload),
      }
    case 'SET_NOTIFICATIONS':
      return {
        ...state,
        notifications: action.payload,
      }
    case 'UPDATE_CONVERSATION_STATE':
      const newCache = new Map(state.conversationStateCache)
      newCache.set(action.payload.conversationId, action.payload.state)
      return {
        ...state,
        conversationStateCache: newCache,
      }
    default:
      return state
  }
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(notificationReducer, initialState)
  const { isAuthenticated, token } = useAuth()
  const [, setSocket] = React.useState<Socket | null>(null)
  const conversationUpdateCallbacksRef = useRef<Set<(conversationId: string) => void>>(new Set())
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const playedEscalationsRef = useRef<Set<string>>(new Set())
  const [audioEnabled, setAudioEnabled] = React.useState(() => {
    // Load audio preference from localStorage
    const saved = localStorage.getItem('audioNotificationsEnabled')
    return saved === 'true'
  })

  // Initialize audio element
  useEffect(() => {
    const initAudio = async () => {
      try {
        audioRef.current = new Audio('/notification.mp3')
        audioRef.current.volume = 0.5
        
        // Preload the audio
        audioRef.current.load()
        
        console.log('🔊 Audio initialized successfully')
      } catch (error) {
        console.error('❌ Error initializing audio:', error)
      }
    }
    
    initAudio()
  }, [])

  // Toggle audio and save preference
  const toggleAudio = useCallback(() => {
    setAudioEnabled(prev => {
      const newValue = !prev
      localStorage.setItem('audioNotificationsEnabled', String(newValue))
      
      // Play a test sound when enabling
      if (newValue && audioRef.current) {
        console.log('🔊 Playing test sound...')
        
        // Reset audio to beginning
        audioRef.current.currentTime = 0
        
        const playPromise = audioRef.current.play()
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('✅ Test sound played successfully')
            })
            .catch(error => {
              console.error('❌ Audio playback blocked by browser:', error)
              alert('⚠️ El navegador bloqueó la reproducción de audio. Por favor, interactúa con la página (haz clic en cualquier lugar) y vuelve a activar las notificaciones de audio.')
            })
        }
      }
      
      return newValue
    })
  }, [])

  useEffect(() => {
    if (isAuthenticated && token) {
      const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
        auth: {
          token,
        },
      })

      newSocket.on('notification', (notification: Notification) => {
        dispatch({ type: 'ADD_NOTIFICATION', payload: notification })
      })

      newSocket.on('conversation_escalated', (data: any) => {
        console.log('🚨 ESCALATION EVENT RECEIVED:', {
          data,
          timestamp: new Date().toISOString(),
          currentNotificationsCount: state.notifications.length
        })
        
        const notification: Notification = {
          id: Date.now().toString(),
          type: 'warning',
          title: 'Conversación Escalada',
          message: `La conversación con ${data.clientName} requiere atención humana`,
          timestamp: new Date(),
          read: false,
        }
        
        dispatch({ type: 'ADD_NOTIFICATION', payload: notification })
        
        console.log('✅ ESCALATION NOTIFICATION ADDED:', notification)
      })

      newSocket.on('low_stock_alert', (data: any) => {
        const notification: Notification = {
          id: Date.now().toString(),
          type: 'warning',
          title: 'Stock Bajo',
          message: `El producto "${data.productName}" tiene stock bajo (${data.currentStock} unidades)`,
          timestamp: new Date(),
          read: false,
        }
        dispatch({ type: 'ADD_NOTIFICATION', payload: notification })
      })

      // Handle conversation state updates
      newSocket.on('conversation_state_updated', (data: {
        conversationId: string
        status: 'active' | 'escalated' | 'resolved' | 'closed' | 'waiting'
        humanTakeoverActive: boolean
        timestamp: string
        agentId?: string
      }) => {
        console.log('🔄 CONVERSATION STATE UPDATE RECEIVED:', data)
        
        // Validate event payload
        if (!data.conversationId || !data.status || typeof data.humanTakeoverActive !== 'boolean') {
          console.error('Invalid conversation state update payload:', data)
          return
        }

        // Update conversation state cache
        const stateCache: ConversationStateCache = {
          status: data.status,
          humanTakeoverActive: data.humanTakeoverActive,
          agentId: data.agentId,
          lastUpdate: new Date(data.timestamp)
        }

        dispatch({
          type: 'UPDATE_CONVERSATION_STATE',
          payload: { conversationId: data.conversationId, state: stateCache }
        })

        // Play audio notification for new escalations
        // Only play when escalated AND human takeover is active (not when deactivating)
        if (data.status === 'escalated' && 
            data.humanTakeoverActive && 
            !playedEscalationsRef.current.has(data.conversationId)) {
          playedEscalationsRef.current.add(data.conversationId)
          
          console.log('🚨 New escalation detected, attempting to play audio...', {
            audioEnabled,
            hasAudioRef: !!audioRef.current,
            conversationId: data.conversationId
          })
          
          // Only play if audio is enabled
          if (audioEnabled && audioRef.current) {
            // Reset audio to beginning
            audioRef.current.currentTime = 0
            
            const playPromise = audioRef.current.play()
            
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  console.log('✅ Escalation audio played successfully')
                })
                .catch(error => {
                  console.error('❌ Audio playback blocked:', error)
                })
            }
          } else {
            console.log('⚠️ Audio not played:', { audioEnabled, hasAudioRef: !!audioRef.current })
          }
        }

        // Clear played escalation when conversation becomes active or human takeover ends
        if (data.status === 'active' || !data.humanTakeoverActive) {
          playedEscalationsRef.current.delete(data.conversationId)
        }

        // Notify all subscribed callbacks
        conversationUpdateCallbacksRef.current.forEach(callback => {
          callback(data.conversationId)
        })
      })

      setSocket(newSocket)

      return () => {
        newSocket.close()
      }
    }
  }, [isAuthenticated, token])

  const markAsRead = (id: string) => {
    dispatch({ type: 'MARK_AS_READ', payload: id })
  }

  const markAllAsRead = () => {
    dispatch({ type: 'MARK_ALL_AS_READ' })
  }

  const clearNotification = (id: string) => {
    dispatch({ type: 'CLEAR_NOTIFICATION', payload: id })
  }

  const showNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    const notification: Notification = {
      id: Date.now().toString(),
      type: type as 'info' | 'warning' | 'success' | 'error',
      title: type === 'error' ? 'Error' : type === 'warning' ? 'Advertencia' : type === 'success' ? 'Éxito' : 'Información',
      message,
      timestamp: new Date(),
      read: false,
    }
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification })
  }

  const getConversationState = useCallback((conversationId: string): ConversationStateCache | undefined => {
    return state.conversationStateCache.get(conversationId)
  }, [state.conversationStateCache])

  const subscribeToConversationUpdates = useCallback((callback: (conversationId: string) => void): (() => void) => {
    conversationUpdateCallbacksRef.current.add(callback)
    return () => {
      conversationUpdateCallbacksRef.current.delete(callback)
    }
  }, [])

  const unreadCount = state.notifications.filter(n => !n.read).length

  const value: NotificationContextType = {
    notifications: state.notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
    showNotification,
    getConversationState,
    subscribeToConversationUpdates,
    audioEnabled,
    toggleAudio,
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}