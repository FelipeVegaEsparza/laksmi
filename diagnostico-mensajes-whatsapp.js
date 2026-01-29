/**
 * Script de diagnóstico para mensajes de WhatsApp
 * Verifica la configuración de Twilio y el envío de mensajes
 */

const axios = require('axios');

const API_URL = 'https://api.esteticalaksmi.cl';

async function diagnosticar() {
  console.log('🔍 DIAGNÓSTICO DE MENSAJES WHATSAPP\n');
  console.log('='.repeat(60));

  try {
    // 1. Verificar configuración de Twilio
    console.log('\n1️⃣ Verificando configuración de Twilio...');
    const settingsResponse = await axios.get(`${API_URL}/company-settings`);
    const settings = settingsResponse.data;

    console.log('   ✓ Configuración obtenida');
    console.log(`   - Twilio Account SID: ${settings.twilioAccountSid ? settings.twilioAccountSid.substring(0, 10) + '...' : '❌ NO CONFIGURADO'}`);
    console.log(`   - Twilio Auth Token: ${settings.twilioAuthToken ? '✓ Configurado' : '❌ NO CONFIGURADO'}`);
    console.log(`   - Twilio Phone: ${settings.twilioPhoneNumber || '❌ NO CONFIGURADO'}`);

    // 2. Verificar conexión con Twilio
    console.log('\n2️⃣ Verificando conexión con Twilio...');
    try {
      const twilioTestResponse = await axios.get(`${API_URL}/twilio/test-connection`);
      if (twilioTestResponse.data.success) {
        console.log('   ✓ Conexión exitosa con Twilio');
        console.log(`   - Account: ${twilioTestResponse.data.accountInfo?.friendlyName || 'N/A'}`);
        console.log(`   - Status: ${twilioTestResponse.data.accountInfo?.status || 'N/A'}`);
      } else {
        console.log('   ❌ Error de conexión:', twilioTestResponse.data.error);
      }
    } catch (error) {
      console.log('   ❌ No se pudo verificar conexión:', error.response?.data?.error || error.message);
    }

    // 3. Obtener conversaciones recientes
    console.log('\n3️⃣ Obteniendo conversaciones recientes...');
    const conversationsResponse = await axios.get(`${API_URL}/conversations?limit=5`);
    const conversations = conversationsResponse.data.data || [];
    
    console.log(`   ✓ ${conversations.length} conversaciones encontradas`);

    if (conversations.length > 0) {
      const conv = conversations[0];
      console.log(`\n   📱 Conversación más reciente:`);
      console.log(`   - ID: ${conv.id}`);
      console.log(`   - Cliente: ${conv.client?.name || 'N/A'}`);
      console.log(`   - Teléfono: ${conv.client?.phone || '❌ SIN TELÉFONO'}`);
      console.log(`   - Canal: ${conv.channel}`);
      console.log(`   - Estado: ${conv.status}`);

      // 4. Obtener mensajes de la conversación
      console.log('\n4️⃣ Obteniendo mensajes de la conversación...');
      const messagesResponse = await axios.get(`${API_URL}/conversations/${conv.id}/messages`);
      const messages = messagesResponse.data || [];
      
      console.log(`   ✓ ${messages.length} mensajes encontrados`);
      
      // Buscar mensajes humanos
      const humanMessages = messages.filter(m => m.senderType === 'human');
      console.log(`   - Mensajes de agente humano: ${humanMessages.length}`);
      
      if (humanMessages.length > 0) {
        const lastHumanMsg = humanMessages[humanMessages.length - 1];
        console.log(`\n   📤 Último mensaje de agente:`);
        console.log(`   - Contenido: "${lastHumanMsg.content.substring(0, 50)}..."`);
        console.log(`   - Timestamp: ${lastHumanMsg.timestamp}`);
        console.log(`   - Metadata:`, JSON.stringify(lastHumanMsg.metadata, null, 2));
      }
    }

    // 5. Verificar formato de teléfono
    console.log('\n5️⃣ Verificando formato de teléfonos...');
    const clientsResponse = await axios.get(`${API_URL}/clients?limit=5`);
    const clients = clientsResponse.data.clients || [];
    
    console.log(`   ✓ ${clients.length} clientes encontrados`);
    clients.forEach((client, index) => {
      const phone = client.phone || 'N/A';
      const isValid = phone.startsWith('+56') || phone.startsWith('+1');
      console.log(`   ${index + 1}. ${client.name}: ${phone} ${isValid ? '✓' : '⚠️ Formato incorrecto'}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ DIAGNÓSTICO COMPLETADO\n');
    console.log('📋 RECOMENDACIONES:');
    console.log('   1. Verifica que los teléfonos tengan formato +56XXXXXXXXX (Chile)');
    console.log('   2. Verifica que las credenciales de Twilio sean correctas');
    console.log('   3. Revisa los logs del backend en Easypanel para ver errores de Twilio');
    console.log('   4. Verifica que el webhook de Twilio esté configurado correctamente\n');

  } catch (error) {
    console.error('\n❌ ERROR EN DIAGNÓSTICO:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

diagnosticar();
