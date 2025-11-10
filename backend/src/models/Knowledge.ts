import db from '../config/database';
import {
  KnowledgeCategory,
  KnowledgeArticle,
  KnowledgeFAQ,
  KnowledgeTechnology,
  KnowledgeIngredient,
  KnowledgeSearch,
  SearchResult,
  KnowledgeSearchRequest,
  CreateArticleRequest,
  UpdateArticleRequest,
  CreateFAQRequest,
  UpdateFAQRequest,
  CreateTechnologyRequest,
  CreateIngredientRequest,
} from '../types/knowledge';

export class KnowledgeModel {
  // ==================== CATEGORIES ====================
  
  static async getAllCategories(): Promise<KnowledgeCategory[]> {
    const categories = await db('knowledge_categories')
      .where('is_active', true)
      .orderBy('display_order', 'asc');
    
    return categories.map(this.formatCategory);
  }

  static async getCategoryById(id: string): Promise<KnowledgeCategory | null> {
    const category = await db('knowledge_categories').where({ id }).first();
    return category ? this.formatCategory(category) : null;
  }

  // ==================== ARTICLES ====================
  
  static async searchArticles(query: string, limit: number = 10): Promise<SearchResult[]> {
    const articles = await db('knowledge_articles')
      .where('is_published', true)
      .whereRaw('MATCH(title, content, summary, keywords) AGAINST(? IN NATURAL LANGUAGE MODE)', [query])
      .limit(limit);
    
    return articles.map(article => ({
      type: 'article' as const,
      id: article.id,
      title: article.title,
      content: article.summary || article.content.substring(0, 200),
      relevance: 1,
      metadata: {
        categoryId: article.category_id,
        tags: KnowledgeModel.parseJSON(article.tags),
      }
    }));
  }

  static async getArticleById(id: string): Promise<KnowledgeArticle | null> {
    const article = await db('knowledge_articles').where({ id }).first();
    
    if (!article) return null;
    
    // Increment view count
    await db('knowledge_articles').where({ id }).increment('view_count', 1);
    
    return this.formatArticle(article);
  }

  static async createArticle(data: CreateArticleRequest, userId: string): Promise<KnowledgeArticle> {
    const [id] = await db('knowledge_articles').insert({
      category_id: data.categoryId,
      title: data.title,
      content: data.content,
      summary: data.summary,
      keywords: JSON.stringify(data.keywords || []),
      tags: JSON.stringify(data.tags || []),
      related_services: JSON.stringify(data.relatedServices || []),
      related_products: JSON.stringify(data.relatedProducts || []),
      is_published: data.isPublished ?? true,
      published_at: data.isPublished ? new Date() : null,
      created_by: userId,
    });
    
    const article = await this.getArticleById(String(id));
    if (!article) throw new Error('Failed to create article');
    return article;
  }

  static async updateArticle(id: string, data: UpdateArticleRequest, userId: string): Promise<KnowledgeArticle> {
    const updateData: any = {
      updated_by: userId,
    };
    
    if (data.categoryId) updateData.category_id = data.categoryId;
    if (data.title) updateData.title = data.title;
    if (data.content) updateData.content = data.content;
    if (data.summary !== undefined) updateData.summary = data.summary;
    if (data.keywords) updateData.keywords = JSON.stringify(data.keywords);
    if (data.tags) updateData.tags = JSON.stringify(data.tags);
    if (data.relatedServices) updateData.related_services = JSON.stringify(data.relatedServices);
    if (data.relatedProducts) updateData.related_products = JSON.stringify(data.relatedProducts);
    if (data.isPublished !== undefined) {
      updateData.is_published = data.isPublished;
      if (data.isPublished) updateData.published_at = new Date();
    }
    
    await db('knowledge_articles').where({ id }).update(updateData);
    
    const article = await this.getArticleById(id);
    if (!article) throw new Error('Article not found');
    return article;
  }

  static async deleteArticle(id: string): Promise<void> {
    await db('knowledge_articles').where({ id }).delete();
  }

  // ==================== FAQs ====================
  
  static async searchFAQs(query: string, limit: number = 10): Promise<SearchResult[]> {
    const faqs = await db('knowledge_faqs')
      .where('is_active', true)
      .whereRaw('MATCH(question, answer, keywords) AGAINST(? IN NATURAL LANGUAGE MODE)', [query])
      .limit(limit);
    
    return faqs.map(faq => ({
      type: 'faq' as const,
      id: faq.id,
      title: faq.question,
      content: faq.answer,
      relevance: 1,
      metadata: {
        categoryId: faq.category_id,
      }
    }));
  }

  static async getAllFAQs(categoryId?: string): Promise<KnowledgeFAQ[]> {
    let query = db('knowledge_faqs').where('is_active', true);
    
    if (categoryId) {
      query = query.where('category_id', categoryId);
    }
    
    const faqs = await query.orderBy('display_order', 'asc');
    return faqs.map(this.formatFAQ);
  }

  static async getFAQById(id: string): Promise<KnowledgeFAQ | null> {
    const faq = await db('knowledge_faqs').where({ id }).first();
    
    if (!faq) return null;
    
    // Increment view count
    await db('knowledge_faqs').where({ id }).increment('view_count', 1);
    
    return this.formatFAQ(faq);
  }

  static async createFAQ(data: CreateFAQRequest): Promise<KnowledgeFAQ> {
    const [id] = await db('knowledge_faqs').insert({
      category_id: data.categoryId,
      question: data.question,
      answer: data.answer,
      keywords: JSON.stringify(data.keywords || []),
      display_order: data.displayOrder || 0,
    });
    
    const faq = await this.getFAQById(String(id));
    if (!faq) throw new Error('Failed to create FAQ');
    return faq;
  }

  static async updateFAQ(id: string, data: UpdateFAQRequest): Promise<KnowledgeFAQ> {
    const updateData: any = {};
    
    if (data.categoryId) updateData.category_id = data.categoryId;
    if (data.question) updateData.question = data.question;
    if (data.answer) updateData.answer = data.answer;
    if (data.keywords) updateData.keywords = JSON.stringify(data.keywords);
    if (data.displayOrder !== undefined) updateData.display_order = data.displayOrder;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;
    
    await db('knowledge_faqs').where({ id }).update(updateData);
    
    const faq = await this.getFAQById(id);
    if (!faq) throw new Error('FAQ not found');
    return faq;
  }

  static async deleteFAQ(id: string): Promise<void> {
    await db('knowledge_faqs').where({ id }).delete();
  }

  // ==================== TECHNOLOGIES ====================
  
  static async searchTechnologies(query: string, limit: number = 10): Promise<SearchResult[]> {
    const technologies = await db('knowledge_technologies')
      .where('is_active', true)
      .whereRaw('MATCH(name, description) AGAINST(? IN NATURAL LANGUAGE MODE)', [query])
      .limit(limit);
    
    return technologies.map(tech => ({
      type: 'technology' as const,
      id: tech.id,
      title: tech.name,
      content: tech.description.substring(0, 200),
      relevance: 1,
      metadata: {
        benefits: KnowledgeModel.parseJSON(tech.benefits),
        applications: KnowledgeModel.parseJSON(tech.applications),
      }
    }));
  }

  static async getAllTechnologies(): Promise<KnowledgeTechnology[]> {
    const technologies = await db('knowledge_technologies')
      .where('is_active', true);
    
    return technologies.map(this.formatTechnology);
  }

  static async getTechnologyById(id: string): Promise<KnowledgeTechnology | null> {
    const technology = await db('knowledge_technologies').where({ id }).first();
    return technology ? this.formatTechnology(technology) : null;
  }

  static async createTechnology(data: CreateTechnologyRequest): Promise<KnowledgeTechnology> {
    const [id] = await db('knowledge_technologies').insert({
      name: data.name,
      description: data.description,
      benefits: JSON.stringify(data.benefits || []),
      applications: JSON.stringify(data.applications || []),
      related_services: JSON.stringify(data.relatedServices || []),
      image_url: data.imageUrl,
    });
    
    const technology = await this.getTechnologyById(String(id));
    if (!technology) throw new Error('Failed to create technology');
    return technology;
  }

  static async updateTechnology(id: string, data: Partial<CreateTechnologyRequest>): Promise<KnowledgeTechnology> {
    const updateData: any = {};
    
    if (data.name) updateData.name = data.name;
    if (data.description) updateData.description = data.description;
    if (data.benefits) updateData.benefits = JSON.stringify(data.benefits);
    if (data.applications) updateData.applications = JSON.stringify(data.applications);
    if (data.relatedServices) updateData.related_services = JSON.stringify(data.relatedServices);
    if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl;
    
    await db('knowledge_technologies').where({ id }).update(updateData);
    
    const technology = await this.getTechnologyById(id);
    if (!technology) throw new Error('Technology not found');
    return technology;
  }

  static async deleteTechnology(id: string): Promise<void> {
    await db('knowledge_technologies').where({ id }).delete();
  }

  // ==================== INGREDIENTS ====================
  
  static async searchIngredients(query: string, limit: number = 10): Promise<SearchResult[]> {
    const ingredients = await db('knowledge_ingredients')
      .where('is_active', true)
      .whereRaw('MATCH(name, description) AGAINST(? IN NATURAL LANGUAGE MODE)', [query])
      .limit(limit);
    
    return ingredients.map(ing => ({
      type: 'ingredient' as const,
      id: ing.id,
      title: ing.name,
      content: ing.description.substring(0, 200),
      relevance: 1,
      metadata: {
        benefits: KnowledgeModel.parseJSON(ing.benefits),
      }
    }));
  }

  static async getAllIngredients(): Promise<KnowledgeIngredient[]> {
    const ingredients = await db('knowledge_ingredients')
      .where('is_active', true);
    
    return ingredients.map(this.formatIngredient);
  }

  static async getIngredientById(id: string): Promise<KnowledgeIngredient | null> {
    const ingredient = await db('knowledge_ingredients').where({ id }).first();
    return ingredient ? this.formatIngredient(ingredient) : null;
  }

  static async createIngredient(data: CreateIngredientRequest): Promise<KnowledgeIngredient> {
    const [id] = await db('knowledge_ingredients').insert({
      name: data.name,
      description: data.description,
      benefits: JSON.stringify(data.benefits || []),
      precautions: data.precautions,
      related_products: JSON.stringify(data.relatedProducts || []),
    });
    
    const ingredient = await this.getIngredientById(String(id));
    if (!ingredient) throw new Error('Failed to create ingredient');
    return ingredient;
  }

  static async updateIngredient(id: string, data: Partial<CreateIngredientRequest>): Promise<KnowledgeIngredient> {
    const updateData: any = {};
    
    if (data.name) updateData.name = data.name;
    if (data.description) updateData.description = data.description;
    if (data.benefits) updateData.benefits = JSON.stringify(data.benefits);
    if (data.precautions !== undefined) updateData.precautions = data.precautions;
    if (data.relatedProducts) updateData.related_products = JSON.stringify(data.relatedProducts);
    
    await db('knowledge_ingredients').where({ id }).update(updateData);
    
    const ingredient = await this.getIngredientById(id);
    if (!ingredient) throw new Error('Ingredient not found');
    return ingredient;
  }

  static async deleteIngredient(id: string): Promise<void> {
    await db('knowledge_ingredients').where({ id }).delete();
  }

  // ==================== SEARCH ====================
  
  static async search(request: KnowledgeSearchRequest): Promise<SearchResult[]> {
    const { query, limit = 10, types } = request;
    const results: SearchResult[] = [];
    
    // Search in different sources based on types
    const searchTypes = types || ['article', 'faq', 'technology', 'ingredient'];
    
    if (searchTypes.includes('article')) {
      const articles = await this.searchArticles(query, limit);
      results.push(...articles);
    }
    
    if (searchTypes.includes('faq')) {
      const faqs = await this.searchFAQs(query, limit);
      results.push(...faqs);
    }
    
    if (searchTypes.includes('technology')) {
      const technologies = await this.searchTechnologies(query, limit);
      results.push(...technologies);
    }
    
    if (searchTypes.includes('ingredient')) {
      const ingredients = await this.searchIngredients(query, limit);
      results.push(...ingredients);
    }
    
    // Log search
    const searchId = await this.logSearch({
      conversationId: request.conversationId,
      query,
      resultsFound: results.length,
      resultIds: results.map(r => r.id),
    });
    
    // Sort by relevance and limit
    return results
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);
  }

  static async logSearch(data: Omit<KnowledgeSearch, 'id' | 'createdAt'>): Promise<string> {
    const [id] = await db('knowledge_searches').insert({
      conversation_id: data.conversationId,
      query: data.query,
      results_found: data.resultsFound,
      result_ids: JSON.stringify(data.resultIds),
      was_helpful: data.wasHelpful,
    });
    
    return String(id);
  }

  static async markSearchHelpful(searchId: string, helpful: boolean): Promise<void> {
    await db('knowledge_searches')
      .where({ id: searchId })
      .update({ was_helpful: helpful });
  }

  // ==================== FEEDBACK ====================
  
  static async markArticleHelpful(articleId: string, helpful: boolean): Promise<void> {
    const field = helpful ? 'helpful_count' : 'not_helpful_count';
    await db('knowledge_articles').where({ id: articleId }).increment(field, 1);
  }

  static async markFAQHelpful(faqId: string, helpful: boolean): Promise<void> {
    const field = helpful ? 'helpful_count' : 'not_helpful_count';
    await db('knowledge_faqs').where({ id: faqId }).increment(field, 1);
  }

  // ==================== FORMATTERS ====================
  
  private static formatCategory(dbCategory: any): KnowledgeCategory {
    return {
      id: dbCategory.id,
      name: dbCategory.name,
      description: dbCategory.description,
      icon: dbCategory.icon,
      displayOrder: dbCategory.display_order,
      isActive: Boolean(dbCategory.is_active),
      createdAt: dbCategory.created_at,
      updatedAt: dbCategory.updated_at,
    };
  }

  private static formatArticle(dbArticle: any): KnowledgeArticle {
    return {
      id: dbArticle.id,
      categoryId: dbArticle.category_id,
      title: dbArticle.title,
      content: dbArticle.content,
      summary: dbArticle.summary,
      keywords: KnowledgeModel.parseJSON(dbArticle.keywords),
      tags: KnowledgeModel.parseJSON(dbArticle.tags),
      relatedServices: KnowledgeModel.parseJSON(dbArticle.related_services),
      relatedProducts: KnowledgeModel.parseJSON(dbArticle.related_products),
      viewCount: dbArticle.view_count,
      helpfulCount: dbArticle.helpful_count,
      notHelpfulCount: dbArticle.not_helpful_count,
      isPublished: Boolean(dbArticle.is_published),
      publishedAt: dbArticle.published_at,
      createdBy: dbArticle.created_by,
      updatedBy: dbArticle.updated_by,
      createdAt: dbArticle.created_at,
      updatedAt: dbArticle.updated_at,
    };
  }

  private static formatFAQ(dbFAQ: any): KnowledgeFAQ {
    return {
      id: dbFAQ.id,
      categoryId: dbFAQ.category_id,
      question: dbFAQ.question,
      answer: dbFAQ.answer,
      keywords: KnowledgeModel.parseJSON(dbFAQ.keywords),
      displayOrder: dbFAQ.display_order,
      viewCount: dbFAQ.view_count,
      helpfulCount: dbFAQ.helpful_count,
      notHelpfulCount: dbFAQ.not_helpful_count,
      isActive: Boolean(dbFAQ.is_active),
      createdAt: dbFAQ.created_at,
      updatedAt: dbFAQ.updated_at,
    };
  }

  private static formatTechnology(dbTech: any): KnowledgeTechnology {
    return {
      id: dbTech.id,
      name: dbTech.name,
      description: dbTech.description,
      benefits: KnowledgeModel.parseJSON(dbTech.benefits),
      applications: KnowledgeModel.parseJSON(dbTech.applications),
      relatedServices: KnowledgeModel.parseJSON(dbTech.related_services),
      imageUrl: dbTech.image_url,
      isActive: Boolean(dbTech.is_active),
      createdAt: dbTech.created_at,
      updatedAt: dbTech.updated_at,
    };
  }

  private static formatIngredient(dbIng: any): KnowledgeIngredient {
    return {
      id: dbIng.id,
      name: dbIng.name,
      description: dbIng.description,
      benefits: KnowledgeModel.parseJSON(dbIng.benefits),
      precautions: dbIng.precautions,
      relatedProducts: KnowledgeModel.parseJSON(dbIng.related_products),
      isActive: Boolean(dbIng.is_active),
      createdAt: dbIng.created_at,
      updatedAt: dbIng.updated_at,
    };
  }

  private static parseJSON(jsonString: string | null): any[] {
    if (!jsonString) return [];
    try {
      return JSON.parse(jsonString);
    } catch {
      return [];
    }
  }
}
