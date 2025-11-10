const { spawn } = require('child_process');
const axios = require('axios');

console.log('🚀 Iniciando dashboard...\n');

// Verificar que el backend esté disponible
async function checkBackend() {
  try {
    const response = await axios.get('http://localhost:3000/health', { timeout: 3000 });
    console.log('✅ Backend disponible');
    return true;
  } catch (error) {
    console.log('❌ Backend no disponible - asegúrate de que esté ejecutándose en puerto 3000');
    return false;
  }
}

async function startDashboard() {
  const backendAvailable = await checkBackend();
  
  if (!backendAvailable) {
    console.log('\n🔧 Para iniciar el backend:');
    console.log('   cd backend && npm run dev');
    return;
  }

  console.log('🎯 Iniciando servidor de desarrollo del dashboard...');
  console.log('📍 URL: http://localhost:5173');
  console.log('🔗 API Backend: http://localhost:3000');
  console.log('\n📋 Credenciales de prueba:');
  console.log('   Usuario: admin');
  console.log('   Contraseña: admin123');
  console.log('\n' + '='.repeat(50));

  const viteProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true
  });

  viteProcess.on('error', (error) => {
    console.error('❌ Error iniciando dashboard:', error.message);
  });

  viteProcess.on('close', (code) => {
    console.log(`\n📊 Dashboard terminado con código: ${code}`);
  });

  // Manejar Ctrl+C
  process.on('SIGINT', () => {
    console.log('\n🛑 Deteniendo dashboard...');
    viteProcess.kill('SIGINT');
    process.exit(0);
  });
}

startDashboard();