/**
 * Script de diagnóstico para identificar diferencias entre chatbot web y WhatsApp
 * 
 * Este script verifica:
 * 1. Variables de entorno (OPENAI_API_KEY)
 * 2. Conexión a OpenAI
 * 3. Base de datos
 * 4. Últimos mensajes procesados
 */

const OpenAI = require('openai');
const mysql = require('mysql2/promise');

async function diagnosticarSistema() {
  console.log('🔍 DIAGNÓSTICO DEL SISTEMA\n');
  console.log('='.repeat(60));
  
  // 1. Verificar variables de entorno
  console.log('\n1️⃣ VARIABLES DE ENTORNO');
  console.log('-'.repeat(60));
  
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
  const isDummyKey = process.env.OPENAI_API_KEY === 'dummy-key-for-development';
  const keyPrefix = process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 7) : 'N/A';
  
  console.log(`OPENAI_API_KEY configurada: ${hasOpenAIKey ? '✅ SÍ' : '❌ NO'}`);
  console.log(`Es dummy key: ${isDummyKey ? '⚠️ SÍ (PROBLEMA)' : '✅ NO'}`);
  console.log(`Prefijo de la key: ${keyPrefix}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV || 'no configurado'}`);
  
  // 2. Probar conexión con OpenAI
  console.log('\n2️⃣ CONEXIÓN CON OPENAI');
  console.log('-'.repeat(60));
  
  if (!hasOpenAIKey || isDummyKey) {
    console.log('❌ No se puede probar OpenAI: API key no configurada correctamente');
  } else {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      console.log('Probando conexión con OpenAI...');
      
      const startTime = Date.now();
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Hola, esto es una prueba' }],
        max_tokens: 50
      });
      const endTime = Date.now();
      
      console.log(`✅ OpenAI funciona correctamente`);
      console.log(`   Tiempo de respuesta: ${endTime - startTime}ms`);
      console.log(`   Respuesta: "${completion.choices[0].message.content}"`);
    } catch (error) {
      console.log(`❌ Error al conectar con OpenAI:`);
      console.log(`   ${error.message}`);
      if (error.code) console.log(`   Código: ${error.code}`);
      if (error.type) console.log(`   Tipo: ${error.type}`);
    }
  }
  
  // 3. Verificar base de datos
  console.log('\n3️⃣ BASE DE DATOS');
  console.log('-'.repeat(60));
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'clinica_belleza'
    });
    
    console.log('✅ Conexión a base de datos exitosa');
    
    // Verificar últimos clientes
    const [clients] = await connection.execute(
      'SELECT id, name, phone, created_at FROM clients ORDER BY created_at DESC LIMIT 5'
    );
    console.log(`\n   Últimos 5 clientes:`);
    clients.forEach((client, i) => {
      console.log(`   ${i + 1}. ${client.name} (${client.phone}) - ${client.created_at}`);
    });
    
    // Verificar últimas conversaciones
    const [conversations] = await connection.execute(
      'SELECT id, client_id, channel, status, created_at FROM conversations ORDER BY created_at DESC LIMIT 5'
    );
    console.log(`\n   Últimas 5 conversaciones:`);
    conversations.forEach((conv, i) => {
      console.log(`   ${i + 1}. Cliente ${conv.client_id} - Canal: ${conv.channel} - Estado: ${conv.status}`);
    });
    
    // Verificar últimos mensajes
    const [messages] = await connection.execute(
      `SELECT m.id, m.conversation_id, m.sender_type, m.content, m.created_at, c.channel
       FROM messages m
       JOIN conversations c ON m.conversation_id = c.id
       ORDER BY m.created_at DESC LIMIT 10`
    );
    console.log(`\n   Últimos 10 mensajes:`);
    messages.forEach((msg, i) => {
      const content = msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : '');
      console.log(`   ${i + 1}. [${msg.channel}] ${msg.sender_type}: "${content}"`);
    });
    
    // Contar mensajes por canal
    const [channelStats] = await connection.execute(
      `SELECT c.channel, COUNT(*) as count
       FROM messages m
       JOIN conversations c ON m.conversation_id = c.id
       WHERE m.created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
       GROUP BY c.channel`
    );
    console.log(`\n   Mensajes en las últimas 24 horas por canal:`);
    channelStats.forEach(stat => {
      console.log(`   ${stat.channel}: ${stat.count} mensajes`);
    });
    
    await connection.end();
    
  } catch (error) {
    console.log(`❌ Error al conectar con la base de datos:`);
    console.log(`   ${error.message}`);
  }
  
  // 4. Verificar servicios en base de conocimientos
  console.log('\n4️⃣ BASE DE CONOCIMIENTOS');
  console.log('-'.repeat(60));
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'clinica_belleza'
    });
    
    const [services] = await connection.execute(
      'SELECT id, name, price, is_active FROM services WHERE is_active = 1 LIMIT 10'
    );
    
    console.log(`Total de servicios activos: ${services.length}`);
    if (services.length > 0) {
      console.log('\nPrimeros 5 servicios:');
      services.slice(0, 5).forEach((service, i) => {
        console.log(`   ${i + 1}. ${service.name} - $${service.price}`);
      });
    } else {
      console.log('⚠️ No hay servicios activos en la base de conocimientos');
    }
    
    await connection.end();
    
  } catch (error) {
    console.log(`❌ Error al verificar base de conocimientos:`);
    console.log(`   ${error.message}`);
  }
  
  // Resumen
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN');
  console.log('='.repeat(60));
  
  const issues = [];
  
  if (!hasOpenAIKey || isDummyKey) {
    issues.push('❌ OPENAI_API_KEY no configurada correctamente');
  }
  
  if (issues.length === 0) {
    console.log('✅ No se detectaron problemas obvios de configuración');
    console.log('\n💡 SIGUIENTE PASO:');
    console.log('   Revisar los logs del backend en tiempo real mientras envías');
    console.log('   un mensaje por WhatsApp para ver el error exacto.');
  } else {
    console.log('⚠️ PROBLEMAS DETECTADOS:\n');
    issues.forEach(issue => console.log(`   ${issue}`));
    console.log('\n💡 SOLUCIÓN:');
    if (!hasOpenAIKey || isDummyKey) {
      console.log('   1. Configurar OPENAI_API_KEY en las variables de entorno');
      console.log('   2. La key debe empezar con "sk-"');
      console.log('   3. Reiniciar el backend después de configurar');
    }
  }
  
  console.log('\n');
}

// Ejecutar diagnóstico
diagnosticarSistema()
  .then(() => {
    console.log('Diagnóstico completado');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error fatal en diagnóstico:', error);
    process.exit(1);
  });
