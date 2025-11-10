const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('🧹 Limpiando y reiniciando dashboard...\n');

function removeDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
    console.log(`   ✅ Eliminado: ${path.basename(dirPath)}`);
    return true;
  }
  return false;
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`📋 Ejecutando: ${command} ${args.join(' ')}`);
    const process = spawn(command, args, { 
      stdio: 'inherit', 
      shell: true,
      ...options
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

async function cleanAndRestart() {
  try {
    console.log('1. 🧹 Limpiando archivos temporales...');
    
    // Remove build artifacts
    removeDirectory(path.join(__dirname, 'dist'));
    removeDirectory(path.join(__dirname, 'node_modules', '.vite'));
    removeDirectory(path.join(__dirname, 'node_modules', '.cache'));
    
    // Remove lock files to force fresh install
    const lockFiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];
    lockFiles.forEach(lockFile => {
      const lockPath = path.join(__dirname, lockFile);
      if (fs.existsSync(lockPath)) {
        fs.unlinkSync(lockPath);
        console.log(`   ✅ Eliminado: ${lockFile}`);
      }
    });
    
    console.log('\n2. 📦 Reinstalando dependencias...');
    await runCommand('npm', ['install'], { cwd: __dirname });
    
    console.log('\n3. 🔧 Verificando configuración...');
    
    // Check .env
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      console.log('   ✅ Archivo .env existe');
      if (envContent.includes('VITE_API_URL=http://localhost:3000')) {
        console.log('   ✅ VITE_API_URL configurado correctamente');
      } else {
        console.log('   ⚠️  Verificar VITE_API_URL en .env');
      }
    } else {
      console.log('   ⚠️  Archivo .env no encontrado');
    }
    
    // Check vite.config.ts
    const viteConfigPath = path.join(__dirname, 'vite.config.ts');
    if (fs.existsSync(viteConfigPath)) {
      console.log('   ✅ vite.config.ts existe');
    }
    
    console.log('\n4. 🚀 Iniciando servidor de desarrollo...');
    console.log('   📍 URL: http://localhost:5173');
    console.log('   🔐 Credenciales: admin / admin123');
    console.log('   🎯 Después del login, ve a "Productos"');
    console.log('\n' + '='.repeat(50));
    
    // Start dev server
    await runCommand('npm', ['run', 'dev'], { cwd: __dirname });
    
  } catch (error) {
    console.error('\n❌ Error durante la limpieza:', error.message);
    console.log('\n🔧 Pasos manuales:');
    console.log('   1. cd dashboard');
    console.log('   2. rm -rf dist node_modules/.vite package-lock.json');
    console.log('   3. npm install');
    console.log('   4. npm run dev');
  }
}

cleanAndRestart();