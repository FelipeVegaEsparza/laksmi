import { Request, Response } from 'express';
import { KnowledgeService } from '../services/KnowledgeService';
import { AuthenticatedRequest } from '../middleware/auth';
import logger from '../utils/logger';

export class KnowledgeController {
  // ==================== SEARCH ====================
  
  static async search(req: Request, res: Response): Promise<void> {
    try {
      const { query, conversationId, limit, types } = req.query;
      
      if (!query || typeof query !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Query parameter is required',
        });
        return;
      }
      
      const searchRequest = {
        query,
        conversationId: conversationId as string,
        limit: limit ? parseInt(limit as string) : undefined,
        types: types ? (types as string).split(',') as any : undefined,
      };
      
      const results = await KnowledgeService.search(searchRequest);
      
      res.json({
        success: true,
        data: results,
      });
    } catch (error: any) {
      logger.error('Search knowledge base error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error searching knowledge base',
      });
    }
  }

  static async provideFeedback(req: Request, res: Response): Promise<void> {
    try {
      const { searchId } = req.params;
      const { helpful, resultId, resultType } = req.body;
      
      await KnowledgeService.provideFeedback(searchId, helpful, resultId, resultType);
      
      res.json({
        success: true,
        message: 'Feedback recorded successfully',
      });
    } catch (error: any) {
      logger.error('Provide feedback error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error recording feedback',
      });
    }
  }

  // ==================== CATEGORIES ====================
  
  static async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await KnowledgeService.getAllCategories();
      
      res.json({
        success: true,
        data: categories,
      });
    } catch (error: any) {
      logger.error('Get categories error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error fetching categories',
      });
    }
  }

  // ==================== ARTICLES ====================
  
  static async createArticle(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const article = await KnowledgeService.createArticle(req.body, req.user!.userId);
      
      res.status(201).json({
        success: true,
        message: 'Article created successfully',
        data: article,
      });
    } catch (error: any) {
      logger.error('Create article error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Error creating article',
      });
    }
  }

  static async updateArticle(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const article = await KnowledgeService.updateArticle(id, req.body, req.user!.userId);
      
      res.json({
        success: true,
        message: 'Article updated successfully',
        data: article,
      });
    } catch (error: any) {
      logger.error('Update article error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Error updating article',
      });
    }
  }

  static async deleteArticle(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await KnowledgeService.deleteArticle(id);
      
      res.json({
        success: true,
        message: 'Article deleted successfully',
      });
    } catch (error: any) {
      logger.error('Delete article error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Error deleting article',
      });
    }
  }

  static async getArticle(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const article = await KnowledgeService.getArticleById(id);
      
      if (!article) {
        res.status(404).json({
          success: false,
          error: 'Article not found',
        });
        return;
      }
      
      res.json({
        success: true,
        data: article,
      });
    } catch (error: any) {
      logger.error('Get article error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error fetching article',
      });
    }
  }

  // ==================== FAQs ====================
  
  static async getFAQs(req: Request, res: Response): Promise<void> {
    try {
      const { categoryId } = req.query;
      const faqs = await KnowledgeService.getAllFAQs(categoryId as string);
      
      res.json({
        success: true,
        data: faqs,
      });
    } catch (error: any) {
      logger.error('Get FAQs error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error fetching FAQs',
      });
    }
  }

  static async createFAQ(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const faq = await KnowledgeService.createFAQ(req.body);
      
      res.status(201).json({
        success: true,
        message: 'FAQ created successfully',
        data: faq,
      });
    } catch (error: any) {
      logger.error('Create FAQ error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Error creating FAQ',
      });
    }
  }

  static async updateFAQ(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const faq = await KnowledgeService.updateFAQ(id, req.body);
      
      res.json({
        success: true,
        message: 'FAQ updated successfully',
        data: faq,
      });
    } catch (error: any) {
      logger.error('Update FAQ error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Error updating FAQ',
      });
    }
  }

  static async deleteFAQ(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await KnowledgeService.deleteFAQ(id);
      
      res.json({
        success: true,
        message: 'FAQ deleted successfully',
      });
    } catch (error: any) {
      logger.error('Delete FAQ error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Error deleting FAQ',
      });
    }
  }

  // ==================== TECHNOLOGIES ====================
  
  static async getTechnologies(req: Request, res: Response): Promise<void> {
    try {
      const technologies = await KnowledgeService.getAllTechnologies();
      
      res.json({
        success: true,
        data: technologies,
      });
    } catch (error: any) {
      logger.error('Get technologies error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error fetching technologies',
      });
    }
  }

  static async createTechnology(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const technology = await KnowledgeService.createTechnology(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Technology created successfully',
        data: technology,
      });
    } catch (error: any) {
      logger.error('Create technology error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Error creating technology',
      });
    }
  }

  static async updateTechnology(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const technology = await KnowledgeService.updateTechnology(id, req.body);
      
      res.json({
        success: true,
        message: 'Technology updated successfully',
        data: technology,
      });
    } catch (error: any) {
      logger.error('Update technology error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Error updating technology',
      });
    }
  }

  static async deleteTechnology(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await KnowledgeService.deleteTechnology(id);
      
      res.json({
        success: true,
        message: 'Technology deleted successfully',
      });
    } catch (error: any) {
      logger.error('Delete technology error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Error deleting technology',
      });
    }
  }

  // ==================== INGREDIENTS ====================
  
  static async getIngredients(req: Request, res: Response): Promise<void> {
    try {
      const ingredients = await KnowledgeService.getAllIngredients();
      
      res.json({
        success: true,
        data: ingredients,
      });
    } catch (error: any) {
      logger.error('Get ingredients error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error fetching ingredients',
      });
    }
  }

  static async createIngredient(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const ingredient = await KnowledgeService.createIngredient(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Ingredient created successfully',
        data: ingredient,
      });
    } catch (error: any) {
      logger.error('Create ingredient error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Error creating ingredient',
      });
    }
  }

  static async updateIngredient(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const ingredient = await KnowledgeService.updateIngredient(id, req.body);
      
      res.json({
        success: true,
        message: 'Ingredient updated successfully',
        data: ingredient,
      });
    } catch (error: any) {
      logger.error('Update ingredient error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Error updating ingredient',
      });
    }
  }

  static async deleteIngredient(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await KnowledgeService.deleteIngredient(id);
      
      res.json({
        success: true,
        message: 'Ingredient deleted successfully',
      });
    } catch (error: any) {
      logger.error('Delete ingredient error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Error deleting ingredient',
      });
    }
  }

  // ==================== STATISTICS ====================
  
  static async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await KnowledgeService.getStats();
      
      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error('Get stats error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error fetching statistics',
      });
    }
  }
}
