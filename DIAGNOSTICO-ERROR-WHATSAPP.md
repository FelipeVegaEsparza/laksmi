# 🔍 Diagnóstico: Error en Respuestas de WhatsApp

## 📋 Síntoma

WhatsApp está conectado y recibe mensajes, pero responde con:
```
Lo siento, ha ocurrido un error técnico. Por favor, intenta de nuevo en unos momentos.
```

## 🎯 Posibles Causas

### 1. OpenAI API Key no configurada o inválida
- El backend necesita `OPENAI_API_KEY` en las variables de entorno
- Si no está configurada, el AI no puede generar respuestas

### 2. Base de conocimientos vacía o con error
- El sistema intenta buscar información en la base de conocimientos
- Si hay un error en la consulta, puede fallar todo el flujo

### 3. Error en la base de datos
- Problemas al crear/buscar cliente
- Problemas al crear/buscar conversación
- Problemas al guardar mensajes

### 4. Error en el contexto de conversación
- Problemas al actualizar el contexto
- Problemas con el ContextManager

## 🔧 Pasos de Diagnóstico

### Paso 1: Verificar Variables de Entorno en Easypanel

1. Ve a Easypanel → Backend → Environment
2. Verifica que existan estas variables:

```bash
OPENAI_API_KEY=sk-...  # Debe empezar con sk-
NODE_ENV=production
DB_HOST=mysql
DB_NAME=clinica_belleza
DB_USER=...
DB_PASSWORD=...
```

### Paso 2: Verificar Logs Detallados

En los logs de Easypanel, busca:

```bash
# Buscar errores específicos:
❌ Message processing error:

# Buscar si OpenAI está configurado:
OpenAI API key not configured

# Buscar errores de base de datos:
Database connection failed
Error creating client
Error creating conversation

# Buscar errores de OpenAI:
Error generating AI response:
```

### Paso 3: Verificar Base de Conocimientos

Ejecuta en el terminal de Easypanel (backend):

```bash
# Conectar a MySQL
mysql -h mysql -u root -p clinica_belleza

# Verificar que existan servicios
SELECT COUNT(*) FROM services WHERE is_active = 1;

# Verificar que exista la tabla de conocimientos
SHOW TABLES LIKE 'knowledge%';

# Salir
exit
```

### Paso 4: Probar OpenAI Manualmente

Crea un archivo de prueba temporal:

```bash
# En el terminal del backend en Easypanel:
node -e "
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: 'Hola' }]
}).then(r => console.log('✅ OpenAI OK:', r.choices[0].message.content))
  .catch(e => console.error('❌ OpenAI Error:', e.message));
"
```

## ✅ Soluciones Según el Error

### Si falta OPENAI_API_KEY:

1. Ve a Easypanel → Backend → Environment
2. Agrega la variable:
   ```
   OPENAI_API_KEY=sk-tu-api-key-aqui
   ```
3. Haz clic en "Save"
4. Reinicia el backend

### Si OpenAI da error de autenticación:

1. Verifica que la API key sea válida en https://platform.openai.com/api-keys
2. Genera una nueva si es necesario
3. Actualiza en Easypanel
4. Reinicia el backend

### Si hay error de base de datos:

1. Verifica las credenciales de MySQL en Easypanel
2. Verifica que el servicio MySQL esté corriendo
3. Ejecuta las migraciones manualmente si es necesario

### Si la base de conocimientos está vacía:

1. Ve al dashboard de administración
2. Ve a "Base de Conocimientos"
3. Agrega al menos un servicio o información
4. Prueba de nuevo

## 🚀 Mejoras Aplicadas

He mejorado el logging en `MessageRouter.ts` para que muestre más detalles del error:

```typescript
logger.error('❌ Message processing error:', {
  error: error instanceof Error ? error.message : 'Unknown error',
  stack: error instanceof Error ? error.stack : undefined,
  clientId: request.clientId,
  channel: request.channel,
  contentLength: request.content?.length
});
```

## 📊 Verificación Post-Fix

Después de aplicar la solución, deberías ver en los logs:

```
🔵 Processing message START
✅ Client found/created
✅ Conversation found/created
✅ Client message saved
✅ Context updated
🤖 Preparing to call AIService
📞 Calling AIService.generateResponse
Calling OpenAI API
✅ OpenAI response received
✅ AIService response received
💬 Enviando respuesta: [respuesta del AI]
✅ Respuesta enviada automáticamente
```

## 🔄 Próximos Pasos

1. **Hacer commit y push** de los cambios de logging:
```bash
git add backend/src/services/ai/MessageRouter.ts
git commit -m "feat: mejorar logging de errores en MessageRouter"
git push origin main
```

2. **Rebuild en Easypanel**

3. **Enviar un mensaje de prueba** y revisar los logs

4. **Compartir los logs** si el error persiste

## 📝 Checklist de Verificación

- [ ] OPENAI_API_KEY está configurada en Easypanel
- [ ] La API key es válida (empieza con sk-)
- [ ] MySQL está corriendo y accesible
- [ ] Las migraciones se ejecutaron correctamente
- [ ] Hay al menos un servicio en la base de conocimientos
- [ ] Los logs muestran el error específico
- [ ] WhatsApp Web está conectado (QR escaneado)

---

**Fecha**: 2024-11-30
**Estado**: Diagnóstico en progreso
