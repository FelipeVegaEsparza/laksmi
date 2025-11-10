// Types for Knowledge Base System

export interface KnowledgeCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeArticle {
  id: string;
  categoryId: string;
  title: string;
  content: string;
  summary: string;
  keywords: string[];
  tags: string[];
  relatedServices: string[];
  relatedProducts: string[];
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  isPublished: boolean;
  publishedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  category?: KnowledgeCategory;
}

export interface KnowledgeFAQ {
  id: string;
  categoryId: string;
  question: string;
  answer: string;
  keywords: string[];
  displayOrder: number;
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  category?: KnowledgeCategory;
}

export interface KnowledgeTechnology {
  id: string;
  name: string;
  description: string;
  benefits: string[];
  applications: string[];
  relatedServices: string[];
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeIngredient {
  id: string;
  name: string;
  description: string;
  benefits: string[];
  precautions?: string;
  relatedProducts: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeSearch {
  id: string;
  conversationId?: string;
  query: string;
  resultsFound: number;
  resultIds: string[];
  wasHelpful?: boolean;
  createdAt: Date;
}

export interface SearchResult {
  type: 'article' | 'faq' | 'technology' | 'ingredient' | 'service' | 'product';
  id: string;
  title: string;
  content: string;
  relevance: number;
  metadata?: any;
}

export interface KnowledgeSearchRequest {
  query: string;
  conversationId?: string;
  limit?: number;
  types?: Array<'article' | 'faq' | 'technology' | 'ingredient' | 'service' | 'product'>;
}

export interface KnowledgeSearchResponse {
  results: SearchResult[];
  totalResults: number;
  query: string;
  searchId: string;
}

export interface CreateArticleRequest {
  categoryId: string;
  title: string;
  content: string;
  summary?: string;
  keywords?: string[];
  tags?: string[];
  relatedServices?: string[];
  relatedProducts?: string[];
  isPublished?: boolean;
}

export interface UpdateArticleRequest {
  categoryId?: string;
  title?: string;
  content?: string;
  summary?: string;
  keywords?: string[];
  tags?: string[];
  relatedServices?: string[];
  relatedProducts?: string[];
  isPublished?: boolean;
}

export interface CreateFAQRequest {
  categoryId: string;
  question: string;
  answer: string;
  keywords?: string[];
  displayOrder?: number;
}

export interface UpdateFAQRequest {
  categoryId?: string;
  question?: string;
  answer?: string;
  keywords?: string[];
  displayOrder?: number;
  isActive?: boolean;
}

export interface CreateTechnologyRequest {
  name: string;
  description: string;
  benefits?: string[];
  applications?: string[];
  relatedServices?: string[];
  imageUrl?: string;
}

export interface CreateIngredientRequest {
  name: string;
  description: string;
  benefits?: string[];
  precautions?: string;
  relatedProducts?: string[];
}

export interface KnowledgeStats {
  totalArticles: number;
  totalFAQs: number;
  totalTechnologies: number;
  totalIngredients: number;
  totalSearches: number;
  topSearches: Array<{ query: string; count: number }>;
  mostViewedArticles: Array<{ id: string; title: string; views: number }>;
  mostHelpfulFAQs: Array<{ id: string; question: string; helpfulCount: number }>;
}
