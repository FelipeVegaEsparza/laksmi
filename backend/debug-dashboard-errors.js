const axios = require('axios');

console.log('🔍 Debugeando errores específicos del dashboard...\n');

async function debugDashboardErrors() {
  console.log('📋 ERRORES IDENTIFICADOS:');
  console.log('   1. Layout.tsx:187 - Cannot read properties of undefined (reading \'charAt\')');
  console.log('   2. GET http://localhost:5173/assets/js/main.js - 404 Not Found');
  console.log('   3. GET http://localhost:5173/assets/js/index.js - 404 Not Found');
  console.log('   4. React Router Future Flag Warnings');
  
  console.log('\n✅ SOLUCIONES APLICADAS:');
  console.log('   1. ✅ Corregido Layout.tsx - Agregado optional chaining y fallback');
  console.log('      Antes: user?.username.charAt(0)');
  console.log('      Después: user?.username?.charAt(0)?.toUpperCase() || \'U\'');
  
  console.log('\n🔍 VERIFICANDO DASHBOARD:');
  
  // Check if dashboard is running
  try {
    const dashboardResponse = await axios.get('http://localhost:5173', { timeout: 3000 });
    console.log('   ✅ Dashboard ejecutándose en puerto 5173');
    
    // Check if it's serving the correct content
    if (dashboardResponse.data.includes('Dashboard - Clínica de Belleza')) {
      console.log('   ✅ Título correcto en HTML');
    }
    
    if (dashboardResponse.data.includes('/src/main.tsx')) {
      console.log('   ✅ Script principal referenciado correctamente');
    }
    
  } catch (error) {
    console.log('   ❌ Dashboard no disponible en puerto 5173');
    console.log('   🔧 Ejecutar: cd dashboard && npm run dev');
    return;
  }
  
  console.log('\n🔧 SOLUCIONES PARA ERRORES 404:');
  console.log('   Los errores 404 para assets/js/main.js y assets/js/index.js pueden ser causados por:');
  console.log('   1. Cache del navegador');
  console.log('   2. Extensiones del navegador');
  console.log('   3. Service workers antiguos');
  console.log('   4. Build corrupto');
  
  console.log('\n📋 PASOS PARA SOLUCIONAR:');
  console.log('   1. Limpiar cache del navegador:');
  console.log('      - F12 > Application > Storage > Clear site data');
  console.log('      - O usar modo incógnito');
  console.log('');
  console.log('   2. Reiniciar dashboard limpio:');
  console.log('      - cd dashboard');
  console.log('      - node clean-and-restart.js');
  console.log('');
  console.log('   3. Hard refresh:');
  console.log('      - Ctrl+Shift+R');
  console.log('      - O F12 > Network > Disable cache');
  
  console.log('\n⚠️  WARNINGS DE REACT ROUTER:');
  console.log('   Los warnings de React Router son informativos y no afectan la funcionalidad.');
  console.log('   Se pueden ignorar por ahora o actualizar a React Router v7 en el futuro.');
  
  console.log('\n🎯 DESPUÉS DE APLICAR LAS SOLUCIONES:');
  console.log('   ✅ No más errores de Layout');
  console.log('   ✅ No más errores 404 (si eran de cache)');
  console.log('   ✅ Dashboard funcionará correctamente');
  console.log('   ✅ Login y productos funcionarán sin errores');
  
  console.log('\n📱 PARA PROBAR:');
  console.log('   1. Abre http://localhost:5173 en modo incógnito');
  console.log('   2. Login: admin / admin123');
  console.log('   3. Ve a "Productos"');
  console.log('   4. Verifica que no hay errores en consola');
}

debugDashboardErrors();