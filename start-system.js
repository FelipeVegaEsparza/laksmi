const { spawn } = require('child_process');
const axios = require('axios');

console.log('🚀 Iniciando Sistema Completo de Clínica de Belleza\n');

async function checkBackend() {
  try {
    await axios.get('http://localhost:3000/health', { timeout: 3000 });
    return true;
  } catch (error) {
    return false;
  }
}

async function checkDashboard() {
  try {
    await axios.get('http://localhost:5173', { timeout: 3000 });
    return true;
  } catch (error) {
    return false;
  }
}

async function startSystem() {
  console.log('🔍 Verificando estado del sistema...\n');
  
  const backendRunning = await checkBackend();
  const dashboardRunning = await checkDashboard();
  
  console.log(`Backend (puerto 3000): ${backendRunning ? '✅ Ejecutándose' : '❌ No disponible'}`);
  console.log(`Dashboard (puerto 5173): ${dashboardRunning ? '✅ Ejecutándose' : '❌ No disponible'}`);
  
  if (backendRunning && dashboardRunning) {
    console.log('\n🎉 ¡Sistema completamente operativo!');
    console.log('\n📋 URLs del sistema:');
    console.log('   🖥️  Backend API: http://localhost:3000');
    console.log('   🎨 Dashboard Admin: http://localhost:5173');
    console.log('   🌐 Frontend Público: http://localhost:3001');
    console.log('\n🔐 Credenciales del dashboard:');
    console.log('   👤 Usuario: admin');
    console.log('   🔑 Contraseña: admin123');
    console.log('\n📦 Para ver los productos:');
    console.log('   1. Abre http://localhost:5173');
    console.log('   2. Inicia sesión con las credenciales de admin');
    console.log('   3. Ve a la sección "Productos" en el menú lateral');
    console.log('   4. Deberías ver 10 productos de muestra');
    return;
  }
  
  console.log('\n🔧 Servicios que necesitan iniciarse:');
  
  if (!backendRunning) {
    console.log('   ❌ Backend - Ejecutar: cd backend && npm run dev');
  }
  
  if (!dashboardRunning) {
    console.log('   ❌ Dashboard - Ejecutar: cd dashboard && npm run dev');
  }
  
  console.log('\n💡 Tip: Ejecuta cada servicio en una terminal separada');
}

startSystem();