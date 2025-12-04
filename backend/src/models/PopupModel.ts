import db from '../config/database';

export interface Popup {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePopupRequest {
  title: string;
  imageUrl: string;
  linkUrl: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpdatePopupRequest {
  title?: string;
  imageUrl?: string;
  linkUrl?: string;
  displayOrder?: number;
  isActive?: boolean;
}

class PopupModel {
  private tableName = 'popups';

  async findAll(): Promise<Popup[]> {
    const popups = await db(this.tableName)
      .select('*')
      .orderBy('display_order', 'asc');
    
    return popups.map(this.formatPopup);
  }

  async findActive(): Promise<Popup[]> {
    const popups = await db(this.tableName)
      .where('is_active', true)
      .orderBy('display_order', 'asc');
    
    return popups.map(this.formatPopup);
  }

  async findById(id: string): Promise<Popup | null> {
    const popup = await db(this.tableName)
      .where('id', id)
      .first();
    
    return popup ? this.formatPopup(popup) : null;
  }

  async create(data: CreatePopupRequest): Promise<Popup> {
    const id = db.raw('UUID()');
    
    await db(this.tableName).insert({
      id,
      title: data.title,
      image_url: data.imageUrl,
      link_url: data.linkUrl,
      display_order: data.displayOrder || 0,
      is_active: data.isActive !== undefined ? data.isActive : true,
    });

    const popup = await db(this.tableName)
      .where('title', data.title)
      .orderBy('created_at', 'desc')
      .first();
    
    return this.formatPopup(popup);
  }

  async update(id: string, data: UpdatePopupRequest): Promise<Popup | null> {
    const updateData: any = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl;
    if (data.linkUrl !== undefined) updateData.link_url = data.linkUrl;
    if (data.displayOrder !== undefined) updateData.display_order = data.displayOrder;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;

    if (Object.keys(updateData).length === 0) {
      return this.findById(id);
    }

    updateData.updated_at = db.fn.now();

    await db(this.tableName)
      .where('id', id)
      .update(updateData);

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await db(this.tableName)
      .where('id', id)
      .delete();

    return deleted > 0;
  }

  private formatPopup(dbPopup: any): Popup {
    return {
      id: dbPopup.id,
      title: dbPopup.title,
      imageUrl: dbPopup.image_url,
      linkUrl: dbPopup.link_url,
      displayOrder: dbPopup.display_order,
      isActive: Boolean(dbPopup.is_active),
      createdAt: dbPopup.created_at,
      updatedAt: dbPopup.updated_at,
    };
  }
}

export default new PopupModel();
