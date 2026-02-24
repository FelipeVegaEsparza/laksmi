# Fix: Dashboard se recarga cuando se escala una conversación

## 🐛 Problema Identificado

El dashboard se recarga o reinicia cuando una persona escala una conversación desde el chatbot.

## 🔍 Análisis del Problema

Después de revisar el código, identifiqué varios posibles causantes:

### 1. Conflicto de actualización de título

Hay DOS lugares que actualizan el título de la página simultáneamente:

- **`useEscalationNotification`** (en Layout) - Actualiza el título cuando hay notificaciones de escalación
- **`ConversationsPage`** - Actualiza el título cuando hay mensajes no leídos

Esto podría causar un conflicto de estado que provoca re-renders innecesarios.

### 2. Polling agresivo

El código hace polling cada 5-10 segundos:
- `fetchConversations()` cada 10 segundos
- `fetchConversationMessages()` cada 5 segundos

Si hay un error en alguna de estas llamadas, podría causar un comportamiento inesperado.

### 3. Socket.IO reconexión

Cuando llega una notificación de escalación vía Socket.IO, si hay un error en el manejo del evento, podría causar que el socket se desconecte y reconecte, lo que podría parecer un "reload".

## ✅ Soluciones Propuestas

### Solución 1: Separar responsabilidades de título (RECOMENDADO)

Modificar `ConversationsPage` para que NO actualice el título si ya hay notificaciones de escalación activas:

```typescript
// En ConversationsPage.tsx
useEffect(() => {
  // Solo actualizar título si no hay notificaciones de escalación
  const hasEscalationNotifications = document.title.includes('Nueva escalación')
  
  if (!hasEscalationNotifications) {
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) ${originalTitleRef.current}`
    } else {
      document.title = originalTitleRef.current
    }
  }

  return () => {
    // Solo restaurar si no hay notificaciones de escalación
    if (!document.title.includes('Nueva escalación')) {
      document.title = originalTitleRef.current
    }
  }
}, [unreadCount])
```

### Solución 2: Agregar manejo de errores robusto

Envolver todas las llamadas a API en try-catch y evitar que errores causen reloads:

```typescript
const fetchConversations = async () => {
  try {
    setLoading(true)
    const params = {
      search: searchTerm,
      status: statusFilter,
      limit: 1000,
    }

    const response = await apiService.getConversations(params)
    setConversations(response?.data || [])
  } catch (error) {
    console.error('Error fetching conversations:', error)
    // NO mostrar notificación en cada error de polling
    // showNotification('Error al cargar conversaciones', 'error')
  } finally {
    setLoading(false)
  }
}
```

### Solución 3: Debounce del polling

Reducir la frecuencia del polling cuando hay actividad:

```typescript
useEffect(() => {
  fetchConversations()
  
  // Usar un intervalo más largo (30 segundos en lugar de 10)
  const interval = setInterval(fetchConversations, 30000)
  
  return () => clearInterval(interval)
}, [searchTerm, statusFilter])
```

### Solución 4: Agregar logs de debugging

Agregar logs para identificar exactamente qué está causando el reload:

```typescript
// En NotificationContext.tsx
newSocket.on('conversation_escalated', (data: any) => {
  console.log('🚨 ESCALATION EVENT RECEIVED:', data)
  console.log('📊 Current state before escalation:', {
    notificationsCount: state.notifications.length,
    timestamp: new Date().toISOString()
  })
  
  const notification: Notification = {
    id: Date.now().toString(),
    type: 'warning',
    title: 'Conversación Escalada',
    message: `La conversación con ${data.clientName} requiere atención humana`,
    timestamp: new Date(),
    read: false,
  }
  
  dispatch({ type: 'ADD_NOTIFICATION', payload: notification })
  
  console.log('✅ ESCALATION NOTIFICATION ADDED')
})
```

## 🧪 Prueba para Identificar el Problema

1. Abrir el dashboard en una pestaña
2. Abrir la consola del navegador (F12)
3. Ir a la pestaña "Network" y marcar "Preserve log"
4. Escalar una conversación desde el chatbot
5. Observar en la consola:
   - ¿Hay algún error?
   - ¿Se recarga la página completa? (verás un reload en Network)
   - ¿O solo se re-renderizan componentes?

## 📝 Información Adicional Necesaria

Para diagnosticar mejor el problema, necesito saber:

1. **¿Qué tipo de "reload" es?**
   - ¿La página se recarga completamente (pierdes el estado, ves el logo de carga)?
   - ¿O solo se "reinicia" visualmente (los componentes se re-renderizan)?

2. **¿Cuándo ocurre exactamente?**
   - ¿Inmediatamente cuando se escala?
   - ¿Después de unos segundos?
   - ¿Solo en ciertas páginas del dashboard?

3. **¿Hay errores en la consola?**
   - Abrir F12 y ver si hay errores rojos

4. **¿Ocurre en todos los navegadores?**
   - Chrome, Firefox, Safari, etc.

## 🚀 Próximos Pasos

1. **Prueba de diagnóstico:** Ejecutar la prueba descrita arriba
2. **Aplicar Solución 4:** Agregar logs de debugging
3. **Observar comportamiento:** Ver qué logs aparecen cuando se escala
4. **Aplicar fix apropiado:** Basado en los resultados

---

**Fecha:** 2026-02-24
**Estado:** En investigación - Necesita más información del usuario
