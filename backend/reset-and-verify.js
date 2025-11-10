console.log('🔄 Instrucciones para resetear rate limiting y verificar datos...\n');

console.log('📋 PROBLEMA IDENTIFICADO:');
console.log('   - Rate limiting/brute force protection está activo');
console.log('   - Bloqueando después de 5 intentos fallidos de login');
console.log('   - Tiempo de espera: 5 minutos');

console.log('\n🔧 SOLUCIONES:');
console.log('');
console.log('1. 🔄 REINICIAR BACKEND (Recomendado):');
console.log('   - Ve a la terminal del backend');
console.log('   - Presiona Ctrl+C para detener');
console.log('   - Ejecuta: npm run dev');
console.log('   - Esto resetea el rate limiting en memoria');
console.log('');
console.log('2. ⏳ ESPERAR 5 MINUTOS:');
console.log('   - El rate limiting se resetea automáticamente');
console.log('   - Luego podrás hacer login normalmente');
console.log('');
console.log('3. 🔍 VERIFICAR DATOS SIN LOGIN:');
console.log('   - Algunos endpoints pueden ser públicos');
console.log('   - Verificar directamente en la base de datos');

console.log('\n📊 PARA VERIFICAR SI EL FRONTEND USA DATOS REALES:');
console.log('');
console.log('1. 🌐 Abre el dashboard: http://localhost:5173');
console.log('2. 🔍 Abre DevTools (F12) > Network tab');
console.log('3. 🔐 Intenta hacer login');
console.log('4. 📊 Observa las llamadas de red:');
console.log('');
console.log('   ✅ SI VES LLAMADAS A:');
console.log('      - POST /api/v1/auth/login');
console.log('      - GET /api/v1/products');
console.log('      - GET /api/v1/clients');
console.log('      - GET /api/v1/services/public');
console.log('   → El frontend SÍ está conectado al backend');
console.log('');
console.log('   ❌ SI NO VES LLAMADAS DE RED:');
console.log('      - El frontend puede estar usando datos mock');
console.log('      - Puede haber errores de JavaScript');
console.log('      - La configuración de API puede estar mal');

console.log('\n🔍 VERIFICACIÓN ALTERNATIVA:');
console.log('');
console.log('1. 📝 Modifica un producto en la base de datos:');
console.log('   cd backend && node modify-test-data.js');
console.log('');
console.log('2. 🔄 Recarga el dashboard');
console.log('');
console.log('3. 👀 Observa si los cambios se reflejan:');
console.log('   ✅ SI se reflejan → Frontend conectado al backend');
console.log('   ❌ SI NO se reflejan → Frontend usando datos mock/cache');

console.log('\n💡 DESPUÉS DE RESETEAR EL BACKEND:');
console.log('   - Ejecuta: node compare-backend-frontend-data.js');
console.log('   - Para comparar datos exactos');

console.log('\n🎯 OBJETIVO:');
console.log('   Verificar que el frontend muestre exactamente los mismos');
console.log('   datos que están en la base de datos del backend.');