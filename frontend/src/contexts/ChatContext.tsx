'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ChatContextType {
  isConnected: boolean;
  clientId: string | null;
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  openChat: () => void;
  closeChat: () => void;
  serviceContext: { id: string; name: string } | null;
  setServiceContext: (service: { id: string; name: string } | null) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  // Don't throw error, just return undefined if not available
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider = ({ children }: ChatProviderProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [serviceContext, setServiceContext] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    // Initialize client ID only on client side
    let storedClientId = localStorage.getItem('chat_client_id');
    if (!storedClientId) {
      // Generate a valid UUID v4
      storedClientId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
      localStorage.setItem('chat_client_id', storedClientId);
    }
    setClientId(storedClientId);
    setIsConnected(true);
  }, []);

  const openChat = () => {
    // This will be handled by the ChatWidget component
    setUnreadCount(0);
  };

  const closeChat = () => {
    // This will be handled by the ChatWidget component
  };

  return (
    <ChatContext.Provider
      value={{
        isConnected,
        clientId,
        unreadCount,
        setUnreadCount,
        openChat,
        closeChat,
        serviceContext,
        setServiceContext,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export default ChatContext;