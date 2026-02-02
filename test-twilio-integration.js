/**
 * Script de prueba para verificar la integración de Twilio
 * Simula el flujo completo de mensajes WhatsApp
 */

const https = require('https');

// Configuración
const API_URL = process.env.API_URL || 'https://api.esteticalaksmi.cl';

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
  console.log('\n' + '='.repeat(70));
  log(title, 'bright');
  console.log('='.repeat(70));
}

async function makeRequest(path, method = 'GET', data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      rejectUnauthorized: false // Para desarrollo
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (error) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testTwilioConnection(token) {
  logSection('📱 1. PRUEBA DE CONEXIÓN CON TWILIO');

  try {
    log('Probando conexión con Twilio...', 'cyan');
    const response = await makeRequest('/api/v1/twilio/test-connection', 'GET', null, token);

    if (response.status === 200 && response.data.success) {
      log('✅ Conexión con Twilio exitosa', 'green');
      log(`   Account SID: ${response.data.data.accountInfo.sid}`, 'cyan');
      log(`   Friendly Name: ${response.data.data.accountInfo.friendlyName}`, 'cyan');
      log(`   Status: ${response.data.data.accountInfo.status}`, 'cyan');
      return true;
    } else {
      log('❌ Error en conexión con Twilio', 'red');
      log(`   Status: ${response.status}`, 'yellow');
      log(`   Error: ${JSON.stringify(response.data, null, 2)}`, 'yellow');
      return false;
    }
  } catch (error) {
    log(`❌ Error al probar conexión: ${error.message}`, 'red');
    return false;
  }
}

async function testTwilioConfig(token) {
  logSection('⚙️  2. VERIFICAR CONFIGURACIÓN DE TWILIO');

  try {
    log('Obteniendo configuración de Twilio...', 'cyan');
    const response = await makeRequest('/api/v1/twilio/config', 'GET', null, token);

    if (response.status === 200 && response.data.success) {
      log('✅ Configuración obtenida exitosamente', 'green');
      const config = response.data.data;
      log(`   Account SID: ${config.accountSid?.substring(0, 10)}...`, 'cyan');
      log(`   Phone Number: ${config.phoneNumber}`, 'cyan');
      log(`   Webhook URL: ${config.webhookUrl || 'No configurado'}`, 'cyan');
      log(`   Validate Signatures: ${config.validateSignatures}`, 'cyan');
      return config;
    } else {
      log('❌ Error al obtener configuración', 'red');
      log(`   Status: ${response.status}`, 'yellow');
      return null;
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    return null;
  }
}

async function simulateWebhook() {
  logSection('📨 3. SIMULAR WEBHOOK DE TWILIO (Mensaje entrante)');

  log('⚠️  NOTA: Esta prueba simula un webhook de Twilio', 'yellow');
  log('   En producción, Twilio envía estos webhooks automáticamente', 'yellow');
  log('   cuando un cliente envía un mensaje por WhatsApp.', 'yellow');

  const webhookPayload = {
    MessageSid: 'SM' + Math.random().toString(36).substring(7),
    From: 'whatsapp:+56944409283',
    To: 'whatsapp:+14155238886',
    Body: 'Hola, quiero información sobre depilación láser',
    NumMedia: '0',
    ProfileName: 'Cliente Test',
    WaId: '56944409283',
    AccountSid: 'ACxxxxx',
    ApiVersion: '2010-04-01'
  };

  log('\n📤 Payload del webhook:', 'cyan');
  console.log(JSON.stringify(webhookPayload, null, 2));

  try {
    log('\n🔄 Enviando webhook simulado...', 'cyan');
    const response = await makeRequest('/api/v1/twilio/webhook/receive', 'POST', webhookPayload);

    log(`\n📥 Respuesta del servidor (Status: ${response.status}):`, 'cyan');
    
    if (response.status === 200) {
      log('✅ Webhook procesado exitosamente', 'green');
      log('\n📝 Respuesta TwiML:', 'cyan');
      console.log(response.data);
      
      // Verificar si hay mensaje en la respuesta
      if (typeof response.data === 'string' && response.data.includes('<Message>')) {
        log('\n✅ El bot generó una respuesta automática', 'green');
        
        // Extraer el mensaje de la respuesta TwiML
        const messageMatch = response.data.match(/<Message>(.*?)<\/Message>/s);
        if (messageMatch) {
          log('\n💬 Mensaje del bot:', 'cyan');
          log(messageMatch[1].trim(), 'bright');
        }
      } else if (typeof response.data === 'string' && response.data.includes('<Response/>')) {
        log('\n⚠️  El bot no generó respuesta (posible control humano activo)', 'yellow');
      }
      
      return true;
    } else {
      log('❌ Error al procesar webhook', 'red');
      log(`   Respuesta: ${JSON.stringify(response.data, null, 2)}`, 'yellow');
      return false;
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    return false;
  }
}

async function testProcessingStats(token) {
  logSection('📊 4. ESTADÍSTICAS DE PROCESAMIENTO');

  try {
    log('Obteniendo estadísticas...', 'cyan');
    const response = await makeRequest('/api/v1/twilio/processing-stats', 'GET', null, token);

    if (response.status === 200 && response.data.success) {
      log('✅ Estadísticas obtenidas', 'green');
      const stats = response.data.data;
      log(`\n📈 Estadísticas del sistema:`, 'cyan');
      log(`   Tipos de media soportados: ${stats.supportedMediaTypes.length}`, 'cyan');
      log(`   Tamaño máximo de media: ${(stats.maxMediaSize / 1024 / 1024).toFixed(2)} MB`, 'cyan');
      log(`   Ruta de almacenamiento: ${stats.mediaStoragePath}`, 'cyan');
      return true;
    } else {
      log('⚠️  No se pudieron obtener estadísticas', 'yellow');
      return false;
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  log('\n🚀 PRUEBA DE INTEGRACIÓN DE TWILIO WHATSAPP', 'bright');
  log(`   API URL: ${API_URL}`, 'cyan');
  log(`   Fecha: ${new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' })}`, 'cyan');

  // Obtener token de autenticación
  const token = process.env.AUTH_TOKEN;
  
  if (!token) {
    log('\n⚠️  ADVERTENCIA: No se proporcionó token de autenticación', 'yellow');
    log('   Algunas pruebas requieren autenticación.', 'yellow');
    log('   Ejecuta: AUTH_TOKEN=tu_token node test-twilio-integration.js', 'yellow');
  }

  // 1. Probar conexión con Twilio
  const connectionOk = await testTwilioConnection(token);

  // 2. Verificar configuración
  const config = await testTwilioConfig(token);

  // 3. Simular webhook (no requiere autenticación)
  const webhookOk = await simulateWebhook();

  // 4. Obtener estadísticas
  if (token) {
    await testProcessingStats(token);
  }

  // Resumen final
  logSection('📝 RESUMEN DE PRUEBAS');

  const results = [
    { name: 'Conexión con Twilio', status: connectionOk },
    { name: 'Configuración de Twilio', status: !!config },
    { name: 'Procesamiento de Webhook', status: webhookOk }
  ];

  results.forEach(result => {
    const icon = result.status ? '✅' : '❌';
    const color = result.status ? 'green' : 'red';
    log(`   ${icon} ${result.name}`, color);
  });

  const allPassed = results.every(r => r.status);

  if (allPassed) {
    log('\n🎉 TODAS LAS PRUEBAS PASARON', 'green');
    log('   El sistema de WhatsApp con Twilio está funcionando correctamente.', 'green');
  } else {
    log('\n⚠️  ALGUNAS PRUEBAS FALLARON', 'yellow');
    log('   Revisa los errores anteriores para más detalles.', 'yellow');
  }

  logSection('✅ PRUEBAS COMPLETADAS');
  log(`   Tiempo: ${new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' })}`, 'cyan');
  console.log('='.repeat(70) + '\n');
}

// Ejecutar pruebas
main().catch(error => {
  log(`\n❌ ERROR FATAL: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
