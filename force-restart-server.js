// Script para forzar reinicio del servidor con los nuevos cambios de CORS
const { spawn, exec } = require('child_process');
const path = require('path');

console.log('🔄 Forzando reinicio del servidor con nuevos cambios de CORS...');

// Matar cualquier proceso en puerto 3000
console.log('🛑 Matando procesos en puerto 3000...');

exec('netstat -ano | findstr :3000', (error, stdout, stderr) => {
  if (stdout) {
    const lines = stdout.split('\n');
    lines.forEach(line => {
      const match = line.match(/\s+(\d+)$/);
      if (match) {
        const pid = match[1];
        console.log(`🔫 Matando proceso ${pid}...`);
        exec(`taskkill /PID ${pid} /F`, (killError) => {
          if (!killError) {
            console.log(`✅ Proceso ${pid} terminado`);
          }
        });
      }
    });
  }
  
  // Esperar un poco y luego iniciar el servidor
  setTimeout(() => {
    startServer();
  }, 2000);
});

function startServer() {
  console.log('🚀 Iniciando servidor con nuevos cambios...');
  
  // Cambiar al directorio backend
  process.chdir(path.join(__dirname, 'backend'));
  
  // Iniciar el servidor
  const server = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true
  });
  
  server.on('error', (error) => {
    console.error('❌ Error al iniciar servidor:', error);
  });
  
  server.on('close', (code) => {
    console.log(`🛑 Servidor cerrado con código ${code}`);
  });
  
  // Manejar Ctrl+C
  process.on('SIGINT', () => {
    console.log('\n🛑 Cerrando servidor...');
    server.kill();
    process.exit(0);
  });
}