/**
 * Script de Diagnóstico Completo: Control Humano en Chatbot
 * 
 * Verifica:
 * 1. Existencia de columnas en BD (migración 038)
 * 2. Estado de conversaciones activas
 * 3. Sesiones de control humano activas
 * 4. Logs recientes del sistema
 * 
 * Uso:
 *   node diagnostico-control-humano-completo.js
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
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
    console.log('\n' + '='.repeat(80));
    log(title, 'bright');
    console.log('='.repeat(80));
}

function logSubSection(title) {
    console.log('\n' + '-'.repeat(80));
    log(title, 'cyan');
    console.log('-'.repeat(80));
}

async function main() {
    let connection;

    try {
        log('\n🔍 DIAGNÓSTICO COMPLETO: CONTROL HUMANO EN CHATBOT', 'bright');
        log(`   Fecha: ${new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' })}`, 'cyan');

        // Conectar a la base de datos
        logSection('📊 PASO 1: CONECTANDO A BASE DE DATOS');

        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'clinica_belleza',
            port: parseInt(process.env.DB_PORT || '3306')
        });

        log('✅ Conexión establecida', 'green');
        log(`   Host: ${process.env.DB_HOST || 'localhost'}`, 'cyan');
        log(`   Base de datos: ${process.env.DB_NAME || 'clinica_belleza'}`, 'cyan');

        // PASO 2: Verificar columnas de control humano
        logSection('📋 PASO 2: VERIFICAR MIGRACIÓN 038 (COLUMNAS DE CONTROL HUMANO)');

        const [columns] = await connection.execute(`
      SHOW COLUMNS FROM conversations LIKE 'human_takeover%'
    `);

        const requiredColumns = [
            'human_takeover_active',
            'human_takeover_agent_id',
            'last_human_message_time'
        ];

        const existingColumns = columns.map(col => col.Field);
        const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

        if (missingColumns.length === 0) {
            log('✅ TODAS LAS COLUMNAS EXISTEN', 'green');
            for (const col of columns) {
                log(`   • ${col.Field} (${col.Type})`, 'green');
            }
        } else {
            log('❌ PROBLEMA CRÍTICO: COLUMNAS FALTANTES', 'red');
            log('   La migración 038 NO se ha aplicado correctamente', 'red');
            log('\n   Columnas faltantes:', 'yellow');
            for (const col of missingColumns) {
                log(`   • ${col}`, 'red');
            }
            log('\n🔧 SOLUCIÓN:', 'cyan');
            log('   1. Reiniciar el backend para aplicar migraciones:', 'cyan');
            log('      docker-compose restart backend', 'yellow');
            log('   2. O en Easypanel: Rebuild del servicio backend', 'yellow');

            // No continuar si faltan columnas
            await connection.end();
            process.exit(1);
        }

        // PASO 3: Verificar migraciones aplicadas
        logSection('📜 PASO 3: VERIFICAR MIGRACIONES APLICADAS');

        const [migrations] = await connection.execute(`
      SELECT id, name, batch, migration_time
      FROM knex_migrations
      WHERE name LIKE '%human%' OR name LIKE '%038%'
      ORDER BY id DESC
    `);

        if (migrations.length > 0) {
            log('✅ Migraciones relacionadas encontradas:', 'green');
            for (const mig of migrations) {
                log(`   • ${mig.name}`, 'green');
                log(`     Batch: ${mig.batch}, Tiempo: ${mig.migration_time}`, 'cyan');
            }
        } else {
            log('⚠️  No se encontraron migraciones relacionadas con control humano', 'yellow');
        }

        // PASO 4: Verificar conversaciones activas
        logSection('💬 PASO 4: CONVERSACIONES ACTIVAS');

        const [conversations] = await connection.execute(`
      SELECT 
        c.id,
        c.client_id,
        c.channel,
        c.status,
        c.human_takeover_active,
        c.human_takeover_agent_id,
        c.last_human_message_time,
        c.last_activity,
        c.created_at,
        cl.name as client_name,
        cl.phone as client_phone
      FROM conversations c
      LEFT JOIN clients cl ON c.client_id = cl.id
      WHERE c.status IN ('active', 'escalated')
      ORDER BY c.last_activity DESC
      LIMIT 20
    `);

        if (conversations.length === 0) {
            log('ℹ️  No hay conversaciones activas', 'yellow');
        } else {
            log(`📝 Encontradas ${conversations.length} conversaciones activas:`, 'cyan');

            let conversationsWithHumanControl = 0;

            for (const conv of conversations) {
                logSubSection(`Conversación: ${conv.id}`);
                log(`  Cliente: ${conv.client_name || 'Sin nombre'} (${conv.client_phone || 'Sin teléfono'})`, 'cyan');
                log(`  Canal: ${conv.channel}`);
                log(`  Estado: ${conv.status}`, conv.status === 'escalated' ? 'yellow' : 'green');
                log(`  Última actividad: ${conv.last_activity || conv.updated_at}`);

                // Verificar control humano
                if (conv.human_takeover_active) {
                    conversationsWithHumanControl++;
                    log(`  🚨 CONTROL HUMANO ACTIVO: SÍ`, 'red');
                    log(`     Agente: ${conv.human_takeover_agent_id || 'Sin asignar'}`, 'yellow');

                    if (conv.last_human_message_time) {
                        const now = new Date();
                        const lastMessage = new Date(conv.last_human_message_time);
                        const minutesSince = Math.floor((now - lastMessage) / 1000 / 60);

                        log(`     Último mensaje humano: ${conv.last_human_message_time}`, 'yellow');
                        log(`     Hace: ${minutesSince} minutos`, minutesSince > 60 ? 'red' : 'yellow');

                        if (minutesSince > 60) {
                            log(`     ⚠️  TIMEOUT: Debería auto-desactivarse`, 'red');
                        }
                    } else {
                        log(`     ⚠️  Sin timestamp de último mensaje`, 'yellow');
                    }
                } else {
                    log(`  ✅ Control humano: NO`, 'green');
                }
            }

            log(`\n📊 Resumen de conversaciones:`, 'cyan');
            log(`   Total activas: ${conversations.length}`);
            log(`   Con control humano: ${conversationsWithHumanControl}`,
                conversationsWithHumanControl > 0 ? 'red' : 'green');
        }

        // PASO 5: Verificar últimos mensajes
        logSection('📨 PASO 5: ÚLTIMOS MENSAJES (ÚLTIMAS 24 HORAS)');

        const [messages] = await connection.execute(`
      SELECT 
        m.id,
        m.conversation_id,
        m.sender_type,
        m.content,
        m.timestamp,
        c.channel,
        c.status as conversation_status,
        c.human_takeover_active
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE m.timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      ORDER BY m.timestamp DESC
      LIMIT 50
    `);

        if (messages.length === 0) {
            log('ℹ️  No hay mensajes en las últimas 24 horas', 'yellow');
        } else {
            log(`📝 Últimos ${messages.length} mensajes:`, 'cyan');

            let currentConvId = null;
            let aiResponsesWithHumanControl = 0;

            for (const msg of messages) {
                if (msg.conversation_id !== currentConvId) {
                    logSubSection(`Conversación: ${msg.conversation_id}`);
                    log(`  Canal: ${msg.channel} | Estado: ${msg.conversation_status}`, 'cyan');
                    log(`  Control humano: ${msg.human_takeover_active ? 'SÍ' : 'NO'}`,
                        msg.human_takeover_active ? 'yellow' : 'green');
                    currentConvId = msg.conversation_id;
                }

                const senderIcon = msg.sender_type === 'client' ? '👤' :
                    msg.sender_type === 'ai' ? '🤖' :
                        msg.sender_type === 'human' ? '🧑' : '❓';

                const senderColor = msg.sender_type === 'client' ? 'cyan' :
                    msg.sender_type === 'ai' ? 'green' :
                        msg.sender_type === 'human' ? 'yellow' : 'reset';

                log(`  ${senderIcon} [${msg.sender_type}] ${msg.timestamp}`, senderColor);
                log(`     ${msg.content.substring(0, 80)}${msg.content.length > 80 ? '...' : ''}`);

                // Detectar problema: IA respondiendo con control humano activo
                if (msg.sender_type === 'ai' && msg.human_takeover_active) {
                    aiResponsesWithHumanControl++;
                    log(`     ⚠️  PROBLEMA: IA respondió con control humano activo`, 'red');
                }
            }

            if (aiResponsesWithHumanControl > 0) {
                log(`\n❌ PROBLEMA DETECTADO:`, 'red');
                log(`   La IA respondió ${aiResponsesWithHumanControl} veces con control humano activo`, 'red');
            }
        }

        // PASO 6: Análisis y diagnóstico
        logSection('🔍 PASO 6: ANÁLISIS Y DIAGNÓSTICO');

        const conversationsWithHumanControl = conversations.filter(c => c.human_takeover_active);
        const expiredSessions = conversationsWithHumanControl.filter(c => {
            if (!c.last_human_message_time) return false;
            const now = new Date();
            const lastMessage = new Date(c.last_human_message_time);
            const minutesSince = Math.floor((now - lastMessage) / 1000 / 60);
            return minutesSince > 60;
        });

        log('\n📊 Resumen General:', 'cyan');
        log(`  • Total conversaciones activas: ${conversations.length}`);
        log(`  • Con control humano activo: ${conversationsWithHumanControl.length}`,
            conversationsWithHumanControl.length > 0 ? 'yellow' : 'green');
        log(`  • Sesiones expiradas (>1h): ${expiredSessions.length}`,
            expiredSessions.length > 0 ? 'red' : 'green');

        log('\n🎯 Diagnóstico:', 'cyan');

        if (conversationsWithHumanControl.length > 0) {
            log('\n⚠️  PROBLEMA IDENTIFICADO:', 'yellow');
            log(`   Hay ${conversationsWithHumanControl.length} conversación(es) con control humano activo.`, 'yellow');
            log('   Esto BLOQUEARÁ las respuestas automáticas del bot.', 'yellow');

            if (expiredSessions.length > 0) {
                log(`\n   ⚠️  ${expiredSessions.length} sesión(es) expirada(s) (>1 hora sin actividad)`, 'red');
                log('   Estas deberían auto-desactivarse pero no lo hicieron.', 'red');
            }

            log('\n🔧 Soluciones:', 'cyan');
            log('   1. Finalizar control humano desde el dashboard:');
            log('      • Ir a Conversaciones → Seleccionar conversación → Finalizar control');
            log('   2. Ejecutar limpieza de sesiones expiradas:');
            log('      • Llamar al endpoint: POST /api/v1/conversations/cleanup-expired-takeovers');
            log('   3. Manualmente en BD (solo si es urgente):');
            log('      UPDATE conversations SET human_takeover_active = false WHERE id = \'ID\';');

        } else {
            log('\n✅ TODO CORRECTO:', 'green');
            log('   No hay sesiones de control humano bloqueando el bot.', 'green');
            log('   El bot debería responder normalmente.', 'green');

            log('\n🔍 Si el bot aún no responde, verificar:', 'cyan');
            log('   1. Logs del backend en Easypanel');
            log('   2. Buscar: "🙋 Message received but conversation is under human control"');
            log('   3. Buscar errores: "Database error checking human takeover state"');
            log('   4. Verificar que el backend se reinició después del último deploy');
        }

        logSection('✅ DIAGNÓSTICO COMPLETADO');
        log(`   Tiempo: ${new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' })}`, 'cyan');
        console.log('='.repeat(80) + '\n');

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
