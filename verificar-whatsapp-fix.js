/**
 * Script de Verificación: Solución WhatsApp Ready Event
 * 
 * Este script verifica que todos los cambios necesarios estén aplicados
 * para solucionar el problema del evento "ready" que nunca se dispara.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 ========== VERIFICACIÓN DE SOLUCIÓN WHATSAPP ==========\n');

let allChecksPass = true;

// Check 1: Verificar versión de whatsapp-web.js en package.json
console.log('📦 Check 1: Verificando versión de whatsapp-web.js...');
try {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'backend', 'package.json'), 'utf8')
  );
  
  const whatsappVersion = packageJson.dependencies['whatsapp-web.js'];
  
  if (whatsappVersion === '^1.25.0') {
    console.log('   ✅ Versión correcta: whatsapp-web.js ^1.25.0');
  } else {
    console.log(`   ❌ Versión incorrecta: ${whatsappVersion}`);
    console.log('   📝 Debería ser: ^1.25.0');
    allChecksPass = false;
  }
} catch (error) {
  console.log('   ❌ Error leyendo package.json:', error.message);
  allChecksPass = false;
}

console.log('');

// Check 2: Verificar que WhatsAppWebService.ts tenga las nuevas propiedades
console.log('🔧 Check 2: Verificando cambios en WhatsAppWebService.ts...');
try {
  const serviceFile = fs.readFileSync(
    path.join(__dirname, 'backend', 'src', 'services', 'WhatsAppWebService.ts'),
    'utf8'
  );
  
  const checks = [
    { name: 'readyTimeout', pattern: /private static readyTimeout/, found: false },
    { name: 'initializationAttempts', pattern: /private static initializationAttempts/, found: false },
    { name: 'MAX_INIT_ATTEMPTS', pattern: /private static readonly MAX_INIT_ATTEMPTS/, found: false },
    { name: 'READY_TIMEOUT_MS', pattern: /private static readonly READY_TIMEOUT_MS/, found: false },
    { name: 'startReadyTimeout', pattern: /private static startReadyTimeout/, found: false }
  ];
  
  checks.forEach(check => {
    check.found = check.pattern.test(serviceFile);
    if (check.found) {
      console.log(`   ✅ ${check.name} encontrado`);
    } else {
      console.log(`   ❌ ${check.name} NO encontrado`);
      allChecksPass = false;
    }
  });
  
  // Verificar que el timeout se inicie en el evento 'qr'
  if (serviceFile.includes('this.startReadyTimeout()')) {
    console.log('   ✅ startReadyTimeout() se llama correctamente');
  } else {
    console.log('   ❌ startReadyTimeout() NO se llama');
    allChecksPass = false;
  }
  
} catch (error) {
  console.log('   ❌ Error leyendo WhatsAppWebService.ts:', error.message);
  allChecksPass = false;
}

console.log('');

// Check 3: Verificar que Dockerfile.production tenga Chromium
console.log('🐳 Check 3: Verificando Dockerfile.production...');
try {
  const dockerfile = fs.readFileSync(
    path.join(__dirname, 'backend', 'Dockerfile.production'),
    'utf8'
  );
  
  if (dockerfile.includes('chromium')) {
    console.log('   ✅ Chromium está instalado en el Dockerfile');
  } else {
    console.log('   ❌ Chromium NO está en el Dockerfile');
    allChecksPass = false;
  }
  
  if (dockerfile.includes('PUPPETEER_EXECUTABLE_PATH')) {
    console.log('   ✅ PUPPETEER_EXECUTABLE_PATH está configurado');
  } else {
    console.log('   ❌ PUPPETEER_EXECUTABLE_PATH NO está configurado');
    allChecksPass = false;
  }
  
} catch (error) {
  console.log('   ❌ Error leyendo Dockerfile.production:', error.message);
  allChecksPass = false;
}

console.log('');

// Check 4: Verificar que exista el documento de solución
console.log('📄 Check 4: Verificando documentación...');
try {
  if (fs.existsSync(path.join(__dirname, 'SOLUCION-WHATSAPP-READY-EVENT.md'))) {
    console.log('   ✅ Documento de solución existe');
  } else {
    console.log('   ⚠️  Documento de solución no encontrado (no crítico)');
  }
} catch (error) {
  console.log('   ⚠️  Error verificando documentación:', error.message);
}

console.log('');

// Resumen final
console.log('========================================');
if (allChecksPass) {
  console.log('✅ TODOS LOS CHECKS PASARON');
  console.log('');
  console.log('📋 Próximos pasos:');
  console.log('1. Hacer commit de los cambios');
  console.log('2. Push a tu repositorio');
  console.log('3. En Easypanel: Rebuild del backend');
  console.log('4. Eliminar sesión de WhatsApp (rm -rf /app/whatsapp-session)');
  console.log('5. Reconectar WhatsApp desde el dashboard');
  console.log('6. Verificar logs: debe aparecer "WHATSAPP WEB READY"');
  console.log('7. Enviar mensaje de prueba');
} else {
  console.log('❌ ALGUNOS CHECKS FALLARON');
  console.log('');
  console.log('Por favor revisa los errores arriba y aplica los cambios necesarios.');
}
console.log('========================================');

process.exit(allChecksPass ? 0 : 1);
