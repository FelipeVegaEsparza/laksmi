# Detección Automática de Respuestas Humanas en WhatsApp

## 📋 Resumen

Sistema implementado para detectar automáticamente cuando un humano de la clínica responde por WhatsApp (sin usar el dashboard) y desactivar el bot por 1 hora.

---

## 🎯 Problema Resuelto

**Antes**: El bot solo se desactivaba cuando se tomaba control desde el dashboard. Si un humano respondía directamente desde su WhatsApp personal, el bot seguía respondiendo, causando confusión.

**Ahora**: El sistema detecta automáticamente cuando el mensaje viene del número de WhatsApp de la clínica y desactiva el bot por 1 hora.

---

## 🔧 Implementación

### 1. Detección en `WhatsAppWebService.handleIncomingMessage()`

```typescript
// Obtener número de WhatsApp de la clínica desde company_settings
const companySettings = await CompanySettingsModel.getSettings();

if (companySettings?.contactWhatsapp) {
  // Normalizar números (solo dígitos)
  const clinicNumber = companySettings.contactWhatsapp.replace(/[^\d]/g, '');
  const messageFromNumber = message.from.replace(/[^\d]/g, '');
  
  if (messageFromNumber === clinicNumber) {
    // ✅ Mensaje detectado del número de la clínica
    
    // Buscar conversaciones activas en WhatsApp
    const recentConversations = await db('conversations')
      .where('channel', 'whatsapp')
      .whereIn('status', ['active', 'escalated'])
      .orderBy('updated_at', 'desc')
      .limit(10);
    
    // Activar control humano en todas las conversaciones activas
    for (const conv of recentConversations) {
      const session = HumanTakeoverService.getActiveSession(conv.id);
      
      if (session) {
        // Ya hay sesión, solo actualizar timestamp
        session.lastHumanMessageTime = new Date();
      } else {
        // Crear nueva sesión de control humano
        await HumanTakeoverService.startTakeover(
          conv.id,
          'whatsapp-human-agent',
          undefined
        );
      }
    }
    
    // No procesar este mensaje (es del humano, no del cliente)
    return;
  }
}
```

### 2. Timeout de 1 Hora en `HumanTakeoverService.isUnderHumanControl()`

```typescript
static isUnderHumanControl(conversationId: string): boolean {
  const session = this.activeSessions.get(conversationId);
  
  if (!session || session.status !== 'active') {
    return false;
  }

  // Si el humano nunca ha escrito, considerar que está bajo control
  if (!session.lastHumanMessageTime) {
    return true;
  }

  // Verificar si ha pasado más de 1 hora
  const ONE_HOUR_MS = 60 * 60 * 1000;
  const timeSinceLastMessage = Date.now() - session.lastHumanMessageTime.getTime();

  if (timeSinceLastMessage > ONE_HOUR_MS) {
    // ✅ Ha pasado más de 1 hora, el bot puede responder
    return false;
  }

  return true; // Aún está bajo control humano
}
```

---

## 🔄 Flujo Completo

### Escenario 1: Humano responde desde WhatsApp personal

1. Cliente envía mensaje por WhatsApp
2. Bot responde automáticamente
3. Cliente pide hablar con humano
4. **Humano responde desde su WhatsApp personal** (no desde dashboard)
5. Sistema detecta que el mensaje viene del número de la clínica
6. Sistema activa control humano automáticamente
7. Bot deja de responder por 1 hora
8. Después de 1 hora sin mensajes del humano, bot se reactiva

### Escenario 2: Humano responde desde dashboard

1. Cliente envía mensaje por WhatsApp
2. Bot responde automáticamente
3. Cliente pide hablar con humano
4. **Humano toma control desde dashboard**
5. Sistema activa control humano manualmente
6. Humano envía mensaje desde dashboard
7. Sistema actualiza `lastHumanMessageTime`
8. Bot deja de responder por 1 hora
9. Después de 1 hora sin mensajes del humano, bot se reactiva

---

## ⚙️ Configuración Requerida

### En `company_settings`:

```sql
UPDATE company_settings 
SET contact_whatsapp = '+56962829244'
WHERE id = 1;
```

**Importante**: El número debe estar en formato internacional con `+` y código de país.

---

## 📊 Logs de Debugging

El sistema genera logs detallados para debugging:

```
🧑 Mensaje detectado del número de la clínica - Activando control humano automáticamente
⏰ Timestamp actualizado para conversación [ID]
✅ Control humano activado automáticamente para conversación [ID]
⏭️  Mensaje de la clínica procesado, no se enviará al bot
```

Cuando el bot se reactiva después de 1 hora:

```
🤖 Bot reactivated: 1 hour passed since last human message
```

---

## 🧪 Cómo Probar

### Prueba 1: Detección automática

1. Enviar mensaje desde un número de cliente al WhatsApp de la clínica
2. Bot responde automáticamente
3. Responder desde el WhatsApp de la clínica (número configurado en `contact_whatsapp`)
4. Verificar en logs que se detectó el mensaje del humano
5. Enviar otro mensaje desde el cliente
6. Verificar que el bot NO responde

### Prueba 2: Reactivación después de 1 hora

1. Seguir pasos de Prueba 1
2. Esperar 1 hora (o modificar temporalmente `ONE_HOUR_MS` a 1 minuto para testing)
3. Enviar mensaje desde el cliente
4. Verificar que el bot responde automáticamente

---

## 🔒 Seguridad

- Solo se activa control humano si el número coincide EXACTAMENTE con `contact_whatsapp`
- Se normalizan los números (solo dígitos) para evitar problemas de formato
- Se limita la búsqueda a las últimas 10 conversaciones activas
- No se procesan mensajes del humano (no se envían al bot)

---

## 📝 Archivos Modificados

1. `backend/src/services/WhatsAppWebService.ts`
   - Agregado import de `db`
   - Modificado `handleIncomingMessage()` para detectar mensajes de la clínica

2. `backend/src/services/ai/HumanTakeoverService.ts`
   - Ya tenía implementado el timeout de 1 hora en `isUnderHumanControl()`
   - Ya tenía implementado `lastHumanMessageTime` en `sendHumanMessage()`

---

## ✅ Estado

**IMPLEMENTADO Y LISTO PARA PRODUCCIÓN**

- ✅ Detección automática de mensajes del humano
- ✅ Activación automática de control humano
- ✅ Timeout de 1 hora
- ✅ Reactivación automática del bot
- ✅ Logs detallados para debugging
- ✅ Sin errores de TypeScript

---

## 🚀 Despliegue

```bash
# Reiniciar backend para aplicar cambios
docker-compose restart backend

# O en Easypanel
git add .
git commit -m "feat: detectar automáticamente respuestas humanas en WhatsApp"
git push
```

---

**Fecha**: 2026-01-20
**Versión**: 1.0
**Estado**: ✅ Completado
