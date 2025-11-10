// API Configuration with fallback URLs
export const API_CONFIG = {
  // Primary API URLs to try in order
  urls: [
    import.meta.env.VITE_API_URL,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://0.0.0.0:3000'
  ].filter(Boolean), // Remove undefined values
  
  // Current active URL (will be updated when a working URL is found)
  activeUrl: '',
  
  // Test if a URL is working
  async testUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(`${url}/health`, {
        method: 'GET',
        timeout: 5000
      } as any);
      
      return response.ok;
    } catch (error) {
      return false;
    }
  },
  
  // Find the first working URL
  async findWorkingUrl(): Promise<string> {
    console.log('🔍 Testing API URLs...');
    
    for (const url of this.urls) {
      console.log(`Testing: ${url}`);
      
      const isWorking = await this.testUrl(url);
      
      if (isWorking) {
        console.log(`✅ Found working URL: ${url}`);
        this.activeUrl = url;
        return url;
      } else {
        console.log(`❌ Failed: ${url}`);
      }
    }
    
    // If no URL works, use the first one as fallback
    const fallback = this.urls[0] || 'http://localhost:3000';
    console.warn(`⚠️ No working URL found, using fallback: ${fallback}`);
    this.activeUrl = fallback;
    return fallback;
  },
  
  // Get the API URL (with automatic detection)
  async getApiUrl(): Promise<string> {
    if (this.activeUrl) {
      return this.activeUrl;
    }
    
    return await this.findWorkingUrl();
  }
};

// Initialize on module load
API_CONFIG.findWorkingUrl().catch(console.error);