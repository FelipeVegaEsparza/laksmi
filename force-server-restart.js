// Force server restart verification
console.log('🔍 VERIFICACIÓN COMPLETA DEL SERVIDOR\n');

try {
  // Check if endpoints are in compiled file
  const fs = require('fs');
  const path = require('path');
  
  console.log('1. 📁 Verificando archivo compilado...');
  const distPath = path.join('backend', 'dist', 'app.js');
  
  if (fs.existsSync(distPath)) {
    const content = fs.readFileSync(distPath, 'utf8');
    
    const hasTestUpload = content.includes('/test-upload');
    const hasSimpleUpload = content.includes('/simple-upload');
    
    console.log(`   📄 /test-upload en dist/app.js: ${hasTestUpload ? '✅ SÍ' : '❌ NO'}`);
    console.log(`   📄 /simple-upload en dist/app.js: ${hasSimpleUpload ? '✅ SÍ' : '❌ NO'}`);
    
    if (!hasTestUpload || !hasSimpleUpload) {
      console.log('\n❌ PROBLEMA: Los endpoints NO están en el archivo compilado');
      console.log('📋 SOLUCIÓN:');
      console.log('   1. Detén el servidor (Ctrl+C)');
      console.log('   2. Ejecuta: npm run build');
      console.log('   3. Ejecuta: npm run start');
      return;
    }
    
    console.log('\n✅ Los endpoints SÍ están en el archivo compilado');
    
  } else {
    console.log('   ❌ El archivo dist/app.js no existe');
    return;
  }
  
  console.log('\n2. 🔍 Verificando si el servidor usa el archivo correcto...');
  console.log('   📋 INSTRUCCIONES CRÍTICAS:');
  console.log('   1. Ve a la terminal del backend');
  console.log('   2. Verifica que diga "node dist/index.js" al iniciar');
  console.log('   3. Si dice algo diferente, detén y ejecuta "npm run start"');
  console.log('   4. NO uses "npm run dev" - solo "npm run start"');
  
  console.log('\n3. 🎯 Una vez reiniciado correctamente:');
  console.log('   - Ejecuta: node test-ultra-simple.js');
  console.log('   - Deberías ver Status: 200 en ambos endpoints');
  
} catch (error) {
  console.error('❌ Error:', error.message);
}