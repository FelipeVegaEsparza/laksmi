'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Minimize2, ExternalLink } from 'lucide-react';
import { chatApi } from '@/services/api';
import { useChatContext } from '@/contexts/ChatContext';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const ChatWidget = () => {
  const { clientId, isConnected } = useChatContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      
      if (typeof response === 'string') {
        messageContent = response;
      } else if (response && typeof response === 'object') {
        messageContent = response.response?.message || response.message || response.response || messageContent;
      }
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: messageContent,
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
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
          className="bg-rose-600 hover:bg-rose-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-110"
          aria-label="Abrir chat"
        >
          <MessageCircle className="h-6 w-6" />
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
        <div className="bg-rose-600 text-white p-4 rounded-t-lg flex items-center justify-between">
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
                        ? 'bg-rose-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {message.content}
                  </div>
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
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="bg-rose-600 hover:bg-rose-700 disabled:bg-gray-300 text-white p-2 rounded-lg transition-colors flex-shrink-0"
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