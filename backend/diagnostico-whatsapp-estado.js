/**
 * Script de diagnóstico para verificar el estado del sistema WhatsApp con Twilio
 * Verifica:
 * - Configuración de Twilio en la base de datos
 * - Conversaciones activas
 * - Sesiones de control humano
 * - Últimos mensajes enviados/recibidos
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function diagnosticar() {
  console.log('🔍 Iniciando diagnóstico del sistema WhatsApp con Twilio...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'laxmi_db'
  });

  try {
    // 1. Verificar configuración de Twilio
    console.log('📱 1. Configuración de Twilio:');
    const [twilioConfig] = await connection.execute(
      'SELECT twilio_account_sid, twilio_phone_number FROM company_settings LIMIT 1'
    );
    
    if (twilioConfig.length > 0) {
      const config = twilioConfig[0];
      console.log(`   ✅ Account SID: ${config.twilio_account_sid?.substring(0, 10)}...`);
      console.log(`   ✅ Phone Number: ${config.twilio_phone_number}`);
    } else {
      console.log('   ❌ No se encontró configuración de Twilio');
    }

    // 2. Verificar conversaciones activas
    console.log('\n💬 2. Conversaciones activas:');
    const [conversations] = await connection.execute(`
      SELECT 
        c.id,
        c.client_id,
        c.status,
        c.channel,
        cl.name as client_name,
        cl.phone as client_phone,
        c.created_at,
        c.updated_at
      FROM conversations c
      LEFT JOIN clients cl ON c.client_id = cl.id
      WHERE c.status IN ('active', 'escalated')
      ORDER BY c.updated_at DESC
      LIMIT 5
    `);

    if (conversations.length > 0) {
      conversations.forEach(conv => {
        console.log(`   📞 Conversación ${conv.id.substring(0, 8)}...`);
        console.log(`      Cliente: ${conv.client_name} (${conv.client_phone})`);
        console.log(`      Estado: ${conv.status} | Canal: ${conv.channel}`);
        console.log(`      Última actualización: ${conv.updated_at}`);
      });
    } else {
      console.log('   ℹ️  No hay conversaciones activas');
    }

    // 3. Verificar últimos mensajes
    console.log('\n📨 3. Últimos mensajes (últimas 24 horas):');
    const [messages] = await connection.execute(`
      SELECT 
        m.id,
        m.conversation_id,
        m.sender_type,
        m.content,
        m.created_at,
        c.client_id,
        cl.name as client_name
      FROM messages m
      LEFT JOIN conversations c ON m.conversation_id = c.id
      LEFT JOIN clients cl ON c.client_id = cl.id
      WHERE m.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      ORDER BY m.created_at DESC
      LIMIT 10
    `);

    if (messages.length > 0) {
      messages.forEach(msg => {
        const emoji = msg.sender_type === 'client' ? '👤' : 
                     msg.sender_type === 'human' ? '👨‍💼' : '🤖';
        console.log(`   ${emoji} ${msg.sender_type.toUpperCase()}: ${msg.content.substring(0, 50)}...`);
        console.log(`      Cliente: ${msg.client_name} | ${msg.created_at}`);
      });
    } else {
      console.log('   ℹ️  No hay mensajes en las últimas 24 horas');
    }

    // 4. Verificar clientes con WhatsApp
    console.log('\n👥 4. Clientes con WhatsApp:');
    const [clients] = await connection.execute(`
      SELECT 
        id,
        name,
        phone,
        created_at
      FROM clients
      WHERE phone IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 5
    `);

    if (clients.length > 0) {
      clients.forEach(client => {
        console.log(`   📱 ${client.name}: ${client.phone}`);
      });
    } else {
      console.log('   ℹ️  No hay clientes registrados con teléfono');
    }

    // 5. Estadísticas generales
    console.log('\n📊 5. Estadísticas generales:');
    const [stats] = await connection.execute(`
      SELECT 
        (SELECT COUNT(*) FROM conversations WHERE status = 'active') as conversaciones_activas,
        (SELECT COUNT(*) FROM conversations WHERE status = 'escalated') as conversaciones_escaladas,
        (SELECT COUNT(*) FROM messages WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as mensajes_24h,
        (SELECT COUNT(*) FROM clients WHERE phone IS NOT NULL) as clientes_con_telefono
    `);

    if (stats.length > 0) {
      const s = stats[0];
      console.log(`   📈 Conversaciones activas: ${s.conversaciones_activas}`);
      console.log(`   🚨 Conversaciones escaladas: ${s.conversaciones_escaladas}`);
      console.log(`   💬 Mensajes (24h): ${s.mensajes_24h}`);
      console.log(`   👥 Clientes con teléfono: ${s.clientes_con_telefono}`);
    }

    console.log('\n✅ Diagnóstico completado\n');

  } catch (error) {
    console.error('❌ Error en diagnóstico:', error.message);
  } finally {
    await connection.end();
  }
}

diagnosticar();
