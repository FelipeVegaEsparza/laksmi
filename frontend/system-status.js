const axios = require('axios');
const { execSync } = require('child_process');

async function checkSystemStatus() {
  console.log('🔍 VERIFICACIÓN COMPLETA DEL SISTEMA\n');
  console.log('=' .repeat(50));

  // 1. Verificar backend
  console.log('\n📡 BACKEND:');
  try {
    const response = await axios.get('http://localhost:3000/health', { timeout: 3000 });
    console.log('   ✅ Backend ejecutándose correctamente');
    console.log(`   📋 Versión: ${response.data.version}`);
  } catch (error) {
    console.log('   ❌ Backend no disponible');
    console.log('   💡 Ejecuta: cd backend && npm run dev');
  }

  // 2. Verificar APIs públicas
  console.log('\n🌐 APIs PÚBLICAS:');
  const publicAPIs = [
    { name: 'Servicios', url: 'http://localhost:3000/api/v1/services/public' },
    { name: 'Productos', url: 'http://localhost:3000/api/v1/products/public' },
    { name: 'Categorías Servicios', url: 'http://localhost:3000/api/v1/services/categories' },
    { name: 'Categorías Productos', url: 'http://localhost:3000/api/v1/products/categories' }
  ];

  for (const api of publicAPIs) {
    try {
      const response = await axios.get(api.url, { timeout: 3000 });
      console.log(`   ✅ ${api.name}: OK`);
    } catch (error) {
      console.log(`   ❌ ${api.name}: Error ${error.response?.status || 'Conexión'}`);
    }
  }

  // 3. Verificar frontend
  console.log('\n🎨 FRONTEND:');
  try {
    const response = await axios.get('http://localhost:3001', { timeout: 3000 });
    console.log('   ✅ Frontend ejecutándose correctamente');
  } catch (error) {
    console.log('   ❌ Frontend no disponible');
    console.log('   💡 Ejecuta: cd frontend && npm run dev');
  }

  // 4. Verificar dashboard
  console.log('\n📊 DASHBOARD:');
  try {
    const response = await axios.get('http://localhost:5173', { timeout: 3000 });
    console.log('   ✅ Dashboard ejecutándose correctamente');
  } catch (error) {
    console.log('   ❌ Dashboard no disponible');
    console.log('   💡 Ejecuta: cd dashboard && npm run dev');
  }

  // 5. Verificar TypeScript
  console.log('\n🔧 TYPESCRIPT:');
  try {
    execSync('cd backend && npx tsc --noEmit', { stdio: 'pipe' });
    console.log('   ✅ Sin errores de tipos en backend');
  } catch (error) {
    console.log('   ❌ Errores de tipos en backend');
  }

  // 6. Resumen de URLs
  console.log('\n🌍 URLS DEL SISTEMA:');
  console.log('   🎨 Frontend:     http://localhost:3001');
  console.log('   📊 Dashboard:    http://localhost:5173');
  console.log('   📡 Backend API:  http://localhost:3000/api/v1');
  console.log('   🏥 Health Check: http://localhost:3000/health');

  console.log('\n📋 COMANDOS ÚTILES:');
  console.log('   Backend:   cd backend && npm run dev');
  console.log('   Frontend:  cd frontend && npm run dev');
  console.log('   Dashboard: cd dashboard && npm run dev');
  console.log('   Tests:     cd backend && npm test');

  console.log('\n' + '=' .repeat(50));
  console.log('✨ Verificación completada');
}

if (require.main === module) {
  checkSystemStatus().catch(console.error);
}

module.exports = { checkSystemStatus };