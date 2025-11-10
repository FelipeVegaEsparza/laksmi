// Test para verificar que la solución del index.ts funciona
const { spawn } = require('child_process');
const path = require('path');

console.log('🔧 Probando la solución definitiva del index.ts...');

// Cambiar al directorio backend
process.chdir(path.join(__dirname, 'backend'));

// Iniciar el servidor con timeout
const server = spawn('npm', ['run', 'dev'], {
  stdio: 'pipe',
  shell: true
});

let output = '';
let hasStarted = false;

server.stdout.on('data', (data) => {
  const text = data.toString();
  output += text;
  console.log(text);
  
  if (text.includes('Servidor iniciado en puerto') || text.includes('Server started')) {
    hasStarted = true;
    console.log('✅ ÉXITO: El servidor se inició correctamente con la nueva configuración');
    server.kill();
    process.exit(0);
  }
});

server.stderr.on('data', (data) => {
  const text = data.toString();
  console.error('Error:', text);
  
  if (text.includes('Error') && !text.includes('warning')) {
    console.log('❌ ERROR: Problema al iniciar el servidor');
    server.kill();
    process.exit(1);
  }
});

// Timeout después de 15 segundos
setTimeout(() => {
  if (!hasStarted) {
    console.log('⏰ Timeout: El servidor tardó demasiado en iniciar');
    server.kill();
    process.exit(1);
  }
}, 15000);

server.on('close', (code) => {
  if (!hasStarted) {
    console.log(`❌ El servidor se cerró con código ${code}`);
    process.exit(code);
  }
});