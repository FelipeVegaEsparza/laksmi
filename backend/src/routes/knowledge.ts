import { Router } from 'express';
import { KnowledgeController } from '../controllers/KnowledgeController';
import { authenticateToken, requireAnyRole, requireManagerOrAdmin } from '../middleware/auth';

const router = Router();

// Public routes (for chatbot and frontend)
router.get('/search', KnowledgeController.search);
router.get('/categories', KnowledgeController.getCategories);
router.get('/faqs', KnowledgeController.getFAQs);
router.get('/technologies', KnowledgeController.getTechnologies);
router.get('/ingredients', KnowledgeController.getIngredients);

// Feedback (can be public for chatbot)
router.post('/search/:searchId/feedback', KnowledgeController.provideFeedback);

// Protected routes - require authentication
router.use(authenticateToken);
router.use(requireAnyRole);

// Articles management
router.post('/articles', requireManagerOrAdmin, KnowledgeController.createArticle);
router.get('/articles/:id', KnowledgeController.getArticle);
router.put('/articles/:id', requireManagerOrAdmin, KnowledgeController.updateArticle);
router.delete('/articles/:id', requireManagerOrAdmin, KnowledgeController.deleteArticle);

// FAQs management
router.post('/faqs', requireManagerOrAdmin, KnowledgeController.createFAQ);
router.put('/faqs/:id', requireManagerOrAdmin, KnowledgeController.updateFAQ);
router.delete('/faqs/:id', requireManagerOrAdmin, KnowledgeController.deleteFAQ);

// Technologies management
router.post('/technologies', requireManagerOrAdmin, KnowledgeController.createTechnology);
router.put('/technologies/:id', requireManagerOrAdmin, KnowledgeController.updateTechnology);
router.delete('/technologies/:id', requireManagerOrAdmin, KnowledgeController.deleteTechnology);

// Ingredients management
router.post('/ingredients', requireManagerOrAdmin, KnowledgeController.createIngredient);
router.put('/ingredients/:id', requireManagerOrAdmin, KnowledgeController.updateIngredient);
router.delete('/ingredients/:id', requireManagerOrAdmin, KnowledgeController.deleteIngredient);

// Statistics
router.get('/stats', requireManagerOrAdmin, KnowledgeController.getStats);

export default router;
