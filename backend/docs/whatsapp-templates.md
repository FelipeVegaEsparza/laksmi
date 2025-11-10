# Sistema de Plantillas de WhatsApp Business

## Descripción General

El sistema de plantillas de WhatsApp Business permite enviar mensajes estructurados y programados a los clientes de la clínica de belleza. Este sistema incluye plantillas para recordatorios de citas, confirmaciones de reserva, seguimientos post-tratamiento y promociones.

## Características Principales

### 1. Plantillas Predefinidas

#### Recordatorios de Citas
- **appointment_reminder_24h**: Recordatorio 24 horas antes de la cita
- **appointment_reminder_2h**: Recordatorio 2 horas antes de la cita  
- **appointment_reminder_custom**: Recordatorio personalizable

#### Confirmaciones de Reserva
- **booking_confirmation**: Confirmación estándar de cita
- **booking_confirmation_payment**: Confirmación con información de pago
- **booking_modification_confirmation**: Confirmación de modificación de cita
- **booking_cancellation_confirmation**: Confirmación de cancelación

#### Seguimientos Post-Tratamiento
- **follow_up_immediate**: Seguimiento inmediato con instrucciones de cuidado
- **follow_up_24h**: Seguimiento 24 horas después del tratamiento
- **follow_up_weekly**: Seguimiento semanal con recomendaciones
- **follow_up_satisfaction**: Seguimiento para obtener feedback

#### Promociones y Mensajes Especiales
- **promotion_monthly**: Promoción mensual personalizada
- **welcome_new_client**: Bienvenida a cliente nuevo
- **birthday_special**: Felicitación de cumpleaños con oferta
- **loyalty_milestone**: Reconocimiento por fidelidad

### 2. Sistema de Programación Automática

El sistema permite programar el envío de plantillas para fechas y horas específicas:

- **Recordatorios automáticos**: Se programan automáticamente 24h antes de cada cita
- **Confirmaciones inmediatas**: Se envían al momento de confirmar una reserva
- **Seguimientos programados**: Se programan automáticamente después de completar un tratamiento
- **Promociones periódicas**: Se pueden programar campañas promocionales

### 3. Integración con Twilio

- **Plantillas aprobadas**: Intenta usar plantillas pre-aprobadas de WhatsApp Business
- **Fallback a mensajes regulares**: Si falla la plantilla, envía como mensaje regular
- **Rate limiting**: Respeta los límites de Twilio para evitar bloqueos
- **Retry automático**: Reintenta envíos fallidos con backoff exponencial

## API Endpoints

### Gestión de Plantillas

#### GET /api/v1/twilio/whatsapp-templates
Obtener todas las plantillas disponibles.

**Query Parameters:**
- `category` (opcional): Filtrar por categoría (appointment_reminder, booking_confirmation, follow_up, promotion, general)

**Response:**
```json
{
  "success": true,
  "message": "Plantillas obtenidas exitosamente",
  "data": {
    "templates": [
      {
        "name": "appointment_reminder_24h",
        "language": "es",
        "category": "appointment_reminder",
        "parameters": ["clientName", "serviceName", "appointmentDate", "appointmentTime"],
        "description": "Recordatorio de cita 24 horas antes",
        "content": "🔔 *Recordatorio de Cita*\n\n¡Hola {{clientName}}! 👋..."
      }
    ],
    "stats": {
      "totalTemplates": 16,
      "templatesByCategory": {
        "appointment_reminder": 3,
        "booking_confirmation": 4,
        "follow_up": 4,
        "promotion": 4,
        "general": 1
      }
    }
  }
}
```

#### GET /api/v1/twilio/whatsapp-templates/:templateName
Obtener plantilla específica por nombre.

**Response:**
```json
{
  "success": true,
  "message": "Plantilla obtenida exitosamente",
  "data": {
    "name": "appointment_reminder_24h",
    "language": "es",
    "category": "appointment_reminder",
    "parameters": ["clientName", "serviceName", "appointmentDate", "appointmentTime"],
    "description": "Recordatorio de cita 24 horas antes",
    "content": "🔔 *Recordatorio de Cita*\n\n¡Hola {{clientName}}! 👋..."
  }
}
```

#### POST /api/v1/twilio/whatsapp-templates/:templateName/preview
Previsualizar plantilla con datos específicos.

**Request Body:**
```json
{
  "templateData": {
    "clientName": "María",
    "serviceName": "Facial Hidratante",
    "appointmentDate": "viernes, 15 de marzo de 2024",
    "appointmentTime": "14:30"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Vista previa generada exitosamente",
  "data": {
    "content": "🔔 *Recordatorio de Cita*\n\n¡Hola María! 👋\n\nTe recordamos tu cita para mañana:\n\n📅 *Facial Hidratante*\n🕐 viernes, 15 de marzo de 2024 a las 14:30...",
    "templateName": "appointment_reminder_24h",
    "templateData": { ... }
  }
}
```

### Programación de Plantillas

#### POST /api/v1/twilio/schedule-template
Programar envío de plantilla para fecha específica.

**Request Body:**
```json
{
  "templateName": "appointment_reminder_24h",
  "clientId": "uuid-del-cliente",
  "scheduledFor": "2024-03-14T14:30:00Z",
  "templateData": {
    "clientName": "María",
    "serviceName": "Facial Hidratante",
    "appointmentDate": "viernes, 15 de marzo de 2024",
    "appointmentTime": "14:30"
  },
  "bookingId": "uuid-de-la-cita"
}
```

#### GET /api/v1/twilio/scheduled-templates
Obtener plantillas programadas con filtros.

**Query Parameters:**
- `clientId`: Filtrar por cliente
- `bookingId`: Filtrar por cita
- `templateName`: Filtrar por plantilla
- `status`: Filtrar por estado (pending, sent, failed, cancelled)
- `scheduledFrom`: Fecha desde
- `scheduledTo`: Fecha hasta
- `page`: Página (default: 1)
- `limit`: Límite por página (default: 10, max: 100)

#### DELETE /api/v1/twilio/scheduled-templates/:scheduledId
Cancelar plantilla programada.

### Envío Directo de Plantillas

#### POST /api/v1/twilio/send-appointment-reminder
Enviar recordatorio de cita inmediatamente.

**Request Body:**
```json
{
  "clientId": "uuid-del-cliente",
  "bookingId": "uuid-de-la-cita"
}
```

#### POST /api/v1/twilio/send-booking-confirmation
Enviar confirmación de reserva inmediatamente.

#### POST /api/v1/twilio/send-follow-up
Enviar seguimiento post-tratamiento.

**Request Body:**
```json
{
  "clientId": "uuid-del-cliente",
  "serviceId": "uuid-del-servicio",
  "customMessage": "Mensaje personalizado opcional"
}
```

### Procesamiento Manual

#### POST /api/v1/twilio/process-scheduled-templates
Procesar manualmente todas las plantillas programadas pendientes.

**Response:**
```json
{
  "success": true,
  "message": "Plantillas programadas procesadas exitosamente",
  "data": {
    "processed": 15,
    "successful": 12,
    "failed": 3
  }
}
```

## Integración con el Sistema de Citas

### Flujo Automático de Notificaciones

1. **Al crear una cita**:
   - Se envía confirmación inmediata (`booking_confirmation`)
   - Se programa recordatorio 24h antes (`appointment_reminder_24h`)

2. **Al completar una cita**:
   - Se programa seguimiento 24h después (`follow_up_24h`)
   - Se programa seguimiento semanal (`follow_up_weekly`)

3. **Al modificar una cita**:
   - Se envía confirmación de modificación (`booking_modification_confirmation`)
   - Se cancelan recordatorios antiguos
   - Se programan nuevos recordatorios

4. **Al cancelar una cita**:
   - Se envía confirmación de cancelación (`booking_cancellation_confirmation`)
   - Se cancelan todos los recordatorios programados

### Integración con SchedulerService

El `SchedulerService` procesa automáticamente las plantillas programadas cada minuto:

```typescript
// El servicio se ejecuta automáticamente
SchedulerService.start();

// También se puede ejecutar manualmente
const result = await SchedulerService.runManually();
```

## Variables de Plantilla Disponibles

### Variables Comunes
- `clientName`: Nombre del cliente
- `clinicName`: Nombre de la clínica
- `clinicPhone`: Teléfono de la clínica
- `clinicAddress`: Dirección de la clínica

### Variables de Cita
- `serviceName`: Nombre del servicio
- `appointmentDate`: Fecha de la cita (formato largo)
- `appointmentTime`: Hora de la cita
- `duration`: Duración en minutos
- `price`: Precio del servicio
- `professionalName`: Nombre del profesional
- `confirmationCode`: Código de confirmación

### Variables de Seguimiento
- `careInstructions`: Instrucciones de cuidado post-tratamiento
- `nextRecommendedDate`: Próxima fecha recomendada
- `specialOffer`: Oferta especial
- `reviewLink`: Enlace para dejar reseña

### Variables de Promoción
- `discountPercentage`: Porcentaje de descuento
- `validUntil`: Fecha de vencimiento
- `welcomeOffer`: Oferta de bienvenida
- `birthdayOffer`: Oferta de cumpleaños
- `loyaltyReward`: Recompensa por fidelidad
- `rewardCode`: Código de recompensa

## Configuración y Personalización

### Agregar Nueva Plantilla

```typescript
import { WhatsAppTemplateService } from '../services/WhatsAppTemplateService';

// Agregar plantilla
WhatsAppTemplateService.addTemplate({
  name: 'nueva_plantilla',
  language: 'es',
  category: 'promotion',
  parameters: ['clientName', 'customMessage'],
  description: 'Nueva plantilla personalizada'
});

// Actualizar contenido
WhatsAppTemplateService.updateTemplateContent(
  'nueva_plantilla',
  '¡Hola {{clientName}}! {{customMessage}}'
);
```

### Configurar Recordatorios Automáticos

```typescript
// Configurar recordatorios para una cita específica
await NotificationService.scheduleAppointmentReminder(bookingId, {
  enabled: true,
  hoursBeforeAppointment: 24,
  channels: ['whatsapp'],
  templateName: 'appointment_reminder_24h',
  retryAttempts: 3,
  retryIntervalMinutes: 30
});
```

## Monitoreo y Estadísticas

### Obtener Estadísticas de Plantillas

```typescript
const stats = WhatsAppTemplateService.getTemplateStats();
// Retorna: totalTemplates, templatesByCategory, templatesWithMostParameters
```

### Obtener Estadísticas del Scheduler

```typescript
const schedulerStats = await SchedulerService.getStats();
// Retorna: isRunning, upcomingReminders, pendingNotifications, scheduledTemplates
```

### Obtener Estadísticas de Notificaciones

```typescript
const notificationStats = await NotificationService.getNotificationStats();
// Retorna: totalNotifications, successRate, channelStats, typeStats
```

## Mejores Prácticas

### 1. Personalización de Mensajes
- Usar siempre el primer nombre del cliente para mayor cercanía
- Incluir emojis relevantes para hacer los mensajes más atractivos
- Mantener un tono profesional pero amigable

### 2. Timing de Envíos
- Recordatorios: 24h antes (horario laboral)
- Confirmaciones: Inmediatamente después de la acción
- Seguimientos: 24h después del tratamiento
- Promociones: Horarios de mayor actividad (10-12h, 16-18h)

### 3. Gestión de Errores
- Implementar retry automático para envíos fallidos
- Monitorear tasas de entrega y éxito
- Tener fallbacks para cuando las plantillas de WhatsApp Business no estén disponibles

### 4. Cumplimiento Normativo
- Solicitar consentimiento explícito antes del primer envío
- Proporcionar opción de opt-out en cada mensaje
- Mantener registros de consentimientos y opt-outs
- Cumplir con GDPR/LOPD para retención de datos

## Troubleshooting

### Problemas Comunes

1. **Plantilla no se envía**:
   - Verificar que la plantilla existe
   - Validar que todos los parámetros requeridos están presentes
   - Comprobar configuración de Twilio

2. **Rate limiting**:
   - Verificar límites de Twilio
   - Implementar delays entre envíos masivos
   - Usar el sistema de cola integrado

3. **Plantillas de WhatsApp Business rechazadas**:
   - El sistema automáticamente hace fallback a mensajes regulares
   - Verificar que las plantillas estén aprobadas en Twilio
   - Revisar logs para errores específicos

### Logs y Debugging

```typescript
// Habilitar logs detallados
logger.level = 'debug';

// Verificar estado de plantillas programadas
const pending = await WhatsAppTemplateService.getScheduledTemplates({
  status: 'pending'
});

// Procesar manualmente para debugging
await WhatsAppTemplateService.processScheduledTemplates();
```