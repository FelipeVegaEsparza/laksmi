/**
 * Script de Diagnóstico: Estado de WhatsApp Web
 * 
 * Este script verifica el estado de conexión de WhatsApp Web
 * y proporciona información detallada para debugging.
 * 
 * Uso:
 *   node diagnostico-whatsapp-estado.js
 */

const https = require('https');

// Configuración
const API_URL = process.env.API_URL || 'https://esteticalaksmi.cl';
const API_VERSION = 'v1';

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60));
}

async function makeRequest(path, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function checkWhatsAppStatus(token) {
  logSection('🔍 VERIFICANDO ESTADO DE WHATSAPP WEB');

  try {
    const response = await makeRequest(`/api/${API_VERSION}/whatsapp-web/status`, token);

    if (response.status === 401) {
      log('❌ ERROR: No autenticado', 'red');
      log('   Este endpoint requiere autenticación.', 'yellow');
      log('   Necesitas proporcionar un token de autenticación.', 'yellow');
      return null;
    }

    if (response.status !== 200) {
      log(`❌ ERROR: Status ${response.status}`, 'red');
      log(`   Respuesta: ${JSON.stringify(response.data, null, 2)}`, 'yellow');
      return null;
    }

    const status = response.data.data;

    log('\n📊 Estado Actual:', 'cyan');
    console.log(JSON.stringify(status, null, 2));

    log('\n📋 Análisis:', 'cyan');

    // Analizar estado
    if (status.status === 'connected' && status.isReady) {
      log('✅ WhatsApp Web está CONECTADO y LISTO', 'green');
      log('   El bot puede enviar y recibir mensajes.', 'green');
    } else if (status.status === 'qr') {
      log('⚠️  WhatsApp Web está esperando ESCANEO DE QR', 'yellow');
      log('   Necesitas escanear el código QR para conectar.', 'yellow');
      
      if (status.qrCode) {
        log('\n📱 Código QR disponible:', 'cyan');
        log('   El QR está disponible en la respuesta.', 'yellow');
        log('   Accede al dashboard para escanearlo.', 'yellow');
      }
    } else if (status.status === 'disconnected') {
      log('❌ WhatsApp Web está DESCONECTADO', 'red');
      log('   Necesitas iniciar la conexión.', 'yellow');
    } else if (status.status === 'error') {
      log('❌ WhatsApp Web tiene un ERROR', 'red');
      log(`   Mensaje: ${status.message}`, 'yellow');
    } else {
      log(`⚠️  Estado desconocido: ${status.status}`, 'yellow');
    }

    return status;

  } catch (error) {
    log(`❌ ERROR al verificar estado: ${error.message}`, 'red');
    return null;
  }
}

async function checkBackendHealth() {
  logSection('🏥 VERIFICANDO SALUD DEL BACKEND');

  try {
    const response = await makeRequest('/health');

    if (response.status === 200) {
      log('✅ Backend está funcionando correctamente', 'green');
      return true;
    } else {
      log(`⚠️  Backend respondió con status ${response.status}`, 'yellow');
      return false;
    }
  } catch (error) {
    log(`❌ ERROR: Backend no responde - ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  log('\n🚀 DIAGNÓSTICO DE WHATSAPP WEB', 'bright');
  log(`   API URL: ${API_URL}`, 'cyan');
  log(`   Fecha: ${new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' })}`, 'cyan');

  // 1. Verificar salud del backend
  const backendHealthy = await checkBackendHealth();

  if (!backendHealthy) {
    log('\n❌ El backend no está respondiendo. No se puede continuar.', 'red');
    process.exit(1);
  }

  // 2. Verificar estado de WhatsApp
  const token = process.env.AUTH_TOKEN || null;
  
  if (!token) {
    log('\n⚠️  ADVERTENCIA: No se proporcionó token de autenticación', 'yellow');
    log('   Para verificar el estado de WhatsApp Web, necesitas:', 'yellow');
    log('   1. Obtener un token de autenticación del dashboard', 'yellow');
    log('   2. Ejecutar: AUTH_TOKEN=tu_token node diagnostico-whatsapp-estado.js', 'yellow');
    log('\n   Intentando sin autenticación...', 'yellow');
  }

  const whatsappStatus = await checkWhatsAppStatus(token);

  // 3. Resumen y recomendaciones
  logSection('📝 RESUMEN Y RECOMENDACIONES');

  if (!whatsappStatus) {
    log('❌ No se pudo obtener el estado de WhatsApp Web', 'red');
    log('\n🔧 Acciones recomendadas:', 'cyan');
    log('   1. Verifica que estés autenticado (proporciona AUTH_TOKEN)', 'yellow');
    log('   2. Accede al dashboard y ve a la sección de WhatsApp', 'yellow');
    log('   3. Revisa los logs del backend en Easypanel', 'yellow');
  } else if (whatsappStatus.status === 'connected' && whatsappStatus.isReady) {
    log('✅ WhatsApp Web está funcionando correctamente', 'green');
    log('\n🎯 El sistema está listo para:', 'cyan');
    log('   • Recibir mensajes de WhatsApp', 'green');
    log('   • Responder automáticamente con el bot', 'green');
    log('   • Procesar comandos y consultas', 'green');
  } else if (whatsappStatus.status === 'qr') {
    log('⚠️  WhatsApp Web necesita ser conectado', 'yellow');
    log('\n🔧 Pasos para conectar:', 'cyan');
    log('   1. Accede a los logs del backend en Easypanel', 'yellow');
    log('   2. Busca el código QR en formato ASCII', 'yellow');
    log('   3. Escanea el QR con WhatsApp en tu teléfono', 'yellow');
    log('   4. Espera a ver "WHATSAPP WEB READY" en los logs', 'yellow');
    log('   5. Ejecuta este script de nuevo para verificar', 'yellow');
  } else {
    log('⚠️  WhatsApp Web no está en estado óptimo', 'yellow');
    log('\n🔧 Acciones recomendadas:', 'cyan');
    log('   1. Revisa los logs del backend en Easypanel', 'yellow');
    log('   2. Considera reiniciar el servicio de backend', 'yellow');
    log('   3. Verifica que el volumen /app/whatsapp-session esté configurado', 'yellow');
  }

  logSection('✅ DIAGNÓSTICO COMPLETADO');
  log(`   Tiempo: ${new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' })}`, 'cyan');
  console.log('='.repeat(60) + '\n');
}

// Ejecutar diagnóstico
main().catch(error => {
  log(`\n❌ ERROR FATAL: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
