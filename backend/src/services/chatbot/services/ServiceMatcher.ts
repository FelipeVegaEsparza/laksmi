import { Service } from '../types';
import logger from '@/utils/logger';

export class ServiceMatcher {
  private services: Service[] = [];
  private servicesByCategory: Map<string, Service[]> = new Map();
  private lastLoad: Date | null = null;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

  async loadServices(forceReload = false): Promise<void> {
    // Recargar si ha pasado el tiempo TTL o si es forzado
    if (!forceReload && this.lastLoad) {
      const timeSinceLastLoad = Date.now() - this.lastLoad.getTime();
      if (timeSinceLastLoad < this.CACHE_TTL_MS && this.services.length > 0) {
        logger.info('ServiceMatcher using cached services', { 
          count: this.services.length, 
          ageMs: timeSinceLastLoad 
        });
        return;
      }
    }

    try {
      const { ServiceService } = await import('../../ServiceService');
      const result = await ServiceService.getServices({ isActive: true, limit: 300 });
      this.services = result.services.map((s: any) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        price: s.price,
        duration: s.duration,
        sessions: s.sessions,
        category: s.category,
        description: s.description || '',
        benefits: s.benefits || ''
      }));

      this.servicesByCategory.clear();
      for (const service of this.services) {
        const category = service.category || 'Otros';
        if (!this.servicesByCategory.has(category)) {
          this.servicesByCategory.set(category, []);
        }
        this.servicesByCategory.get(category)!.push(service);
      }

      this.lastLoad = new Date();
      logger.info(`ServiceMatcher loaded ${this.services.length} services (forceReload: ${forceReload})`);
    } catch (error) {
      logger.error('Error loading services:', error);
      if (this.services.length === 0) {
        this.services = [];
      }
    }
  }

  async ensureLoaded(): Promise<void> {
    await this.loadServices();
  }

  findByName(query: string): Service | null {
    const normalizedQuery = this.normalizeText(query);

    const match = this.services.find(service => {
      const normalizedName = this.normalizeText(service.name);
      return normalizedName.includes(normalizedQuery) ||
             normalizedQuery.includes(normalizedName);
    });

    return match || null;
  }

  findById(id: string): Service | null {
    return this.services.find(s => s.id === id) || null;
  }

  findBySlug(slug: string): Service | null {
    return this.services.find(s => s.slug === slug) || null;
  }

  findByCategory(categoryName: string): Service[] {
    const normalizedCategory = this.normalizeText(categoryName);

    const category = Array.from(this.servicesByCategory.keys()).find(cat =>
      this.normalizeText(cat).includes(normalizedCategory)
    );

    return category ? this.servicesByCategory.get(category) || [] : [];
  }

  fuzzyMatch(query: string): Service | null {
    const normalizedQuery = this.normalizeText(query);
    const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 2);

    if (queryWords.length === 0) {
      return null;
    }

    let bestMatch: Service | null = null;
    let bestScore = 0;

    for (const service of this.services) {
      const normalizedName = this.normalizeText(service.name);
      const normalizedCategory = this.normalizeText(service.category);

      let score = 0;

      for (const word of queryWords) {
        if (normalizedName.includes(word)) {
          score += 3;
        }
        if (normalizedCategory.includes(word)) {
          score += 2;
        }
        if (service.description && this.normalizeText(service.description).includes(word)) {
          score += 1;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = service;
      }
    }

    return bestScore > 0 ? bestMatch : null;
  }

  findByPrice(price: number): Service[] {
    const tolerance = 20000;
    return this.services.filter(s =>
      Math.abs(s.price - price) <= tolerance
    );
  }

  getAllServices(): Service[] {
    if (this.services.length === 0) {
      this.loadServices(true); // Carga sincrónica si no hay datos
    }
    return this.services;
  }

  getCategories(): { name: string; count: number }[] {
    if (this.services.length === 0) {
      this.loadServices(true);
    }

    const categories: Map<string, number> = new Map();

    for (const [category, services] of this.servicesByCategory.entries()) {
      categories.set(category, services.length);
    }

    return Array.from(categories.entries()).map(([name, count]) => ({
      name,
      count
    }));
  }

  getServicesByCategory(categoryName: string): Service[] {
    return this.findByCategory(categoryName);
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

export const serviceMatcher = new ServiceMatcher();
