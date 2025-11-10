import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { io, Socket } from 'socket.io-client'
import { Notification } from '@/types'
import { useAuth } from './AuthContext'

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearNotification: (id: string) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

type NotificationAction =
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'MARK_AS_READ'; payload: string }
  | { type: 'MARK_ALL_AS_READ' }
  | { type: 'CLEAR_NOTIFICATION'; payload: string }
  | { type: 'SET_NOTIFICATIONS'; payload: Notification[] }

interface NotificationState {
  notifications: Notification[]
}

const initialState: NotificationState = {
  notifications: [],
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
    default:
      return state
  }
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(notificationReducer, initialState)
  const { isAuthenticated, token } = useAuth()
  const [, setSocket] = React.useState<Socket | null>(null)

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
        const notification: Notification = {
          id: Date.now().toString(),
          type: 'warning',
          title: 'Conversación Escalada',
          message: `La conversación con ${data.clientName} requiere atención humana`,
          timestamp: new Date(),
          read: false,
        }
        dispatch({ type: 'ADD_NOTIFICATION', payload: notification })
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

  const unreadCount = state.notifications.filter(n => !n.read).length

  const value: NotificationContextType = {
    notifications: state.notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
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