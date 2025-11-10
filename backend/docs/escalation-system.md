# Sistema de Escalación a Agente Humano

## Descripción General

El sistema de escalación permite transferir conversaciones del agente IA a agentes humanos cuando se detectan situaciones que requieren intervención manual. El sistema incluye detección automática, alertas en tiempo real y una interfaz completa para toma de control manual.

## Componentes Principales

### 1. EscalationService
Servicio principal que maneja la lógica de escalación automática.

**Funcionalidades:**
- Evaluación automática de necesidad de escalación
- Detección de quejas, problemas complejos y solicitudes de agente humano
- Gestión de escalaciones activas
- Estadísticas y métricas

**Criterios de Escalación:**
- **Confianza baja**: Cuando el NLU tiene confianza < 60%
- **Intentos fallidos**: Después de 3 intentos fallidos consecutivos
- **Quejas**: Detección de palabras clave de queja o insatisfacción
- **Solicitudes complejas**: Consultas que requieren conocimiento especializado
- **Problemas de pago**: Asuntos relacionados con facturación o cobros
- **Solicitud explícita**: Cliente pide hablar con agente humano

### 2. HumanTakeoverService
Servicio que maneja la toma de control manual de conversaciones.

**Funcionalidades:**
- Inicio de sesión de control humano
- Envío de mensajes como agente humano
- Pausa y reanudación de control
- Transferencia entre agentes
- Finalización de control y devolución al IA

### 3. AlertService
Sistema de notificaciones para agentes humanos.

**Funcionalidades:**
- Alertas inmediatas para escalaciones urgentes
- Resumen diario de escalaciones
- Rate limiting para evitar spam
- Múltiples canales de notificación (email, SMS)

## API Endpoints

### Escalaciones

```
GET    /api/v1/escalations                    # Obtener escalaciones activas
GET    /api/v1/escalations/my                 # Escalaciones asignadas al usuario
GET    /api/v1/escalations/stats              # Estadísticas de escalaciones
GET    /api/v1/escalations/:escalationId      # Detalles de escalación específica
POST   /api/v1/escalations/conversation/:id   # Escalar conversación manualmente
POST   /api/v1/escalations/:id/assign         # Asignar agente a escalación
POST   /api/v1/escalations/:id/take-control   # Tomar control de escalación
POST   /api/v1/escalations/:id/resolve        # Resolver escalación
GET    /api/v1/escalations/system/status      # Estado completo del sistema
```

### Toma de Control Manual

```
POST   /api/v1/takeover/:conversationId/start    # Iniciar control manual
POST   /api/v1/takeover/:conversationId/message  # Enviar mensaje como humano
POST   /api/v1/takeover/:conversationId/pause    # Pausar control
POST   /api/v1/takeover/:conversationId/resume   # Reanudar control
POST   /api/v1/takeover/:conversationId/end      # Finalizar control
POST   /api/v1/takeover/:conversationId/transfer # Transferir a otro agente
GET    /api/v1/takeover/:conversationId          # Obtener sesión activa
GET    /api/v1/takeover/sessions/my              # Sesiones del agente actual
GET    /api/v1/takeover/sessions/stats           # Estadísticas de sesiones
```

## Flujo de Escalación Automática

1. **Evaluación**: Cada mensaje se evalúa automáticamente en MessageRouter
2. **Detección**: Se analizan múltiples criterios (confianza, palabras clave, etc.)
3. **Escalación**: Si se cumple algún criterio, se crea una escalación
4. **Notificación**: Se envían alertas a agentes humanos disponibles
5. **Asignación**: Un agente puede tomar control de la escalación
6. **Resolución**: El agente resuelve el problema y cierra la escalación

## Flujo de Toma de Control Manual

1. **Inicio**: Agente inicia control de una conversación específica
2. **Sesión Activa**: Se crea una sesión que bloquea el IA
3. **Comunicación**: Agente puede enviar mensajes directamente al cliente
4. **Pausa/Reanudación**: Control puede pausarse temporalmente
5. **Transferencia**: Control puede transferirse a otro agente
6. **Finalización**: Sesión se cierra y conversación vuelve al IA

## Configuración

### EscalationService Config
```typescript
{
  confidenceThreshold: 0.6,        // Umbral de confianza mínimo
  maxFailedAttempts: 3,            // Intentos fallidos antes de escalar
  complexityKeywords: [...],       // Palabras clave de complejidad
  escalationReasons: {             // Configuración por tipo de escalación
    complaint: { priority: 'high', autoEscalate: true },
    // ...
  }
}
```

### AlertService Config
```typescript
{
  enabled: true,
  channels: ['email'],             // Canales de notificación
  escalationAlerts: {              // Configuración por prioridad
    urgent: { immediate: true, channels: ['email', 'sms'] },
    // ...
  },
  maxAlertsPerHour: 20            // Rate limiting
}
```

## Tipos de Escalación

### Por Prioridad
- **Urgent**: Problemas críticos, notificación inmediata
- **High**: Quejas o problemas de pago, notificación inmediata
- **Medium**: Confianza baja o solicitudes complejas
- **Low**: Solicitudes de agente humano o problemas técnicos

### Por Razón
- **low_confidence**: Confianza del NLU por debajo del umbral
- **failed_attempts**: Múltiples intentos fallidos de comunicación
- **complaint**: Queja o insatisfacción detectada
- **complex_request**: Solicitud que requiere conocimiento especializado
- **technical_issue**: Problema técnico del sistema
- **payment_issue**: Problema relacionado con pagos
- **client_request**: Solicitud explícita del cliente

## Métricas y Estadísticas

### Escalaciones
- Total de escalaciones activas
- Escalaciones por razón y prioridad
- Tiempo promedio de resolución
- Escalaciones por agente

### Sesiones de Control
- Sesiones activas y pausadas
- Duración promedio de sesiones
- Sesiones por agente
- Transferencias entre agentes

### Alertas
- Total de alertas enviadas
- Alertas por tipo
- Estado de rate limiting
- Configuración actual

## Integración con Otros Sistemas

### MessageRouter
- Evaluación automática en cada mensaje
- Generación de respuestas de escalación
- Bloqueo de IA durante control humano

### ContextManager
- Mantenimiento de contexto durante escalación
- Historial de mensajes para agentes
- Variables de estado de escalación

### NotificationService
- Envío de alertas a agentes
- Plantillas de notificación
- Programación de recordatorios

## Seguridad y Permisos

### Autenticación
- Todos los endpoints requieren autenticación JWT
- Verificación de roles para acciones administrativas

### Autorización
- Agentes solo pueden controlar sus propias sesiones
- Managers/Admins tienen acceso completo
- Transferencias requieren validación de permisos

### Rate Limiting
- Límites por usuario para prevenir abuso
- Rate limiting de alertas para evitar spam
- Cleanup automático de datos antiguos

## Monitoreo y Logs

### Eventos Registrados
- Inicio y fin de escalaciones
- Toma de control y transferencias
- Errores y excepciones
- Métricas de rendimiento

### Alertas del Sistema
- Escalaciones no asignadas por mucho tiempo
- Errores frecuentes en el sistema
- Problemas de conectividad con servicios externos

## Mantenimiento

### Limpieza Automática
- Escalaciones resueltas después de 24 horas
- Sesiones inactivas después de 24 horas
- Rate limits expirados

### Configuración Dinámica
- Actualización de configuración sin reinicio
- Ajuste de umbrales basado en métricas
- Habilitación/deshabilitación de funcionalidades

## Casos de Uso Comunes

### 1. Cliente Insatisfecho
```
Cliente: "Estoy muy molesto con el servicio, quiero mi dinero de vuelta"
Sistema: Detecta "molesto" + "dinero de vuelta" → Escalación automática (complaint, high)
Resultado: Alerta inmediata a agentes, respuesta empática al cliente
```

### 2. Consulta Compleja
```
Cliente: "Necesito un tratamiento especial para mi condición médica específica"
Sistema: Detecta complejidad + baja confianza → Escalación automática (complex_request, medium)
Resultado: Transferencia a especialista
```

### 3. Solicitud Directa
```
Cliente: "Quiero hablar con una persona real"
Sistema: Detecta solicitud explícita → Escalación automática (client_request, low)
Resultado: Conexión inmediata con agente disponible
```

### 4. Problema Técnico
```
Sistema: Error en procesamiento de mensaje → Escalación automática (technical_issue, low)
Resultado: Respuesta de fallback + notificación a equipo técnico
```

## Mejores Prácticas

### Para Agentes
1. Responder rápidamente a escalaciones urgentes
2. Usar mensajes empáticos y profesionales
3. Documentar resoluciones para futuras referencias
4. Transferir cuando sea necesario conocimiento especializado

### Para Administradores
1. Monitorear métricas regularmente
2. Ajustar umbrales basado en patrones
3. Entrenar agentes en uso del sistema
4. Revisar y actualizar palabras clave de detección

### Para Desarrollo
1. Mantener logs detallados para debugging
2. Implementar tests para casos críticos
3. Monitorear rendimiento del sistema
4. Actualizar documentación con cambios