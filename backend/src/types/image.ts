export interface ImageInfo {
  id: string;
  originalName: string;
  filename: string;
  path: string;
  url: string;
  thumbnailUrl: string;
  size: number;
  mimetype: string;
  width?: number;
  height?: number;
  createdAt: Date;
}

export interface ImageUploadRequest {
  type: 'service' | 'product';
  entityId: string;
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export interface ImageUploadResponse {
  success: boolean;
  message: string;
  data: {
    image: ImageInfo;
    thumbnail: string;
  };
}

export interface MultipleImageUploadResponse {
  success: boolean;
  message: string;
  data: {
    uploaded: Array<{
      image: ImageInfo;
      thumbnail: string;
    }>;
    errors: Array<{
      filename: string;
      error: string;
    }>;
    summary: {
      total: number;
      successful: number;
      failed: number;
    };
  };
}

export interface ImageCleanupRequest {
  type: 'service' | 'product';
  referencedImages: string[];
}

export interface ImageCleanupResponse {
  success: boolean;
  message: string;
  data: {
    deletedCount: number;
  };
}