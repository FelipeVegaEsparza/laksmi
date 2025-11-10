const axios = require('axios');

console.log('🔍 Diagnóstico completo de todas las APIs del dashboard...\n');

async function debugAllApis() {
  try {
    // 1. Login
    console.log('1. 🔐 Login...');
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data.accessToken;
    console.log('   ✅ Login exitoso\n');
    
    // 2. Test all dashboard APIs
    const apis = [
      { name: 'Clients', url: '/clients', page: 'ClientsPage' },
      { name: 'Services', url: '/services', page: 'ServicesPage' },
      { name: 'Products', url: '/products', page: 'ProductsPage' },
      { name: 'Bookings', url: '/bookings', page: 'BookingsPage' },
      { name: 'Conversations', url: '/conversations', page: 'ConversationsPage' },
      { name: 'Notifications', url: '/notifications', page: 'NotificationsPage' },
      { name: 'Loyalty', url: '/loyalty', page: 'LoyaltyPage' },
      { name: 'Twilio Config', url: '/twilio/config', page: 'SettingsPage' },
      { name: 'Twilio Templates', url: '/twilio/templates', page: 'SettingsPage' }
    ];
    
    console.log('2. 📊 Probando todas las APIs...');
    
    for (const api of apis) {
      try {
        const response = await axios.get(`http://localhost:3000/api/v1${api.url}`, {
          headers: { 'Authorization': `Bearer ${token}` },
          timeout: 5000
        });
        
        if (response.data.success) {
          const data = response.data.data;
          console.log(`   ✅ ${api.name}: OK`);
          
          // Analyze response structure
          if (Array.isArray(data)) {
            console.log(`      📋 Array con ${data.length} elementos`);
          } else if (data && typeof data === 'object') {
            const keys = Object.keys(data);
            console.log(`      📊 Objeto con keys: ${keys.join(', ')}`);
            
            // Check for pagination structure
            if (keys.includes('data') || keys.includes('items')) {
              console.log(`      📄 Estructura paginada detectada`);
            }
            if (keys.includes('total')) {
              console.log(`      📈 Total: ${data.total}`);
            }
          }
        } else {
          console.log(`   ⚠️  ${api.name}: Success=false - ${response.data.error || 'Unknown error'}`);
        }
        
      } catch (error) {
        const status = error.response?.status;
        const errorMsg = error.response?.data?.error || error.message;
        console.log(`   ❌ ${api.name}: ${status || 'TIMEOUT'} - ${errorMsg}`);
      }
    }
    
    // 3. Test specific endpoints that might have different structures
    console.log('\n3. 🔍 Probando endpoints específicos...');
    
    const specificTests = [
      { name: 'Clients Paginated', url: '/clients?page=1&limit=5' },
      { name: 'Services Paginated', url: '/services?page=1&limit=5' },
      { name: 'Bookings Today', url: '/bookings?date=today' },
      { name: 'Dashboard Stats', url: '/dashboard/stats' },
      { name: 'Conversation Metrics', url: '/conversations/metrics' }
    ];
    
    for (const test of specificTests) {
      try {
        const response = await axios.get(`http://localhost:3000/api/v1${test.url}`, {
          headers: { 'Authorization': `Bearer ${token}` },
          timeout: 5000
        });
        
        if (response.data.success) {
          const data = response.data.data;
          console.log(`   ✅ ${test.name}: OK`);
          
          if (data && typeof data === 'object') {
            const keys = Object.keys(data);
            console.log(`      📊 Keys: ${keys.join(', ')}`);
          }
        }
        
      } catch (error) {
        const status = error.response?.status;
        console.log(`   ❌ ${test.name}: ${status || 'ERROR'}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📋 RESUMEN DE PROBLEMAS IDENTIFICADOS:');
  console.log('');
  console.log('1. 👥 CLIENTES:');
  console.log('   - Verificar estructura de respuesta');
  console.log('   - Posible problema similar a productos');
  console.log('');
  console.log('2. 💅 SERVICIOS:');
  console.log('   - Verificar estructura de respuesta');
  console.log('   - Posible problema similar a productos');
  console.log('');
  console.log('3. 📅 BOOKINGS:');
  console.log('   - Endpoints específicos pueden faltar');
  console.log('   - Verificar rutas de calendario');
  console.log('');
  console.log('4. 💬 CONVERSACIONES:');
  console.log('   - SSE endpoints pueden tener problemas de auth');
  console.log('   - Verificar estructura de respuesta');
  console.log('');
  console.log('5. ⚙️  CONFIGURACIÓN:');
  console.log('   - Twilio endpoints pueden necesitar ajustes');
  console.log('   - Verificar estructura de respuesta');
}

debugAllApis();