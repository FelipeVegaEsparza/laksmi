const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api/v1';

async function testFrontendDataLoading() {
  console.log('🔍 Probando carga de datos del frontend...\n');

  const tests = [
    {
      name: 'Servicios para página principal',
      test: async () => {
        const response = await axios.get(`${API_BASE_URL}/services/public`);
        const services = response.data.data?.services || response.data.data || response.data;
        
        if (!Array.isArray(services)) {
          throw new Error(`Esperaba un array, recibió: ${typeof services}`);
        }
        
        console.log(`   ✅ Recibidos ${services.length} servicios`);
        if (services.length > 0) {
          console.log(`   📋 Primer servicio: ${services[0].name} - €${services[0].price}`);
        }
        
        return services;
      }
    },
    {
      name: 'Productos para página de productos',
      test: async () => {
        const response = await axios.get(`${API_BASE_URL}/products/public`);
        const products = response.data.data?.products || response.data.data || response.data;
        
        if (!Array.isArray(products)) {
          throw new Error(`Esperaba un array, recibió: ${typeof products}`);
        }
        
        console.log(`   ✅ Recibidos ${products.length} productos`);
        if (products.length > 0) {
          console.log(`   📋 Primer producto: ${products[0].name} - €${products[0].price}`);
        }
        
        return products;
      }
    },
    {
      name: 'Categorías de servicios',
      test: async () => {
        const response = await axios.get(`${API_BASE_URL}/services/categories`);
        const categories = response.data.data || response.data;
        
        console.log(`   ✅ Recibidas ${categories.length} categorías de servicios`);
        categories.forEach(cat => {
          console.log(`   📂 ${cat.name}: ${cat.description}`);
        });
        
        return categories;
      }
    },
    {
      name: 'Categorías de productos',
      test: async () => {
        const response = await axios.get(`${API_BASE_URL}/products/categories`);
        const categories = response.data.data || response.data;
        
        console.log(`   ✅ Recibidas ${categories.length} categorías de productos`);
        categories.forEach(cat => {
          console.log(`   📂 ${cat.category}: ${cat.count} productos`);
        });
        
        return categories;
      }
    }
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    try {
      console.log(`📡 Probando: ${test.name}`);
      await test.test();
      passedTests++;
      console.log('');
    } catch (error) {
      console.log(`❌ ERROR - ${test.name}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Error: ${error.response.data?.message || error.response.statusText}`);
      } else {
        console.log(`   Error: ${error.message}`);
      }
      console.log('');
    }
  }

  console.log(`📊 RESUMEN:`);
  console.log(`   Tests pasados: ${passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log(`\n🎉 ¡Todos los tests pasaron! El frontend debería poder cargar los datos correctamente.`);
    console.log(`\n💡 Próximos pasos:`);
    console.log(`   1. Reinicia el frontend: npm run dev`);
    console.log(`   2. Visita http://localhost:3001`);
    console.log(`   3. Verifica que los servicios y productos se muestren correctamente`);
  } else {
    console.log(`\n⚠️  Algunos tests fallaron. Revisa la configuración.`);
  }

  return passedTests === totalTests;
}

if (require.main === module) {
  testFrontendDataLoading().catch(console.error);
}

module.exports = { testFrontendDataLoading };