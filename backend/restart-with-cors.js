console.log('🔄 Reiniciando backend con configuración CORS actualizada...\n');

console.log('📋 Configuración CORS actualizada:');
console.log('   ✅ http://localhost:3001 (Frontend público)');
console.log('   ✅ http://localhost:5173 (Dashboard - puerto preferido)');
console.log('   ✅ http://localhost:5174 (Dashboard - puerto alternativo)');

console.log('\n🔧 Para aplicar los cambios:');
console.log('   1. Detén el backend actual (Ctrl+C)');
console.log('   2. Ejecuta: npm run dev');
console.log('   3. El backend se reiniciará con la nueva configuración CORS');

console.log('\n🎯 Después del reinicio:');
console.log('   - El dashboard en puerto 5174 debería funcionar');
console.log('   - No más errores de CORS');
console.log('   - Podrás hacer login normalmente');

console.log('\n💡 Tip: Si el dashboard sigue en puerto 5174, también puedes:');
console.log('   - Detener el dashboard (Ctrl+C)');
console.log('   - Ejecutar: npm run dev');
console.log('   - Vite intentará usar el puerto 5173 preferido');

console.log('\n🔍 Para verificar que todo funcione:');
console.log('   node test-login.js');