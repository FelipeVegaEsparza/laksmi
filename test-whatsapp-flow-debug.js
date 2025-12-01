/**
 * Script para probar el flujo completo de WhatsApp y ver dónde falla
 * 
 * Este script simula un mensaje entrante de WhatsApp y muestra
 * logs detallados en cada paso del procesamiento.
 */

async function probarFlujoWhatsApp() {
    console.log('🧪 PROBANDO FLUJO DE WHATSAPP\n');
    console.log('='.repeat(60));

    try {
        // Importar servicios necesarios
        const { WhatsAppMessageProcessor } = require('./backend/src/services/WhatsAppMessageProcessor');
        const { MessageRouter } = require('./backend/src/services/ai/MessageRouter');
        const { AIService } = require('./backend/src/services/AIService');

        // Payload de prueba simulando un mensaje de WhatsApp
        const testPayload = {
            From: 'whatsapp:+56912345678',
            Body: 'hola, tengo una consulta de criolipólisis',
            MessageSid: 'TEST_' + Date.now(),
            To: 'whatsapp:+56987654321',
            ProfileName: 'Usuario de Prueba',
            NumMedia: '0'
        };

        console.log('\n1️⃣ PAYLOAD DE PRUEBA:');
        console.log(JSON.stringify(testPayload, null, 2));

        console.log('\n2️⃣ LLAMANDO A WhatsAppMessageProcessor.processIncomingMessage...\n');

        const result = await WhatsAppMessageProcessor.processIncomingMessage(testPayload);

        console.log('\n3️⃣ RESULTADO:');
        console.log('Success:', result.success);
        console.log('Response:', result.response?.substring(0, 200));
        console.log('Error:', result.error);
        console.log('Client ID:', result.clientId);
        console.log('Conversation ID:', result.conversationId);

        if (result.success) {
            console.log('\n✅ PRUEBA EXITOSA - El flujo de WhatsApp funciona correctamente');
        } else {
            console.log('\n❌ PRUEBA FALLIDA - Error:', result.error);
        }

    } catch (error) {
        console.log('\n❌ ERROR FATAL EN LA PRUEBA:');
        console.log('Mensaje:', error.message);
        console.log('Stack:', error.stack);
    }

    console.log('\n' + '='.repeat(60));
}

// Ejecutar prueba
probarFlujoWhatsApp()
    .then(() => {
        console.log('\nPrueba completada');
        process.exit(0);
    })
    .catch(error => {
        console.error('\nError fatal:', error);
        process.exit(1);
    });
