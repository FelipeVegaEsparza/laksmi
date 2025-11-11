import db from '../config/database';

export interface FeaturedImage {
  id: string;
  slot: number;
  title: string;
  description?: string;
  imageUrl?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateFeaturedImageRequest {
  title?: string;
  description?: string;
  imageUrl?: string;
  active?: boolean;
}

export class FeaturedImageModel {
  static async getAll(): Promise<FeaturedImage[]> {
    const images = await db('featured_images').orderBy('slot', 'asc');
    return images.map(this.formatFeaturedImage);
  }

  static async getBySlot(slot: number): Promise<FeaturedImage | null> {
    const image = await db('featured_images').where({ slot }).first();
    if (!image) return null;
    return this.formatFeaturedImage(image);
  }

  static async update(slot: number, data: UpdateFeaturedImageRequest): Promise<FeaturedImage | null> {
    const updateData: any = {
      updated_at: new Date(),
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl;
    if (data.active !== undefined) updateData.active = data.active;

    await db('featured_images').where({ slot }).update(updateData);
    return this.getBySlot(slot);
  }

  private static formatFeaturedImage(dbImage: any): FeaturedImage {
    return {
      id: dbImage.id,
      slot: dbImage.slot,
      title: dbImage.title,
      description: dbImage.description,
      imageUrl: dbImage.image_url,
      active: Boolean(dbImage.active),
      createdAt: dbImage.created_at,
      updatedAt: dbImage.updated_at,
    };
  }
}
