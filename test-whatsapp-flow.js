/**
 * Script de diagnóstico para probar el flujo completo de WhatsApp
 * Ejecutar en el backend de Easypanel: node test-whatsapp-flow.js
 */

// Cargar variables de entorno si existe .env
require('dotenv').config({ path: '.env' });

async function testWhatsAppFlow() {
  console.log('🔍 ========== INICIANDO DIAGNÓSTICO ==========\n');

  try {
    // 1. Verificar variables de entorno
    console.log('1️⃣ Verificando variables de entorno...');
    const requiredEnvVars = [
      'OPENAI_API_KEY',
      'DB_HOST',
      'DB_NAME',
      'DB_USER',
      'DB_PASSWORD'
    ];

    let allEnvVarsPresent = true;
    for (const envVar of requiredEnvVars) {
      const value = process.env[envVar];
      if (!value) {
        console.error(`   ❌ ${envVar}: NO CONFIGURADA`);
        allEnvVarsPresent = false;
      } else if (envVar === 'OPENAI_API_KEY') {
        console.log(`   ✅ ${envVar}: ${value.substring(0, 20)}...`);
      } else if (envVar.includes('PASSWORD') || envVar.includes('SECRET')) {
        console.log(`   ✅ ${envVar}: ***`);
      } else {
        console.log(`   ✅ ${envVar}: ${value}`);
      }
    }

    if (!allEnvVarsPresent) {
      throw new Error('Faltan variables de entorno requeridas');
    }

    // 2. Probar conexión a base de datos
    console.log('\n2️⃣ Probando conexión a base de datos...');
    let db;
    try {
      db = require('./dist/config/database').default;
      await db.raw('SELECT 1');
      console.log('   ✅ Base de datos conectada');
    } catch (dbError) {
      console.error('   ❌ Error conectando a BD:', dbError.message);
      throw dbError;
    }

    // 3. Verificar que existan clientes
    console.log('\n3️⃣ Verificando tabla de clientes...');
    try {
      const clientCount = await db('clients').count('* as count').first();
      console.log(`   ✅ Clientes en BD: ${clientCount.count}`);
    } catch (clientError) {
      console.error('   ❌ Error consultando clientes:', clientError.message);
    }

    // 4. Verificar que existan servicios
    console.log('\n4️⃣ Verificando servicios activos...');
    try {
      const serviceCount = await db('services').where('is_active', true).count('* as count').first();
      console.log(`   ✅ Servicios activos: ${serviceCount.count}`);
    } catch (serviceError) {
      console.error('   ❌ Error consultando servicios:', serviceError.message);
    }

    // 5. Probar OpenAI directamente
    console.log('\n5️⃣ Probando OpenAI API...');
    try {
      const OpenAI = require('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Hola' }],
        max_tokens: 50
      });
      console.log(`   ✅ OpenAI responde: "${completion.choices[0].message.content}"`);
    } catch (openaiError) {
      console.error('   ❌ Error con OpenAI:', openaiError.message);
      throw openaiError;
    }

    // 6. Simular procesamiento de mensaje
    console.log('\n6️⃣ Simulando procesamiento de mensaje...');
    try {
      const { WhatsAppMessageProcessor } = require('./dist/services/WhatsAppMessageProcessor');
      
      const testPayload = {
        From: 'whatsapp:+56912345678',
        Body: 'Hola, tengo una consulta',
        MessageSid: 'TEST_' + Date.now(),
        To: 'whatsapp:+56912345678',
        ProfileName: 'Usuario Test',
        NumMedia: '0'
      };

      console.log('   📤 Enviando mensaje de prueba...');
      const result = await WhatsAppMessageProcessor.processIncomingMessage(testPayload);
      
      if (result.success) {
        console.log('   ✅ Mensaje procesado exitosamente');
        console.log(`   📨 Respuesta: "${result.response?.substring(0, 100)}..."`);
      } else {
        console.log('   ❌ Error procesando mensaje:', result.error);
      }
    } catch (processorError) {
      console.error('   ❌ Error en WhatsAppMessageProcessor:', processorError.message);
      console.error('   Stack:', processorError.stack);
      throw processorError;
    }

    console.log('\n✅ ========== DIAGNÓSTICO COMPLETADO ==========');
    
    // Cerrar conexión a BD
    if (db) {
      await db.destroy();
    }
    
    process.exit(0);

  } catch (error) {
    console.error('\n❌ ========== ERROR EN DIAGNÓSTICO ==========');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('Type:', error.constructor.name);
    process.exit(1);
  }
}

// Ejecutar diagnóstico
testWhatsAppFlow();
