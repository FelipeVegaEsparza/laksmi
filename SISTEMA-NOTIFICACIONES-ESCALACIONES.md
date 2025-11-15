# Sistema de Notificaciones de Escalaciones - Documentación Completa

## 📋 Resumen

Se ha implementado un sistema completo de notificaciones automáticas que alerta al administrador cuando:
- El chatbot no puede responder una pregunta
- Un cliente necesita atención humana
- Hay una queja o problema
- Se detecta una solicitud compleja

## 🎯 ¿Cómo Funciona?

### Flujo Automático

```
1. Cliente envía mensaje por WhatsApp
   ↓
2. Bot intenta responder usando IA + Base de Conocimientos
   ↓
3. Bot detecta que NO puede ayudar (baja confianza, queja, etc.)
   ↓
4. Bot crea ESCALACIÓN automáticamente en la base de datos
   ↓
5. Sistema envía NOTIFICACIÓN EN TIEMPO REAL al dashboard
   ↓
6. Administrador ve alerta en el dashboard
   ↓
7. Administrador toma control de la conversación
   ↓
8. Administrador responde al cliente directamente
```

## 🔧 Componentes Implementados

### Backend

#### 1. **Migración de Base de Datos** ✅
- **Archivo**: `backend/migrations/017_create_escalations_table.sql`
- **Tablas creadas**:
  - `escalations`: Registro de todas las escalaciones
  - `escalation_notifications`: Tracking de notificaciones enviadas
  - `escalation_history`: Historial de cambios
  - `escalations_dashboard`: Vista optimizada para el dashboard

#### 2. **Modelo de Escalaciones** ✅
- **Archivo**: `backend/src/models/Escalation.ts`
- **Funciones**:
  - `create()`: Crear nueva escalación
  - `findAll()`: Buscar con filtros
  - `assign()`: Asignar agente
  - `resolve()`: Resolver escalación
  - `getStats()`: Estadísticas
  - `getPending()`: Escalaciones pendientes
  - `getUrgentUnassigned()`: Urgentes sin asignar

#### 3. **AIService Actualizado** ✅
- **Archivo**: `backend/src/services/AIService.ts`
- **Nueva función**: `createAutomaticEscalation()`
- **Detecta automáticamente**:
  - Quejas (prioridad ALTA)
  - Solicitud de humano (prioridad MEDIA)
  - Solicitudes complejas (prioridad MEDIA)
  - Baja confianza (prioridad según score)

#### 4. **EscalationService Actualizado** ✅
- **Archivo**: `backend/src/services/ai/EscalationService.ts`
- **Ahora persiste en base de datos**
- **Envía notificaciones automáticas**

#### 5. **Servicios de Notificación** ✅ (Ya existían)
- **RealTimeNotificationService**: WebSocket para notificaciones en tiempo real
- **AlertService**: Envío de alertas por email/SMS

#### 6. **Controlador Actualizado** ✅
- **Archivo**: `backend/src/controllers/EscalationController.ts`
- **Endpoints disponibles**:
  - `GET /api/v1/escalations` - Ver todas las escalaciones
  - `GET /api/v1/escalations/my` - Mis escalaciones asignadas
  - `GET /api/v1/escalations/stats` - Estadísticas
  - `POST /api/v1/escalations/:id/assign` - Asignar agente
  - `POST /api/v1/escalations/:id/take-control` - Tomar control
  - `POST /api/v1/escalations/:id/resolve` - Resolver

## 📊 Tipos de Escalación

### Por Razón (reason)
- `low_confidence`: Bot no está seguro de la respuesta
- `failed_attempts`: Múltiples intentos fallidos
- `complaint`: Queja del cliente
- `complex_request`: Solicitud compleja
- `technical_issue`: Problema técnico
- `payment_issue`: Problema de pago
- `client_request`: Cliente pide hablar con humano

### Por Prioridad (priority)
- `urgent`: Requiere atención inmediata (< 15 min)
- `high`: Alta prioridad (< 30 min)
- `medium`: Prioridad media (< 60 min)
- `low`: Baja prioridad

### Por Estado (status)
- `pending`: Esperando asignación
- `assigned`: Asignada a un agente
- `in_progress`: En proceso
- `resolved`: Resuelta
- `cancelled`: Cancelada

## 🚀 Cómo Usar el Sistema

### Para el Administrador

#### 1. Ver Escalaciones Pendientes

**Endpoint**: `GET /api/v1/escalations?status=pending`

**Respuesta**:
```json
{
  "success": true,
  "data": {
    "escalations": [
      {
        "id": "uuid",
        "escalationCode": "ESC_ABC123_XYZ",
        "conversationId": "uuid",
        "clientName": "Juan Pérez",
        "clientPhone": "+1234567890",
        "reason": "complaint",
        "priority": "high",
        "status": "pending",
        "summary": "Cliente insatisfecho con el servicio...",
        "clientMessage": "Estoy muy molesto...",
        "confidenceScore": 0.25,
        "ageMinutes": 5,
        "slaStatus": "on_time",
        "createdAt": "2025-11-15T10:30:00Z"
      }
    ],
    "counts": {
      "urgent": 2,
      "high": 5,
      "medium": 10,
      "low": 3
    }
  }
}
```

#### 2. Tomar Control de una Conversación

**Endpoint**: `POST /api/v1/escalations/:escalationId/take-control`

**Body**:
```json
{
  "userId": "admin-user-id"
}
```

#### 3. Resolver Escalación

**Endpoint**: `POST /api/v1/escalations/:escalationId/resolve`

**Body**:
```json
{
  "resolutionNotes": "Cliente satisfecho, problema resuelto"
}
```

### Para el Dashboard (Frontend)

#### Conectar a WebSocket para Notificaciones en Tiempo Real

```typescript
import { io } from 'socket.io-client';

// Conectar al servidor
const socket = io('http://localhost:3000', {
  auth: {
    token: 'JWT_TOKEN_AQUI'
  }
});

// Escuchar notificaciones de escalación
socket.on('notification', (notification) => {
  if (notification.type === 'escalation') {
    // Mostrar alerta en el dashboard
    showAlert({
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      escalationId: notification.data.escalationId,
      conversationId: notification.data.conversationId
    });
    
    // Reproducir sonido si es urgente
    if (notification.priority === 'urgent') {
      playUrgentSound();
    }
    
    // Actualizar contador de escalaciones pendientes
    updateEscalationBadge();
  }
});

// Escuchar actualizaciones de estado
socket.on('escalation_status_update', (update) => {
  console.log('Escalation updated:', update);
  // Actualizar UI
});
```

#### Componente React de Ejemplo

```tsx
import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

interface Escalation {
  id: string;
  escalationCode: string;
  clientName: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  summary: string;
  ageMinutes: number;
}

export const EscalationMonitor: React.FC = () => {
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [socket, setSocket] = useState<any>(null);

  useEffect(() => {
    // Conectar WebSocket
    const newSocket = io('http://localhost:3000', {
      auth: { token: localStorage.getItem('token') }
    });

    newSocket.on('notification', (notification) => {
      if (notification.type === 'escalation') {
        // Agregar nueva escalación
        fetchEscalations();
        
        // Mostrar notificación del navegador
        if (Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/logo.png',
            tag: notification.data.escalationId
          });
        }
      }
    });

    setSocket(newSocket);

    // Cargar escalaciones iniciales
    fetchEscalations();

    return () => {
      newSocket.close();
    };
  }, []);

  const fetchEscalations = async () => {
    const response = await fetch('/api/v1/escalations?status=pending', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    const data = await response.json();
    setEscalations(data.data.escalations);
  };

  const handleTakeControl = async (escalationId: string) => {
    await fetch(`/api/v1/escalations/${escalationId}/take-control`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    fetchEscalations();
  };

  return (
    <div className="escalation-monitor">
      <h2>Escalaciones Pendientes ({escalations.length})</h2>
      
      {escalations.map(escalation => (
        <div 
          key={escalation.id}
          className={`escalation-card priority-${escalation.priority}`}
        >
          <div className="escalation-header">
            <span className="code">{escalation.escalationCode}</span>
            <span className={`priority ${escalation.priority}`}>
              {escalation.priority.toUpperCase()}
            </span>
          </div>
          
          <div className="escalation-body">
            <p><strong>{escalation.clientName}</strong></p>
            <p>{escalation.summary}</p>
            <p className="age">Hace {escalation.ageMinutes} minutos</p>
          </div>
          
          <button onClick={() => handleTakeControl(escalation.id)}>
            Tomar Control
          </button>
        </div>
      ))}
    </div>
  );
};
```

## 🎨 Estilos CSS de Ejemplo

```css
.escalation-monitor {
  padding: 20px;
}

.escalation-card {
  border: 2px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  transition: all 0.3s;
}

.escalation-card.priority-urgent {
  border-color: #dc3545;
  background-color: #fff5f5;
  animation: pulse 2s infinite;
}

.escalation-card.priority-high {
  border-color: #fd7e14;
  background-color: #fff8f0;
}

.escalation-card.priority-medium {
  border-color: #ffc107;
  background-color: #fffbf0;
}

.escalation-card.priority-low {
  border-color: #28a745;
  background-color: #f0fff4;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.7);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(220, 53, 69, 0);
  }
}

.priority {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.priority.urgent {
  background-color: #dc3545;
  color: white;
}

.priority.high {
  background-color: #fd7e14;
  color: white;
}

.priority.medium {
  background-color: #ffc107;
  color: black;
}

.priority.low {
  background-color: #28a745;
  color: white;
}
```

## 📱 Notificaciones del Navegador

```typescript
// Solicitar permiso para notificaciones
const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
};

// Mostrar notificación
const showBrowserNotification = (escalation: any) => {
  if (Notification.permission === 'granted') {
    const notification = new Notification('Nueva Escalación', {
      body: `${escalation.clientName}: ${escalation.summary}`,
      icon: '/logo.png',
      badge: '/badge.png',
      tag: escalation.id,
      requireInteraction: escalation.priority === 'urgent',
      vibrate: [200, 100, 200]
    });

    notification.onclick = () => {
      window.focus();
      // Navegar a la escalación
      window.location.href = `/escalations/${escalation.id}`;
    };
  }
};
```

## 🔔 Sonidos de Alerta

```typescript
// Reproducir sonido según prioridad
const playAlertSound = (priority: string) => {
  const sounds = {
    urgent: '/sounds/urgent-alert.mp3',
    high: '/sounds/high-alert.mp3',
    medium: '/sounds/medium-alert.mp3',
    low: '/sounds/low-alert.mp3'
  };

  const audio = new Audio(sounds[priority] || sounds.medium);
  audio.play().catch(err => console.error('Error playing sound:', err));
};
```

## 📊 Dashboard de Métricas

```typescript
// Obtener estadísticas
const fetchStats = async () => {
  const response = await fetch('/api/v1/escalations/stats', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  
  return {
    total: data.data.total,
    pending: data.data.byStatus.pending || 0,
    resolved: data.data.byStatus.resolved || 0,
    averageResolutionTime: data.data.averageResolutionTime,
    slaCompliance: data.data.slaCompliance
  };
};
```

## 🚀 Pasos para Activar el Sistema

### 1. Ejecutar la Migración

```bash
docker-compose restart backend
```

La migración se ejecutará automáticamente.

### 2. Verificar que las Tablas se Crearon

```sql
SHOW TABLES LIKE 'escalations%';
```

Deberías ver:
- `escalations`
- `escalation_notifications`
- `escalation_history`

### 3. Probar el Sistema

Envía un mensaje por WhatsApp que el bot no pueda responder:

```
"Tengo una queja sobre el servicio"
```

o

```
"Quiero hablar con un gerente"
```

### 4. Ver la Escalación Creada

```bash
curl -X GET "http://localhost:3000/api/v1/escalations?status=pending" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. Conectar el Dashboard

Implementa el componente React de ejemplo en tu dashboard.

## 📈 Métricas y Analytics

### SLA (Service Level Agreement)

El sistema calcula automáticamente si las escalaciones se resuelven a tiempo:

- **Urgente**: < 15 minutos
- **Alta**: < 30 minutos
- **Media**: < 60 minutos
- **Baja**: Sin límite estricto

### Reportes Disponibles

1. **Escalaciones por Razón**
2. **Escalaciones por Prioridad**
3. **Tiempo Promedio de Resolución**
4. **Cumplimiento de SLA**
5. **Escalaciones por Agente**

## 🔍 Troubleshooting

### No se crean escalaciones automáticas

1. Verificar que la migración se ejecutó:
```sql
SELECT * FROM escalations LIMIT 1;
```

2. Verificar logs del backend:
```bash
docker-compose logs backend | grep -i escalation
```

### No llegan notificaciones en tiempo real

1. Verificar que el WebSocket está conectado:
```javascript
console.log(socket.connected); // debe ser true
```

2. Verificar que el token es válido
3. Verificar que el puerto 3000 está abierto

### Las escalaciones no se muestran en el dashboard

1. Verificar permisos del usuario
2. Verificar que el endpoint responde:
```bash
curl -X GET "http://localhost:3000/api/v1/escalations" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🎯 Próximos Pasos (Opcional)

1. **Email/SMS**: Configurar envío de emails cuando hay escalaciones urgentes
2. **Slack Integration**: Enviar notificaciones a Slack
3. **Dashboard Analytics**: Gráficos de tendencias
4. **Auto-asignación**: Asignar automáticamente según disponibilidad
5. **Chatbot Mejorado**: Agregar más contenido a la base de conocimientos

## 📝 Resumen

✅ **Sistema completamente funcional**
✅ **Escalaciones automáticas**
✅ **Notificaciones en tiempo real**
✅ **Persistencia en base de datos**
✅ **API completa para el dashboard**
✅ **Tracking de SLA**
✅ **Historial de cambios**

El administrador ahora **SÍ se enterará** cuando un cliente necesite atención humana, con notificaciones en tiempo real y un dashboard completo para gestionar las escalaciones.

