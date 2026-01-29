/**
 * Script de Diagnóstico Completo: WhatsApp Web
 * 
 * Verifica:
 * 1. Estado de conexión de WhatsApp Web
 * 2. Conversaciones recientes en la base de datos
 * 3. Mensajes recientes de WhatsApp
 * 4. Logs del sistema
 * 
 * Uso:
 *   node diagnostico-whatsapp-completo.js
 */

const mysql = require('mysql2/promise');
const https = require('https');
require('dotenv').config({ path: './backend/.env' });

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

async function checkWhatsAppWebStatus() {
  return new Promise((resolve) => {
    const apiUrl = process.env.API_URL || 'https://esteticalaksmi.cl';
    const url = new URL('/api/v1/whatsapp-web/status', apiUrl);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      rejectUnauthorized: false // Para desarrollo
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (error) {
          resolve({ status: res.statusCode, data: null, error: 'Parse error' });
        }
      });
    });

    req.on('error', (error) => {
      resolve({ status: 0, data: null, error: error.message });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({ status: 0, data: null, error: 'Timeout' });
    });

    req.end();
  });
}

async function main() {
  let connection;

  try {
    log('\n🔍 DIAGNÓSTICO COMPLETO: WHATSAPP WEB', 'bright');
    log(`   Fecha: ${new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' })}`, 'cyan');

    // 1. Verificar estado de WhatsApp Web
    logSection('📱 ESTADO DE WHATSAPP WEB');

    log('Consultando estado del servicio...', 'cyan');
    const whatsappStatus = await checkWhatsAppWebStatus();

    if (whatsappStatus.status === 401) {
      log('⚠️  Endpoint requiere autenticación', 'yellow');
      log('   No se puede verificar estado sin token', 'yellow');
    } else if (whatsappStatus.status === 200 && whatsappStatus.data) {
      const status = whatsappStatus.data.data || whatsappStatus.data;
      log(`Estado: ${status.status}`, status.status === 'connected' ? 'green' : 'yellow');
      log(`Mensaje: ${status.message}`);
      log(`Listo: ${status.isReady ? 'Sí' : 'No'}`, status.isReady ? 'green' : 'red');
      
      if (status.status === 'qr') {
        log('\n⚠️  WhatsApp Web NO está conectado', 'yellow');
        log('   Necesita escanear código QR', 'yellow');
      } else if (status.status === 'connected' && status.isReady) {
        log('\n✅ WhatsApp Web está CONECTADO y LISTO', 'green');
      } else {
        log(`\n⚠️  Estado: ${status.status}`, 'yellow');
      }
    } else {
      log('❌ No se pudo obtener estado de WhatsApp Web', 'red');
      log(`   Status: ${whatsappStatus.status}`, 'yellow');
      log(`   Error: ${whatsappStatus.error || 'Unknown'}`, 'yellow');
    }

    // 2. Conectar a la base de datos
    logSection('📊 CONECTANDO A BASE DE DATOS');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'clinica_belleza',
      port: parseInt(process.env.DB_PORT || '3306')
    });

    log('✅ Conexión establecida', 'green');

    // 3. Verificar conversaciones recientes de WhatsApp
    logSection('💬 CONVERSACIONES RECIENTES DE WHATSAPP');

    const [conversations] = await connection.execute(`
      SELECT 
        id,
        client_id,
        channel,
        status,
        created_at,
        updated_at,
        last_activity
      FROM conversations
      WHERE channel = 'whatsapp'
      ORDER BY created_at DESC
      LIMIT 10
    `);

    if (conversations.length === 0) {
      log('⚠️  NO hay conversaciones de WhatsApp en la base de datos', 'yellow');
      log('   Esto indica que NO se están creando conversaciones nuevas', 'yellow');
    } else {
      log(`📝 Últimas ${conversations.length} conversaciones:`, 'cyan');
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let todayCount = 0;
      
      for (const conv of conversations) {
        const createdDate = new Date(conv.created_at);
        const isToday = createdDate >= today;
        
        if (isToday) todayCount++;
        
        const dateColor = isToday ? 'green' : 'yellow';
        const dateLabel = isToday ? '🟢 HOY' : '⚪ Antigua';
        
        console.log('\n' + '-'.repeat(70));
        log(`${dateLabel} - ID: ${conv.id}`, dateColor);
        log(`  Cliente: ${conv.client_id}`);
        log(`  Estado: ${conv.status}`);
        log(`  Creada: ${conv.created_at}`);
        log(`  Última actividad: ${conv.last_activity || conv.updated_at}`);
      }
      
      console.log('\n' + '='.repeat(70));
      log(`\n📊 Resumen:`, 'cyan');
      log(`  • Total conversaciones: ${conversations.length}`);
      log(`  • Conversaciones de HOY: ${todayCount}`, todayCount > 0 ? 'green' : 'red');
      log(`  • Conversaciones antiguas: ${conversations.length - todayCount}`, 'yellow');
      
      if (todayCount === 0) {
        log('\n❌ PROBLEMA IDENTIFICADO:', 'red');
        log('   NO se están creando conversaciones nuevas de WhatsApp', 'red');
        log('   Esto significa que los mensajes NO están llegando al sistema', 'red');
      }
    }

    // 4. Verificar mensajes recientes de WhatsApp
    logSection('📨 MENSAJES RECIENTES DE WHATSAPP');

    const [messages] = await connection.execute(`
      SELECT 
        m.id,
        m.conversation_id,
        m.sender_type,
        m.content,
        m.created_at as timestamp,
        c.channel
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE c.channel = 'whatsapp'
      ORDER BY m.created_at DESC
      LIMIT 20
    `);

    if (messages.length === 0) {
      log('⚠️  NO hay mensajes de WhatsApp en la base de datos', 'yellow');
    } else {
      log(`📝 Últimos ${messages.length} mensajes:`, 'cyan');
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let todayCount = 0;
      
      for (const msg of messages) {
        const msgDate = new Date(msg.timestamp);
        const isToday = msgDate >= today;
        
        if (isToday) todayCount++;
        
        const dateColor = isToday ? 'green' : 'yellow';
        const dateLabel = isToday ? '🟢 HOY' : '⚪ Antiguo';
        
        const senderIcon = msg.sender_type === 'client' ? '👤' : 
                          msg.sender_type === 'ai' ? '🤖' : 
                          msg.sender_type === 'human' ? '🧑' : '❓';
        
        log(`${dateLabel} ${senderIcon} [${msg.sender_type}] ${msg.timestamp}`, dateColor);
        log(`   ${msg.content.substring(0, 80)}${msg.content.length > 80 ? '...' : ''}`);
      }
      
      console.log('\n' + '='.repeat(70));
      log(`\n📊 Resumen:`, 'cyan');
      log(`  • Total mensajes: ${messages.length}`);
      log(`  • Mensajes de HOY: ${todayCount}`, todayCount > 0 ? 'green' : 'red');
      log(`  • Mensajes antiguos: ${messages.length - todayCount}`, 'yellow');
      
      if (todayCount === 0) {
        log('\n❌ PROBLEMA CONFIRMADO:', 'red');
        log('   NO se están guardando mensajes nuevos de WhatsApp', 'red');
      }
    }

    // 5. Diagnóstico final
    logSection('🎯 DIAGNÓSTICO FINAL');

    const hasRecentConversations = conversations.some(c => {
      const createdDate = new Date(c.created_at);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return createdDate >= today;
    });

    const hasRecentMessages = messages.some(m => {
      const msgDate = new Date(m.timestamp);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return msgDate >= today;
    });

    if (!hasRecentConversations && !hasRecentMessages) {
      log('\n❌ PROBLEMA CRÍTICO IDENTIFICADO:', 'red');
      log('   WhatsApp Web NO está recibiendo ni procesando mensajes', 'red');
      
      log('\n🔍 Posibles causas:', 'cyan');
      log('   1. WhatsApp Web NO está conectado (no escaneó QR)', 'yellow');
      log('   2. WhatsApp Web está conectado pero el listener no funciona', 'yellow');
      log('   3. Hay un error en el procesamiento de mensajes', 'yellow');
      log('   4. El servicio de WhatsApp Web no se inició correctamente', 'yellow');
      
      log('\n🔧 Soluciones recomendadas:', 'cyan');
      log('   1. Verificar logs del backend para ver si hay errores', 'yellow');
      log('   2. Buscar en logs: "WHATSAPP WEB READY"', 'yellow');
      log('   3. Buscar en logs: "MENSAJE RECIBIDO"', 'yellow');
      log('   4. Si no hay "WHATSAPP WEB READY": escanear código QR', 'yellow');
      log('   5. Si hay "WHATSAPP WEB READY" pero no "MENSAJE RECIBIDO":', 'yellow');
      log('      → El listener no está funcionando correctamente', 'yellow');
      log('      → Reiniciar el servicio de backend', 'yellow');
      
    } else if (hasRecentConversations && hasRecentMessages) {
      log('\n✅ TODO FUNCIONANDO CORRECTAMENTE:', 'green');
      log('   WhatsApp Web está recibiendo y procesando mensajes', 'green');
      
    } else {
      log('\n⚠️  ESTADO INCONSISTENTE:', 'yellow');
      log('   Hay conversaciones pero no mensajes, o viceversa', 'yellow');
      log('   Revisar logs del backend para más detalles', 'yellow');
    }

    logSection('✅ DIAGNÓSTICO COMPLETADO');
    log(`   Tiempo: ${new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' })}`, 'cyan');
    console.log('='.repeat(70) + '\n');

  } catch (error) {
    log(`\n❌ ERROR: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Ejecutar diagnóstico
main().catch(error => {
  log(`\n❌ ERROR FATAL: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
