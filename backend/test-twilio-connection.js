/**
 * Script para probar la conexión con Twilio WhatsApp
 * Uso: node backend/test-twilio-connection.js
 */

require('dotenv').config({ path: './backend/.env' });
const twilio = require('twilio');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testTwilioConnection() {
  log('\n🔍 Verificando configuración de Twilio WhatsApp...\n', 'cyan');

  // Verificar variables de entorno
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;
  const webhookUrl = process.env.TWILIO_WEBHOOK_URL;

  log('📋 Variables de entorno:', 'blue');
  log(`   Account SID: ${accountSid ? '✓ Configurado' : '✗ No configurado'}`, accountSid ? 'green' : 'red');
  log(`   Auth Token: ${authToken ? '✓ Configurado' : '✗ No configurado'}`, authToken ? 'green' : 'red');
  log(`   WhatsApp Number: ${whatsappNumber || '✗ No configurado'}`, whatsappNumber ? 'green' : 'red');
  log(`   Webhook URL: ${webhookUrl || '✗ No configurado'}`, webhookUrl ? 'green' : 'red');

  if (!accountSid || !authToken) {
    log('\n❌ Error: Faltan credenciales de Twilio en el archivo .env', 'red');
    log('\nAgrega las siguientes variables a backend/.env:', 'yellow');
    log('   TWILIO_ACCOUNT_SID=tu_account_sid', 'yellow');
    log('   TWILIO_AUTH_TOKEN=tu_auth_token', 'yellow');
    log('   TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886', 'yellow');
    log('   TWILIO_WEBHOOK_URL=https://tu-url.ngrok.io/api/v1/twilio/webhook/receive\n', 'yellow');
    process.exit(1);
  }

  try {
    // Crear cliente de Twilio
    log('\n🔌 Conectando con Twilio...', 'cyan');
    const client = twilio(accountSid, authToken);

    // Obtener información de la cuenta
    log('📡 Obteniendo información de la cuenta...', 'cyan');
    const account = await client.api.accounts(accountSid).fetch();
    
    log('\n✅ Conexión exitosa!', 'green');
    log('\n📊 Información de la cuenta:', 'blue');
    log(`   Nombre: ${account.friendlyName}`, 'green');
    log(`   Estado: ${account.status}`, 'green');
    log(`   Tipo: ${account.type}`, 'green');

    // Verificar números de WhatsApp
    log('\n📱 Verificando números de WhatsApp...', 'cyan');
    try {
      const incomingNumbers = await client.incomingPhoneNumbers.list({ limit: 20 });
      
      if (incomingNumbers.length > 0) {
        log(`   Encontrados ${incomingNumbers.length} números`, 'green');
        incomingNumbers.forEach(number => {
          log(`   - ${number.phoneNumber} (${number.friendlyName})`, 'green');
        });
      } else {
        log('   ⚠️  No se encontraron números. Usa el Sandbox para desarrollo.', 'yellow');
      }
    } catch (error) {
      log('   ℹ️  No se pudieron listar números (normal en cuentas trial)', 'yellow');
    }

    // Verificar balance (solo en cuentas de pago)
    log('\n💰 Verificando balance...', 'cyan');
    try {
      const balance = await client.balance.fetch();
      log(`   Balance: ${balance.currency} ${balance.balance}`, 'green');
    } catch (error) {
      log('   ℹ️  No se pudo obtener el balance (normal en cuentas trial)', 'yellow');
    }

    // Verificar mensajes recientes
    log('\n📨 Verificando mensajes recientes...', 'cyan');
    try {
      const messages = await client.messages.list({ limit: 5 });
      
      if (messages.length > 0) {
        log(`   Últimos ${messages.length} mensajes:`, 'green');
        messages.forEach(msg => {
          const date = new Date(msg.dateCreated).toLocaleString();
          log(`   - ${msg.direction} | ${msg.status} | ${date}`, 'green');
          log(`     De: ${msg.from} → Para: ${msg.to}`, 'green');
        });
      } else {
        log('   No hay mensajes recientes', 'yellow');
      }
    } catch (error) {
      log('   ℹ️  No se pudieron obtener mensajes', 'yellow');
    }

    // Resumen final
    log('\n' + '='.repeat(60), 'cyan');
    log('✅ CONFIGURACIÓN CORRECTA', 'green');
    log('='.repeat(60), 'cyan');
    log('\n📝 Próximos pasos:', 'blue');
    log('   1. Asegúrate de que tu backend esté corriendo', 'yellow');
    log('   2. Si estás en desarrollo local, inicia ngrok:', 'yellow');
    log('      ngrok http 3000', 'cyan');
    log('   3. Configura el Webhook URL en Twilio Console:', 'yellow');
    log('      https://console.twilio.com/us1/develop/sms/settings/whatsapp-sandbox', 'cyan');
    log('   4. Prueba enviando un mensaje de WhatsApp', 'yellow');
    log('\n🎉 ¡Todo listo para usar WhatsApp!\n', 'green');

  } catch (error) {
    log('\n❌ Error al conectar con Twilio:', 'red');
    
    if (error.code === 20003) {
      log('   Credenciales inválidas. Verifica tu Account SID y Auth Token.', 'red');
      log('\n   Puedes encontrarlos en:', 'yellow');
      log('   https://console.twilio.com/', 'cyan');
    } else if (error.code === 20404) {
      log('   Cuenta no encontrada. Verifica tu Account SID.', 'red');
    } else {
      log(`   ${error.message}`, 'red');
      if (error.code) {
        log(`   Código de error: ${error.code}`, 'red');
      }
    }
    
    log('\n📚 Documentación de Twilio:', 'yellow');
    log('   https://www.twilio.com/docs/whatsapp', 'cyan');
    log('\n');
    process.exit(1);
  }
}

// Ejecutar prueba
testTwilioConnection().catch(error => {
  log('\n❌ Error inesperado:', 'red');
  log(`   ${error.message}\n`, 'red');
  process.exit(1);
});
