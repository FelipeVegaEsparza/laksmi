import { ConversationModel } from '../../models/Conversation';
import { ClientModel } from '../../models/Client';
import { ProcessMessageRequest, ProcessMessageResponse, MessageRouterConfig, ConversationChannel, AIResponse } from '../../types/ai';
import { ContextManager } from './ContextManager';
import { NLUService } from './NLUService';
import { EscalationService } from './EscalationService';
// import { DialogManager } from './DialogManager';
import logger from '../../utils/logger';

export class MessageRouter {
  private static config: MessageRouterConfig = {
    defaultChannel: 'whatsapp',
    maxMessageLength: 4000,
    supportedMediaTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    rateLimitPerMinute: 60
  };

  private static rateLimitMap = new Map<string, { count: number; resetTime: number }>();

  /**
   * Procesar mensaje entrante y generar respuesta
   */
  static async processMessage(request: ProcessMessageRequest): Promise<ProcessMessageResponse> {
    const startTime = Date.now();

    logger.info('🔵 Processing message START', {
      clientId: request.clientId,
      channel: request.channel,
      contentLength: request.content?.length,
      hasMedia: !!request.mediaUrl
    });

    try {
      // ============================================
      // VALIDACIONES DE ESTADO DEL SISTEMA
      // ============================================
      
      // 1. Verificar modo mantenimiento
      const { CompanySettingsModel } = await import('../../models/CompanySettings');
      const settings = await CompanySettingsModel.getSettings();
      
      if (settings?.maintenanceMode) {
        logger.warn('System in maintenance mode, returning maintenance message');
        
        const processingTime = Date.now() - startTime;
        return {
          response: {
            message: '🔧 Estamos realizando mantenimiento en este momento. Por favor, intenta de nuevo en unos minutos. Disculpa las molestias.',
            intent: 'maintenance',
            entities: [],
            needsHumanEscalation: false,
            metadata: { maintenanceMode: true }
          },
          conversationId: 'maintenance',
          clientId: request.clientId, // Usar el clientId del request
          messageId: 'maintenance',
          processingTime
        };
      }
      
      // 2. Verificar disponibilidad de OpenAI (solo warning, no bloqueante)
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'dummy-key-for-development') {
        logger.warn('OpenAI API key not configured, will use fallback responses');
      }

      // Validar entrada
      this.validateRequest(request);

      // Verificar rate limiting
      if (!this.checkRateLimit(request.clientId)) {
        throw new Error('Rate limit exceeded. Please wait before sending another message.');
      }

      // Obtener o crear cliente (NO MUTAR request.clientId)
      const effectiveClientId = request.clientId;
      let client = await ClientModel.findById(effectiveClientId);
      
      if (!client) {
        // Intentar buscar por teléfono
        const phoneToSearch = request.channel === 'whatsapp' && request.metadata?.phone
          ? request.metadata.phone
          : `web_${effectiveClientId.substring(0, 8)}`;

        client = await ClientModel.findByPhone(phoneToSearch);

        // Si aún no existe, crear cliente temporal para chat web
        if (!client && request.channel === 'web') {
          try {
            client = await ClientModel.create({
              name: `Web Visitor ${effectiveClientId.substring(0, 8)}`,
              phone: phoneToSearch,
              email: request.metadata?.email || ''
            });
            logger.info(`New web client created: ${client.id} for web ID: ${effectiveClientId}`);
          } catch (error: any) {
            // Si falla por duplicado, intentar buscar de nuevo
            if (error.message?.includes('Duplicate entry')) {
              client = await ClientModel.findByPhone(phoneToSearch);
            }
            if (!client) throw error;
          }
        }

        if (!client) {
          throw new Error('Client not found');
        }
      }

      // Obtener o crear conversación
      let conversation = await ConversationModel.findByClientAndChannel(client.id, request.channel);
      if (!conversation) {
        conversation = await ConversationModel.create(client.id, request.channel);
        logger.info(`New conversation created: ${conversation.id} for client ${client.id}`);
      }

      // Guardar mensaje del cliente
      logger.debug('Saving client message...', { metadata: request.metadata });
      const clientMessage = await ConversationModel.addMessage(conversation.id, {
        senderType: 'client',
        content: request.content,
        mediaUrl: request.mediaUrl,
        metadata: request.metadata
      });
      logger.debug('Client message saved:', { messageId: clientMessage.id });

      // Actualizar contexto con el nuevo mensaje
      logger.debug('Updating context...');
      await ContextManager.addMessageToContext(conversation.id, clientMessage);
      logger.debug('Context updated');

      // ============================================
      // OBTENER CONTEXTO FRESCO (CRÍTICO)
      // ============================================
      // Después de guardar el mensaje, obtener contexto actualizado
      const freshContext = await ContextManager.getContext(conversation.id);
      logger.debug('Fresh context obtained', {
        conversationId: conversation.id,
        messagesCount: freshContext.lastMessages?.length || 0
      });

      // ============================================
      // CAPTURAR SERVICE_ID DEL METADATA SI ESTÁ DISPONIBLE
      // ============================================
      if (request.metadata?.serviceId) {
        logger.info('📌 Service ID captured from metadata:', {
          serviceId: request.metadata.serviceId,
          serviceName: request.metadata.serviceName,
          conversationId: conversation.id
        });
        
        // Guardar serviceId en el contexto de la conversación
        await ContextManager.setVariable(conversation.id, 'contextServiceId', request.metadata.serviceId);
        await ContextManager.setVariable(conversation.id, 'contextServiceName', request.metadata.serviceName);
      }

      // ============================================
      // VERIFICAR SI HAY CONTROL HUMANO ACTIVO (ANTES DE TODO)
      // ============================================
      const { HumanTakeoverService } = await import('./HumanTakeoverService');
      const isUnderHumanControl = await HumanTakeoverService.isUnderHumanControl(conversation.id);

      logger.info('🔍 HUMAN CONTROL CHECK', {
        conversationId: conversation.id,
        isUnderHumanControl,
        clientId: client.id,
        channel: request.channel,
        messageContent: request.content.substring(0, 50)
      });

      if (isUnderHumanControl) {
        const session = await HumanTakeoverService.getActiveSession(conversation.id);
        
        logger.warn('🙋 Message received but conversation is under human control - Bot will NOT respond', {
          conversationId: conversation.id,
          clientId: client.id,
          humanAgentId: session?.humanAgentId,
          channel: request.channel,
          messageContent: request.content
        });

        // Solo retornar confirmación de que el mensaje fue recibido
        // El agente humano verá el mensaje en el dashboard
        const processingTime = Date.now() - startTime;

        return {
          response: {
            message: '', // No enviar respuesta automática
            intent: 'human_takeover_active',
            entities: [],
            needsHumanEscalation: false,
            metadata: {
              humanControlActive: true,
              humanAgentId: session?.humanAgentId,
              messageReceived: true
            }
          },
          conversationId: conversation.id,
          clientId: client.id,
          messageId: clientMessage.id,
          processingTime
        };
      }

      // ============================================
      // DETECCIÓN: Primer mensaje con servicio específico desde página de servicio
      // ============================================
      // Si el mensaje viene con serviceId en metadata Y es una conversación nueva (pocos mensajes)
      // Responder directamente con el menú de 4 opciones de ese servicio
      if (request.metadata?.serviceId && request.metadata?.serviceName) {
        const messageCount = freshContext.lastMessages?.length || 0;
        
        // Solo aplicar si es una conversación nueva (1-2 mensajes)
        if (messageCount <= 2) {
          logger.info('🎯 First message with specific service from service page', {
            serviceId: request.metadata.serviceId,
            serviceName: request.metadata.serviceName,
            messageCount,
            conversationId: conversation.id
          });
          
          // Generar respuesta directa con menú de 4 opciones
          const firstName = client.name.startsWith('Web Visitor') ? '' : client.name.split(' ')[0];
          const greeting = firstName ? `¡Hola ${firstName}! 😊` : '¡Hola! 😊';
          
          const directResponse = `${greeting} Veo que te interesa ${request.metadata.serviceName}.

¿Qué información necesitas?

1. Ver precio y sesiones
2. Saber cuánto dura
3. Conocer los beneficios
4. Agendar una cita

⚠️ IMPORTANTE: Responde SOLO con el número de tu opción (1, 2, 3 o 4).`;
          
          const aiMessage = await ConversationModel.addMessage(conversation.id, {
            senderType: 'ai',
            content: directResponse,
            metadata: {
              intent: 'service_inquiry_from_page',
              serviceId: request.metadata.serviceId,
              serviceName: request.metadata.serviceName,
              autoResponse: true
            }
          });
          
          await ContextManager.addMessageToContext(conversation.id, aiMessage);
          
          const processingTime = Date.now() - startTime;
          
          logger.info('✅ Service inquiry menu sent from service page', {
            serviceId: request.metadata.serviceId,
            serviceName: request.metadata.serviceName,
            conversationId: conversation.id
          });
          
          return {
            response: {
              message: directResponse,
              intent: 'service_inquiry_from_page',
              entities: [],
              needsHumanEscalation: false,
              metadata: {
                serviceId: request.metadata.serviceId,
                serviceName: request.metadata.serviceName,
                autoResponse: true
              }
            },
            conversationId: conversation.id,
            clientId: client.id,
            messageId: aiMessage.id,
            processingTime
          };
        }
      }

      // ============================================
      // PRIORIDAD MÁXIMA: ¿Usuario quiere agendar con servicio en contexto?
      // ============================================
      // ESTO DEBE IR ANTES DE TODO para interceptar INMEDIATAMENTE
      const contextServiceIdCheck = await ContextManager.getVariable(conversation.id, 'contextServiceId');
      const awaitingConfirmationCheck = await ContextManager.getVariable(conversation.id, 'awaitingBookingConfirmation');
      const serviceOptionsCheck = await ContextManager.getVariable(conversation.id, 'serviceOptions');
      
      logger.info('🔍🔍🔍 PRIORITY CHECK: Booking intent?', {
        hasContextServiceId: !!contextServiceIdCheck,
        awaitingConfirmation: awaitingConfirmationCheck,
        hasServiceOptions: !!serviceOptionsCheck,
        userMessage: request.content,
        conversationId: conversation.id
      });
      
      // IMPORTANTE: NO interceptar si hay serviceOptions (usuario está seleccionando de una lista)
      if (contextServiceIdCheck && awaitingConfirmationCheck && !serviceOptionsCheck) {
        const messageLower = request.content.toLowerCase().trim();
        
        // Detectar si es un NÚMERO
        const isNumber = /^\d+$/.test(request.content.trim());
        
        // Si es un número duplicado (ej: "44"), extraer el dígito único
        let singleDigit: number | null = null;
        if (isNumber) {
          const numStr = request.content.trim();
          const allSame = numStr.split('').every(d => d === numStr[0]);
          if (allSame) {
            singleDigit = parseInt(numStr[0]);
          }
        }
        
        // Detectar keywords de agendar
        const bookingKeywords = ['agendar', 'reservar', 'cita', 'hora', 'reserva', 'si', 'sí', 'dale', 'ok', 'okay', 'confirmo'];
        const hasBookingKeyword = bookingKeywords.some(kw => messageLower.includes(kw));
        
        // GENERAR LINK SI: es número O tiene keyword de agendar
        if (isNumber || hasBookingKeyword) {
          logger.info('✅✅✅ INTERCEPTED: USER WANTS TO BOOK', {
            isNumber,
            singleDigit,
            hasBookingKeyword,
            userMessage: request.content,
            contextServiceId: contextServiceIdCheck,
            conversationId: conversation.id
          });
          
          const { ServiceService } = await import('../ServiceService');
          const result = await ServiceService.getServices({ isActive: true, limit: 300 });
          const service = result.services.find((s: any) => s.id === contextServiceIdCheck);
          
          if (service) {
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
            const bookingLink = `${frontendUrl}/reservar?service=${service.slug}`;
            
            await ContextManager.setVariable(conversation.id, 'awaitingBookingConfirmation', false);
            
            const directResponse = `¡Perfecto! Te ayudaré a agendar tu tratamiento de ${service.name}. 😊

📅 Para reservar tu cita, haz clic aquí:

${bookingLink}`;
            
            const aiMessage = await ConversationModel.addMessage(conversation.id, {
              senderType: 'ai',
              content: directResponse,
              metadata: {
                intent: 'booking_request',
                serviceId: contextServiceIdCheck,
                serviceName: service.name,
                bookingLink,
                directBooking: true
              }
            });
            
            await ContextManager.addMessageToContext(conversation.id, aiMessage);
            
            const processingTime = Date.now() - startTime;
            
            logger.info('✅✅✅ BOOKING LINK GENERATED AND RETURNED', {
              serviceId: contextServiceIdCheck,
              serviceName: service.name,
              bookingLink,
              processingTime,
              conversationId: conversation.id
            });
            
            return {
              response: {
                message: directResponse,
                intent: 'booking_request',
                entities: [],
                needsHumanEscalation: false,
                metadata: {
                  bookingLink,
                  serviceId: contextServiceIdCheck,
                  serviceName: service.name,
                  directBooking: true
                }
              },
              conversationId: conversation.id,
              clientId: client.id,
              messageId: aiMessage.id,
              processingTime
            };
          }
        }
      }

      // ============================================
      // DETECCIÓN TEMPRANA: Usuario seleccionó servicio por número
      // ============================================
      const numberMatch = request.content.match(/^\s*(\d+)\s*$/);
      
      logger.info('🔍 Checking for number selection', {
        userMessage: request.content,
        hasNumberMatch: !!numberMatch,
        numberMatchResult: numberMatch ? numberMatch[1] : null,
        conversationId: conversation.id,
        channel: request.channel
      });
      
      if (numberMatch) {
        const selectedNumber = parseInt(numberMatch[1]);
        const serviceOptions = await ContextManager.getVariable(conversation.id, 'serviceOptions');
        
        logger.info('🔢 Number detected in user message', {
          number: selectedNumber,
          hasServiceOptions: !!serviceOptions,
          serviceOptionsCount: serviceOptions?.length || 0,
          serviceOptions: serviceOptions ? serviceOptions.map((s: any, i: number) => ({ 
            index: i + 1, 
            name: s.name, 
            id: s.id 
          })) : null,
          conversationId: conversation.id,
          channel: request.channel
        });
        
        // ============================================
        // CASO 1: Usuario seleccionó del MENÚ PRINCIPAL (1, 2, 3)
        // ============================================
        const lastMessages = freshContext.lastMessages || [];
        const lastBotMessage = lastMessages.filter((m: any) => m.senderType === 'ai').slice(-1)[0];
        const isMainMenu = lastBotMessage && this.isMainMenu(lastBotMessage.content);
        
        if (isMainMenu && selectedNumber >= 1 && selectedNumber <= 3) {
          logger.info('✅ User selected from main menu', {
            selectedNumber,
            option: selectedNumber === 1 ? 'Ver servicios' : selectedNumber === 2 ? 'Hacer consulta' : 'Agendar',
            conversationId: conversation.id
          });
          
          let responseMessage = '';
          
          if (selectedNumber === 1) {
            // Ver servicios - Mostrar categorías
            responseMessage = await this.generateCategoriesMenu();
            
            // Marcar que estamos en el menú de categorías
            await ContextManager.setVariable(conversation.id, 'inCategoriesMenu', true);
          } else if (selectedNumber === 2) {
            // Hacer consulta - Modo libre con IA
            responseMessage = `Perfecto, estoy aquí para responder tus preguntas. 😊

¿Qué te gustaría saber sobre nuestros servicios, tratamientos o la clínica?`;
            
            // Marcar que estamos en modo consulta libre
            await ContextManager.setVariable(conversation.id, 'inFreeConsultation', true);
          } else if (selectedNumber === 3) {
            // Agendar - Mostrar categorías para seleccionar servicio
            responseMessage = `¡Perfecto! Para agendar tu cita, primero necesito saber qué servicio te interesa.

${await this.generateCategoriesMenu()}`;
            
            // Marcar que estamos en proceso de agendamiento
            await ContextManager.setVariable(conversation.id, 'inBookingProcess', true);
          }
          
          const aiMessage = await ConversationModel.addMessage(conversation.id, {
            senderType: 'ai',
            content: responseMessage,
            metadata: {
              intent: 'main_menu_selection',
              selectedOption: selectedNumber
            }
          });
          
          await ContextManager.addMessageToContext(conversation.id, aiMessage);
          
          const processingTime = Date.now() - startTime;
          
          return {
            response: {
              message: responseMessage,
              intent: 'main_menu_selection',
              entities: [],
              needsHumanEscalation: false,
              metadata: {
                selectedOption: selectedNumber
              }
            },
            conversationId: conversation.id,
            clientId: client.id,
            messageId: aiMessage.id,
            processingTime
          };
        }
        
        // ============================================
        // CASO 2: Usuario seleccionó CATEGORÍA (después de "Ver servicios")
        // ============================================
        const inCategoriesMenu = await ContextManager.getVariable(conversation.id, 'inCategoriesMenu');
        const categoriesCount = await this.getMainMenuCategoriesCount();
        
        if (inCategoriesMenu && selectedNumber >= 1 && selectedNumber <= categoriesCount) {
          logger.info('✅ User selected category from categories menu', {
            selectedNumber,
            categoriesCount,
            conversationId: conversation.id
          });
          
          // Obtener el nombre de la categoría seleccionada
          const { ServiceService } = await import('../ServiceService');
          const categories = await ServiceService.getCategories();
          const selectedCategory = categories[selectedNumber - 1];
          
          if (selectedCategory) {
            logger.info('📋 Category selected, fetching services', {
              categoryName: selectedCategory.name,
              conversationId: conversation.id
            });
            
            // Obtener servicios de esa categoría
            const servicesResult = await ServiceService.getServices({ 
              category: selectedCategory.name,
              isActive: true,
              limit: 10
            });
            
            const services = servicesResult.services;
            
            logger.info('📊 Services found for category', {
              categoryName: selectedCategory.name,
              servicesCount: services.length,
              services: services.map((s: any) => ({ name: s.name, price: s.price })),
              conversationId: conversation.id
            });
            
            if (services.length === 0) {
              // No hay servicios en esta categoría
              const noServicesMessage = `Lo siento, actualmente no tenemos servicios disponibles en la categoría ${selectedCategory.name}.

¿Te gustaría ver otra categoría?

${await this.generateCategoriesMenu()}`;
              
              const aiMessage = await ConversationModel.addMessage(conversation.id, {
                senderType: 'ai',
                content: noServicesMessage,
                metadata: {
                  intent: 'category_selection',
                  categoryName: selectedCategory.name,
                  noServices: true
                }
              });
              
              await ContextManager.addMessageToContext(conversation.id, aiMessage);
              
              const processingTime = Date.now() - startTime;
              
              return {
                response: {
                  message: noServicesMessage,
                  intent: 'category_selection',
                  entities: [],
                  needsHumanEscalation: false,
                  metadata: {
                    categoryName: selectedCategory.name,
                    noServices: true
                  }
                },
                conversationId: conversation.id,
                clientId: client.id,
                messageId: aiMessage.id,
                processingTime
              };
            }
            
            // Generar lista de servicios
            let servicesMessage = `Perfecto, aquí están nuestros servicios de ${selectedCategory.name}:\n\n`;
            
            services.forEach((service: any, index: number) => {
              const price = service.price ? `$${service.price.toLocaleString('es-CL')}` : 'Consultar';
              const sessions = service.sessions ? ` (${service.sessions} sesiones)` : '';
              servicesMessage += `${index + 1}. *${service.name}${sessions}* - ${price}\n`;
            });
            
            servicesMessage += `\n⚠️ IMPORTANTE: Responde SOLO con el número del servicio que te interesa.`;
            
            // Guardar las opciones de servicios en el contexto
            const serviceOptions = services.map((s: any) => ({
              id: s.id,
              name: s.name,
              slug: s.slug,
              price: s.price
            }));
            
            await ContextManager.setVariable(conversation.id, 'serviceOptions', serviceOptions);
            
            // Limpiar flags
            await ContextManager.setVariable(conversation.id, 'inCategoriesMenu', false);
            await ContextManager.setVariable(conversation.id, 'contextServiceId', null);
            await ContextManager.setVariable(conversation.id, 'contextServiceName', null);
            
            const aiMessage = await ConversationModel.addMessage(conversation.id, {
              senderType: 'ai',
              content: servicesMessage,
              metadata: {
                intent: 'category_selection',
                categoryName: selectedCategory.name,
                servicesCount: services.length
              }
            });
            
            await ContextManager.addMessageToContext(conversation.id, aiMessage);
            
            const processingTime = Date.now() - startTime;
            
            logger.info('✅ Services list generated for category', {
              categoryName: selectedCategory.name,
              servicesCount: services.length,
              conversationId: conversation.id
            });
            
            return {
              response: {
                message: servicesMessage,
                intent: 'category_selection',
                entities: [],
                needsHumanEscalation: false,
                metadata: {
                  categoryName: selectedCategory.name,
                  servicesCount: services.length
                }
              },
              conversationId: conversation.id,
              clientId: client.id,
              messageId: aiMessage.id,
              processingTime
            };
          }
        }
        
        // ============================================
        // CASO 3: Usuario seleccionó SERVICIO de una lista
        // ============================================
        if (serviceOptions && Array.isArray(serviceOptions) && serviceOptions[selectedNumber - 1]) {
          const selectedService = serviceOptions[selectedNumber - 1];
          logger.info('✅ User selected service by number from serviceOptions', { 
            number: selectedNumber, 
            serviceId: selectedService.id,
            serviceName: selectedService.name,
            conversationId: conversation.id
          });
          
          // Guardar el servicio seleccionado en el contexto
          await ContextManager.setVariable(conversation.id, 'contextServiceId', selectedService.id);
          await ContextManager.setVariable(conversation.id, 'contextServiceName', selectedService.name);
          
          // Limpiar flags de agendamiento
          await ContextManager.setVariable(conversation.id, 'awaitingBookingConfirmation', false);
          
          // Limpiar las opciones del contexto
          await ContextManager.setVariable(conversation.id, 'serviceOptions', null);
          
          // Generar respuesta directa sin llamar al AI
          const directResponse = `¡Claro! Te cuento sobre ${selectedService.name}. 😊

¿Qué información necesitas?
1. Ver precio y sesiones
2. Saber cuánto dura
3. Conocer los beneficios
4. Agendar una cita

⚠️ IMPORTANTE: Responde SOLO con el número de tu opción (1, 2, 3 o 4).`;

          const aiMessage = await ConversationModel.addMessage(conversation.id, {
            senderType: 'ai',
            content: directResponse,
            metadata: {
              intent: 'service_inquiry',
              serviceSelected: true,
              serviceId: selectedService.id,
              serviceName: selectedService.name
            }
          });

          await ContextManager.addMessageToContext(conversation.id, aiMessage);

          const processingTime = Date.now() - startTime;

          return {
            response: {
              message: directResponse,
              intent: 'service_inquiry',
              entities: [],
              needsHumanEscalation: false,
              metadata: {
                serviceSelected: true,
                serviceId: selectedService.id,
                serviceName: selectedService.name
              }
            },
            conversationId: conversation.id,
            clientId: client.id,
            messageId: aiMessage.id,
            processingTime
          };
        } else {
          // CASO: Usuario seleccionó un número pero no hay serviceOptions
          // Verificar si hay un servicio en contexto (ya seleccionado previamente)
          const contextServiceId = await ContextManager.getVariable(conversation.id, 'contextServiceId');
          const contextServiceName = await ContextManager.getVariable(conversation.id, 'contextServiceName');
          
          // IMPORTANTE: Verificar si el usuario está seleccionando una CATEGORÍA del menú principal
          // Si selecciona un número y el último mensaje del bot fue el menú principal, limpiar contexto
          const lastMessages = freshContext.lastMessages || [];
          const lastBotMessage = lastMessages.filter((m: any) => m.senderType === 'ai').slice(-1)[0];
          const isMainMenu = lastBotMessage && this.isMainMenu(lastBotMessage.content);
          
          // Obtener el número de categorías dinámicamente
          const categoriesCount = await this.getMainMenuCategoriesCount();
          
          logger.info('🔍 Checking if user is in main menu', {
            selectedNumber,
            isMainMenu,
            categoriesCount,
            hasContextServiceId: !!contextServiceId,
            lastBotMessagePreview: lastBotMessage?.content?.substring(0, 200),
            conversationId: conversation.id
          });
          
          // Si el usuario selecciona un número de categoría del menú principal, limpiar contexto y pasar a IA
          if (isMainMenu && selectedNumber >= 1 && selectedNumber <= categoriesCount) {
            logger.info('✅ User selected category from main menu, clearing context', {
              selectedNumber,
              categoriesCount,
              conversationId: conversation.id
            });
            
            // Limpiar contexto de servicio anterior
            await ContextManager.setVariable(conversation.id, 'contextServiceId', null);
            await ContextManager.setVariable(conversation.id, 'contextServiceName', null);
            await ContextManager.setVariable(conversation.id, 'serviceOptions', null);
            
            // NO hacer return aquí, dejar que el mensaje pase a la IA
            // La IA generará la lista de servicios de la categoría seleccionada
          } else if (contextServiceId && (selectedNumber >= 1 && selectedNumber <= 4)) {
            logger.info('✅ User selected info option about service in context', {
              option: selectedNumber,
              serviceId: contextServiceId,
              serviceName: contextServiceName,
              conversationId: conversation.id
            });
            
            // Obtener información del servicio
            const { ServiceService } = await import('../ServiceService');
            const result = await ServiceService.getServices({ isActive: true, limit: 300 });
            const service = result.services.find((s: any) => s.id === contextServiceId);
            
            if (service) {
              let directResponse = '';
              
              if (selectedNumber === 1) {
                // Ver precio y sesiones
                directResponse = `💰 Información de precio de ${service.name}:

• Precio: $${service.price?.toLocaleString('es-CL') || 'Consultar'}
• Sesiones: ${service.sessions || 'Consultar'}
• Duración por sesión: ${service.duration || 'Consultar'} minutos

¿Qué más te gustaría saber?
1. Ver precio y sesiones
2. Saber cuánto dura
3. Conocer los beneficios
4. Agendar una cita

⚠️ IMPORTANTE: Responde SOLO con el número de tu opción.`;
              } else if (selectedNumber === 2) {
                // Saber cuánto dura
                directResponse = `⏱️ Duración de ${service.name}:

• Duración por sesión: ${service.duration || 'Consultar'} minutos
• Total de sesiones: ${service.sessions || 'Consultar'}
• Tiempo total del tratamiento: Aproximadamente ${service.sessions ? Math.ceil(service.sessions * (service.duration || 60) / 60) : 'Consultar'} horas distribuidas en varias sesiones

¿Qué más te gustaría saber?
1. Ver precio y sesiones
2. Saber cuánto dura
3. Conocer los beneficios
4. Agendar una cita

⚠️ IMPORTANTE: Responde SOLO con el número de tu opción.`;
              } else if (selectedNumber === 3) {
                // Conocer los beneficios
                directResponse = `✨ Beneficios de ${service.name}:

${service.description || 'Tratamiento profesional de alta calidad.'}

¿Qué más te gustaría saber?
1. Ver precio y sesiones
2. Saber cuánto dura
3. Conocer los beneficios
4. Agendar una cita

⚠️ IMPORTANTE: Responde SOLO con el número de tu opción.`;
              } else if (selectedNumber === 4) {
                // Agendar una cita
                const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
                const bookingLink = `${frontendUrl}/reservar?service=${service.slug}`;
                
                directResponse = `¡Perfecto! Te ayudaré a agendar tu tratamiento de ${service.name}. 😊

📅 Para reservar tu cita, haz clic aquí:

${bookingLink}`;
              }
              
              const aiMessage = await ConversationModel.addMessage(conversation.id, {
                senderType: 'ai',
                content: directResponse,
                metadata: {
                  intent: selectedNumber === 4 ? 'booking_request' : 'service_info',
                  serviceId: contextServiceId,
                  serviceName: service.name,
                  infoType: selectedNumber === 1 ? 'price' : selectedNumber === 2 ? 'duration' : selectedNumber === 3 ? 'benefits' : 'booking',
                  ...(selectedNumber === 4 && { bookingLink: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/reservar?service=${service.slug}` })
                }
              });
              
              await ContextManager.addMessageToContext(conversation.id, aiMessage);
              
              const processingTime = Date.now() - startTime;
              
              logger.info('✅ Service info provided', {
                option: selectedNumber,
                serviceId: contextServiceId,
                serviceName: service.name,
                conversationId: conversation.id
              });
              
              return {
                response: {
                  message: directResponse,
                  intent: selectedNumber === 4 ? 'booking_request' : 'service_info',
                  entities: [],
                  needsHumanEscalation: false,
                  metadata: {
                    serviceId: contextServiceId,
                    serviceName: service.name,
                    infoType: selectedNumber === 1 ? 'price' : selectedNumber === 2 ? 'duration' : selectedNumber === 3 ? 'benefits' : 'booking',
                    ...(selectedNumber === 4 && { bookingLink: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/reservar?service=${service.slug}` })
                  }
                },
                conversationId: conversation.id,
                clientId: client.id,
                messageId: aiMessage.id,
                processingTime
              };
            }
          }
        }
      }

      // Procesar mensaje con NLU (usando contexto fresco)
      const nluResult = await NLUService.processMessage(request.content, freshContext);

      // ============================================
      // INTERCEPTAR GREETING: Generar menú principal dinámico
      // ============================================
      if (nluResult.intent.name === 'greeting') {
        logger.info('👋 Greeting detected, generating dynamic main menu', {
          conversationId: conversation.id,
          clientName: client.name
        });
        
        const firstName = client.name.split(' ')[0];
        const mainMenuMessage = await this.generateMainMenu(firstName);
        
        const aiMessage = await ConversationModel.addMessage(conversation.id, {
          senderType: 'ai',
          content: mainMenuMessage,
          metadata: {
            intent: 'greeting',
            dynamicMenu: true
          }
        });
        
        await ContextManager.addMessageToContext(conversation.id, aiMessage);
        
        const processingTime = Date.now() - startTime;
        
        return {
          response: {
            message: mainMenuMessage,
            intent: 'greeting',
            entities: [],
            needsHumanEscalation: false,
            metadata: {
              dynamicMenu: true
            }
          },
          conversationId: conversation.id,
          clientId: client.id,
          messageId: aiMessage.id,
          processingTime
        };
      }

      // Verificar si está esperando que proporcione su email
      const { ChatAuthService } = await import('./ChatAuthService');
      const awaitingEmailInput = await ChatAuthService.isAwaitingEmailInput(conversation.id);

      if (awaitingEmailInput) {
        const captureResult = await ChatAuthService.captureAndSaveEmail(
          conversation.id,
          client.id,
          request.content
        );

        const aiMessage = await ConversationModel.addMessage(conversation.id, {
          senderType: 'ai',
          content: captureResult.message,
          metadata: {
            emailCapture: true,
            emailSaved: captureResult.emailSaved,
            success: captureResult.success
          }
        });

        await ContextManager.addMessageToContext(conversation.id, aiMessage);

        const processingTime = Date.now() - startTime;

        return {
          response: {
            message: captureResult.message,
            intent: 'email_capture',
            entities: [],
            needsHumanEscalation: false,
            metadata: {
              emailCapture: true,
              emailSaved: captureResult.emailSaved
            }
          },
          conversationId: conversation.id,
          clientId: client.id,
          messageId: aiMessage.id,
          processingTime
        };
      }

      // Verificar si está esperando verificación por teléfono
      const awaitingPhoneVerification = await ChatAuthService.isAwaitingPhoneVerification(conversation.id);

      if (awaitingPhoneVerification) {
        const validationResult = await ChatAuthService.validatePhoneVerification(
          conversation.id,
          client.id,
          request.content
        );

        const aiMessage = await ConversationModel.addMessage(conversation.id, {
          senderType: 'ai',
          content: validationResult.message,
          metadata: {
            verificationAttempt: true,
            verificationMethod: 'phone',
            isValid: validationResult.isVerified
          }
        });

        await ContextManager.addMessageToContext(conversation.id, aiMessage);

        const processingTime = Date.now() - startTime;

        return {
          response: {
            message: validationResult.message,
            intent: 'phone_verification',
            entities: [],
            needsHumanEscalation: false,
            metadata: {
              verification: true,
              verified: validationResult.isVerified
            }
          },
          conversationId: conversation.id,
          clientId: client.id,
          messageId: aiMessage.id,
          processingTime
        };
      }

      // Verificar si el mensaje es un código de verificación por email
      if (ChatAuthService.isVerificationCodeMessage(request.content)) {
        const validationResult = await ChatAuthService.validateVerificationCode(
          conversation.id,
          request.content
        );

        const aiMessage = await ConversationModel.addMessage(conversation.id, {
          senderType: 'ai',
          content: validationResult.message,
          metadata: {
            verificationAttempt: true,
            verificationMethod: 'email',
            isValid: validationResult.isValid
          }
        });

        await ContextManager.addMessageToContext(conversation.id, aiMessage);

        const processingTime = Date.now() - startTime;

        return {
          response: {
            message: validationResult.message,
            intent: 'email_verification',
            entities: [],
            needsHumanEscalation: false,
            metadata: {
              verification: true,
              verified: validationResult.clientVerified
            }
          },
          conversationId: conversation.id,
          clientId: client.id,
          messageId: aiMessage.id,
          processingTime
        };
      }

      // Verificar si es una gestión de reserva (confirmar, cancelar, reagendar) - usar freshContext
      const bookingManagement = await this.handleBookingManagement(
        request.content,
        nluResult.intent.name,
        client.id,
        freshContext,
        conversation.id
      );

      if (bookingManagement) {
        // Guardar respuesta de gestión de reserva
        const aiMessage = await ConversationModel.addMessage(conversation.id, {
          senderType: 'ai',
          content: bookingManagement.message,
          metadata: {
            intent: nluResult.intent.name,
            bookingAction: bookingManagement.action,
            bookingId: bookingManagement.bookingId
          }
        });

        await ContextManager.addMessageToContext(conversation.id, aiMessage);

        const processingTime = Date.now() - startTime;

        return {
          response: {
            message: bookingManagement.message,
            intent: nluResult.intent.name,
            entities: nluResult.entities,
            needsHumanEscalation: false,
            metadata: {
              bookingManagement: true,
              action: bookingManagement.action
            }
          },
          conversationId: conversation.id,
          clientId: client.id,
          messageId: aiMessage.id,
          processingTime
        };
      }

      // Evaluar necesidad de escalación (usar freshContext)
      const escalationEvaluation = await EscalationService.evaluateEscalationNeed(
        conversation.id,
        nluResult,
        freshContext,
        client
      );

      let aiResponse: AIResponse;
      let extractedServiceId: string | null = null;
      let extractedServiceName: string | null = null;

      if (escalationEvaluation.shouldEscalate) {
        // Ejecutar escalación automática
        const escalationResult = await EscalationService.escalateToHuman(
          conversation.id,
          escalationEvaluation.reason!,
          escalationEvaluation.priority!,
          escalationEvaluation.summary
        );

        if (escalationResult.success) {
          aiResponse = {
            message: await this.generateEscalationMessage(escalationEvaluation.reason!, request.channel),
            intent: nluResult.intent.name,
            entities: nluResult.entities,
            needsHumanEscalation: true,
            metadata: {
              escalationId: escalationResult.escalationId,
              escalationReason: escalationEvaluation.reason
            }
          };
        } else {
          aiResponse = {
            message: 'Lo siento, ha ocurrido un problema. Un especialista te contactará pronto.',
            intent: nluResult.intent.name,
            entities: nluResult.entities,
            needsHumanEscalation: true
          };
        }
      } else {
        // Intentar generar respuesta con OpenAI
        try {
          logger.debug('Preparing to call AIService', {
            conversationId: conversation.id,
            messageContent: request.content.substring(0, 100)
          });

          const { AIService } = await import('../AIService');

          // Preparar historial de conversación para OpenAI
          // IMPORTANTE: Enviar TODA la conversación (últimos 20 mensajes) para que la IA tenga contexto completo
          const conversationHistory = freshContext.lastMessages.slice(-20).map((msg: any) => ({
            role: msg.senderType === 'client' ? 'user' as const : 'assistant' as const,
            content: msg.content
          }));

          logger.debug('Calling AIService.generateResponse', {
            conversationId: conversation.id,
            historyLength: conversationHistory.length,
            fullHistory: conversationHistory.map((m, i) => `${i + 1}. ${m.role}: ${m.content.substring(0, 100)}`)
          });

          // Generar respuesta con OpenAI
          const aiResult = await AIService.generateResponse(
            request.content,
            conversationHistory,
            conversation.id
          );

          logger.info('AIService response received', {
            conversationId: conversation.id,
            messageLength: aiResult.message.length,
            usedKnowledgeBase: aiResult.usedKnowledgeBase,
            hasServiceId: aiResult.message.includes('[SERVICE_ID:'),
            aiMessagePreview: aiResult.message.substring(0, 300),
            fullAiMessage: aiResult.message
          });

          // ============================================
          // EXTRAER SERVICE_ID DEL MENSAJE AI
          // ============================================
          let aiMessage = aiResult.message;
          let extractedServiceId: string | null = null;
          let extractedServiceName: string | null = null;
          
          const serviceIdMatch = aiMessage.match(/\[SERVICE_ID:([a-f0-9-]{36})\]/i);
          if (serviceIdMatch) {
            extractedServiceId = serviceIdMatch[1];
            logger.info('✅ SERVICE_ID extracted from AI message', {
              serviceId: extractedServiceId,
              conversationId: conversation.id
            });
            
            // Buscar el nombre del servicio
            try {
              const { ServiceService } = await import('../ServiceService');
              const result = await ServiceService.getServices({ isActive: true, limit: 300 });
              const service = result.services.find((s: any) => s.id === extractedServiceId);
              if (service) {
                extractedServiceName = service.name;
                logger.info('✅ Service found for SERVICE_ID', {
                  serviceId: extractedServiceId,
                  serviceName: extractedServiceName,
                  conversationId: conversation.id
                });
              }
            } catch (error) {
              logger.error('Error finding service:', error);
            }
          } else {
            logger.info('ℹ️ No SERVICE_ID in AI message (this is OK if user is not booking)', {
              conversationId: conversation.id,
              aiMessagePreview: aiMessage.substring(0, 200)
            });
          }

          // NUEVA LÓGICA: Detectar si el AI listó múltiples servicios y guardarlos en el contexto
          // IMPORTANTE: Hacer esto ANTES de limpiar el [SERVICE_ID:xxx]
          logger.info('🔍 About to call detectAndSaveServiceOptions', {
            conversationId: conversation.id,
            aiMessageLength: aiMessage.length,
            aiMessagePreview: aiMessage.substring(0, 300)
          });
          
          await this.detectAndSaveServiceOptions(aiMessage, conversation.id);
          
          logger.info('✅ detectAndSaveServiceOptions completed', {
            conversationId: conversation.id
          });

          // Limpiar marcadores especiales [SERVICE_ID:xxx] del mensaje antes de enviarlo
          let finalMessage = aiMessage.replace(/\[SERVICE_ID:[^\]]+\]/g, '').trim();
          
          // Si hay SERVICE_ID, generar el link de reserva
          let bookingLink: string | null = null;
          if (extractedServiceId && extractedServiceName) {
            try {
              const { ServiceService } = await import('../ServiceService');
              const result = await ServiceService.getServices({ isActive: true, limit: 300 });
              const service = result.services.find((s: any) => s.id === extractedServiceId);
              
              if (service) {
                const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
                bookingLink = `${frontendUrl}/reservar?service=${service.slug}`;
                
                logger.info('✅✅✅ BOOKING LINK GENERATED FROM AI SERVICE_ID', {
                  serviceId: extractedServiceId,
                  serviceName: service.name,
                  slug: service.slug,
                  bookingLink,
                  conversationId: conversation.id
                });
              }
            } catch (error) {
              logger.error('Error generating booking link:', error);
            }
          }
          
          logger.info('🔍 Checking if booking link should be added', {
            hasBookingLink: !!bookingLink,
            bookingLink: bookingLink || 'null',
            conversationId: conversation.id,
            userMessage: request.content
          });
          
          // Si hay link de reserva, agregarlo al mensaje
          if (bookingLink) {
            finalMessage += `\n\n📅 Para reservar tu cita, haz clic aquí:\n\n${bookingLink}`;
            
            logger.info('✅✅✅ BOOKING LINK ADDED TO MESSAGE', {
              conversationId: conversation.id,
              bookingLink,
              finalMessageLength: finalMessage.length
            });
          } else {
            logger.info('ℹ️ No booking link to add (AI did not include SERVICE_ID)', {
              conversationId: conversation.id,
              userMessage: request.content,
              aiMessageHadServiceId: aiResult.message.includes('[SERVICE_ID:')
            });
          }

          aiResponse = {
            message: finalMessage,
            intent: nluResult.intent.name,
            entities: nluResult.entities,
            needsHumanEscalation: aiResult.suggestedActions?.includes('escalate') || false,
            metadata: {
              usedKnowledgeBase: aiResult.usedKnowledgeBase,
              confidence: aiResult.confidence,
              bookingLink: bookingLink || undefined
            }
          };

          logger.info('OpenAI response generated', {
            conversationId: conversation.id,
            usedKnowledgeBase: aiResult.usedKnowledgeBase,
            confidence: aiResult.confidence,
            hasBookingLink: !!bookingLink
          });

        } catch (error) {
          logger.warn('Error generating OpenAI response, using fallback:', error);

          // Fallback: Generar respuesta simple
          let responseMessage = this.generateSimpleResponse(nluResult.intent.name, client.name);

          // Solo buscar en la base de conocimientos si es una pregunta específica
          const shouldSearchKnowledge = !['greeting', 'goodbye', 'thanks'].includes(nluResult.intent.name)
            && request.content.includes('?');

          if (shouldSearchKnowledge) {
            try {
              const { KnowledgeService } = await import('../KnowledgeService');
              const knowledgeAnswer = await KnowledgeService.getFormattedAnswer(request.content, conversation.id);

              if (knowledgeAnswer) {
                responseMessage = knowledgeAnswer;
              }
            } catch (kbError) {
              logger.warn('Error fetching knowledge base:', kbError);
            }
          }

          aiResponse = {
            message: responseMessage,
            intent: nluResult.intent.name,
            entities: nluResult.entities,
            needsHumanEscalation: nluResult.needsHumanEscalation || false
          };
        }
      }

      // ============================================
      // VERIFICACIÓN FINAL: Control humano activado durante el procesamiento
      // ============================================
      // Verificar una última vez ANTES de guardar la respuesta de la IA
      // por si el control humano se activó mientras se procesaba el mensaje
      const finalHumanControlCheck = await HumanTakeoverService.isUnderHumanControl(conversation.id);
      
      if (finalHumanControlCheck) {
        logger.warn('🙋 Human control activated during message processing - Discarding AI response', {
          conversationId: conversation.id,
          clientId: client.id,
          aiResponsePreview: aiResponse.message.substring(0, 100)
        });
        
        const processingTime = Date.now() - startTime;
        
        return {
          response: {
            message: '', // No enviar respuesta de la IA
            intent: 'human_takeover_active',
            entities: [],
            needsHumanEscalation: false,
            metadata: {
              humanControlActive: true,
              aiResponseDiscarded: true
            }
          },
          conversationId: conversation.id,
          clientId: client.id,
          messageId: clientMessage.id,
          processingTime
        };
      }

      // ============================================
      // GUARDAR RESPUESTA DEL AI
      // ============================================
      // Solo llegar aquí si NO hay control humano activo
      const aiMessage = await ConversationModel.addMessage(conversation.id, {
        senderType: 'ai',
        content: aiResponse.message,
        metadata: {
          intent: aiResponse.intent,
          entities: aiResponse.entities,
          actions: aiResponse.actions,
          serviceId: extractedServiceId || undefined,
          serviceName: extractedServiceName || undefined
        }
      });

      // Actualizar contexto con la respuesta
      await ContextManager.addMessageToContext(conversation.id, aiMessage);

      // Ejecutar acciones si las hay
      if (aiResponse.actions && aiResponse.actions.length > 0) {
        await this.executeActions(aiResponse.actions, conversation.id, client.id);
      }

      // Manejar escalación si es necesaria
      if (aiResponse.needsHumanEscalation) {
        await ConversationModel.escalateConversation(
          conversation.id,
          'AI confidence low or complex request'
        );
        logger.info(`Conversation escalated: ${conversation.id}`);
        
        // 🔧 FIX: NO reemplazar el mensaje de la IA si ya generó una respuesta válida
        // Solo agregar el mensaje de escalación si el canal es web Y la respuesta es genérica
        const isGenericEscalationMessage = aiResponse.message.includes('Lo siento, ha ocurrido un problema');
        
        if (request.channel === 'web' && isGenericEscalationMessage) {
          const escalationMessageWithLink = await this.generateEscalationMessage('client_request', request.channel);
          
          // Actualizar el mensaje en la BD directamente
          const db = (await import('../../config/database')).default;
          await db('messages')
            .where('id', aiMessage.id)
            .update({ content: escalationMessageWithLink });
          
          // Actualizar el mensaje en la respuesta que se enviará al cliente
          aiResponse.message = escalationMessageWithLink;
          
          logger.info('✅ Escalation message updated with WhatsApp link', {
            conversationId: conversation.id,
            messageId: aiMessage.id,
            channel: request.channel,
            messageLength: escalationMessageWithLink.length
          });
        } else {
          logger.info('ℹ️ Escalation flagged but keeping AI response', {
            conversationId: conversation.id,
            channel: request.channel,
            isGenericMessage: isGenericEscalationMessage,
            messagePreview: aiResponse.message.substring(0, 200)
          });
        }
        
        // NO activar control humano automáticamente aquí
        // El control humano se activará cuando un agente real tome la conversación
        // Esto permite que el bot siga respondiendo hasta que un humano intervenga
      }

      // Cerrar conversación si terminó
      if (aiResponse.conversationEnded) {
        await ConversationModel.closeConversation(conversation.id);
        logger.info(`Conversation closed: ${conversation.id}`);
      }

      const processingTime = Date.now() - startTime;

      return {
        response: aiResponse,
        conversationId: conversation.id,
        clientId: client.id, // Devolver el clientId real de la BD
        messageId: aiMessage.id,
        processingTime
      };

    } catch (error) {
      logger.error('❌ Message processing error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        clientId: request.clientId,
        channel: request.channel,
        contentLength: request.content?.length
      });

      // Respuesta de fallback
      const fallbackResponse: AIResponse = {
        message: 'Lo siento, ha ocurrido un error técnico. Por favor, intenta de nuevo en unos momentos.',
        needsHumanEscalation: true,
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
      };

      const processingTime = Date.now() - startTime;

      return {
        response: fallbackResponse,
        conversationId: 'error',
        clientId: request.clientId, // Usar el clientId del request
        messageId: 'error',
        processingTime
      };
    }
  }

  /**
   * Procesar mensaje de WhatsApp (webhook de Twilio)
   */
  static async processWhatsAppMessage(twilioPayload: any): Promise<ProcessMessageResponse> {
    try {
      // Extraer información del payload de Twilio
      const phoneNumber = this.extractPhoneNumber(twilioPayload.From);
      const content = twilioPayload.Body || '';
      const mediaUrl = twilioPayload.MediaUrl0;

      // Buscar cliente por número de teléfono
      let client = await ClientModel.findByPhone(phoneNumber);
      if (!client) {
        // Crear cliente automáticamente para WhatsApp
        client = await ClientModel.create({
          phone: phoneNumber,
          name: `Cliente WhatsApp ${phoneNumber.slice(-4)}`,
          allergies: [],
          preferences: []
        });
        logger.info(`Auto-created client for WhatsApp: ${client.id}`);
      }

      const request: ProcessMessageRequest = {
        content,
        clientId: client.id,
        channel: 'whatsapp',
        mediaUrl,
        metadata: {
          phone: phoneNumber,
          twilioSid: twilioPayload.MessageSid,
          twilioFrom: twilioPayload.From,
          twilioTo: twilioPayload.To
        }
      };

      return await this.processMessage(request);

    } catch (error) {
      logger.error('WhatsApp message processing error:', error);
      throw error;
    }
  }

  /**
   * Validar request de entrada
   */
  private static validateRequest(request: ProcessMessageRequest): void {
    if (!request.content || request.content.trim().length === 0) {
      throw new Error('Message content is required');
    }

    if (request.content.length > this.config.maxMessageLength) {
      throw new Error(`Message too long. Maximum ${this.config.maxMessageLength} characters allowed`);
    }

    if (!request.clientId) {
      throw new Error('Client ID is required');
    }

    if (!['web', 'whatsapp'].includes(request.channel)) {
      throw new Error('Invalid channel. Must be web or whatsapp');
    }

    // Validar tipo de media si está presente
    if (request.mediaUrl && request.metadata?.mediaType) {
      if (!this.config.supportedMediaTypes.includes(request.metadata.mediaType)) {
        throw new Error(`Unsupported media type: ${request.metadata.mediaType}`);
      }
    }
  }

  /**
   * Verificar rate limiting por cliente
   */
  private static checkRateLimit(clientId: string): boolean {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minuto

    const clientLimit = this.rateLimitMap.get(clientId);

    if (!clientLimit || now > clientLimit.resetTime) {
      // Nueva ventana de tiempo
      this.rateLimitMap.set(clientId, {
        count: 1,
        resetTime: now + windowMs
      });
      return true;
    }

    if (clientLimit.count >= this.config.rateLimitPerMinute) {
      return false;
    }

    clientLimit.count++;
    return true;
  }

  /**
   * Ejecutar acciones del AI
   */
  private static async executeActions(actions: any[], conversationId: string, clientId: string): Promise<void> {
    // const { BusinessLogicService } = await import('./BusinessLogicService');

    for (const action of actions) {
      try {
        switch (action.type) {
          case 'book_appointment':
            logger.info(`Booking action executed for conversation ${conversationId}:`, action.params);
            // TODO: Implementar lógica de reserva real
            break;
          case 'check_availability':
            await this.executeAvailabilityCheck(action.params, conversationId);
            break;
          case 'get_services':
            await this.executeGetServices(action.params, conversationId);
            break;
          case 'get_client_info':
            await this.executeGetClientInfo(action.params, conversationId, clientId);
            break;
          case 'send_notification':
            await this.executeSendNotificationAction(action.params, clientId);
            break;
          case 'escalate_to_human':
            await ConversationModel.escalateConversation(
              conversationId,
              action.params.reason || 'AI escalation',
              action.params.humanAgentId
            );
            break;
          case 'end_conversation':
            await ConversationModel.closeConversation(conversationId);
            break;
          default:
            logger.warn(`Unknown action type: ${action.type}`);
        }
      } catch (error) {
        logger.error(`Error executing action ${action.type}:`, error);
      }
    }
  }

  /**
   * Ejecutar verificación de disponibilidad
   */
  private static async executeAvailabilityCheck(params: any, conversationId: string): Promise<void> {
    logger.info(`Availability check executed for conversation ${conversationId}:`, params);
    // La lógica ya está integrada en BusinessLogicService
  }

  /**
   * Ejecutar obtención de servicios
   */
  private static async executeGetServices(params: any, conversationId: string): Promise<void> {
    logger.info(`Get services executed for conversation ${conversationId}:`, params);
    // La lógica ya está integrada en BusinessLogicService
  }

  /**
   * Ejecutar obtención de información del cliente
   */
  private static async executeGetClientInfo(params: any, conversationId: string, clientId: string): Promise<void> {
    logger.info(`Get client info executed for conversation ${conversationId}, client ${clientId}:`, params);
    // La lógica ya está integrada en BusinessLogicService
  }

  /**
   * Ejecutar acción de envío de notificación
   */
  private static async executeSendNotificationAction(params: any, clientId: string): Promise<void> {
    try {
      const { NotificationService } = await import('../NotificationService');

      await NotificationService.createNotification({
        clientId,
        type: params.type || 'promotion',
        channel: params.channel || 'whatsapp',
        scheduledFor: params.scheduledFor || new Date(),
        templateName: params.templateName || 'general_message',
        templateData: params.templateData || {}
      });

      logger.info(`Notification scheduled for client ${clientId}`);
    } catch (error) {
      logger.error(`Error sending notification to client ${clientId}:`, error);
    }
  }

  /**
   * Extraer número de teléfono limpio
   */
  private static extractPhoneNumber(twilioFrom: string): string {
    // Remover prefijo "whatsapp:" si existe
    return twilioFrom.replace('whatsapp:', '').replace(/\s+/g, '');
  }

  /**
   * Obtener configuración actual
   */
  static getConfig(): MessageRouterConfig {
    return { ...this.config };
  }

  /**
   * Actualizar configuración
   */
  static updateConfig(newConfig: Partial<MessageRouterConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('MessageRouter configuration updated:', this.config);
  }

  /**
   * Limpiar rate limits expirados
   */
  static cleanupRateLimits(): void {
    const now = Date.now();
    for (const [clientId, limit] of this.rateLimitMap.entries()) {
      if (now > limit.resetTime) {
        this.rateLimitMap.delete(clientId);
      }
    }
  }

  /**
   * Manejar gestión de reservas (confirmar, cancelar, reagendar, consultar)
   */
  private static async handleBookingManagement(
    userMessage: string,
    intent: string,
    clientId: string,
    context: any,
    conversationId: string
  ): Promise<{ message: string; action: string; bookingId?: string } | null> {
    try {
      const { BookingManagementService } = await import('./BookingManagementService');
      const { ChatAuthService } = await import('./ChatAuthService');
      const messageLower = userMessage.toLowerCase();

      logger.info('🔍 handleBookingManagement ejecutándose', {
        userMessage,
        intent,
        messageLower,
        conversationId
      });

      // Detectar acción de gestión de reserva
      let action: string | null = null;
      let result: any = null;
      let requiresAuth = false;

      // 1. Listar reservas
      if (
        messageLower.includes('mis reservas') ||
        messageLower.includes('mis citas') ||
        messageLower.includes('ver mis') ||
        (messageLower.includes('tengo') && (messageLower.includes('reserva') || messageLower.includes('cita')))
      ) {
        action = 'list';
        result = await BookingManagementService.listClientBookings(clientId);
      }

      // 2. Confirmar reserva (NO requiere autenticación - es una acción positiva)
      if (
        !action && (
          (intent === 'affirmative' && context.variables?.pendingBookingConfirmation) ||
          (messageLower.includes('confirmar') && (messageLower.includes('reserva') || messageLower.includes('cita')))
        )
      ) {
        action = 'confirm';

        if (intent === 'affirmative' && context.variables?.pendingBookingConfirmation) {
          const bookingId = context.variables.pendingBookingConfirmation;
          result = await BookingManagementService.confirmBooking(bookingId, clientId);
        } else {
          const booking = await BookingManagementService.findBookingByContext(clientId, userMessage);
          if (booking) {
            result = await BookingManagementService.confirmBooking(booking.id, clientId);
          } else {
            const bookings = await BookingManagementService.getClientActiveBookings(clientId);
            if (bookings.length === 1) {
              result = await BookingManagementService.confirmBooking(bookings[0].id, clientId);
            } else if (bookings.length > 1) {
              result = await BookingManagementService.listClientBookings(clientId);
              result.message = 'Tienes varias reservas. ¿Cuál quieres confirmar?\n\n' + result.message;
            }
            // Si no hay reservas, no hacer nada y continuar evaluando otras acciones
          }
        }
      }

      // 3. Cancelar reserva (REQUIERE AUTENTICACIÓN)
      if (
        !action && (
          intent === 'cancel_booking' ||
          (messageLower.includes('cancelar') && (messageLower.includes('reserva') || messageLower.includes('cita') || messageLower.includes('hora')))
        )
      ) {
        action = 'cancel';
        requiresAuth = true;

        logger.info('🔍 Cancelación detectada', {
          intent,
          messageLower,
          conversationId
        });

        // Verificar autenticación
        const authResult = await ChatAuthService.verifyClientForSensitiveAction(
          clientId,
          conversationId,
          'cancel'
        );

        if (!authResult.isVerified) {
          return {
            message: authResult.message,
            action: 'auth_required',
            bookingId: undefined
          };
        }

        // Cliente verificado, proceder con cancelación
        const booking = await BookingManagementService.findBookingByContext(clientId, userMessage);
        if (booking) {
          result = await BookingManagementService.cancelBooking(booking.id, clientId, 'Cancelado por el cliente');
        } else {
          const bookings = await BookingManagementService.getClientActiveBookings(clientId);
          if (bookings.length === 1) {
            result = await BookingManagementService.cancelBooking(bookings[0].id, clientId, 'Cancelado por el cliente');
          } else if (bookings.length > 1) {
            result = await BookingManagementService.listClientBookings(clientId);
            result.message = 'Tienes varias reservas. ¿Cuál quieres cancelar?\n\n' + result.message;
          } else {
            return null;
          }
        }
      }

      // 4. Reagendar reserva (REQUIERE AUTENTICACIÓN)
      if (
        !action && (
          intent === 'reschedule_booking' ||
          ((messageLower.includes('reagendar') || messageLower.includes('reprogramar') || messageLower.includes('cambiar')) &&
            (messageLower.includes('reserva') || messageLower.includes('cita') || messageLower.includes('hora')))
        )
      ) {
        action = 'reschedule';
        requiresAuth = true;

        logger.info('🔍 Reagendamiento detectado', {
          intent,
          messageLower,
          conversationId
        });

        // Verificar autenticación
        const authResult = await ChatAuthService.verifyClientForSensitiveAction(
          clientId,
          conversationId,
          'reschedule'
        );

        if (!authResult.isVerified) {
          return {
            message: authResult.message,
            action: 'auth_required',
            bookingId: undefined
          };
        }

        // Cliente verificado, proceder con reagendamiento
        const booking = await BookingManagementService.findBookingByContext(clientId, userMessage);
        if (booking) {
          result = await BookingManagementService.initiateReschedule(booking.id, clientId);
        } else {
          const bookings = await BookingManagementService.getClientActiveBookings(clientId);
          if (bookings.length === 1) {
            result = await BookingManagementService.initiateReschedule(bookings[0].id, clientId);
          } else if (bookings.length > 1) {
            result = await BookingManagementService.listClientBookings(clientId);
            result.message = 'Tienes varias reservas. ¿Cuál quieres reagendar?\n\n' + result.message;
          } else {
            return null;
          }
        }
      }

      // 5. Consultar información de reserva
      if (
        !action && (
          (messageLower.includes('información') || messageLower.includes('detalles') || messageLower.includes('ver')) &&
          (messageLower.includes('reserva') || messageLower.includes('cita'))
        )
      ) {
        action = 'info';
        const booking = await BookingManagementService.findBookingByContext(clientId, userMessage);
        if (booking) {
          result = await BookingManagementService.getBookingInfo(booking.id, clientId);
        } else {
          result = await BookingManagementService.listClientBookings(clientId);
        }
      }

      if (result && action) {
        return {
          message: result.message,
          action,
          bookingId: result.booking?.id
        };
      }

      return null;
    } catch (error) {
      logger.error('Error handling booking management:', error);
      return null;
    }
  }

  /**
   * Generar link de reserva si el usuario confirma que quiere agendar
   * SIMPLIFICADO: Solo usa [SERVICE_ID:xxx] del AI para máxima confiabilidad
   */
  private static async generateBookingLinkIfNeeded(
    userMessage: string,
    intent: string,
    context: any,
    conversationId: string
  ): Promise<string | null> {
    try {
      logger.info('🔵 generateBookingLinkIfNeeded CALLED', {
        userMessage,
        intent,
        conversationId,
        contextLastMessagesCount: context.lastMessages?.length || 0
      });

      const messageLower = userMessage.toLowerCase().trim();

      // ============================================
      // CONFIRMACIÓN ROBUSTA SIN FALSOS POSITIVOS
      // ============================================
      
      // REGLA 1: Verificar estado explícito de espera de confirmación
      const awaitingConfirmation = await ContextManager.getVariable(conversationId, 'awaitingBookingConfirmation');
      
      logger.info('🔍 Checking awaitingBookingConfirmation state', {
        awaitingConfirmation,
        conversationId
      });
      
      // Si NO hay estado de espera, NO generar link (evita falsos positivos)
      if (!awaitingConfirmation) {
        logger.info('❌ NOT awaiting booking confirmation, NOT generating booking link', {
          conversationId,
          userMessage: userMessage.substring(0, 50)
        });
        return null;
      }
      
      // REGLA 2: Verificar confirmación válida (intent affirmative O keywords explícitos)
      const isAffirmativeIntent = intent === 'affirmative';
      
      // Keywords explícitos de confirmación (INCLUIR "agendar" y "reservar")
      const explicitConfirmationKeywords = [
        'quiero reservar', 'quiero agendar', 'agendar cita', 'reservar cita',
        'sí quiero', 'si quiero', 'sí, quiero', 'si, quiero',
        'quiero ese', 'quiero esa', 'me interesa ese', 'me interesa esa',
        'confirmo', 'adelante', 'proceder',
        'sí, reservar', 'si, reservar', 'sí, agendar', 'si, agendar',
        'agendar', 'reservar' // Agregar palabras solas cuando hay estado de espera
      ];
      
      const hasExplicitConfirmation = explicitConfirmationKeywords.some(kw => messageLower.includes(kw));
      
      // Confirmación válida: intent affirmative O confirmación explícita
      const hasValidConfirmation = isAffirmativeIntent || hasExplicitConfirmation;
      
      logger.info('🔍 Confirmation validation', {
        awaitingConfirmation,
        isAffirmativeIntent,
        hasExplicitConfirmation,
        hasValidConfirmation,
        messageLower,
        conversationId
      });
      
      // Si no hay confirmación válida, NO generar link
      if (!hasValidConfirmation) {
        logger.info('❌ No valid confirmation detected, NOT generating booking link', {
          conversationId,
          userMessage: userMessage.substring(0, 50)
        });
        return null;
      }

      logger.info('✅ Valid confirmation detected, proceeding to find SERVICE_ID');

      // ============================================
      // BUSCAR SERVICE_ID (SOLO contexto o metadata)
      // ============================================
      let serviceId: string | null = null;

      // Estrategia 0 (MÁXIMA PRIORIDAD): Usar serviceId guardado en el contexto
      const contextServiceId = await ContextManager.getVariable(conversationId, 'contextServiceId');
      if (contextServiceId) {
        serviceId = contextServiceId;
        const contextServiceName = await ContextManager.getVariable(conversationId, 'contextServiceName');
        logger.info('✅ SERVICE_ID found in conversation context (HIGHEST PRIORITY):', { 
          serviceId, 
          serviceName: contextServiceName,
          conversationId
        });
      } else {
        logger.warn('⚠️ No contextServiceId found in conversation context', {
          conversationId,
          userMessage: userMessage.substring(0, 50)
        });
      }

      // Estrategia 1: Buscar en metadata de mensajes anteriores del AI (solo si no hay en contexto)
      if (!serviceId && context.lastMessages && context.lastMessages.length > 0) {
        const recentAIMessages = context.lastMessages
          .filter((msg: any) => msg.senderType === 'ai')
          .slice(-3)
          .reverse();

        for (const aiMsg of recentAIMessages) {
          // Buscar en el metadata (más confiable que el contenido)
          if (aiMsg.metadata) {
            const metadata = typeof aiMsg.metadata === 'string' 
              ? JSON.parse(aiMsg.metadata) 
              : aiMsg.metadata;
            
            if (metadata.serviceId) {
              serviceId = metadata.serviceId;
              logger.info('✅ SERVICE_ID found in AI message metadata:', { 
                serviceId,
                serviceName: metadata.serviceName 
              });
              break;
            }
          }
        }
      }

      // Si aún no encontramos servicio, NO generar link
      if (!serviceId) {
        logger.warn('❌ No service found, NOT generating booking link', {
          conversationId,
          userMessage: userMessage.substring(0, 50),
          checkedContext: true,
          checkedMessages: true
        });
        return null;
      }

      logger.info('🔍 Validating service exists and is active', { serviceId });

      // Validar que el servicio existe y está activo
      const { ServiceService } = await import('../ServiceService');
      const result = await ServiceService.getServices({ isActive: true, limit: 300 });
      const service = result.services.find((s: any) => s.id === serviceId);

      if (!service) {
        logger.warn('❌ Service ID found but service not active or not found:', { 
          serviceId,
          conversationId 
        });
        return null;
      }

      // Generar link usando slug en lugar de ID
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      const bookingLink = `${frontendUrl}/reservar?service=${service.slug}`;
      
      // Limpiar estado de espera después de generar el link
      await ContextManager.setVariable(conversationId, 'awaitingBookingConfirmation', false);
      
      logger.info('✅✅✅ BOOKING LINK GENERATED SUCCESSFULLY', { 
        serviceId, 
        slug: service.slug, 
        serviceName: service.name,
        bookingLink,
        conversationId,
        awaitingConfirmationCleared: true
      });
      
      return bookingLink;

    } catch (error) {
      logger.error('Error generating booking link:', error);
      return null;
    }
  }

  /**
   * Generar respuesta simple basada en la intención
   */
  private static generateSimpleResponse(intent: string, clientName: string): string {
    const firstName = clientName.split(' ')[0];

    switch (intent) {
      case 'greeting':
        return `¡Hola ${firstName}! 👋 Soy tu asistente virtual de la Clínica de Belleza.\n\n¿En qué puedo ayudarte hoy?\n• Ver servicios disponibles\n• Reservar una cita\n• Consultar precios\n• Información sobre tratamientos`;
      case 'booking_request':
        return `Perfecto ${firstName}, te ayudo a reservar tu cita. 📅\n\n¿Qué servicio te interesa? Puedo ayudarte con:\n• Tratamientos faciales\n• Tratamientos corporales\n• Manicure y pedicure\n• Masajes y spa`;
      case 'service_inquiry':
        return `Claro ${firstName}, déjame ayudarte con información sobre nuestros servicios. ¿Qué tipo de tratamiento te interesa?`;
      case 'product_inquiry':
        return `Con gusto te informo sobre nuestros productos. ¿Buscas algo específico?`;
      case 'price_inquiry':
        return `Te puedo ayudar con información de precios. ¿Qué servicio o producto te interesa?`;
      case 'goodbye':
        return `¡Hasta pronto ${firstName}! Ha sido un placer ayudarte. 😊\n\nSi necesitas algo más, aquí estaré.`;
      default:
        return `Entiendo ${firstName}. ¿Podrías darme más detalles sobre lo que necesitas? Puedo ayudarte con servicios, reservas, precios o cualquier consulta sobre nuestros tratamientos.`;
    }
  }

  /**
   * Generar mensaje de escalación según la razón
   */
  private static async generateEscalationMessage(reason: string, channel: ConversationChannel = 'web'): Promise<string> {
    // Obtener número de WhatsApp de la configuración SOLO si el canal es web
    let whatsappLink = '';
    if (channel === 'web') {
      try {
        const { CompanySettingsModel } = await import('../../models/CompanySettings');
        const settings = await CompanySettingsModel.getSettings();
        
        logger.info('🔍 Generating escalation message', {
          channel,
          hasSettings: !!settings,
          hasWhatsapp: !!settings?.contactWhatsapp,
          whatsappNumber: settings?.contactWhatsapp
        });
        
        if (settings?.contactWhatsapp) {
          const cleanNumber = settings.contactWhatsapp.replace(/[^\d+]/g, '');
          const message = encodeURIComponent('Hola, vengo desde el sitio web. Necesito hablar con un humano');
          whatsappLink = `\n\n📱 También puedes contactarnos directamente por WhatsApp:\nhttps://wa.me/${cleanNumber}?text=${message}`;
          
          logger.info('✅ WhatsApp link generated', {
            cleanNumber,
            linkLength: whatsappLink.length,
            link: whatsappLink
          });
        } else {
          logger.warn('⚠️ No WhatsApp number configured in company_settings');
        }
      } catch (error) {
        logger.error('Error obteniendo número de WhatsApp para escalación:', error);
      }
    } else {
      logger.info('📱 Channel is not web, skipping WhatsApp link', { channel });
    }

    const baseMessage = (() => {
      switch (reason) {
        case 'complaint':
          return 'Entiendo tu preocupación y quiero asegurarme de que recibas la mejor atención. Te voy a conectar con uno de nuestros especialistas que podrá ayudarte mejor. Un momento por favor...';

        case 'failed_attempts':
          return 'Veo que hemos tenido algunas dificultades para entendernos. Permíteme conectarte con un agente humano que podrá asistirte de manera más personalizada.';

        case 'complex_request':
          return 'Tu consulta requiere atención especializada. Te voy a transferir con uno de nuestros expertos que podrá darte una respuesta más detallada.';

        case 'payment_issue':
          return 'Para asuntos relacionados con pagos, es mejor que hables directamente con nuestro equipo especializado. Te conecto ahora mismo.';

        case 'client_request':
          return 'Entendido. Apenas una persona esté disponible, te hablará de forma directa para atenderte personalmente.';

        case 'technical_issue':
          return 'Ha ocurrido un problema técnico. Un especialista te contactará para asistirte.';

        default:
          return 'Te voy a conectar con uno de nuestros especialistas para brindarte la mejor atención posible. Un momento por favor...';
      }
    })();

    const finalMessage = baseMessage + whatsappLink;
    
    logger.info('📨 Final escalation message generated', {
      reason,
      channel,
      baseMessageLength: baseMessage.length,
      whatsappLinkLength: whatsappLink.length,
      finalMessageLength: finalMessage.length,
      hasWhatsappLink: whatsappLink.length > 0,
      finalMessage: finalMessage.substring(0, 200) + '...'
    });

    return finalMessage;
  }

  /**
   * Detectar y guardar opciones de servicios cuando el AI lista múltiples servicios
   */
  private static async detectAndSaveServiceOptions(
    aiMessage: string,
    conversationId: string
  ): Promise<void> {
    try {
      // Detectar si el mensaje contiene una lista de servicios
      // Formatos soportados:
      // 1. "1. *Depilación láser bigote (8 sesiones)* - $120,000"
      // 2. "• Nombre del servicio (X sesiones) - $precio"
      // 3. "1. Nombre del servicio (X sesiones) - $precio"
      
      // Pattern mejorado que captura el formato con asteriscos
      // Captura: número, asterisco opcional, nombre (puede contener asteriscos), sesiones opcionales, precio
      // Explicación: \*?\s* = asterisco opcional + espacios, (.+?) = nombre (cualquier cosa), \*?\s* = asterisco opcional + espacios
      const serviceListPattern = /(?:^|\n)\s*(\d+)\.\s*\*?\s*(.+?)\s*\*?\s*(?:\((\d+)\s*sesiones?\))?\s*\*?\s*[-–—]\s*\$?\s*([\d,\.]+)/gi;
      const matches = [...aiMessage.matchAll(serviceListPattern)];
      
      logger.info('🔍 Searching for service list in AI message', {
        messageLength: aiMessage.length,
        matchesFound: matches.length,
        conversationId,
        messagePreview: aiMessage.substring(0, 500),
        matches: matches.map(m => ({
          fullMatch: m[0],
          number: m[1],
          name: m[2]?.trim(),
          sessions: m[3],
          price: m[4]
        }))
      });
      
      if (matches.length >= 2) {
        // Hay múltiples servicios listados, buscarlos en la BD
        logger.info('📋 Multiple services detected in AI response, searching in database', {
          count: matches.length,
          conversationId
        });
        
        const { ServiceService } = await import('../ServiceService');
        const result = await ServiceService.getServices({ isActive: true, limit: 300 });
        const allServices = result.services;
        
        logger.info('📊 Total services in database', {
          count: allServices.length,
          conversationId
        });
        
        const serviceOptions: any[] = [];
        
        for (let i = 0; i < matches.length; i++) {
          const match = matches[i];
          const listNumber = match[1]; // El número en la lista (1, 2, 3, etc.)
          const serviceName = match[2].trim().replace(/\*/g, ''); // El nombre del servicio, limpiar asteriscos
          const sessions = match[3]; // Las sesiones (opcional)
          let priceStr = match[4].replace(/[,\s]/g, ''); // El precio, eliminar comas y espacios
          
          // Normalizar precio: si tiene punto decimal, mantenerlo; si no, es entero
          const priceNum = priceStr.includes('.') 
            ? parseFloat(priceStr) 
            : parseInt(priceStr, 10);
          
          logger.info(`🔎 Looking for service ${i + 1} (list number: ${listNumber})`, {
            listNumber,
            serviceName,
            sessions,
            priceStr,
            priceNum,
            conversationId
          });
          
          // Buscar el servicio en la BD por nombre y precio
          // Normalizar para comparación (quitar acentos, mayúsculas, etc.)
          const normalizeText = (text: string) => {
            return text
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .replace(/[^a-z0-9\s]/g, "")
              .trim();
          };
          
          const normalizedSearchName = normalizeText(serviceName);
          
          const foundService = allServices.find((s: any) => {
            const normalizedServiceName = normalizeText(s.name);
            
            // Verificar coincidencia de nombre - más tolerante
            // Buscar si el nombre del servicio contiene las palabras clave principales
            const searchWords = normalizedSearchName.split(/\s+/).filter((w: string) => w.length > 3);
            
            // Si el nombre normalizado del servicio contiene las palabras clave
            const nameMatch = searchWords.length > 0 && searchWords.every((word: string) => 
              normalizedServiceName.includes(word)
            );
            
            // Verificar coincidencia de precio (tolerante a diferencias pequeñas)
            const servicePriceNum = parseInt(s.price.toString(), 10);
            const priceDiff = Math.abs(servicePriceNum - priceNum);
            const priceMatch = priceDiff < 100; // Tolerancia de $100
            
            const isMatch = nameMatch && priceMatch;
            
            if (searchWords.length > 0 && (nameMatch || priceMatch)) {
              logger.info(`  Comparing with: ${s.name}`, {
                normalizedServiceName,
                normalizedSearchName,
                searchWords,
                nameMatch,
                priceMatch,
                isMatch,
                servicePrice: s.price,
                servicePriceNum,
                searchPrice: priceNum,
                priceDiff,
                conversationId
              });
            }
            
            return isMatch;
          });
          
          if (foundService) {
            serviceOptions.push({
              id: foundService.id,
              name: foundService.name,
              slug: foundService.slug,
              price: foundService.price
            });
            logger.info(`✅ Service found: ${foundService.name}`, {
              id: foundService.id,
              slug: foundService.slug,
              conversationId
            });
          } else {
            logger.warn(`⚠️ Service not found in database`, {
              serviceName,
              priceNum,
              normalizedSearchName,
              conversationId
            });
          }
        }
        
        if (serviceOptions.length >= 2) {
          // Guardar las opciones en el contexto
          await ContextManager.setVariable(conversationId, 'serviceOptions', serviceOptions);
          logger.info('✅✅✅ Service options saved to context', {
            count: serviceOptions.length,
            services: serviceOptions.map((s, idx) => ({ 
              index: idx + 1,
              name: s.name, 
              id: s.id,
              slug: s.slug,
              price: s.price
            })),
            conversationId
          });
        } else {
          logger.warn('⚠️ Not enough services found to save options', {
            foundCount: serviceOptions.length,
            requiredCount: 2,
            conversationId
          });
        }
      } else {
        logger.info('ℹ️ No service list detected (less than 2 matches)', {
          matchesFound: matches.length,
          conversationId
        });
      }
    } catch (error) {
      logger.error('Error detecting and saving service options:', error);
    }
  }

  /**
   * Detectar y guardar servicio mencionado en la respuesta del AI
   * DEPRECADO: Ya no se usa. Solo confiamos en [SERVICE_ID:xxx] explícito del AI
   * Mantenido por compatibilidad pero no se llama desde ningún lugar
   */
  private static async detectAndSaveServiceFromResponse(
    aiMessage: string,
    conversationId: string
  ): Promise<void> {
    // DEPRECADO: Esta función ya no se usa
    // Solo confiamos en [SERVICE_ID:xxx] explícito del AI
    logger.debug('detectAndSaveServiceFromResponse is deprecated and not used');
  }

  /**
   * Obtener estadísticas del router
   */
  static getStats(): {
    activeRateLimits: number;
    config: MessageRouterConfig;
  } {
    this.cleanupRateLimits();

    return {
      activeRateLimits: this.rateLimitMap.size,
      config: this.getConfig()
    };
  }

  /**
   * Generar menú principal inicial (primer contacto)
   */
  static async generateMainMenu(clientName?: string): Promise<string> {
    const greeting = `¡Hola${clientName ? ' ' + clientName : ''}! � Bienvenido a Laxmi, tu clínica de belleza.`;
    
    const menu = `${greeting}

¿En qué puedo ayudarte hoy?

1. Ver nuestros servicios
2. Hacer una consulta
3. Agendar una cita

⚠️ IMPORTANTE: Responde SOLO con el número de tu opción.`;
    
    return menu;
  }

  /**
   * Generar menú de categorías de servicios
   */
  static async generateCategoriesMenu(): Promise<string> {
    try {
      const { ServiceService } = await import('../ServiceService');
      let categories = await ServiceService.getCategories();
      
      logger.info('📋 Generating categories menu', {
        categoriesCount: categories.length,
        categories: categories.map(c => c.name)
      });
      
      // Si no hay categorías desde service_categories, usar categorías hardcodeadas como fallback
      if (categories.length === 0) {
        logger.warn('No categories found from database, using fallback categories');
        categories = [
          { name: 'Depilación', description: 'Servicios de depilación', serviceCount: 0 },
          { name: 'Tratamientos Faciales', description: 'Servicios de tratamientos faciales', serviceCount: 0 },
          { name: 'Tratamientos Corporales', description: 'Servicios de tratamientos corporales', serviceCount: 0 }
        ];
      }
      
      let menu = `Perfecto, aquí están nuestras categorías de servicios:\n\n`;
      
      categories.forEach((category, index) => {
        menu += `${index + 1}. ${category.name}\n`;
      });
      
      menu += `\n⚠️ IMPORTANTE: Responde SOLO con el número de la categoría que te interesa.`;
      
      return menu;
    } catch (error) {
      logger.error('Error generating categories menu:', error);
      // En caso de error, regresar al menú principal
      return `Lo siento, hubo un error al cargar las categorías.

Volvamos al inicio. ¿En qué puedo ayudarte?

1. Ver nuestros servicios
2. Hacer una consulta
3. Agendar una cita

⚠️ IMPORTANTE: Responde SOLO con el número de tu opción.`;
    }
  }

  /**
   * Verificar si un mensaje es el menú principal
   */
  static isMainMenu(message: string): boolean {
    // Verificar si el mensaje contiene el patrón del menú principal
    return message.includes('¿En qué puedo ayudarte hoy?') && 
           message.includes('1. Ver nuestros servicios') &&
           message.includes('2. Hacer una consulta') &&
           message.includes('3. Agendar una cita');
  }

  /**
   * Obtener número de categorías del menú principal
   */
  static async getMainMenuCategoriesCount(): Promise<number> {
    try {
      const { ServiceService } = await import('../ServiceService');
      const categories = await ServiceService.getCategories();
      
      // Si no hay categorías, usar fallback de 3 categorías
      if (categories.length === 0) {
        logger.warn('No categories found, using fallback count of 3');
        return 3; // Depilación, Tratamientos Faciales, Tratamientos Corporales
      }
      
      return categories.length;
    } catch (error) {
      logger.error('Error getting categories count:', error);
      return 3; // Fallback a 3 categorías por defecto
    }
  }
}