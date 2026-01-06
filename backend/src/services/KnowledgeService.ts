import { KnowledgeModel } from '../models/Knowledge';
import {
  KnowledgeSearchRequest,
  KnowledgeSearchResponse,
  SearchResult,
  CreateArticleRequest,
  UpdateArticleRequest,
  CreateFAQRequest,
  UpdateFAQRequest,
  CreateTechnologyRequest,
  CreateIngredientRequest,
  KnowledgeStats,
} from '../types/knowledge';
import logger from '../utils/logger';

export class KnowledgeService {
  /**
   * Search knowledge base for relevant information
   */
  static async search(request: KnowledgeSearchRequest): Promise<KnowledgeSearchResponse> {
    try {
      const results = await KnowledgeModel.search(request);
      
      // Generate search ID for tracking
      const searchId = await KnowledgeModel.logSearch({
        conversationId: request.conversationId,
        query: request.query,
        resultsFound: results.length,
        resultIds: results.map(r => r.id),
      });
      
      return {
        results,
        totalResults: results.length,
        query: request.query,
        searchId,
      };
    } catch (error) {
      logger.error('Error searching knowledge base:', error);
      throw error;
    }
  }

  /**
   * Get context for AI chatbot from knowledge base
   * This method formats knowledge base results for the AI to use
   */
  static async getContextForAI(query: string, conversationId?: string): Promise<string> {
    let context = '';
    
    // 1. Intentar buscar en la base de conocimientos (pero no fallar si hay error)
    try {
      const searchResults = await this.search({
        query,
        conversationId,
        limit: 5,
      });
      
      if (searchResults.results.length > 0) {
        context += 'INFORMACIÓN DE LA BASE DE CONOCIMIENTOS:\n\n';
        searchResults.results.forEach((result, index) => {
          context += `${index + 1}. ${result.title}\n`;
          context += `   ${result.content}\n\n`;
        });
      }
    } catch (error) {
      logger.warn('Error searching knowledge base, continuing with services:', error);
      // No fallar, continuar con servicios
    }
    
    // 2. SIEMPRE incluir lista de servicios CON TODA LA INFORMACIÓN
    try {
      const { ServiceService } = await import('./ServiceService');
      const result = await ServiceService.getServices({ isActive: true, limit: 100 });
      const services = result.services;
        
        if (services && services.length > 0) {
          context += '\n\n═══════════════════════════════════════════════════\n';
          context += 'SERVICIOS DISPONIBLES - BASE DE DATOS:\n';
          context += '═══════════════════════════════════════════════════\n';
          context += '⚠️ INSTRUCCIÓN: Esta información está disponible, pero NO la entregues toda de golpe.\n';
          context += 'Sigue el flujo conversacional: PREGUNTA qué información necesita el usuario.\n\n';
          
          services.forEach((service: any, index: number) => {
            context += `${index + 1}. ${service.name.toUpperCase()}\n`;
            context += `   ID: ${service.id}\n`;  // ⚠️ IMPORTANTE: ID para generar link correcto
            context += `   Categoría: ${service.category}\n`;
            context += `   Precio: $${service.price}\n`;
            context += `   Duración: ${service.duration} minutos\n`;
            
            if (service.sessions && service.sessions > 1) {
              context += `   Sesiones recomendadas: ${service.sessions}\n`;
            }
            
            if (service.tag) {
              context += `   Etiqueta: ${service.tag}\n`;
            }
            
            if (service.description) {
              const cleanDescription = service.description.replace(/<[^>]*>/g, '').trim();
              if (cleanDescription) {
                context += `   Descripción: ${cleanDescription}\n`;
              }
            }
            
            if (service.benefits) {
              const cleanBenefits = service.benefits.replace(/<[^>]*>/g, '').trim();
              if (cleanBenefits) {
                context += `   Beneficios: ${cleanBenefits}\n`;
              }
            }
            
            if (service.requirements && service.requirements.length > 0) {
              context += `   Requisitos: ${service.requirements.join(', ')}\n`;
            }
            
            context += '\n';
          });
          
          context += '═══════════════════════════════════════════════════\n';
          context += 'REGLAS DE USO DE ESTA INFORMACIÓN:\n';
          context += '1. Cuando el usuario pregunte por una CATEGORÍA, lista SOLO nombres y precios\n';
          context += '2. Cuando el usuario elija UN servicio, NO des todos los detalles - PREGUNTA qué necesita saber\n';
          context += '3. Solo proporciona la información específica que el usuario solicite\n';
          context += '4. Si el usuario pregunta por un precio específico, responde SOLO con el precio\n';
          context += '5. Si el usuario pregunta por duración, responde SOLO con la duración\n';
          context += '6. Mantén la conversación INTERACTIVA y GRADUAL - NO des toda la info de golpe\n';
          context += '═══════════════════════════════════════════════════\n\n';
          
          logger.info(`Services loaded for AI context: ${services.length} services with full details`);
        }
      } catch (error) {
        logger.warn('Error fetching services for AI context:', error);
      }
      
      // 3. SIEMPRE incluir lista de productos CON TODA LA INFORMACIÓN
      try {
        const { ProductService } = await import('./ProductService');
        const result = await ProductService.getProducts({ limit: 100 });
        const products = result.products;
        
        if (products && products.length > 0) {
          context += '\n\n═══════════════════════════════════════════════════\n';
          context += 'PRODUCTOS DISPONIBLES CON INFORMACIÓN COMPLETA:\n';
          context += '═══════════════════════════════════════════════════\n\n';
          
          products.forEach((product: any, index: number) => {
            context += `${index + 1}. ${product.name.toUpperCase()}\n`;
            context += `   Categoría: ${product.category}\n`;
            context += `   Precio: $${product.price}\n`;
            context += `   Stock disponible: ${product.stock} unidades\n`;
            
            if (product.description) {
              context += `   Descripción: ${product.description}\n`;
            }
            
            if (product.ingredients && product.ingredients.length > 0) {
              context += `   Ingredientes principales: ${product.ingredients.slice(0, 5).join(', ')}\n`;
            }
            
            if (product.compatibleServices && product.compatibleServices.length > 0) {
              context += `   Compatible con servicios: ${product.compatibleServices.length} servicio(s)\n`;
            }
            
            context += '\n';
          });
          
          context += '═══════════════════════════════════════════════════\n';
          context += 'IMPORTANTE: Estos son los ÚNICOS productos oficiales.\n';
          context += '- Si el usuario pregunta por un precio de producto, búscalo en esta lista.\n';
          context += '- Menciona los ingredientes principales cuando sea relevante.\n';
          context += '- Sugiere productos compatibles con los servicios que el usuario consulta.\n';
          context += '═══════════════════════════════════════════════════\n\n';
          
          logger.info(`Products loaded for AI context: ${products.length} products with full details`);
        }
      } catch (error) {
        logger.warn('Error fetching products for AI context:', error);
      }
      
      // Si no hay contexto después de intentar cargar todo, retornar mensaje apropiado
      if (!context) {
        logger.warn('No context generated for AI - no services or products found');
        return 'No se encontró información específica en la base de conocimientos. Por favor, solicita hablar con un especialista para obtener información precisa.';
      }
      
      return context;
  }

  /**
   * Get formatted answer from knowledge base
   * Returns a user-friendly response based on search results
   */
  static async getFormattedAnswer(query: string, conversationId?: string): Promise<string | null> {
    try {
      const searchResults = await this.search({
        query,
        conversationId,
        limit: 3,
      });
      
      if (searchResults.results.length === 0) {
        return null;
      }
      
      // If we have FAQs, prioritize them
      const faqResults = searchResults.results.filter(r => r.type === 'faq');
      
      if (faqResults.length > 0) {
        const faq = faqResults[0];
        return `**${faq.title}**\n\n${faq.content}`;
      }
      
      // Otherwise, use the best match
      const bestMatch = searchResults.results[0];
      return `**${bestMatch.title}**\n\n${bestMatch.content}`;
      
    } catch (error) {
      logger.error('Error getting formatted answer:', error);
      return null;
    }
  }

  /**
   * Mark search result as helpful or not
   */
  static async provideFeedback(
    searchId: string,
    helpful: boolean,
    resultId?: string,
    resultType?: string
  ): Promise<void> {
    try {
      // Mark search as helpful
      await KnowledgeModel.markSearchHelpful(searchId, helpful);
      
      // If specific result feedback, mark that too
      if (resultId && resultType) {
        if (resultType === 'article') {
          await KnowledgeModel.markArticleHelpful(resultId, helpful);
        } else if (resultType === 'faq') {
          await KnowledgeModel.markFAQHelpful(resultId, helpful);
        }
      }
    } catch (error) {
      logger.error('Error providing feedback:', error);
      throw error;
    }
  }

  // ==================== ARTICLE MANAGEMENT ====================
  
  static async createArticle(data: CreateArticleRequest, userId: string) {
    return KnowledgeModel.createArticle(data, userId);
  }

  static async updateArticle(id: string, data: UpdateArticleRequest, userId: string) {
    return KnowledgeModel.updateArticle(id, data, userId);
  }

  static async deleteArticle(id: string) {
    return KnowledgeModel.deleteArticle(id);
  }

  static async getArticleById(id: string) {
    return KnowledgeModel.getArticleById(id);
  }

  // ==================== FAQ MANAGEMENT ====================
  
  static async createFAQ(data: CreateFAQRequest) {
    return KnowledgeModel.createFAQ(data);
  }

  static async updateFAQ(id: string, data: UpdateFAQRequest) {
    return KnowledgeModel.updateFAQ(id, data);
  }

  static async deleteFAQ(id: string) {
    return KnowledgeModel.deleteFAQ(id);
  }

  static async getFAQById(id: string) {
    return KnowledgeModel.getFAQById(id);
  }

  static async getAllFAQs(categoryId?: string) {
    return KnowledgeModel.getAllFAQs(categoryId);
  }

  // ==================== TECHNOLOGY MANAGEMENT ====================
  
  static async createTechnology(data: CreateTechnologyRequest) {
    return KnowledgeModel.createTechnology(data);
  }

  static async updateTechnology(id: string, data: Partial<CreateTechnologyRequest>) {
    return KnowledgeModel.updateTechnology(id, data);
  }

  static async deleteTechnology(id: string) {
    return KnowledgeModel.deleteTechnology(id);
  }

  static async getTechnologyById(id: string) {
    return KnowledgeModel.getTechnologyById(id);
  }

  static async getAllTechnologies() {
    return KnowledgeModel.getAllTechnologies();
  }

  // ==================== INGREDIENT MANAGEMENT ====================
  
  static async createIngredient(data: CreateIngredientRequest) {
    return KnowledgeModel.createIngredient(data);
  }

  static async updateIngredient(id: string, data: Partial<CreateIngredientRequest>) {
    return KnowledgeModel.updateIngredient(id, data);
  }

  static async deleteIngredient(id: string) {
    return KnowledgeModel.deleteIngredient(id);
  }

  static async getIngredientById(id: string) {
    return KnowledgeModel.getIngredientById(id);
  }

  static async getAllIngredients() {
    return KnowledgeModel.getAllIngredients();
  }

  // ==================== CATEGORIES ====================
  
  static async getAllCategories() {
    return KnowledgeModel.getAllCategories();
  }

  static async getCategoryById(id: string) {
    return KnowledgeModel.getCategoryById(id);
  }

  // ==================== STATISTICS ====================
  
  static async getStats(): Promise<KnowledgeStats> {
    // This would need additional queries to get stats
    // Placeholder implementation
    return {
      totalArticles: 0,
      totalFAQs: 0,
      totalTechnologies: 0,
      totalIngredients: 0,
      totalSearches: 0,
      topSearches: [],
      mostViewedArticles: [],
      mostHelpfulFAQs: [],
    };
  }
}
