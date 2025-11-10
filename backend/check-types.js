const { execSync } = require('child_process');

console.log('🔍 Verificando tipos de TypeScript...\n');

try {
  // Verificar tipos del código principal (sin tests)
  console.log('📋 Verificando código principal...');
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log('✅ Código principal: Sin errores de tipos\n');

  // Verificar tipos de los tests
  console.log('📋 Verificando tests...');
  execSync('npx tsc --noEmit --project tsconfig.test.json', { stdio: 'inherit' });
  console.log('✅ Tests: Sin errores de tipos\n');

  console.log('🎉 ¡Todos los archivos TypeScript están correctos!');
} catch (error) {
  console.error('❌ Se encontraron errores de tipos');
  process.exit(1);
}