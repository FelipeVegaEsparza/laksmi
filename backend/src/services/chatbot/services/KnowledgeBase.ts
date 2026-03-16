import { KnowledgeModel } from '@/models/Knowledge';
import { CompanySettingsModel, CompanySettings } from '@/models/CompanySettings';
import logger from '@/utils/logger';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
}

interface Article {
  id: string;
  title: string;
  content: string;
}

export class KnowledgeBase {
  private faqs: FAQ[] = [];
  private articles: Article[] = [];
  private loaded = false;
  private companyInfoLoaded = false;
  private companyInfo: {
    address?: string;
    phone?: string;
    email?: string;
    schedule?: string;
    whatsapp?: string;
  } = {};

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
      logger.warn('Error loading KnowledgeBase:', error);
      this.faqs = [];
      this.articles = [];
      this.loaded = true;
    }
  }

  async loadCompanyInfo(): Promise<void> {
    if (this.companyInfoLoaded) return;

    try {
      const settings = await CompanySettingsModel.getSettings();
      
      if (settings) {
        this.companyInfo = {
          address: settings.contactAddress || undefined,
          phone: settings.contactPhone || undefined,
          email: settings.contactEmail || undefined,
          schedule: settings.businessHours ? JSON.stringify(settings.businessHours) : undefined,
          whatsapp: settings.contactWhatsapp || undefined
        };
      }

      this.companyInfoLoaded = true;
      logger.info('Company info loaded for KnowledgeBase', this.companyInfo);
    } catch (error) {
      logger.warn('Error loading company info:', error);
      this.companyInfoLoaded = true;
    }
  }

  async search(query: string): Promise<string | null> {
    await this.load();
    await this.loadCompanyInfo();

    const normalizedQuery = this.normalizeText(query);
    const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 2);

    if (queryWords.length === 0) {
      return this.getCompanyInfoResponse(query);
    }

    if (this.isCompanyInfoQuery(query)) {
      const response = this.getCompanyInfoResponse(query);
      if (response) return response;
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

    if (bestMatch && bestScore > 0) {
      return bestMatch.answer;
    }

    return this.getCompanyInfoResponse(query);
  }

  private isCompanyInfoQuery(query: string): boolean {
    const normalized = query.toLowerCase();
    const keywords = [
      'dirección', 'direccion', 'ubicación', 'ubicacion', 'donde están',
      'teléfono', 'telefono', 'celular', 'contacto', 'email', 'correo',
      'horario', 'horarios', 'abiertura', 'abren', 'cierran', 'cerrado',
      'whatsapp', 'ubicados', 'están ubicados'
    ];
    return keywords.some(k => normalized.includes(k));
  }

  private getCompanyInfoResponse(query: string): string | null {
    const parts: string[] = [];

    if (this.companyInfo.address) {
      parts.push(`📍 **Dirección:** ${this.companyInfo.address}`);
    }

    if (this.companyInfo.phone) {
      parts.push(`📞 **Teléfono:** ${this.companyInfo.phone}`);
    }

    if (this.companyInfo.whatsapp) {
      parts.push(`💬 **WhatsApp:** ${this.companyInfo.whatsapp}`);
    }

    if (this.companyInfo.email) {
      parts.push(`✉️ **Email:** ${this.companyInfo.email}`);
    }

    if (this.companyInfo.schedule) {
      parts.push(`🕐 **Horario:** ${this.companyInfo.schedule}`);
    }

    if (parts.length > 0) {
      return 'Aquí tienes nuestra información de contacto:\n\n' + parts.join('\n\n');
    }

    return null;
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
