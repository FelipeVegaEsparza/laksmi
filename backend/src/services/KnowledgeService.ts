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
    try {
      let context = '';
      
      // 1. Buscar en la base de conocimientos
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
      
      // 2. SIEMPRE incluir lista de servicios para que el AI tenga contexto completo
      try {
        const { ServiceService } = await import('./ServiceService');
        const result = await ServiceService.getServices({ isActive: true, limit: 100 });
        const services = result.services;
        
        if (services && services.length > 0) {
          context += '\n\nSERVICIOS DISPONIBLES CON PRECIOS OFICIALES:\n\n';
          services.forEach((service: any) => {
            context += `• ${service.name}\n`;
            context += `  Precio: $${service.price}\n`;
            context += `  Duración: ${service.duration} minutos\n`;
            if (service.description) {
              context += `  Descripción: ${service.description}\n`;
            }
            context += '\n';
          });
          context += '\nIMPORTANTE: Estos son los ÚNICOS servicios y precios oficiales. Si el usuario pregunta por un precio, búscalo en esta lista y responde con el precio exacto. No menciones otros servicios que no estén en esta lista.\n';
          
          logger.info(`Services loaded for AI context: ${services.length} services`);
        }
      } catch (error) {
        logger.warn('Error fetching services for AI context:', error);
      }
      
      if (!context) {
        return 'No se encontró información específica en la base de conocimientos. Por favor, solicita hablar con un especialista para obtener información precisa.';
      }
      
      return context;
    } catch (error) {
      logger.error('Error getting context for AI:', error);
      return 'Error al buscar información. Por favor, solicita hablar con un especialista.';
    }
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
