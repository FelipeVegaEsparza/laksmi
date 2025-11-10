const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Arreglando problemas del dashboard...\n');

function runCommand(command, args, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    console.log(`📋 Ejecutando: ${command} ${args.join(' ')}`);
    const process = spawn(command, args, { 
      cwd, 
      stdio: 'inherit', 
      shell: true 
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
    
    process.on('error', reject);
  });
}

async function fixDashboard() {
  try {
    console.log('1. 🧹 Limpiando archivos de build...');
    
    // Remove dist folder if exists
    const distPath = path.join(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      fs.rmSync(distPath, { recursive: true, force: true });
      console.log('   ✅ Carpeta dist eliminada');
    }
    
    // Remove node_modules/.vite if exists
    const viteCachePath = path.join(__dirname, 'node_modules', '.vite');
    if (fs.existsSync(viteCachePath)) {
      fs.rmSync(viteCachePath, { recursive: true, force: true });
      console.log('   ✅ Cache de Vite eliminado');
    }
    
    console.log('\n2. 📦 Reinstalando dependencias...');
    await runCommand('npm', ['install'], __dirname);
    
    console.log('\n3. 🔧 Verificando configuración...');
    
    // Check .env file
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      if (envContent.includes('VITE_API_URL=http://localhost:3000')) {
        console.log('   ✅ Variables de entorno correctas');
      } else {
        console.log('   ⚠️  Verificar VITE_API_URL en .env');
      }
    }
    
    console.log('\n4. 🚀 Iniciando dashboard...');
    console.log('   📍 URL: http://localhost:5173');
    console.log('   🔐 Credenciales: admin / admin123');
    console.log('   🎯 Después del login, ve a "Productos"');
    
    // Start dev server
    await runCommand('npm', ['run', 'dev'], __dirname);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n🔧 Solución manual:');
    console.log('   1. cd dashboard');
    console.log('   2. rm -rf dist node_modules/.vite');
    console.log('   3. npm install');
    console.log('   4. npm run dev');
  }
}

fixDashboard();