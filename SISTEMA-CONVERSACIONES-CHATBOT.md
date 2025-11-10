# Sistema de Conversaciones y Chatbot - Documentación Completa

## 📋 Índice
1. [Visión General](#visión-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Funcionalidades Implementadas](#funcionalidades-implementadas)
4. [Cómo Funciona](#cómo-funciona)
5. [Componentes del Dashboard](#componentes-del-dashboard)
6. [API Endpoints](#api-endpoints)
7. [Flujo de Trabajo](#flujo-de-trabajo)
8. [Configuración y Uso](#configuración-y-uso)

---

## 🎯 Visión General

El sistema de conversaciones y chatbot es una solución completa de atención al cliente que combina:
- **IA Conversacional**: Chatbot inteligente que atiende automáticamente
- **Canales Múltiples**: WhatsApp y Web Chat
- **Monitoreo en Tiempo Real**: Dashboard con métricas y alertas
- **Intervención Humana**: Sistema de "takeover" para casos complejos
- **Escalación Automática**: Detección de situaciones que requieren atención humana

---

## 🏗️ Arquitectura del Sistema

### Backend (Node.js + TypeScript)

```
backend/src/
├── controllers/
│   ├── ConversationController.ts    # Gestión de conversaciones
│   └── TakeoverController.ts        # Control humano de conversaciones
├── services/
│   ├── ConversationService.ts       # Lógica de negocio
│   ├── AIService.ts                 # Integración con IA (OpenAI)
│   ├── NotificationService.ts       # Notificaciones
│   └── SchedulerService.ts          # Tareas programadas
├── models/
│   ├── Conversation.ts              # Modelo de conversación
│   └── Message.ts                   # Modelo de mensaje
└── routes/
    ├── conversations.ts             # Rutas de conversaciones
    └── takeover.ts                  # Rutas de takeover
```

### Frontend (React + TypeScript)

```
dashboard/src/
├── pages/
│   └── ConversationsPage.tsx       # Página principal
├── components/
│   ├── ConversationMetrics.tsx     # Métricas en tiempo real
│   ├── ConversationAlerts.tsx      # Sistema de alertas
│   └── DataTable.tsx               # Tabla de conversaciones
├── hooks/
│   └── useConversationMonitor.ts   # Hook para monitoreo
└── services/
    └── conversationMonitorService.ts # Servicio de monitoreo
```

---

## ✅ Funcionalidades Implementadas

### 1. **Gestión de Conversaciones**

#### ✅ Lista de Conversaciones
- Tabla con todas las conversaciones
- Filtros por estado (activa, cerrada, escalada)
- Filtros por canal (WhatsApp, Web)
- Búsqueda por cliente
- Paginación

#### ✅ Detalles de Conversación
- Historial completo de mensajes
- Identificación de remitente (Cliente, IA, Humano)
- Timestamps de cada mensaje
- Estado actual de la conversación

### 2. **Métricas en Tiempo Real**

#### ✅ Métricas Principales
- **Conversaciones Activas**: Número de sesiones en curso
- **Tiempo de Respuesta**: Promedio de respuesta del sistema
- **Tasa de Escalación**: Porcentaje de conversaciones escaladas
- **Tasa de Resolución**: Porcentaje de conversaciones resueltas exitosamente

#### ✅ Analytics por Canal
- Estadísticas de WhatsApp vs Web Chat
- Número de conversaciones por canal
- Mensajes totales por canal
- Duración promedio de conversaciones

#### ✅ Análisis de Actividad
- Horas pico de conversaciones
- Distribución por estado
- Tendencias de uso

### 3. **Sistema de Alertas**

#### ✅ Tipos de Alertas
- **Nueva Conversación**: Notifica cuando inicia una conversación
- **Escalación**: Alerta cuando una conversación requiere atención humana
- **Tiempo de Espera**: Avisa si un cliente espera demasiado
- **Error del Sistema**: Notifica problemas técnicos

#### ✅ Prioridades
- **Urgente** (rojo): Requiere atención inmediata
- **Alta** (naranja): Importante pero no crítico
- **Media** (azul): Información relevante
- **Baja** (gris): Notificaciones generales

### 4. **Sistema de Takeover (Control Humano)**

#### ✅ Tomar Control
- Desactiva temporalmente el chatbot IA
- Permite a un agente humano responder directamente
- Mantiene el historial de la conversación
- Notifica al cliente del cambio

#### ✅ Enviar Mensajes
- Interfaz de chat en tiempo real
- Envío de mensajes como agente humano
- Actualización automática del historial

#### ✅ Finalizar Control
- Devuelve el control al chatbot IA
- Registra la resolución
- Cierra la conversación si es necesario

### 5. **Sistema de Escalación**

#### ✅ Escalación Manual
- Botón para escalar conversaciones activas
- Selección de razón de escalación
- Asignación de prioridad
- Generación de resumen automático

#### ✅ Escalación Automática
El sistema detecta automáticamente:
- Solicitudes complejas que la IA no puede manejar
- Clientes frustrados o insatisfechos
- Errores repetidos del sistema
- Tiempo de espera excesivo

---

## 🔄 Cómo Funciona

### Flujo de una Conversación Normal

```
1. Cliente inicia conversación (WhatsApp o Web)
   ↓
2. Sistema crea registro en base de datos
   ↓
3. Chatbot IA procesa el mensaje
   ↓
4. IA genera respuesta contextual
   ↓
5. Sistema envía respuesta al cliente
   ↓
6. Se actualiza el historial
   ↓
7. Dashboard muestra métricas en tiempo real
```

### Flujo con Escalación

```
1. Cliente envía mensaje complejo
   ↓
2. IA detecta que no puede resolver
   ↓
3. Sistema marca conversación como "escalada"
   ↓
4. Se genera alerta en dashboard
   ↓
5. Agente humano toma control (takeover)
   ↓
6. Agente responde directamente al cliente
   ↓
7. Agente finaliza control cuando resuelve
   ↓
8. Sistema registra resolución
```

### Monitoreo en Tiempo Real

```
Dashboard actualiza cada 30 segundos:
├── Métricas generales
├── Conversaciones activas
├── Alertas nuevas
└── Analytics por canal
```

---

## 🎨 Componentes del Dashboard

### 1. **ConversationsPage** (Página Principal)

**Ubicación**: `dashboard/src/pages/ConversationsPage.tsx`

**Características**:
- Dos tabs: "Métricas en Tiempo Real" y "Lista de Conversaciones"
- Filtros avanzados (estado, canal, búsqueda)
- Tabla interactiva con acciones
- Modales para detalles y takeover

**Acciones Disponibles**:
- 👁️ **Ver**: Abre modal con historial completo
- ✏️ **Tomar Control**: Inicia takeover de la conversación
- ⚠️ **Escalar**: Marca como escalada manualmente
- 🛑 **Finalizar**: Devuelve control al chatbot

### 2. **ConversationMetrics** (Métricas)

**Ubicación**: `dashboard/src/components/ConversationMetrics.tsx`

**Muestra**:
- 4 tarjetas con métricas principales
- Gráficos de distribución por estado
- Comparativa de canales (WhatsApp vs Web)
- Top 5 horas pico de actividad

**Actualización**: Cada 30 segundos (configurable)

### 3. **ConversationAlerts** (Alertas)

**Ubicación**: `dashboard/src/components/ConversationAlerts.tsx`

**Funciones**:
- Lista de alertas activas con badge de contador
- Código de colores por prioridad
- Botón para limpiar alertas
- Click en alerta para ir a conversación
- Colapsar/expandir lista

### 4. **useConversationMonitor** (Hook de Monitoreo)

**Ubicación**: `dashboard/src/hooks/useConversationMonitor.ts`

**Propósito**:
- Conecta con WebSocket para actualizaciones en tiempo real
- Gestiona alertas localmente
- Refresca datos automáticamente
- Maneja reconexión automática

---

## 🔌 API Endpoints

### Conversaciones

```typescript
// Listar conversaciones
GET /api/v1/conversations
Query params: page, limit, status, channel, search

// Obtener conversación específica
GET /api/v1/conversations/:id

// Obtener mensajes de conversación
GET /api/v1/conversations/:id/messages

// Métricas generales
GET /api/v1/conversations/metrics

// Analytics por canal
GET /api/v1/conversations/analytics/channels

// Crear conversación (usado por chatbot)
POST /api/v1/conversations
Body: { clientId, channel, initialMessage }
```

### Takeover (Control Humano)

```typescript
// Iniciar takeover
POST /api/v1/takeover/:conversationId/start

// Enviar mensaje como humano
POST /api/v1/takeover/:conversationId/message
Body: { content }

// Finalizar takeover
POST /api/v1/takeover/:conversationId/end
Body: { resolution }
```

### Escalaciones

```typescript
// Escalar conversación
POST /api/v1/escalations/conversation/:conversationId
Body: { reason, priority, summary }

// Listar escalaciones
GET /api/v1/escalations
Query params: status, priority
```

---

## 📊 Flujo de Trabajo Completo

### Para Agentes del Dashboard

1. **Monitoreo Pasivo**
   - Observar métricas en tiempo real
   - Revisar alertas del sistema
   - Identificar tendencias

2. **Intervención Activa**
   - Recibir alerta de escalación
   - Revisar historial de conversación
   - Tomar control (takeover)
   - Responder al cliente
   - Resolver el problema
   - Finalizar control

3. **Análisis**
   - Revisar métricas de rendimiento
   - Identificar horas pico
   - Analizar tasa de escalación
   - Optimizar respuestas del chatbot

### Para el Sistema Automático

1. **Recepción de Mensaje**
   - Cliente envía mensaje
   - Sistema identifica canal (WhatsApp/Web)
   - Crea o actualiza conversación

2. **Procesamiento IA**
   - Analiza contexto de la conversación
   - Identifica intención del cliente
   - Genera respuesta apropiada
   - Detecta si necesita escalación

3. **Respuesta**
   - Envía mensaje al cliente
   - Actualiza historial
   - Registra métricas
   - Genera alertas si es necesario

4. **Monitoreo**
   - Actualiza dashboard en tiempo real
   - Calcula métricas
   - Detecta patrones
   - Programa notificaciones

---

## ⚙️ Configuración y Uso

### Requisitos Previos

1. **Base de Datos MySQL**
   - Tablas: `conversations`, `messages`, `escalations`
   - Migraciones ejecutadas

2. **Servicios Externos**
   - OpenAI API (para chatbot IA)
   - Twilio (para WhatsApp)
   - Redis (opcional, para caché)

3. **Variables de Entorno**
```env
# OpenAI
OPENAI_API_KEY=sk-...

# Twilio (WhatsApp)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=whatsapp:+...

# Base de datos
DB_HOST=localhost
DB_PORT=3306
DB_NAME=clinica_belleza
DB_USER=root
DB_PASSWORD=...
```

### Iniciar el Sistema

```bash
# Backend
cd backend
npm install
npm run dev

# Dashboard
cd dashboard
npm install
npm run dev
```

### Acceder al Dashboard

1. Abrir navegador en `http://localhost:5173`
2. Iniciar sesión con credenciales de admin
3. Navegar a "Conversaciones" en el menú lateral
4. Ver métricas en tiempo real o lista de conversaciones

### Probar el Chatbot

**Opción 1: Web Chat**
- Ir al frontend público: `http://localhost:3001`
- Click en el botón de chat
- Enviar mensaje de prueba

**Opción 2: WhatsApp**
- Configurar webhook de Twilio
- Enviar mensaje al número configurado
- El chatbot responderá automáticamente

---

## 🎯 Casos de Uso Comunes

### 1. Cliente Pregunta por Servicios
```
Cliente: "¿Qué servicios de manicure tienen?"
IA: "Tenemos varios servicios de manicure:
     - Manicure básico ($20)
     - Manicure con gel ($35)
     - Manicure spa ($45)
     ¿Te gustaría agendar una cita?"
```

### 2. Cliente Quiere Agendar Cita
```
Cliente: "Quiero agendar una cita para mañana"
IA: "¡Perfecto! ¿Para qué servicio te gustaría agendar?"
Cliente: "Manicure con gel"
IA: "Tengo disponibilidad mañana a las:
     - 10:00 AM
     - 2:00 PM
     - 4:00 PM
     ¿Cuál prefieres?"
```

### 3. Consulta Compleja (Escalación)
```
Cliente: "Tuve una reacción alérgica después del tratamiento"
IA: [Detecta situación delicada]
Sistema: Escala automáticamente
Dashboard: Genera alerta URGENTE
Agente: Toma control
Agente: "Lamento mucho lo sucedido. Voy a ayudarte..."
```

---

## 📈 Métricas Clave a Monitorear

### Rendimiento del Chatbot
- **Tasa de Resolución**: >80% es bueno
- **Tiempo de Respuesta**: <3 segundos es excelente
- **Tasa de Escalación**: <10% es óptimo

### Satisfacción del Cliente
- Conversaciones completadas sin escalación
- Tiempo promedio de resolución
- Número de mensajes por conversación

### Eficiencia Operativa
- Horas pico de actividad
- Distribución por canal
- Tiempo de respuesta de agentes humanos

---

## 🚀 Próximas Mejoras Sugeridas

1. **Análisis de Sentimiento**
   - Detectar clientes frustrados automáticamente
   - Priorizar conversaciones negativas

2. **Respuestas Sugeridas**
   - IA sugiere respuestas a agentes humanos
   - Plantillas de respuestas rápidas

3. **Integración con CRM**
   - Sincronizar con datos de clientes
   - Historial completo de interacciones

4. **Reportes Avanzados**
   - Exportar métricas a Excel/PDF
   - Gráficos de tendencias históricas

5. **Chatbot Multiidioma**
   - Detección automática de idioma
   - Respuestas en español e inglés

---

## 📝 Notas Importantes

- El sistema está **completamente implementado** y funcional
- Requiere configuración de OpenAI y Twilio para funcionar completamente
- El dashboard funciona sin estos servicios pero con funcionalidad limitada
- Las métricas se calculan en tiempo real desde la base de datos
- El sistema de alertas usa WebSocket para actualizaciones instantáneas

---

## 🆘 Solución de Problemas

### El chatbot no responde
- Verificar API key de OpenAI
- Revisar logs del backend
- Confirmar que el servicio AIService está activo

### No se reciben mensajes de WhatsApp
- Verificar configuración de Twilio
- Confirmar webhook configurado correctamente
- Revisar logs de Twilio

### Dashboard no muestra métricas
- Verificar conexión a base de datos
- Confirmar que hay conversaciones en la BD
- Revisar endpoint `/api/v1/conversations/metrics`

### Alertas no aparecen
- Verificar conexión WebSocket
- Revisar hook `useConversationMonitor`
- Confirmar que el servicio de notificaciones está activo

---

**Última actualización**: Noviembre 2025
**Versión del sistema**: 1.0.0
