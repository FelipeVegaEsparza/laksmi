// Test connection utility for debugging
export async function testConnection() {
  console.log('🔍 Testing connection from dashboard...');
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  console.log('API_URL:', API_URL);
  
  try {
    // Test 1: Health check
    console.log('Testing health check...');
    const healthResponse = await fetch(`${API_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
    
    // Test 2: Login
    console.log('Testing login...');
    const loginResponse = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);
    
    if (loginData.success) {
      const token = loginData.data.accessToken;
      console.log('✅ Token received');
      
      // Test 3: Upload endpoint (usando la ruta limpia)
      console.log('Testing upload endpoint...');
      const uploadResponse = await fetch(`${API_URL}/api/v1/upload/services`, {
        method: 'GET'
      });
      
      const uploadData = await uploadResponse.json();
      console.log('Upload response:', uploadData);
      
      return { success: true, token, uploadData };
    } else {
      console.error('❌ Login failed:', loginData);
      return { success: false, error: 'Login failed' };
    }
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Auto-run test in development
if (import.meta.env.DEV) {
  // Run test after a short delay to ensure everything is loaded
  setTimeout(() => {
    testConnection();
  }, 1000);
}