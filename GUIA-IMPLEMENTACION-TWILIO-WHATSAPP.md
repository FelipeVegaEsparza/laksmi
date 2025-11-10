# 🚀 Guía Completa de Implementación Twilio WhatsApp

## 📋 Índice
1. [Requisitos Previos](#requisitos-previos)
2. [Configuración de Twilio](#configuración-de-twilio)
3. [Configuración del Backend](#configuración-del-backend)
4. [Configuración del Dashboard](#configuración-del-dashboard)
5. [Pruebas](#pruebas)
6. [Troubleshooting](#troubleshooting)

---

## 1. Requisitos Previos

### ✅ Cuenta de Twilio
- Cuenta activa en [Twilio](https://www.twilio.com/)
- WhatsApp Business API habilitado
- Créditos o plan de pago configurado

### ✅ Datos que necesitas tener listos:
- **Account SID**: Lo encuentras en el Dashboard de Twilio
- **Auth Token**: También en el Dashboard de Twilio
- **WhatsApp Number**: Tu número de WhatsApp de Twilio (formato: +14155238886)

---

## 2. Configuración de Twilio

### Paso 1: Obtener credenciales

1. Ve a [Twilio Console](https://console.twilio.com/)
2. En el Dashboard principal verás:
   - **Account SID**: Algo como `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **Auth Token**: Click en "Show" para verlo

### Paso 2: Configurar WhatsApp Sandbox (Para desarrollo)

1. Ve a: **Messaging** > **Try it out** > **Send a WhatsApp message**
2. Sigue las instrucciones para unirte al sandbox
3. Envía el código de activación desde tu WhatsApp personal
4. Anota el número del sandbox (ej: `+14155238886`)

### Paso 3: Configurar Webhook URL

**IMPORTANTE**: Aquí es donde conectas Twilio con tu backend.

#### Opción A: Desarrollo Local con ngrok (Recomendado para pruebas)

1. **Instalar ngrok**:
   ```bash
   # Descargar de: https://ngrok.com/download
   # O con chocolatey en Windows:
   choco install ngrok
   ```

2. **Iniciar tu backend**:
   ```bash
   cd backend
   npm run dev
   # El backend debería estar corriendo en http://localhost:3000
   ```

3. **Exponer con ngrok**:
   ```bash
   ngrok http 3000
   ```

4. **Copiar la URL de ngrok**:
   ```
   Forwarding: https://abc123.ngrok.io -> http://localhost:3000
   ```

5. **Tu Webhook URL será**:
   ```
   https://abc123.ngrok.io/api/v1/twilio/webhook/receive
   ```

#### Opción B: Servidor de Producción

Si ya tienes tu backend en producción:
```
https://tu-dominio.com/api/v1/twilio/webhook/receive
```

### Paso 4: Configurar el Webhook en Twilio

1. Ve a: **Messaging** > **Settings** > **WhatsApp sandbox settings**
2. En **"When a message comes in"**:
   - Pega tu Webhook URL
   - Método: **POST**
   - Click en **Save**

3. (Opcional) En **"Status callback URL"**:
   ```
   https://tu-url/api/v1/twilio/webhook/status
   ```

---

## 3. Configuración del Backend

### Paso 1: Configurar variables de entorno

Edita el archivo `backend/.env`:

```env
# Twilio WhatsApp Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=tu_auth_token_aqui
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
TWILIO_WEBHOOK_URL=https://tu-url.ngrok.io/api/v1/twilio/webhook/receive

# OpenAI (para el chatbot)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4
```

### Paso 2: Verificar que el backend esté corriendo

```bash
cd backend
npm run dev
```

Deberías ver:
```
✓ Server running on port 3000
✓ Database connected
✓ Redis connected
```

### Paso 3: Probar la conexión con Twilio

Puedes usar este script de prueba:

```bash
node backend/test-twilio-connection.js
```

O hacer una petición manual:
```bash
curl -X GET http://localhost:3000/api/v1/twilio/test-connection \
  -H "Authorization: Bearer TU_TOKEN_JWT"
```

---

## 4. Configuración del Dashboard

### Paso 1: Acceder a la configuración

1. Inicia sesión en el dashboard: `http://localhost:3002`
2. Ve a: **Configuración** > **Integraciones** > **Twilio WhatsApp**

### Paso 2: Completar el formulario

Ingresa los siguientes datos:

| Campo | Valor | Ejemplo |
|-------|-------|---------|
| **Account SID** | Tu Account SID de Twilio | `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| **Auth Token** | Tu Auth Token de Twilio | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| **WhatsApp Number** | Tu número de WhatsApp | `+14155238886` |
| **Webhook URL** | URL del webhook (solo lectura) | `https://abc123.ngrok.io/api/v1/twilio/webhook/receive` |

### Paso 3: Probar la conexión

1. Click en **"Probar Conexión"**
2. Deberías ver: ✅ **"Conexión exitosa"**

### Paso 4: Guardar configuración

1. Click en **"Guardar Configuración"**
2. Verás una notificación de éxito

---

## 5. Pruebas

### Prueba 1: Enviar mensaje desde WhatsApp

1. Abre WhatsApp en tu teléfono
2. Envía un mensaje al número del sandbox de Twilio
3. Deberías recibir una respuesta automática del chatbot

**Ejemplo de conversación**:
```
Tú: Hola
Bot: ¡Hola! Soy el asistente virtual de [Clínica]. ¿En qué puedo ayudarte hoy?

Tú: ¿Qué servicios ofrecen?
Bot: Ofrecemos los siguientes servicios:
- Tratamientos faciales
- Depilación láser
- Masajes terapéuticos
...
```

### Prueba 2: Enviar mensaje desde el Dashboard

1. Ve a: **Conversaciones** > **Nueva Conversación**
2. Selecciona un cliente
3. Escribe un mensaje
4. Click en **Enviar**
5. El cliente debería recibir el mensaje en WhatsApp

### Prueba 3: Ver logs en tiempo real

En la terminal donde corre el backend verás:
```
[INFO] WhatsApp message received from +1234567890
[INFO] Processing message: "Hola"
[INFO] AI response generated
[INFO] WhatsApp response sent successfully
```

---

## 6. Troubleshooting

### ❌ Error: "Webhook URL no responde"

**Causa**: Twilio no puede alcanzar tu servidor

**Solución**:
1. Verifica que ngrok esté corriendo
2. Verifica que el backend esté corriendo
3. Prueba la URL manualmente:
   ```bash
   curl -X POST https://tu-url.ngrok.io/api/v1/twilio/webhook/receive \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "From=whatsapp:+1234567890&Body=test"
   ```

### ❌ Error: "Authentication failed"

**Causa**: Credenciales incorrectas

**Solución**:
1. Verifica que el Account SID sea correcto
2. Verifica que el Auth Token sea correcto
3. Regenera el Auth Token si es necesario en Twilio Console

### ❌ Error: "Message not sent"

**Causa**: Número no válido o sin créditos

**Solución**:
1. Verifica que el número tenga el formato correcto: `+1234567890`
2. Verifica que tengas créditos en Twilio
3. Verifica que el número esté en el sandbox (desarrollo)

### ❌ No recibo respuestas del bot

**Causa**: OpenAI no configurado o error en el procesamiento

**Solución**:
1. Verifica que `OPENAI_API_KEY` esté configurado
2. Revisa los logs del backend
3. Verifica que la base de conocimientos tenga contenido

### ❌ ngrok se desconecta

**Causa**: ngrok gratuito tiene sesiones limitadas

**Solución**:
1. Reinicia ngrok
2. Actualiza la Webhook URL en Twilio Console
3. Considera usar ngrok con cuenta (URLs persistentes)

---

## 📊 Verificación Final

### Checklist de implementación:

- [ ] ✅ Cuenta de Twilio creada y verificada
- [ ] ✅ WhatsApp Sandbox activado (o número de producción)
- [ ] ✅ Credenciales copiadas (Account SID, Auth Token)
- [ ] ✅ Backend corriendo en local o producción
- [ ] ✅ ngrok exponiendo el backend (si es local)
- [ ] ✅ Webhook URL configurada en Twilio Console
- [ ] ✅ Variables de entorno configuradas en `.env`
- [ ] ✅ Configuración guardada en el Dashboard
- [ ] ✅ Prueba de conexión exitosa
- [ ] ✅ Mensaje de prueba enviado y recibido
- [ ] ✅ Respuesta del bot recibida

---

## 🎯 Próximos Pasos

Una vez que todo funcione:

1. **Producción**: 
   - Solicita un número de WhatsApp Business oficial
   - Configura un dominio permanente
   - Actualiza las URLs en Twilio

2. **Plantillas**:
   - Crea plantillas pre-aprobadas en Twilio
   - Configura recordatorios automáticos
   - Personaliza mensajes de bienvenida

3. **Monitoreo**:
   - Configura alertas para errores
   - Revisa estadísticas en Twilio Console
   - Analiza conversaciones en el Dashboard

---

## 📞 Soporte

Si tienes problemas:

1. **Logs del Backend**: Revisa `backend/logs/combined.log`
2. **Twilio Debugger**: https://console.twilio.com/us1/monitor/logs/debugger
3. **Documentación Twilio**: https://www.twilio.com/docs/whatsapp

---

## 🔐 Seguridad

**IMPORTANTE**: 

- ⚠️ Nunca compartas tu Auth Token
- ⚠️ No subas el archivo `.env` a Git
- ⚠️ Usa variables de entorno en producción
- ⚠️ Habilita la validación de firma de Twilio (ya implementada)
- ⚠️ Configura rate limiting (ya implementado)

---

## 📝 Notas Adicionales

### Formato de números de teléfono:

- **Internacional**: `+1234567890` (sin espacios ni guiones)
- **WhatsApp**: `whatsapp:+1234567890` (para Twilio)

### Límites del Sandbox:

- Solo números pre-autorizados pueden recibir mensajes
- Cada número debe unirse enviando el código de activación
- Límite de mensajes por día

### Migración a Producción:

1. Solicita número oficial en Twilio
2. Aprueba plantillas de mensajes
3. Configura dominio con SSL
4. Actualiza Webhook URL
5. Prueba exhaustivamente

---

¡Listo! Ahora tienes WhatsApp completamente integrado con tu sistema. 🎉
