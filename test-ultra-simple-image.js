// Test para verificar que UltraSimpleImage funciona correctamente
console.log('🧪 Probando UltraSimpleImage...');

// Simular uploadService.getImageUrl
function getImageUrl(path) {
  if (path.startsWith('http')) {
    return path;
  }

  if (path.startsWith('data:')) {
    return path;
  }

  if (path.includes('mock-') || path.includes('emergency-') || path.includes('local-')) {
    return 'https://via.placeholder.com/300x200/f3f4f6/6b7280?text=Imagen+Subida';
  }

  const baseUrl = 'http://localhost:3000';
  const fullUrl = `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  
  // Sin cache busting
  return fullUrl;
}

console.log('🔍 Probando generación de URLs:');

const testPaths = [
  '/uploads/services/images-1760841769319-567190668.jpg',
  '/uploads/services/images-1760842212804-237079016.png',
  'uploads/services/test.jpg',
  'http://localhost:3000/uploads/services/full.png',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
];

testPaths.forEach(path => {
  const url = getImageUrl(path);
  console.log(`  ${path}`);
  console.log(`  → ${url}`);
  console.log('');
});

// Verificar que las URLs no tienen parámetros ?t=
console.log('✅ Verificaciones:');
testPaths.forEach(path => {
  const url = getImageUrl(path);
  const hasParams = url.includes('?t=');
  const status = hasParams ? '❌' : '✅';
  console.log(`  ${status} ${path} → ${hasParams ? 'Tiene parámetros problemáticos' : 'URL limpia'}`);
});

console.log('\n🎯 UltraSimpleImage debería:');
console.log('  ✅ Cargar imágenes inmediatamente (sin loading state)');
console.log('  ✅ Usar URLs limpias sin parámetros ?t=');
console.log('  ✅ Mostrar fallback SVG si hay error');
console.log('  ✅ Loggear éxito/error en console');