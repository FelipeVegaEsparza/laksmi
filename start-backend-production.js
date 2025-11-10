// Start backend in production mode to ensure compiled files are used
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando backend en modo producción...\n');

try {
  // Change to backend directory and run production start
  const backendDir = path.join(process.cwd(), 'backend');
  
  console.log('📁 Directorio backend:', backendDir);
  console.log('🔨 Compilando...');
  
  // First, build
  const buildProcess = spawn('npm', ['run', 'build'], {
    cwd: backendDir,
    stdio: 'inherit',
    shell: true
  });
  
  buildProcess.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Compilación exitosa');
      console.log('🚀 Iniciando servidor...');
      
      // Then start
      const startProcess = spawn('npm', ['run', 'start'], {
        cwd: backendDir,
        stdio: 'inherit',
        shell: true
      });
      
      startProcess.on('close', (code) => {
        console.log(`Servidor terminado con código: ${code}`);
      });
      
    } else {
      console.error('❌ Error en compilación');
    }
  });
  
} catch (error) {
  console.error('❌ Error:', error.message);
}