'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Minimize2, ExternalLink } from 'lucide-react';
import { chatApi } from '@/services/api';
import { useChatContext } from '@/contexts/ChatContext';
import { themeColors } from '@/utils/colors';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const ChatWidget = () => {
  const chatContext = useChatContext();
  const clientId = chatContext?.clientId || null;
  const isConnected = chatContext?.isConnected || false;
  const serviceContext = chatContext?.serviceContext || null;
  
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [hasAutoSentMessage, setHasAutoSentMessage] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [lastMessageTimestamp, setLastMessageTimestamp] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const originalTitleRef = useRef<string>('');

  // Guardar el título original al montar
  useEffect(() => {
    if (typeof document !== 'undefined') {
      originalTitleRef.current = document.title;
    }
  }, []);

  // Actualizar título de la pestaña cuando hay mensajes no leídos
  useEffect(() => {
    if (typeof document === 'undefined') return;

    if (unreadCount > 0 && (!isOpen || isMinimized)) {
      document.title = `(${unreadCount}) ${originalTitleRef.current}`;
    } else {
      document.title = originalTitleRef.current;
    }

    return () => {
      document.title = originalTitleRef.current;
    };
  }, [unreadCount, isOpen, isMinimized]);

  // Resetear contador cuando se abre el chat
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setUnreadCount(0);
    }
  }, [isOpen, isMinimized]);

  // Función para convertir URLs en links clicables
  const linkifyText = (text: string): string => {
    // Regex para detectar URLs (http, https, www)
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;
    
    return text.replace(urlRegex, (url) => {
      // Si la URL no tiene protocolo, agregar https://
      const href = url.startsWith('http') ? url : `https://${url}`;
      
      return `<a href="${href}" target="_blank" rel="noopener noreferrer" style="color: ${themeColors.primary}; text-decoration: underline; font-weight: 500; cursor: pointer;">${url}</a>`;
    });
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Load conversation history if client ID exists and component is mounted
    if (clientId && isMounted && isConnected) {
      loadConversationHistory(clientId);
    }
  }, [clientId, isMounted, isConnected]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Reset auto-sent flag when service context changes
  useEffect(() => {
    if (serviceContext) {
      setHasAutoSentMessage(false);
    }
  }, [serviceContext]);

  // Polling para obtener mensajes nuevos cuando hay una conversación activa
  useEffect(() => {
    if (!conversationId) {
      // Limpiar polling si no hay conversación
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    // Función para obtener mensajes nuevos
    const pollMessages = async () => {
      try {
        const result = await chatApi.getMessages(conversationId, lastMessageTimestamp || undefined);
        
        if (result.messages && result.messages.length > 0) {
          // Convertir mensajes del backend al formato del frontend
          const newMessages: Message[] = result.messages.map(msg => ({
            id: msg.id,
            content: msg.content,
            sender: msg.senderType === 'client' ? 'user' : 'ai',
            timestamp: new Date(msg.timestamp)
          }));

          // Agregar solo mensajes que no existen ya
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id));
            const uniqueNewMessages = newMessages.filter(m => !existingIds.has(m.id));
            
            if (uniqueNewMessages.length > 0) {
              console.log('📨 New messages received from polling:', uniqueNewMessages.length);
              console.log('📊 Chat state - isOpen:', isOpen, 'isMinimized:', isMinimized);
              
              // Incrementar contador de no leídos si el chat está cerrado o minimizado
              // Solo contar mensajes del AI/agente, no los del usuario
              const aiMessages = uniqueNewMessages.filter(m => m.sender === 'ai');
              if ((!isOpen || isMinimized) && aiMessages.length > 0) {
                console.log('🔔 Incrementing unread count by:', aiMessages.length);
                setUnreadCount(prev => prev + aiMessages.length);
              }
              
              // Actualizar timestamp del último mensaje
              const latestMessage = uniqueNewMessages[uniqueNewMessages.length - 1];
              setLastMessageTimestamp(latestMessage.timestamp.toISOString());
              
              return [...prev, ...uniqueNewMessages];
            }
            
            return prev;
          });
        }
      } catch (error) {
        console.error('Error polling messages:', error);
      }
    };

    // Iniciar polling cada 3 segundos
    pollingIntervalRef.current = setInterval(pollMessages, 3000);

    // Limpiar al desmontar
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [conversationId, lastMessageTimestamp, isOpen, isMinimized]);

  const loadConversationHistory = async (clientId: string) => {
    try {
      // Por ahora, no cargar historial ya que requiere autenticación
      // En el futuro, esto se puede implementar con tokens de sesión
      setMessages([{
        id: '0',
        content: '¡Hola! Soy tu asistente virtual de la Clínica de Belleza. ¿En qué puedo ayudarte hoy? Puedo ayudarte con información sobre servicios, reservar citas o responder cualquier pregunta.',
        sender: 'ai',
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Error loading conversation history:', error);
      // Start with welcome message if no history
      setMessages([{
        id: '0',
        content: '¡Hola! Soy tu asistente virtual de la Clínica de Belleza. ¿En qué puedo ayudarte hoy? Puedo ayudarte con información sobre servicios, reservar citas o responder cualquier pregunta.',
        sender: 'ai',
        timestamp: new Date()
      }]);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !clientId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await chatApi.sendMessage(inputMessage, clientId);
      
      // Extraer el mensaje de la respuesta
      let messageContent = 'Lo siento, no pude procesar tu mensaje. ¿Podrías intentarlo de nuevo?';
      
      console.log('Chat response:', response);
      
      if (typeof response === 'string') {
        messageContent = response;
      } else if (response && typeof response === 'object') {
        // La API devuelve { response: { message: string, ... }, conversationId, messageId, processingTime }
        if ((response as any).response?.message) {
          messageContent = (response as any).response.message;
          console.log('✅ Extracted message:', messageContent);
          console.log('📋 Metadata:', (response as any).response?.metadata);
        } else if ((response as any).data?.response?.message) {
          messageContent = (response as any).data.response.message;
        } else if ((response as any).message) {
          messageContent = (response as any).message;
        }

        // Guardar conversationId para polling
        const convId = (response as any).data?.conversationId || (response as any).conversationId;
        if (convId) {
          setConversationId(convId);
          console.log('💬 Conversation ID set:', convId);
        }
      }
      
      console.log('📨 Final message to display:', messageContent);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: messageContent,
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Actualizar timestamp del último mensaje
      setLastMessageTimestamp(aiMessage.timestamp.toISOString());
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Lo siento, hay un problema con la conexión. Por favor, intenta de nuevo o contáctanos por WhatsApp al +34 123 456 789.',
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendAutoMessage = async (message: string) => {
    if (!message.trim() || !clientId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await chatApi.sendMessage(message, clientId);
      
      // Extraer el mensaje de la respuesta
      let messageContent = 'Lo siento, no pude procesar tu mensaje. ¿Podrías intentarlo de nuevo?';
      
      console.log('Chat response:', response);
      
      if (typeof response === 'string') {
        messageContent = response;
      } else if (response && typeof response === 'object') {
        // La API devuelve { response: { message: string, ... }, conversationId, messageId, processingTime }
        if ((response as any).response?.message) {
          messageContent = (response as any).response.message;
        } else if ((response as any).data?.response?.message) {
          messageContent = (response as any).data.response.message;
        } else if ((response as any).message) {
          messageContent = (response as any).message;
        }

        // Guardar conversationId para polling
        const convId = (response as any).data?.conversationId || (response as any).conversationId;
        if (convId) {
          setConversationId(convId);
          console.log('💬 Conversation ID set:', convId);
        }
      }
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: messageContent,
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Actualizar timestamp del último mensaje
      setLastMessageTimestamp(aiMessage.timestamp.toISOString());
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Lo siento, hay un problema con la conexión. Por favor, intenta de nuevo o contáctanos por WhatsApp.',
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleChat = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    setIsMinimized(false);
    
    // Si se abre el chat y hay contexto de servicio, enviar mensaje automático
    if (newIsOpen && serviceContext && !hasAutoSentMessage) {
      setHasAutoSentMessage(true);
      const autoMessage = `Hola, quiero información sobre ${serviceContext.name}`;
      setInputMessage(autoMessage);
      
      // Enviar el mensaje automáticamente después de un pequeño delay
      setTimeout(() => {
        sendAutoMessage(autoMessage);
        // Limpiar el input después de enviar el mensaje automático
        setInputMessage('');
      }, 500);
    }
  };

  const minimizeChat = () => {
    setIsMinimized(true);
  };

  const quickActions = [
    { text: 'Ver servicios disponibles', action: 'services' },
    { text: 'Reservar una cita', action: 'booking' },
    { text: 'Consultar precios', action: 'prices' },
    { text: 'Continuar en WhatsApp', action: 'whatsapp' }
  ];

  const handleQuickAction = (action: string, text: string) => {
    if (action === 'whatsapp') {
      transferToWhatsApp();
    } else {
      setInputMessage(text);
      sendMessage();
    }
  };

  const transferToWhatsApp = () => {
    // Create a message with conversation context for WhatsApp
    const conversationSummary = messages
      .slice(-3) // Last 3 messages for context
      .map(msg => `${msg.sender === 'user' ? 'Cliente' : 'Asistente'}: ${msg.content}`)
      .join('\n');
    
    const whatsappMessage = encodeURIComponent(
      `Hola, vengo del chat web. Contexto de la conversación:\n\n${conversationSummary}\n\n¿Podrían ayudarme a continuar?`
    );
    
    const whatsappUrl = `https://wa.me/34123456789?text=${whatsappMessage}`;
    window.open(whatsappUrl, '_blank');
    
    // Add a message indicating the transfer
    const transferMessage: Message = {
      id: Date.now().toString(),
      content: 'Te he redirigido a WhatsApp para continuar la conversación con nuestro equipo. ¡Nos vemos allí!',
      sender: 'ai',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, transferMessage]);
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!isMounted) {
    return null;
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={toggleChat}
          className="text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-110 relative"
          style={{ backgroundColor: themeColors.primary }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = themeColors.primaryHover}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = themeColors.primary}
          aria-label="Abrir chat"
        >
          <MessageCircle className="h-6 w-6" />
          {unreadCount > 0 && (
            <span 
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
              style={{ minWidth: '20px' }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-[calc(100vw-2rem)]">
      <div className={`bg-white rounded-lg shadow-xl border border-gray-200 transition-all duration-200 ${
        isMinimized ? 'w-80 sm:w-96 h-16' : 'w-80 sm:w-96 h-[32rem] max-h-[calc(100vh-2rem)]'
      }`}>
        {/* Header */}
        <div className="text-white p-4 rounded-t-lg flex items-center justify-between" style={{ backgroundColor: themeColors.primary }}>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
            <span className="font-medium">Asistente Virtual</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={minimizeChat}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="Minimizar chat"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
            <button
              onClick={toggleChat}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="Cerrar chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: 'calc(100% - 12rem)' }}>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                      message.sender === 'user'
                        ? 'text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                    style={message.sender === 'user' ? { backgroundColor: themeColors.primary } : {}}
                    dangerouslySetInnerHTML={{
                      __html: message.sender === 'ai' 
                        ? linkifyText(message.content)
                        : message.content
                    }}
                  />
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 max-w-xs px-3 py-2 rounded-lg text-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2 border-t border-gray-100">
                <div className="text-xs text-gray-500 mb-2 mt-2">Acciones rápidas:</div>
                <div className="grid grid-cols-2 gap-1">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickAction(action.action, action.text)}
                      className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1.5 rounded transition-colors text-left"
                    >
                      {action.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="border-t border-gray-200 p-3">
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Escribe tu mensaje..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:border-transparent"
                  style={{
                    '--tw-ring-color': themeColors.primary,
                  } as React.CSSProperties}
                  onFocus={(e) => {
                    e.currentTarget.style.outline = `2px solid ${themeColors.primary}`;
                    e.currentTarget.style.outlineOffset = '2px';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.outline = 'none';
                  }}
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="text-white p-2 rounded-lg transition-colors flex-shrink-0"
                  style={{ backgroundColor: (!inputMessage.trim() || isLoading) ? '#d1d5db' : themeColors.primary }}
                  onMouseEnter={(e) => {
                    if (!(!inputMessage.trim() || isLoading)) {
                      e.currentTarget.style.backgroundColor = themeColors.primaryHover;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!(!inputMessage.trim() || isLoading)) {
                      e.currentTarget.style.backgroundColor = themeColors.primary;
                    }
                  }}
                  aria-label="Enviar mensaje"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
                <div className="text-xs text-gray-500">
                  Conversación segura
                </div>
                <button
                  onClick={transferToWhatsApp}
                  className="text-xs text-green-600 hover:text-green-700 flex items-center whitespace-nowrap"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  WhatsApp
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatWidget;