import db from '../config/database';

export interface LegalPage {
  id: string;
  page_type: string;
  title: string;
  content: string;
  created_at: Date;
  updated_at: Date;
}

export interface LegalPageInput {
  pageType: 'terms' | 'consent' | 'privacy';
  title: string;
  content: string;
}

class LegalPageModel {
  private tableName = 'legal_pages';

  // Obtener todas las páginas legales
  async findAll(): Promise<LegalPage[]> {
    const pages = await db(this.tableName)
      .select('*')
      .orderBy('page_type');
    return pages;
  }

  // Obtener una página por tipo
  async findByType(pageType: string): Promise<LegalPage | null> {
    const page = await db(this.tableName)
      .where('page_type', pageType)
      .first();
    return page || null;
  }

  // Actualizar una página legal
  async update(pageType: string, data: Partial<LegalPageInput>): Promise<LegalPage | null> {
    const updateData: any = {};

    if (data.title !== undefined) {
      updateData.title = data.title;
    }

    if (data.content !== undefined) {
      updateData.content = data.content;
    }

    if (Object.keys(updateData).length === 0) {
      return this.findByType(pageType);
    }

    updateData.updated_at = db.fn.now();

    await db(this.tableName)
      .where('page_type', pageType)
      .update(updateData);

    return this.findByType(pageType);
  }

  // Crear o actualizar (upsert)
  async upsert(data: LegalPageInput): Promise<LegalPage> {
    const existing = await this.findByType(data.pageType);

    if (existing) {
      return (await this.update(data.pageType, data))!;
    }

    // Crear nuevo
    await db(this.tableName).insert({
      id: db.raw('UUID()'),
      page_type: data.pageType,
      title: data.title,
      content: data.content
    });

    return (await this.findByType(data.pageType))!;
  }
}

export default new LegalPageModel();
