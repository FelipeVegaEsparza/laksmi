const axios = require('axios');

async function testAPIs() {
  console.log('🔍 Probando APIs del backend...\n');
  
  const baseURL = 'http://localhost:3000/api/v1';
  
  try {
    // Test 1: Health check
    console.log('1. 🏥 Health Check:');
    const health = await axios.get('http://localhost:3000/health');
    console.log(`   ✅ Status: ${health.status} - ${health.data.status}`);
    
    // Test 2: API root
    console.log('\n2. 🌐 API Root:');
    const apiRoot = await axios.get(`${baseURL}`);
    console.log(`   ✅ Status: ${apiRoot.status} - API Version: ${apiRoot.data.version}`);
    
    // Test 3: Services API
    console.log('\n3. 💅 Services API:');
    const services = await axios.get(`${baseURL}/services`);
    console.log(`   ✅ Status: ${services.status}`);
    console.log(`   📊 Data structure:`, {
      success: services.data.success,
      dataType: Array.isArray(services.data.data) ? 'array' : typeof services.data.data,
      count: Array.isArray(services.data.data) ? services.data.data.length : 'N/A',
      total: services.data.total || 'N/A'
    });
    
    if (Array.isArray(services.data.data) && services.data.data.length > 0) {
      console.log(`   📋 First service:`, {
        id: services.data.data[0].id,
        name: services.data.data[0].name,
        category: services.data.data[0].category,
        price: services.data.data[0].price
      });
    }
    
    // Test 4: Products API
    console.log('\n4. 📦 Products API:');
    const products = await axios.get(`${baseURL}/products`);
    console.log(`   ✅ Status: ${products.status}`);
    console.log(`   📊 Data structure:`, {
      success: products.data.success,
      dataType: Array.isArray(products.data.data) ? 'array' : typeof products.data.data,
      count: Array.isArray(products.data.data) ? products.data.data.length : 'N/A',
      total: products.data.total || 'N/A'
    });
    
    if (Array.isArray(products.data.data) && products.data.data.length > 0) {
      console.log(`   📋 First product:`, {
        id: products.data.data[0].id,
        name: products.data.data[0].name,
        category: products.data.data[0].category,
        price: products.data.data[0].price
      });
    }
    
    // Test 5: Services with pagination (like dashboard)
    console.log('\n5. 📄 Services with Pagination:');
    const servicesPaginated = await axios.get(`${baseURL}/services?page=1&limit=10`);
    console.log(`   ✅ Status: ${servicesPaginated.status}`);
    console.log(`   📊 Paginated response:`, {
      success: servicesPaginated.data.success,
      dataCount: Array.isArray(servicesPaginated.data.data) ? servicesPaginated.data.data.length : 'N/A',
      total: servicesPaginated.data.total || 'N/A',
      page: servicesPaginated.data.page || 'N/A',
      totalPages: servicesPaginated.data.totalPages || 'N/A'
    });
    
    console.log('\n🎉 ¡Todas las APIs funcionan correctamente!');
    console.log('\n📋 Resumen:');
    console.log(`   💅 Servicios disponibles: ${Array.isArray(services.data.data) ? services.data.data.length : 0}`);
    console.log(`   📦 Productos disponibles: ${Array.isArray(products.data.data) ? products.data.data.length : 0}`);
    console.log('\n🌐 URLs para probar:');
    console.log(`   Dashboard: http://localhost:5173`);
    console.log(`   Frontend: http://localhost:3001`);
    console.log(`   API Services: ${baseURL}/services`);
    console.log(`   API Products: ${baseURL}/products`);
    
  } catch (error) {
    console.error('\n❌ Error probando APIs:', error.message);
    
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    } else if (error.request) {
      console.error('   No response received');
    }
    
    console.log('\n🔧 Posibles soluciones:');
    console.log('   1. Verificar que el backend esté ejecutándose en puerto 3000');
    console.log('   2. Verificar que no haya errores en la consola del backend');
    console.log('   3. Reiniciar el backend: npm run dev');
  }
}

testAPIs();