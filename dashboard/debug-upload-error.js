// Debug upload router issue
const axios = require('axios');

async function debugUploadRouter() {
  try {
    console.log('🔍 Debugging upload router issue...\n');
    
    // Login
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data.accessToken;
    console.log('✅ Login successful');
    
    // Test different routes to see which ones work
    const testRoutes = [
      '/api/v1/auth/me',
      '/api/v1/clients',
      '/api/v1/products',
      '/api/v1/services/public',
      '/api/v1/upload',
      '/api/v1/upload/services',
      '/api/v1/upload/products',
      '/api/v1/security',
      '/api/v1/gdpr'
    ];
    
    console.log('\n🧪 Testing different routes:');
    
    for (const route of testRoutes) {
      try {
        const response = await axios.get(`http://localhost:3000${route}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const isApiResponse = response.data.message === 'API del Sistema de Gestión de Clínica de Belleza';
        console.log(`${isApiResponse ? '❌' : '✅'} ${route}: ${response.status} ${isApiResponse ? '(catch-all)' : '(specific)'}`);
        
      } catch (error) {
        console.log(`❌ ${route}: ${error.response?.status} (${error.response?.data?.message || error.message})`);
      }
    }
    
    // Check if the issue is with the route order
    console.log('\n🔍 Checking route registration order...');
    
    try {
      // This should hit the catch-all
      const catchAllResponse = await axios.get('http://localhost:3000/api/v1/nonexistent', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('Catch-all works:', catchAllResponse.status);
      
    } catch (catchAllError) {
      console.log('Catch-all error:', catchAllError.response?.status);
    }
    
  } catch (error) {
    console.error('❌ General Error:', error.message);
  }
}

debugUploadRouter();