// Debug which file the server is actually running
console.log('🔍 VERIFICANDO QUÉ ARCHIVO EJECUTA EL SERVIDOR\n');

try {
  // Check if the server is running the compiled version
  console.log('1. 📁 Verificando archivos...');
  
  const fs = require('fs');
  const path = require('path');
  
  // Check source file
  const srcPath = path.join('backend', 'src', 'app.ts');
  if (fs.existsSync(srcPath)) {
    const srcContent = fs.readFileSync(srcPath, 'utf8');
    const hasUploadNow = srcContent.includes('upload-now');
    console.log(`   📄 src/app.ts existe: ${hasUploadNow ? '✅ Tiene upload-now' : '❌ NO tiene upload-now'}`);
  }
  
  // Check compiled file
  const distPath = path.join('backend', 'dist', 'app.js');
  if (fs.existsSync(distPath)) {
    const distContent = fs.readFileSync(distPath, 'utf8');
    const hasUploadNow = distContent.includes('upload-now');
    console.log(`   📄 dist/app.js existe: ${hasUploadNow ? '✅ Tiene upload-now' : '❌ NO tiene upload-now'}`);
  }
  
  // Check package.json scripts
  const packagePath = path.join('backend', 'package.json');
  if (fs.existsSync(packagePath)) {
    const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    console.log('\n2. 📋 Scripts en package.json:');
    console.log(`   dev: ${packageContent.scripts.dev}`);
    console.log(`   start: ${packageContent.scripts.start}`);
  }
  
  console.log('\n3. 🔍 DIAGNÓSTICO:');
  console.log('   Si usas "npm run dev" → ejecuta src/app.ts (TypeScript)');
  console.log('   Si usas "npm run start" → ejecuta dist/app.js (JavaScript compilado)');
  console.log('\n   Para que funcione el upload-now, DEBES usar "npm run start"');
  
} catch (error) {
  console.error('❌ Error:', error.message);
}