// Script para probar envío de WhatsApp desde el backend
require('dotenv').config();
const { TwilioService } = require('./dist/services/TwilioService');

async function testWhatsAppSend() {
  console.log('🧪 Iniciando prueba de envío de WhatsApp...\n');
  
  // Inicializar Twilio
  console.log('1️⃣ Inicializando TwilioService...');
  TwilioService.initialize();
  
  // Verificar configuración
  console.log('\n2️⃣ Verificando configuración:');
  const config = TwilioService.getConfig();
  console.log('   - Account SID:', config.accountSid?.substring(0, 10) + '...');
  console.log('   - Phone Number:', config.phoneNumber);
  console.log('   - Webhook URL:', config.webhookUrl);
  
  // Probar conexión
  console.log('\n3️⃣ Probando conexión con Twilio...');
  const connectionTest = await TwilioService.testConnection();
  if (connectionTest.success) {
    console.log('   ✅ Conexión exitosa');
    console.log('   - Account:', connectionTest.accountInfo.friendlyName);
    console.log('   - Status:', connectionTest.accountInfo.status);
  } else {
    console.log('   ❌ Error de conexión:', connectionTest.error);
    return;
  }
  
  // Enviar mensaje de prueba
  console.log('\n4️⃣ Enviando mensaje de prueba...');
  console.log('   Número destino: +56984320723 (tu propio número para prueba)');
  
  const result = await TwilioService.sendWhatsAppMessage({
    to: '+56984320723',
    body: '🧪 Mensaje de prueba desde el backend de Laxmi. Si recibes esto, el sistema está funcionando correctamente.'
  });
  
  console.log('\n5️⃣ Resultado del envío:');
  if (result.success) {
    console.log('   ✅ Mensaje enviado exitosamente');
    console.log('   - Message SID:', result.messageSid);
  } else {
    console.log('   ❌ Error al enviar mensaje');
    console.log('   - Error:', result.error);
  }
  
  console.log('\n✅ Prueba completada\n');
}

testWhatsAppSend().catch(error => {
  console.error('\n❌ Error en la prueba:', error);
  process.exit(1);
});
