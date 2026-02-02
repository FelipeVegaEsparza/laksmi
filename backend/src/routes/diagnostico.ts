import { Router, Request, Response } from 'express';
import db from '../config/database';
import logger from '../utils/logger';

const router = Router();

/**
 * Endpoint de diagnóstico para verificar el estado del control humano
 * GET /api/diagnostico/control-humano
 */
router.get('/control-humano', async (req: Request, res: Response) => {
  try {
    const diagnostico: any = {
      timestamp: new Date().toISOString(),
      resultados: {}
    };

    // 1. Verificar si la migración 038 se ejecutó
    logger.info('🔍 Verificando migración 038...');
    const migrations = await db('schema_migrations')
      .where('id', 38)
      .orWhere('version', 'like', '%038%');
    
    diagnostico.resultados.migracion = {
      encontrada: migrations.length > 0,
      detalles: migrations
    };

    // 2. Verificar estructura de la tabla conversations
    logger.info('🔍 Verificando estructura de tabla...');
    const columns = await db.raw(`
      SHOW COLUMNS FROM conversations WHERE Field IN (
        'human_takeover_active',
        'human_takeover_agent_id',
        'last_human_message_time'
      )
    `);
    
    const columnsList = columns[0];
    const expectedColumns = [
      'human_takeover_active',
      'human_takeover_agent_id',
      'last_human_message_time'
    ];
    
    const foundColumns = columnsList.map((c: any) => c.Field);
    const missingColumns = expectedColumns.filter(col => !foundColumns.includes(col));
    
    diagnostico.resultados.estructura = {
      columnasEncontradas: foundColumns,
      columnasFaltantes: missingColumns,
      todasPresentes: missingColumns.length === 0,
      detalles: columnsList
    };

    // 3. Verificar conversaciones con control humano activo
    if (foundColumns.includes('human_takeover_active')) {
      logger.info('🔍 Verificando conversaciones con control humano...');
      const activeConversations = await db('conversations')
        .select(
          'id',
          'client_id',
          'channel',
          'status',
          'human_takeover_active',
          'human_takeover_agent_id',
          'last_human_message_time',
          'last_activity',
          'created_at'
        )
        .where('human_takeover_active', true)
        .orderBy('last_human_message_time', 'desc')
        .limit(10);
      
      // Calcular tiempo desde último mensaje para cada conversación
      const conversationsWithTime = activeConversations.map(conv => {
        let timeSinceLastMessage = null;
        let expired = false;
        
        if (conv.last_human_message_time) {
          const timeSince = Date.now() - new Date(conv.last_human_message_time).getTime();
          const minutesSince = Math.round(timeSince / 1000 / 60);
          const hoursSince = (minutesSince / 60).toFixed(1);
          
          timeSinceLastMessage = {
            minutos: minutesSince,
            horas: hoursSince
          };
          
          expired = minutesSince > 60;
        }
        
        return {
          ...conv,
          timeSinceLastMessage,
          expired
        };
      });
      
      diagnostico.resultados.conversacionesActivas = {
        total: activeConversations.length,
        conversaciones: conversationsWithTime
      };
    } else {
      diagnostico.resultados.conversacionesActivas = {
        error: 'Columna human_takeover_active no existe'
      };
    }

    // 4. Verificar conversaciones recientes (últimas 24 horas)
    logger.info('🔍 Verificando conversaciones recientes...');
    const recentConversations = await db('conversations')
      .select('id', 'client_id', 'channel', 'status', 'last_activity', 'created_at')
      .where('last_activity', '>=', db.raw('DATE_SUB(NOW(), INTERVAL 24 HOUR)'))
      .orderBy('last_activity', 'desc')
      .limit(10);
    
    diagnostico.resultados.conversacionesRecientes = {
      total: recentConversations.length,
      conversaciones: recentConversations
    };

    // 5. Verificar mensajes recientes de tipo 'human'
    logger.info('🔍 Verificando mensajes de agentes humanos...');
    const humanMessages = await db('messages')
      .join('conversations', 'messages.conversation_id', 'conversations.id')
      .select(
        'messages.id',
        'messages.conversation_id',
        'messages.sender_type',
        'messages.content',
        'messages.timestamp',
        'conversations.channel',
        'conversations.status'
      )
      .where('messages.sender_type', 'human')
      .orderBy('messages.timestamp', 'desc')
      .limit(10);
    
    diagnostico.resultados.mensajesHumanos = {
      total: humanMessages.length,
      mensajes: humanMessages.map(msg => ({
        ...msg,
        contentPreview: msg.content.substring(0, 50) + '...'
      }))
    };

    // 6. Generar resumen y recomendaciones
    const resumen: any = {
      estado: 'OK',
      problemas: [],
      recomendaciones: []
    };

    if (!diagnostico.resultados.migracion.encontrada) {
      resumen.estado = 'ERROR';
      resumen.problemas.push('Migración 038 no encontrada en schema_migrations');
      resumen.recomendaciones.push('Verificar que la migración existe en backend/migrations/');
      resumen.recomendaciones.push('Reiniciar el backend para aplicar la migración');
    }

    if (diagnostico.resultados.estructura.columnasFaltantes.length > 0) {
      resumen.estado = 'ERROR';
      resumen.problemas.push(`Columnas faltantes: ${diagnostico.resultados.estructura.columnasFaltantes.join(', ')}`);
      resumen.recomendaciones.push('Reiniciar el backend: docker-compose restart backend');
      resumen.recomendaciones.push('O en Easypanel: Rebuild del servicio backend');
    }

    if (resumen.estado === 'OK' && diagnostico.resultados.conversacionesActivas?.total > 0) {
      resumen.recomendaciones.push('Sistema funcionando correctamente');
      resumen.recomendaciones.push('Verificar logs del backend para confirmar que isUnderHumanControl() funciona');
    }

    if (resumen.estado === 'OK' && diagnostico.resultados.conversacionesActivas?.total === 0) {
      resumen.recomendaciones.push('Sistema listo - no hay conversaciones con control humano activo');
    }

    diagnostico.resumen = resumen;

    logger.info('✅ Diagnóstico completado', { estado: resumen.estado });

    res.json({
      success: true,
      diagnostico
    });

  } catch (error: any) {
    logger.error('❌ Error en diagnóstico:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

export default router;
