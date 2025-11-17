import db from '../config/database';

export interface Banner {
  id: string;
  title?: string;
  description?: string;
  link?: string;
  imageUrl?: string;
  order: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBannerRequest {
  title?: string;
  description?: string;
  link?: string;
  imageUrl?: string;
  order?: number;
  active?: boolean;
}

export interface UpdateBannerRequest {
  title?: string;
  description?: string;
  link?: string;
  imageUrl?: string;
  order?: number;
  active?: boolean;
}

export class BannerModel {
  static async getAll(activeOnly: boolean = false): Promise<Banner[]> {
    let query = db('banners').orderBy('order', 'asc');
    
    if (activeOnly) {
      query = query.where('active', true);
    }
    
    const banners = await query;
    return banners.map(this.formatBanner);
  }

  static async getById(id: string): Promise<Banner | null> {
    const banner = await db('banners').where({ id }).first();
    if (!banner) return null;
    return this.formatBanner(banner);
  }

  static async create(data: CreateBannerRequest): Promise<Banner> {
    const bannerData = {
      title: data.title,
      description: data.description,
      link: data.link,
      image_url: data.imageUrl,
      order: data.order ?? 0,
      active: data.active ?? true,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const [result] = await db('banners').insert(bannerData);
    // MySQL returns insertId, get the first banner after insert
    const allBanners = await db('banners').orderBy('created_at', 'desc').limit(1);
    if (!allBanners || allBanners.length === 0) throw new Error('Failed to create banner');
    return this.formatBanner(allBanners[0]);
  }

  static async update(id: string, data: UpdateBannerRequest): Promise<Banner | null> {
    const updateData: any = {
      updated_at: new Date(),
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.link !== undefined) updateData.link = data.link;
    if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl;
    if (data.order !== undefined) updateData.order = data.order;
    if (data.active !== undefined) updateData.active = data.active;

    await db('banners').where({ id }).update(updateData);
    return this.getById(id);
  }

  static async delete(id: string): Promise<boolean> {
    const deleted = await db('banners').where({ id }).delete();
    return deleted > 0;
  }

  static async reorder(bannerIds: string[]): Promise<void> {
    const updates = bannerIds.map((id, index) => 
      db('banners').where({ id }).update({ order: index })
    );
    await Promise.all(updates);
  }

  private static formatBanner(dbBanner: any): Banner {
    return {
      id: dbBanner.id,
      title: dbBanner.title,
      description: dbBanner.description,
      link: dbBanner.link,
      imageUrl: dbBanner.image_url,
      order: dbBanner.order,
      active: Boolean(dbBanner.active),
      createdAt: dbBanner.created_at,
      updatedAt: dbBanner.updated_at,
    };
  }
}
