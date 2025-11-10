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
  const dashboardPath = path.join(__dirname, 'dashboard');
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

async function checkDatabase() {
  console.log('\n3. 🗄️  BASE DE DATOS:');
  try {
    // This would require backend to be running
    const response = await axios.get('http://localhost:3000/api/v1', { timeout: 3000 });
    console.log('   ✅ Base de datos accesible a través del backend');
  } catch (error) {
    console.log('   ❌ No se puede verificar la base de datos');
  }
}

function showSolutions() {
  console.log('\n' + '='.repeat(60));
  console.log('🔧 SOLUCIONES RECOMENDADAS:');
  console.log('');
  console.log('1. Para iniciar el backend:');
  console.log('   cd backend && npm run dev');
  console.log('');
  console.log('2. Para iniciar el dashboard:');
  console.log('   cd dashboard && npm install && npm run dev');
  console.log('');
  console.log('3. URLs del sistema:');
  console.log('   🖥️  Backend: http://localhost:3000');
  console.log('   🎨 Dashboard: http://localhost:5173');
  console.log('   🌐 Frontend: http://localhost:3001');
  console.log('');
  console.log('4. Credenciales de prueba:');
  console.log('   👤 Usuario: admin');
  console.log('   🔑 Contraseña: admin123');
  console.log('');
  console.log('5. Para ver productos en el dashboard:');
  console.log('   - Asegúrate de que ambos servicios estén ejecutándose');
  console.log('   - Inicia sesión con las credenciales de admin');
  console.log('   - Navega a la sección "Productos"');
}

async function runDiagnosis() {
  await checkBackend();
  await checkDashboard();
  await checkDatabase();
  showSolutions();
}

runDiagnosis();