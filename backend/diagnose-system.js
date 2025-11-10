const axios = require('axios');
const fs = require('fs');
const path = require('path');

console.log('🔍 Diagnóstico completo del sistema...\n');

async function checkBackend() {
  console.log('1. 🖥️  BACKEND:');
  try {
    const health = await axios.get('http://localhost:3000/health', { timeout: 3000 });
    console.log('   ✅ Backend ejecutándose correctamente');
    console.log(`   📍 Puerto: 3000`);
    console.log(`   🕐 Timestamp: ${health.data.timestamp}`);
    
    // Test login
    try {
      const login = await axios.post('http://localhost:3000/api/v1/auth/login', {
        username: 'admin',
        password: 'admin123'
      });
      console.log('   ✅ Autenticación funcionando');
      
      // Test products with token
      const token = login.data.data.accessToken || login.data.data.token;
      const products = await axios.get('http://localhost:3000/api/v1/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log(`   ✅ API Products: ${products.data.data.total} productos`);
      
    } catch (authError) {
      console.log('   ❌ Error en autenticación:', authError.response?.data?.error || authError.message);
    }
    
  } catch (error) {
    console.log('   ❌ Backend no disponible');
    console.log(`   🔧 Error: ${error.code || error.message}`);
  }
}

async function checkDashboard() {
  console.log('\n2. 🎨 DASHBOARD:');
  
  // Check if dashboard files exist
  const dashboardPath = path.join(__dirname, '..', 'dashboard');
  if (!fs.existsSync(dashboardPath)) {
    console.log('   ❌ Directorio dashboard no encontrado');
    return;
  }
  
  console.log('   ✅ Directorio dashboard existe');
  
  // Check package.json
  const packagePath = path.join(dashboardPath, 'package.json');
  if (fs.existsSync(packagePath)) {
    console.log('   ✅ package.json existe');
  } else {
    console.log('   ❌ package.json no encontrado');
  }
  
  // Check node_modules
  const nodeModulesPath = path.join(dashboardPath, 'node_modules');
  if (fs.existsSync(nodeModulesPath)) {
    console.log('   ✅ node_modules existe');
  } else {
    console.log('   ❌ node_modules no encontrado - ejecutar: npm install');
  }
  
  // Check .env
  const envPath = path.join(dashboardPath, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    console.log('   ✅ .env existe');
    if (envContent.includes('VITE_API_URL=http://localhost:3000')) {
      console.log('   ✅ VITE_API_URL configurado correctamente');
    } else {
      console.log('   ⚠️  VITE_API_URL podría estar mal configurado');
    }
  } else {
    console.log('   ❌ .env no encontrado');
  }
  
  // Try to check if dashboard is running
  try {
    const dashboardResponse = await axios.get('http://localhost:5173', { timeout: 3000 });
    console.log('   ✅ Dashboard ejecutándose en puerto 5173');
  } catch (error) {
    console.log('   ❌ Dashboard no ejecutándose en puerto 5173');
    console.log('   🔧 Para iniciar: cd dashboard && npm run dev');
  }
}

async function checkPorts() {
  console.log('\n3. 🔌 PUERTOS:');
  
  const ports = [
    { port: 3000, service: 'Backend API' },
    { port: 5173, service: 'Dashboard (Vite)' },
    { port: 3001, service: 'Frontend público' }
  ];
  
  for (const { port, service } of ports) {
    try {
      const response = await axios.get(`http://localhost:${port}`, { timeout: 2000 });
      console.log(`   ✅ Puerto ${port} (${service}): Activo`);
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`   ❌ Puerto ${port} (${service}): No disponible`);
      } else {
        console.log(`   ⚠️  Puerto ${port} (${service}): ${error.message}`);
      }
    }
  }
}

function showSolutions() {
  console.log('\n' + '='.repeat(60));
  console.log('🔧 SOLUCIONES PASO A PASO:');
  console.log('');
  console.log('1. 🖥️  INICIAR BACKEND:');
  console.log('   cd backend');
  console.log('   npm run dev');
  console.log('   (Debe mostrar: "Server running on port 3000")');
  console.log('');
  console.log('2. 🎨 INICIAR DASHBOARD:');
  console.log('   # En una nueva terminal:');
  console.log('   cd dashboard');
  console.log('   npm install  # Solo si no tienes node_modules');
  console.log('   npm run dev');
  console.log('   (Debe abrir automáticamente http://localhost:5173)');
  console.log('');
  console.log('3. 🔐 ACCEDER AL DASHBOARD:');
  console.log('   URL: http://localhost:5173');
  console.log('   Usuario: admin');
  console.log('   Contraseña: admin123');
  console.log('');
  console.log('4. 📦 VER PRODUCTOS:');
  console.log('   - Después del login, ir a "Productos" en el menú lateral');
  console.log('   - Deberías ver 10 productos de muestra');
  console.log('');
  console.log('5. ❗ SI SIGUES TENIENDO PROBLEMAS:');
  console.log('   - Verifica que no haya otros servicios usando los puertos');
  console.log('   - Revisa la consola del navegador para errores JavaScript');
  console.log('   - Verifica que las variables de entorno estén correctas');
}

async function runDiagnosis() {
  await checkBackend();
  await checkDashboard();
  await checkPorts();
  showSolutions();
}

runDiagnosis();