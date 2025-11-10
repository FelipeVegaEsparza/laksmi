const axios = require('axios');

console.log('🔍 Comparando datos del backend vs frontend...\n');

async function compareBackendFrontendData() {
  try {
    // 1. Login
    console.log('1. 🔐 Login...');
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data.accessToken;
    console.log('   ✅ Login exitoso\n');
    
    // 2. Get actual backend data
    console.log('2. 📊 Obteniendo datos reales del backend...\n');
    
    // Products
    console.log('📦 PRODUCTOS:');
    const productsResponse = await axios.get('http://localhost:3000/api/v1/products', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (productsResponse.data.success) {
      const products = productsResponse.data.data.products;
      console.log(`   📈 Total en backend: ${products.length}`);
      console.log('   📋 Primeros 3 productos del backend:');
      products.slice(0, 3).forEach((product, index) => {
        console.log(`      ${index + 1}. ${product.name} - €${product.price} - Stock: ${product.stock}`);
      });
    }
    console.log('');
    
    // Clients
    console.log('👥 CLIENTES:');
    const clientsResponse = await axios.get('http://localhost:3000/api/v1/clients', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (clientsResponse.data.success) {
      const clients = clientsResponse.data.data.clients;
      console.log(`   📈 Total en backend: ${clients.length}`);
      console.log('   📋 Primeros 3 clientes del backend:');
      clients.slice(0, 3).forEach((client, index) => {
        console.log(`      ${index + 1}. ${client.name} - ${client.phone} - Puntos: ${client.loyaltyPoints}`);
      });
    }
    console.log('');
    
    // Services
    console.log('💅 SERVICIOS:');
    const servicesResponse = await axios.get('http://localhost:3000/api/v1/services/public', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (servicesResponse.data.success) {
      const services = servicesResponse.data.data.services;
      console.log(`   📈 Total en backend: ${services.length}`);
      console.log('   📋 Primeros 3 servicios del backend:');
      services.slice(0, 3).forEach((service, index) => {
        console.log(`      ${index + 1}. ${service.name} - €${service.price} - ${service.category}`);
      });
    }
    console.log('');
    
    // Bookings
    console.log('📅 RESERVAS:');
    const bookingsResponse = await axios.get('http://localhost:3000/api/v1/bookings', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (bookingsResponse.data.success) {
      const bookings = bookingsResponse.data.data.bookings;
      console.log(`   📈 Total en backend: ${bookings.length}`);
      console.log('   📋 Primeras 3 reservas del backend:');
      bookings.slice(0, 3).forEach((booking, index) => {
        console.log(`      ${index + 1}. Cliente: ${booking.client?.name || 'N/A'} - Servicio: ${booking.service?.name || 'N/A'} - Estado: ${booking.status}`);
      });
    }
    console.log('');
    
    console.log('=' .repeat(60));
    console.log('🔍 INSTRUCCIONES PARA VERIFICAR EN EL FRONTEND:');
    console.log('');
    console.log('1. Abre el dashboard en http://localhost:5173');
    console.log('2. Inicia sesión con admin / admin123');
    console.log('3. Ve a cada página y compara los datos:');
    console.log('');
    console.log('📦 PRODUCTOS - Compara:');
    console.log('   - ¿El número total coincide?');
    console.log('   - ¿Los nombres de productos coinciden?');
    console.log('   - ¿Los precios coinciden?');
    console.log('   - ¿Los stocks coinciden?');
    console.log('');
    console.log('👥 CLIENTES - Compara:');
    console.log('   - ¿El número total coincide?');
    console.log('   - ¿Los nombres coinciden?');
    console.log('   - ¿Los teléfonos coinciden?');
    console.log('   - ¿Los puntos de lealtad coinciden?');
    console.log('');
    console.log('💅 SERVICIOS - Compara:');
    console.log('   - ¿El número total coincide?');
    console.log('   - ¿Los nombres coinciden?');
    console.log('   - ¿Los precios coinciden?');
    console.log('   - ¿Las categorías coinciden?');
    console.log('');
    console.log('📅 RESERVAS - Compara:');
    console.log('   - ¿El número total coincide?');
    console.log('   - ¿Los clientes coinciden?');
    console.log('   - ¿Los servicios coinciden?');
    console.log('   - ¿Los estados coinciden?');
    console.log('');
    console.log('⚠️  SI LOS DATOS NO COINCIDEN:');
    console.log('   - El frontend puede estar usando datos mock');
    console.log('   - Puede haber problemas de cache');
    console.log('   - Las APIs pueden no estar conectándose correctamente');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

compareBackendFrontendData();