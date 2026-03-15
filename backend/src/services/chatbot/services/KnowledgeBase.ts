import { KnowledgeModel } from '@/models/Knowledge';
import logger from '@/utils/logger';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
}

export class KnowledgeBase {
  private faqs: FAQ[] = [];
  private loaded = false;

  async load(): Promise<void> {
    if (this.loaded) return;

    try {
      const allFaqs = await KnowledgeModel.getAllFAQs();

      this.faqs = allFaqs.map((faq: any) => ({
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
        keywords: this.extractKeywords(faq.question)
      }));

      this.loaded = true;
      logger.info(`KnowledgeBase loaded ${this.faqs.length} FAQs`);
    } catch (error) {
      logger.warn('Error loading FAQs, using empty list:', error);
      this.faqs = [];
      this.loaded = true;
    }
  }

  async search(query: string): Promise<string | null> {
    await this.load();

    const normalizedQuery = this.normalizeText(query);
    const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 2);

    if (queryWords.length === 0) {
      return null;
    }

    let bestMatch: FAQ | null = null;
    let bestScore = 0;

    for (const faq of this.faqs) {
      let score = 0;

      for (const word of queryWords) {
        if (this.normalizeText(faq.question).includes(word)) {
          score += 3;
        }
        if (this.normalizeText(faq.answer).includes(word)) {
          score += 1;
        }
        for (const keyword of faq.keywords) {
          if (this.normalizeText(keyword).includes(word)) {
            score += 2;
          }
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = faq;
      }
    }

    return bestMatch && bestScore > 0
      ? `**${bestMatch.question}**\n\n${bestMatch.answer}`
      : null;
  }

  private extractKeywords(question: string): string[] {
    const stopWords = [
      'que', 'es', 'como', 'cual', 'cuál', 'cuándo', 'donde', 'dónde',
      'por', 'qué', 'para', 'con', 'sin', 'una', 'uno', 'las', 'los'
    ];

    return question
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3 && !stopWords.includes(w));
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .trim();
  }
}

export const knowledgeBase = new KnowledgeBase();
