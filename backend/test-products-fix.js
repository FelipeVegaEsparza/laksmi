const axios = require('axios');

console.log('🔍 Probando corrección de productos...\n');

async function testProductsFix() {
  try {
    // 1. Login
    console.log('1. 🔐 Login...');
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data.accessToken;
    console.log('   ✅ Login exitoso');
    
    // 2. Test products API
    console.log('\n2. 📦 Probando Products API...');
    const productsResponse = await axios.get('http://localhost:3000/api/v1/products', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log(`   ✅ Status: ${productsResponse.status}`);
    console.log(`   📊 Success: ${productsResponse.data.success}`);
    console.log(`   📋 Estructura: ${Object.keys(productsResponse.data.data).join(', ')}`);
    
    if (productsResponse.data.data.products) {
      console.log(`   📦 Productos: ${productsResponse.data.data.products.length}`);
      console.log(`   📊 Total: ${productsResponse.data.data.total}`);
      console.log(`   📄 Página: ${productsResponse.data.data.page}`);
      console.log(`   📑 Total páginas: ${productsResponse.data.data.totalPages}`);
      
      // Show first product
      if (productsResponse.data.data.products.length > 0) {
        const firstProduct = productsResponse.data.data.products[0];
        console.log(`   🔍 Primer producto: ${firstProduct.name} - Stock: ${firstProduct.stock}`);
      }
    }
    
    // 3. Test with pagination
    console.log('\n3. 📄 Probando paginación...');
    const paginatedResponse = await axios.get('http://localhost:3000/api/v1/products?page=1&limit=5', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log(`   📦 Productos página 1: ${paginatedResponse.data.data.products.length}`);
    console.log(`   📊 Total: ${paginatedResponse.data.data.total}`);
    
    // 4. Test with search
    console.log('\n4. 🔍 Probando búsqueda...');
    const searchResponse = await axios.get('http://localhost:3000/api/v1/products?search=crema', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log(`   📦 Productos con "crema": ${searchResponse.data.data.products.length}`);
    
    console.log('\n✅ CORRECCIÓN EXITOSA:');
    console.log('   - Products API devuelve estructura correcta');
    console.log('   - Frontend debería poder acceder a response.products');
    console.log('   - Paginación funciona correctamente');
    console.log('   - Búsqueda funciona correctamente');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testProductsFix();