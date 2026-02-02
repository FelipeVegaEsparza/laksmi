/**
 * Script de diagnóstico para verificar el estado del control humano
 * 
 * Este script verifica:
 * 1. Si la migración 038 se aplicó correctamente
 * 2. Si las columnas existen en la tabla conversations
 * 3. El estado actual de las conversaciones con control humano
 * 4. Los logs del backend relacionados con control humano
 */

const mysql = require('mysql2/promise');
require('dotenv').config({ path: './backend/.env' });

async function diagnosticar() {
  console.log('🔍 DIAGNÓSTICO DE CONTROL HUMANO\n');
  console.log('='.repeat(60));
  
  let connection;
  
  try {
    // Conectar a la base de datos
    console.log('\n📡 Conectando a la base de datos...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'laxmi_db'
    });
    console.log('✅ Conexión exitosa\n');

    // 1. Verificar si la migración 038 se ejecutó
    console.log('1️⃣  VERIFICANDO MIGRACIÓN 038');
    console.log('-'.repeat(60));
    
    const [migrations] = await connection.execute(
      'SELECT * FROM schema_migrations WHERE id = 38 OR version LIKE "%038%"'
    );
    
    if (migrations.length > 0) {
      console.log('✅ Migración 038 encontrada:');
      migrations.forEach(m => {
        console.log(`   - ID: ${m.id}, Version: ${m.version}, Ejecutada: ${m.executed_at}`);
      });
    } else {
      console.log('❌ Migración 038 NO encontrada en schema_migrations');
      console.log('   ⚠️  Las columnas de control humano probablemente no existen');
    }

    // 2. Verificar estructura de la tabla conversations
    console.log('\n2️⃣  VERIFICANDO ESTRUCTURA DE LA TABLA');
    console.log('-'.repeat(60));
    
    const [columns] = await connection.execute(
      `SHOW COLUMNS FROM conversations WHERE Field IN (
        'human_takeover_active',
        'human_takeover_agent_id',
        'last_human_message_time'
      )`
    );
    
    const expectedColumns = [
      'human_takeover_active',
      'human_takeover_agent_id',
      'last_human_message_time'
    ];
    
    const foundColumns = columns.map(c => c.Field);
    
    expectedColumns.forEach(col => {
      if (foundColumns.includes(col)) {
        const colInfo = columns.find(c => c.Field === col);
        console.log(`✅ ${col}: ${colInfo.Type} (${colInfo.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
      } else {
        console.log(`❌ ${col}: NO EXISTE`);
      }
    });

    // 3. Verificar conversaciones con control humano activo
    console.log('\n3️⃣  CONVERSACIONES CON CONTROL HUMANO ACTIVO');
    console.log('-'.repeat(60));
    
    if (foundColumns.includes('human_takeover_active')) {
      const [activeConversations] = await connection.execute(`
        SELECT 
          id,
          client_id,
          channel,
          status,
          human_takeover_active,
          human_takeover_agent_id,
          last_human_message_time,
          last_activity,
          created_at
        FROM conversations
        WHERE human_takeover_active = TRUE
        ORDER BY last_human_message_time DESC
        LIMIT 10
      `);
      
      if (activeConversations.length > 0) {
        console.log(`✅ ${activeConversations.length} conversación(es) con control humano activo:\n`);
        activeConversations.forEach((conv, index) => {
          console.log(`   ${index + 1}. Conversación: ${conv.id}`);
          console.log(`      - Cliente: ${conv.client_id}`);
          console.log(`      - Canal: ${conv.channel}`);
          console.log(`      - Agente: ${conv.human_takeover_agent_id}`);
          console.log(`      - Último mensaje humano: ${conv.last_human_message_time || 'N/A'}`);
          console.log(`      - Última actividad: ${conv.last_activity}`);
          
          // Calcular tiempo desde último mensaje
          if (conv.last_human_message_time) {
            const timeSince = Date.now() - new Date(conv.last_human_message_time).getTime();
            const minutesSince = Math.round(timeSince / 1000 / 60);
            const hoursSince = (minutesSince / 60).toFixed(1);
            console.log(`      - Tiempo desde último mensaje: ${minutesSince} minutos (${hoursSince} horas)`);
            
            if (minutesSince > 60) {
              console.log(`      ⚠️  EXPIRADO: Debería desactivarse automáticamente`);
            }
          }
          console.log('');
        });
      } else {
        console.log('ℹ️  No hay conversaciones con control humano activo');
      }
    } else {
      console.log('⚠️  No se puede verificar - columna human_takeover_active no existe');
    }

    // 4. Verificar conversaciones recientes (últimas 24 horas)
    console.log('\n4️⃣  CONVERSACIONES RECIENTES (ÚLTIMAS 24 HORAS)');
    console.log('-'.repeat(60));
    
    const [recentConversations] = await connection.execute(`
      SELECT 
        id,
        client_id,
        channel,
        status,
        ${foundColumns.includes('human_takeover_active') ? 'human_takeover_active,' : ''}
        ${foundColumns.includes('human_takeover_agent_id') ? 'human_takeover_agent_id,' : ''}
        last_activity,
        created_at
      FROM conversations
      WHERE last_activity >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      ORDER BY last_activity DESC
      LIMIT 10
    `);
    
    if (recentConversations.length > 0) {
      console.log(`✅ ${recentConversations.length} conversación(es) reciente(s):\n`);
      recentConversations.forEach((conv, index) => {
        console.log(`   ${index + 1}. ${conv.id} - ${conv.channel} - ${conv.status}`);
        if (foundColumns.includes('human_takeover_active')) {
          console.log(`      Control humano: ${conv.human_takeover_active ? '✅ ACTIVO' : '❌ Inactivo'}`);
          if (conv.human_takeover_active && conv.human_takeover_agent_id) {
            console.log(`      Agente: ${conv.human_takeover_agent_id}`);
          }
        }
        console.log(`      Última actividad: ${conv.last_activity}`);
        console.log('');
      });
    } else {
      console.log('ℹ️  No hay conversaciones recientes');
    }

    // 5. Verificar mensajes recientes de tipo 'human'
    console.log('\n5️⃣  MENSAJES RECIENTES DE AGENTES HUMANOS');
    console.log('-'.repeat(60));
    
    const [humanMessages] = await connection.execute(`
      SELECT 
        m.id,
        m.conversation_id,
        m.sender_type,
        m.content,
        m.timestamp,
        c.channel,
        c.status
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE m.sender_type = 'human'
      ORDER BY m.timestamp DESC
      LIMIT 10
    `);
    
    if (humanMessages.length > 0) {
      console.log(`✅ ${humanMessages.length} mensaje(s) de agentes humanos:\n`);
      humanMessages.forEach((msg, index) => {
        console.log(`   ${index + 1}. Conversación: ${msg.conversation_id}`);
        console.log(`      - Canal: ${msg.channel}`);
        console.log(`      - Timestamp: ${msg.timestamp}`);
        console.log(`      - Contenido: ${msg.content.substring(0, 50)}...`);
        console.log('');
      });
    } else {
      console.log('ℹ️  No hay mensajes de agentes humanos');
    }

    // 6. Resumen y recomendaciones
    console.log('\n6️⃣  RESUMEN Y RECOMENDACIONES');
    console.log('='.repeat(60));
    
    const missingColumns = expectedColumns.filter(col => !foundColumns.includes(col));
    
    if (missingColumns.length > 0) {
      console.log('\n❌ PROBLEMA DETECTADO:');
      console.log(`   Las siguientes columnas NO existen: ${missingColumns.join(', ')}`);
      console.log('\n📋 SOLUCIÓN:');
      console.log('   1. Verificar que la migración 038 existe en backend/migrations/');
      console.log('   2. Reiniciar el backend para aplicar la migración:');
      console.log('      docker-compose restart backend');
      console.log('   3. O en Easypanel: Rebuild del servicio backend');
      console.log('   4. Verificar logs del backend para confirmar que la migración se ejecutó');
    } else {
      console.log('\n✅ ESTRUCTURA DE BD CORRECTA');
      console.log('   Todas las columnas necesarias existen');
      
      if (activeConversations && activeConversations.length > 0) {
        console.log('\n⚠️  HAY CONVERSACIONES CON CONTROL HUMANO ACTIVO');
        console.log('   El sistema debería estar funcionando correctamente');
        console.log('\n📋 VERIFICAR:');
        console.log('   1. Logs del backend en Easypanel');
        console.log('   2. Buscar errores relacionados con "isUnderHumanControl"');
        console.log('   3. Verificar que el backend se reinició después del último deploy');
      } else {
        console.log('\n✅ SISTEMA LISTO');
        console.log('   No hay conversaciones con control humano activo actualmente');
      }
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nStack trace:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n📡 Conexión cerrada');
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('FIN DEL DIAGNÓSTICO\n');
}

// Ejecutar diagnóstico
diagnosticar().catch(console.error);
