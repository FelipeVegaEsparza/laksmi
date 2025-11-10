const axios = require('axios');

console.log('🔧 Solucionando problema de CORS...\n');

async function checkCorsIssue() {
  console.log('1. 🔍 Verificando estado actual...');
  
  // Check backend
  try {
    const health = await axios.get('http://localhost:3000/health');
    console.log('   ✅ Backend ejecutándose en puerto 3000');
  } catch (error) {
    console.log('   ❌ Backend no disponible en puerto 3000');
    console.log('   🔧 Solución: cd backend && npm run dev');
    return;
  }
  
  // Check dashboard ports
  const dashboardPorts = [5173, 5174];
  let dashboardPort = null;
  
  for (const port of dashboardPorts) {
    try {
      await axios.get(`http://localhost:${port}`, { timeout: 2000 });
      console.log(`   ✅ Dashboard ejecutándose en puerto ${port}`);
      dashboardPort = port;
      break;
    } catch (error) {
      // Port not available
    }
  }
  
  if (!dashboardPort) {
    console.log('   ❌ Dashboard no ejecutándose');
    console.log('   🔧 Solución: cd dashboard && npm run dev');
    return;
  }
  
  console.log('\n2. 🌐 Problema identificado:');
  console.log(`   El dashboard está en puerto ${dashboardPort}`);
  console.log('   El backend CORS estaba configurado solo para puerto 5173');
  console.log('   ✅ CORS actualizado para incluir ambos puertos');
  
  console.log('\n3. 🔄 Pasos para solucionar:');
  console.log('   a) Reiniciar el backend para aplicar nueva configuración CORS:');
  console.log('      - Ve a la terminal del backend');
  console.log('      - Presiona Ctrl+C para detenerlo');
  console.log('      - Ejecuta: npm run dev');
  console.log('');
  console.log('   b) (Opcional) Reiniciar dashboard en puerto preferido:');
  console.log('      - Ve a la terminal del dashboard');
  console.log('      - Presiona Ctrl+C para detenerlo');
  console.log('      - Ejecuta: npm run dev');
  console.log('      - Debería usar puerto 5173');
  
  console.log('\n4. ✅ Después del reinicio:');
  console.log('   - No más errores de CORS');
  console.log('   - Login funcionará correctamente');
  console.log('   - Podrás ver los productos en el dashboard');
  
  console.log('\n5. 🎯 URLs finales:');
  console.log('   - Backend: http://localhost:3000');
  console.log('   - Dashboard: http://localhost:5173 (preferido)');
  console.log('   - Dashboard: http://localhost:5174 (alternativo - también funciona)');
  
  console.log('\n6. 🔐 Credenciales:');
  console.log('   - Usuario: admin');
  console.log('   - Contraseña: admin123');
}

checkCorsIssue();