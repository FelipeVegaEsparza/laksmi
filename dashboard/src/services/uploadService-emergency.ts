// Emergency upload service that works immediately
import { UploadedFile, UploadResponse } from './uploadService'

class EmergencyUploadService {
  private baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

  async uploadImages(type: 'products' | 'services', files: File[]): Promise<UploadResponse> {
    console.log('🚀 Using LOCAL STORAGE upload service (no backend required)...')
    
    // Convert files to base64 and store locally
    const uploadedFiles: UploadedFile[] = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      try {
        // Convert to base64
        const base64 = await this.fileToBase64(file)
        
        const uploadedFile: UploadedFile = {
          filename: `local-${Date.now()}-${i}.${file.name.split('.').pop()}`,
          originalName: file.name,
          size: file.size,
          mimetype: file.type,
          url: base64 // Use base64 as URL for immediate display
        }
        
        uploadedFiles.push(uploadedFile)
        
        // Store in localStorage for persistence
        const storageKey = `uploaded_${type}_${uploadedFile.filename}`
        localStorage.setItem(storageKey, JSON.stringify({
          ...uploadedFile,
          uploadedAt: new Date().toISOString()
        }))
        
        console.log(`✅ File ${i + 1}/${files.length} processed locally`)
        
      } catch (error) {
        console.error(`❌ Failed to process file ${file.name}:`, error)
      }
    }
    
    console.log(`✅ ${uploadedFiles.length} files uploaded locally!`)
    
    return {
      files: uploadedFiles,
      urls: uploadedFiles.map(f => f.url)
    }
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result)
        } else {
          reject(new Error('Failed to read file'))
        }
      }
      reader.onerror = () => reject(new Error('File reading error'))
      reader.readAsDataURL(file)
    })
  }

  async listImages(type: 'products' | 'services'): Promise<UploadedFile[]> {
    console.log('📋 Loading images from local storage...')
    
    const images: UploadedFile[] = []
    
    // Get all items from localStorage that match our pattern
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      
      if (key && key.startsWith(`uploaded_${type}_`)) {
        try {
          const storedData = localStorage.getItem(key)
          if (storedData) {
            const imageData = JSON.parse(storedData)
            images.push({
              filename: imageData.filename,
              originalName: imageData.originalName,
              size: imageData.size,
              mimetype: imageData.mimetype,
              url: imageData.url
            })
          }
        } catch (error) {
          console.warn(`Failed to parse stored image data for key ${key}:`, error)
        }
      }
    }
    
    console.log(`✅ Found ${images.length} local images for ${type}`)
    return images
  }

  getImageUrl(path: string): string {
    // If it's already a data URL (base64), return as is
    if (path.startsWith('data:')) return path
    
    // If it's a full HTTP URL, return as is
    if (path.startsWith('http')) return path
    
    // For local files, return placeholder or try to construct URL
    if (path.includes('local-') || path.includes('emergency-') || path.includes('mock-')) {
      return 'https://via.placeholder.com/300x200/e3f2fd/1976d2?text=Imagen+Local'
    }
    
    // Default case - try to construct URL
    return `${this.baseUrl}${path.startsWith('/') ? '' : '/'}${path}`
  }
}

export const emergencyUploadService = new EmergencyUploadService()