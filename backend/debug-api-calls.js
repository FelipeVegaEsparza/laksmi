const axios = require('axios');

console.log('🔍 Debugeando llamadas de API del frontend...\n');

async function debugApiCalls() {
  try {
    // Esperar un poco para evitar rate limiting
    console.log('⏳ Esperando para evitar rate limiting...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 1. Login
    console.log('1. 🔐 Login...');
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ Login falló:', loginResponse.data.error);
      return;
    }
    
    const token = loginResponse.data.data.accessToken;
    console.log('   ✅ Login exitoso\n');
    
    // 2. Test the exact API calls that the frontend should be making
    console.log('2. 📊 Probando llamadas exactas del frontend...\n');
    
    const frontendCalls = [
      {
        name: 'Products (ProductsPage)',
        method: 'getProducts',
        url: '/products',
        params: { page: 1, limit: 10 }
      },
      {
        name: 'Clients (ClientsPage)', 
        method: 'getClients',
        url: '/clients',
        params: { page: 1, limit: 10 }
      },
      {
        name: 'Services (ServicesPage)',
        method: 'getServices', 
        url: '/services/public',
        params: { page: 1, limit: 10 }
      },
      {
        name: 'Bookings (BookingsPage)',
        method: 'getBookings',
        url: '/bookings', 
        params: { page: 1, limit: 10 }
      },
      {
        name: 'Conversations (ConversationsPage)',
        method: 'get<Conversation[]>',
        url: '/conversations',
        params: {}
      }
    ];
    
    for (const call of frontendCalls) {
      try {
        console.log(`📞 ${call.name}:`);
        console.log(`   🔗 URL: http://localhost:3000/api/v1${call.url}`);
        console.log(`   📋 Método frontend: ${call.method}`);
        
        const response = await axios.get(`http://localhost:3000/api/v1${call.url}`, {
          headers: { 'Authorization': `Bearer ${token}` },
          params: call.params,
          timeout: 5000
        });
        
        if (response.data.success) {
          const data = response.data.data;
          
          if (Array.isArray(data)) {
            console.log(`   ✅ Respuesta: Array con ${data.length} elementos`);
            if (data.length > 0) {
              const first = data[0];
              console.log(`   📋 Primer elemento: ${first.name || first.id || 'Sin nombre'}`);
            }
          } else if (data && typeof data === 'object') {
            const keys = Object.keys(data);
            console.log(`   ✅ Respuesta: Objeto con keys: ${keys.join(', ')}`);
            
            // Show specific data
            if (data.products) {
              console.log(`   📦 Productos: ${data.products.length}`);
              if (data.products.length > 0) {
                console.log(`   📋 Primer producto: ${data.products[0].name} - €${data.products[0].price}`);
              }
            }
            if (data.clients) {
              console.log(`   👥 Clientes: ${data.clients.length}`);
              if (data.clients.length > 0) {
                console.log(`   📋 Primer cliente: ${data.clients[0].name} - ${data.clients[0].phone}`);
              }
            }
            if (data.services) {
              console.log(`   💅 Servicios: ${data.services.length}`);
              if (data.services.length > 0) {
                console.log(`   📋 Primer servicio: ${data.services[0].name} - €${data.services[0].price}`);
              }
            }
            if (data.bookings) {
              console.log(`   📅 Reservas: ${data.bookings.length}`);
              if (data.bookings.length > 0) {
                console.log(`   📋 Primera reserva: Cliente ${data.bookings[0].client?.name || 'N/A'}`);
              }
            }
          }
        } else {
          console.log(`   ❌ API devolvió success: false`);
        }
        
        console.log('');
        
      } catch (error) {
        const status = error.response?.status;
        const errorMsg = error.response?.data?.error || error.message;
        console.log(`   ❌ Error: ${status || 'TIMEOUT'} - ${errorMsg}\n`);
      }
    }
    
    console.log('=' .repeat(60));
    console.log('🔍 VERIFICACIÓN NECESARIA:');
    console.log('');
    console.log('1. 🌐 Abre el dashboard: http://localhost:5173');
    console.log('2. 🔐 Inicia sesión: admin / admin123');
    console.log('3. 🔍 Abre las herramientas de desarrollador (F12)');
    console.log('4. 📊 Ve a la pestaña "Network"');
    console.log('5. 🔄 Navega por las páginas y observa:');
    console.log('');
    console.log('   📦 En Productos:');
    console.log('   - ¿Se hace llamada a /api/v1/products?');
    console.log('   - ¿La respuesta tiene products, total, page?');
    console.log('   - ¿Los datos coinciden con los del backend?');
    console.log('');
    console.log('   👥 En Clientes:');
    console.log('   - ¿Se hace llamada a /api/v1/clients?');
    console.log('   - ¿La respuesta tiene clients, pagination?');
    console.log('   - ¿Los datos coinciden?');
    console.log('');
    console.log('   💅 En Servicios:');
    console.log('   - ¿Se hace llamada a /api/v1/services/public?');
    console.log('   - ¿La respuesta tiene services, pagination?');
    console.log('   - ¿Los datos coinciden?');
    console.log('');
    console.log('⚠️  SI NO VES LLAMADAS DE RED:');
    console.log('   - El frontend puede estar usando cache');
    console.log('   - Puede haber errores de JavaScript');
    console.log('   - Las APIs pueden no estar conectándose');
    console.log('');
    console.log('⚠️  SI VES LLAMADAS PERO DATOS DIFERENTES:');
    console.log('   - Puede haber problemas de mapeo de datos');
    console.log('   - El frontend puede estar transformando los datos');
    console.log('   - Puede haber cache del navegador');
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

debugApiCalls();