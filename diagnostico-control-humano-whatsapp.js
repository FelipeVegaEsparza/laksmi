/**
 * Script de Diagnóstico: Control Humano en WhatsApp
 * 
 * Este script verifica si hay sesiones de control humano activas
 * que estén bloqueando las respuestas automáticas del bot.
 * 
 * Uso:
 *   node diagnostico-control-humano-whatsapp.js
 */

const mysql = require('mysql2/promise');
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

async function main() {
  let connection;

  try {
    log('\n🔍 DIAGNÓSTICO: CONTROL HUMANO EN WHATSAPP', 'bright');
    log(`   Fecha: ${new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' })}`, 'cyan');

    // Conectar a la base de datos
    logSection('📊 CONECTANDO A BASE DE DATOS');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'clinica_belleza',
      port: parseInt(process.env.DB_PORT || '3306')
    });

    log('✅ Conexión establecida', 'green');

    // 1. Verificar conversaciones activas de WhatsApp
    logSection('💬 CONVERSACIONES ACTIVAS DE WHATSAPP');

    const [conversations] = await connection.execute(`
      SELECT 
        id,
        client_id,
        channel,
        status,
        created_at,
        updated_at,
        last_activity,
        context
      FROM conversations
      WHERE channel = 'whatsapp'
        AND status IN ('active', 'escalated')
      ORDER BY updated_at DESC
      LIMIT 20
    `);

    if (conversations.length === 0) {
      log('ℹ️  No hay conversaciones activas de WhatsApp', 'yellow');
    } else {
      log(`📝 Encontradas ${conversations.length} conversaciones activas:`, 'cyan');
      
      for (const conv of conversations) {
        console.log('\n' + '-'.repeat(70));
        log(`Conversación ID: ${conv.id}`, 'bright');
        log(`  Cliente ID: ${conv.client_id}`);
        log(`  Estado: ${conv.status}`, conv.status === 'escalated' ? 'yellow' : 'green');
        log(`  Última actividad: ${conv.last_activity || conv.updated_at}`);
        
        // Parsear contexto para ver si hay humanAgentId
        try {
          const context = JSON.parse(conv.context || '{}');
          if (context.humanAgentId) {
            log(`  ⚠️  CONTROL HUMANO ACTIVO: ${context.humanAgentId}`, 'yellow');
            log(`  Razón de escalación: ${context.escalationReason || 'N/A'}`);
          } else {
            log(`  ✅ Sin control humano en contexto`, 'green');
          }
        } catch (e) {
          log(`  ⚠️  No se pudo parsear contexto`, 'yellow');
        }
      }
    }

    // 2. Verificar escalaciones activas
    logSection('🚨 ESCALACIONES ACTIVAS');

    const [escalations] = await connection.execute(`
      SELECT 
        id,
        conversation_id,
        reason,
        priority,
        status,
        assigned_to,
        created_at,
        resolved_at
      FROM escalations
      WHERE status = 'pending'
      ORDER BY created_at DESC
      LIMIT 10
    `);

    if (escalations.length === 0) {
      log('✅ No hay escalaciones pendientes', 'green');
    } else {
      log(`⚠️  Encontradas ${escalations.length} escalaciones pendientes:`, 'yellow');
      
      for (const esc of escalations) {
        console.log('\n' + '-'.repeat(70));
        log(`Escalación ID: ${esc.id}`, 'bright');
        log(`  Conversación: ${esc.conversation_id}`);
        log(`  Razón: ${esc.reason}`);
        log(`  Prioridad: ${esc.priority}`);
        log(`  Asignado a: ${esc.assigned_to || 'Sin asignar'}`, esc.assigned_to ? 'yellow' : 'red');
        log(`  Creada: ${esc.created_at}`);
      }
    }

    // 3. Verificar últimos mensajes de WhatsApp
    logSection('📨 ÚLTIMOS MENSAJES DE WHATSAPP');

    const [messages] = await connection.execute(`
      SELECT 
        m.id,
        m.conversation_id,
        m.sender_type,
        m.content,
        m.created_at,
        c.channel,
        c.status as conversation_status
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE c.channel = 'whatsapp'
      ORDER BY m.created_at DESC
      LIMIT 20
    `);

    if (messages.length === 0) {
      log('ℹ️  No hay mensajes recientes de WhatsApp', 'yellow');
    } else {
      log(`📝 Últimos ${messages.length} mensajes:`, 'cyan');
      
      let currentConvId = null;
      for (const msg of messages) {
        if (msg.conversation_id !== currentConvId) {
          console.log('\n' + '-'.repeat(70));
          log(`Conversación: ${msg.conversation_id} (${msg.conversation_status})`, 'bright');
          currentConvId = msg.conversation_id;
        }
        
        const senderIcon = msg.sender_type === 'client' ? '👤' : 
                          msg.sender_type === 'ai' ? '🤖' : 
                          msg.sender_type === 'human' ? '🧑' : '❓';
        
        const senderColor = msg.sender_type === 'client' ? 'cyan' : 
                           msg.sender_type === 'ai' ? 'green' : 
                           msg.sender_type === 'human' ? 'yellow' : 'reset';
        
        log(`  ${senderIcon} [${msg.sender_type}] ${msg.created_at}`, senderColor);
        log(`     ${msg.content.substring(0, 80)}${msg.content.length > 80 ? '...' : ''}`);
      }
    }

    // 4. Análisis y recomendaciones
    logSection('🔍 ANÁLISIS Y DIAGNÓSTICO');

    const escalatedConversations = conversations.filter(c => c.status === 'escalated');
    const conversationsWithHumanControl = conversations.filter(c => {
      try {
        const context = JSON.parse(c.context || '{}');
        return !!context.humanAgentId;
      } catch {
        return false;
      }
    });

    log('\n📊 Resumen:', 'cyan');
    log(`  • Total conversaciones activas: ${conversations.length}`);
    log(`  • Conversaciones escaladas: ${escalatedConversations.length}`, 
        escalatedConversations.length > 0 ? 'yellow' : 'green');
    log(`  • Con control humano activo: ${conversationsWithHumanControl.length}`, 
        conversationsWithHumanControl.length > 0 ? 'yellow' : 'green');
    log(`  • Escalaciones pendientes: ${escalations.length}`, 
        escalations.length > 0 ? 'yellow' : 'green');

    log('\n🎯 Diagnóstico:', 'cyan');

    if (conversationsWithHumanControl.length > 0) {
      log('\n⚠️  PROBLEMA IDENTIFICADO:', 'yellow');
      log(`   Hay ${conversationsWithHumanControl.length} conversación(es) con control humano activo.`, 'yellow');
      log('   Esto puede estar bloqueando las respuestas automáticas del bot.', 'yellow');
      
      log('\n🔧 Soluciones posibles:', 'cyan');
      log('   1. Finalizar manualmente las sesiones de control humano desde el dashboard');
      log('   2. Esperar 1 hora desde el último mensaje humano (timeout automático)');
      log('   3. Ejecutar script de limpieza de sesiones inactivas');
      
      log('\n💡 Para finalizar control humano:', 'cyan');
      log('   • Accede al dashboard → Conversaciones');
      log('   • Selecciona la conversación');
      log('   • Haz clic en "Finalizar control humano"');
      
    } else if (escalatedConversations.length > 0) {
      log('\n⚠️  ADVERTENCIA:', 'yellow');
      log(`   Hay ${escalatedConversations.length} conversación(es) escalada(s) sin control humano activo.`, 'yellow');
      log('   El bot debería poder responder, pero la conversación está marcada como escalada.', 'yellow');
      
      log('\n🔧 Solución:', 'cyan');
      log('   • Cambiar el estado de la conversación a "active" si ya fue resuelta');
      
    } else {
      log('\n✅ TODO CORRECTO:', 'green');
      log('   No hay sesiones de control humano activas bloqueando el bot.', 'green');
      log('   El bot debería responder normalmente a los mensajes de WhatsApp.', 'green');
      
      log('\n🔍 Si el bot aún no responde, verificar:', 'cyan');
      log('   1. WhatsApp Web está conectado (ver logs del backend)');
      log('   2. No hay errores en el procesamiento de mensajes');
      log('   3. El número de WhatsApp del cliente está correcto');
      log('   4. No hay problemas de red o conectividad');
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
