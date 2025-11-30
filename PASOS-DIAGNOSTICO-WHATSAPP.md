# 🔍 Pasos para Diagnosticar Error de WhatsApp

## ✅ Confirmado

- OpenAI API funciona correctamente ✅
- Variables de entorno configuradas ✅
- WhatsApp Web conectado ✅

## ❌ Problema

Los mensajes llegan pero responden con error genérico. El error está en algún punto del flujo **antes** de llegar a OpenAI.

## 🚀 Pasos para Diagnosticar

### Paso 1: Hacer commit y push de mejoras de logging

```bash
git add backend/src/services/WhatsAppWebService.ts backend/src/services/ai/MessageRouter.ts test-whatsapp-flow.js PASOS-DIAGNOSTICO-WHATSAPP.md
git commit -m "feat: mejorar logging para diagnosticar error de WhatsApp"
git push origin main
```

### Paso 2: Rebuild en Easypanel

1. Ve a Easypanel
2. Selecciona el servicio **backend**
3. Haz clic en **"Rebuild"**
4. Espera a que termine (2-3 minutos)

### Paso 3: Ejecutar script de diagnóstico

En el terminal del backend en Easypanel:

```bash
node test-whatsapp-flow.js
```

Este script probará:
1. Variables de entorno
2. Conexión a base de datos
3. Existencia de clientes y servicios
4. OpenAI API
5. Flujo completo de procesamiento de mensajes

**Comparte el output completo del script.**

### Paso 4: Enviar mensaje de prueba y revisar logs

1. Envía un mensaje simple a WhatsApp: "Hola"
2. Ve a los logs del backend en Easypanel
3. Busca estas líneas (en orden):

```
📨 ========== MENSAJE RECIBIDO ==========
📤 Enviando a WhatsAppMessageProcessor...
🔵 Processing message START
```

4. **Busca la primera línea que diga `❌`** - Esa es donde falla

5. Comparte:
   - Las 10 líneas antes del error
   - La línea del error
   - Las 5 líneas después del error

## 🎯 Posibles Causas (en orden de probabilidad)

### 1. Error en la base de datos
- No puede crear/buscar cliente
- No puede crear/buscar conversación
- No puede guardar mensajes

**Síntoma en logs:**
```
Error creating client
Error creating conversation
Database connection failed
```

**Solución:**
- Verificar que MySQL esté corriendo
- Verificar credenciales de BD
- Ejecutar migraciones manualmente

### 2. Error en el ContextManager
- No puede actualizar el contexto
- Error al guardar variables de contexto

**Síntoma en logs:**
```
Error updating context
ContextManager error
```

**Solución:**
- Verificar tabla `conversation_context` en BD
- Verificar que Redis esté accesible (aunque está deshabilitado)

### 3. Error en el NLUService
- No puede procesar el mensaje
- Error al detectar intención

**Síntoma en logs:**
```
Error processing message with NLU
NLUService error
```

**Solución:**
- Revisar implementación de NLUService
- Verificar que no dependa de servicios externos

### 4. Error en el KnowledgeService
- No puede buscar en la base de conocimientos
- Tabla de conocimientos no existe

**Síntoma en logs:**
```
Error fetching knowledge base
KnowledgeService error
Table 'knowledge_base' doesn't exist
```

**Solución:**
- Verificar que exista la tabla `knowledge_base`
- Ejecutar migración correspondiente

### 5. Error en el formato del número de teléfono
- No puede normalizar el número
- Formato inválido

**Síntoma en logs:**
```
Error normalizing phone number
Invalid phone format
```

**Solución:**
- Revisar función `normalizePhoneNumber`
- Verificar formato del número entrante

## 📊 Información Necesaria

Para ayudarte mejor, necesito:

1. **Output del script de diagnóstico** (`node test-whatsapp-flow.js`)
2. **Logs del momento exacto** en que envías un mensaje
3. **La primera línea con `❌`** y su contexto

## 🔧 Solución Temporal (Si urge)

Si necesitas que funcione YA mientras diagnosticamos, puedes:

1. Usar el fallback sin OpenAI temporalmente
2. Responder con mensajes predefinidos
3. Escalar todos los mensajes a humano

Pero es mejor encontrar y arreglar la causa raíz.

---

**Siguiente paso**: Ejecuta el script de diagnóstico y comparte el resultado.
