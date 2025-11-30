# 🧪 Guía de Pruebas en Producción - Autenticación Mejorada

## 📋 Checklist de Despliegue

### 1. ✅ Verificar que Easypanel reconstruyó el backend

1. Ve a tu panel de Easypanel
2. Busca el servicio del backend
3. Verifica que el último deploy sea reciente (hace pocos minutos)
4. Revisa los logs para confirmar que inició correctamente

**Comando para ver logs:**
```bash
# En Easypanel, ve a tu servicio backend > Logs
# O si tienes acceso SSH:
docker logs <nombre-contenedor-backend> --tail 100
```

**Busca estas líneas en los logs:**
```
✅ SMTP credentials are configured
✅ Database connected
✅ Server running on port 3000
```

---

## 🧪 Casos de Prueba

### **Test 1: Usuario SIN email intenta cancelar reserva**

**Objetivo:** Verificar que el bot solicita el email y lo guarda correctamente

**Pasos:**

1. **Preparación:**
   - Identifica un cliente en tu BD que NO tenga email
   - O crea uno nuevo desde WhatsApp

2. **Verificar cliente sin email:**
```sql
-- Ejecuta en tu BD de producción
SELECT id, name, email, phone 
FROM clients 
WHERE phone = '+56XXXXXXXXX';  -- Reemplaza con el número real

-- Si tiene email, bórralo temporalmente para la prueba:
UPDATE clients 
SET email = NULL 
WHERE phone = '+56XXXXXXXXX';
```

3. **Conversación de prueba:**

```
📱 TÚ: "Quiero cancelar mi cita"

🤖 BOT: "📧 Verificación de Seguridad
        
        Para continuar, necesito verificar tu identidad.
        
        ¿Cuál es tu correo electrónico?"

📱 TÚ: "tu@email.com"

🤖 BOT: "✅ Email guardado correctamente
        
        📧 Email registrado: tu***@email.com
        
        🔒 Verificación de Seguridad
        
        Te he enviado un código de verificación de 6 dígitos a tu email.
        
        Por favor, revisa tu bandeja de entrada (y carpeta de spam) 
        y responde con el código que recibiste.
        
        ⏰ El código expira en 10 minutos."
```

4. **Verificar email recibido:**
   - Revisa tu bandeja de entrada
   - Busca email de la clínica con el código
   - Copia el código de 6 dígitos

5. **Continuar conversación:**

```
📱 TÚ: "123456"  (el código que recibiste)

🤖 BOT: "✅ Identidad verificada correctamente
        
        Ahora puedes continuar con tu solicitud. ¿Qué te gustaría hacer?"

[El bot procede a cancelar la reserva]
```

6. **Verificar en BD que el email se guardó:**
```sql
SELECT id, name, email, phone 
FROM clients 
WHERE phone = '+56XXXXXXXXX';

-- Deberías ver el email que proporcionaste
```

**✅ Resultado esperado:**
- Bot solicita email
- Email se guarda en BD
- Código se envía por email
- Usuario puede completar la cancelación

---

### **Test 2: Email con formato inválido**

**Objetivo:** Verificar validación de formato de email

**Conversación:**

```
📱 TÚ: "Quiero cancelar mi cita"

🤖 BOT: "📧 ¿Cuál es tu correo electrónico?"

📱 TÚ: "juan.example.com"  ❌ (sin @)

🤖 BOT: "❌ El formato del email no es válido. 
        Por favor, ingresa un email válido (ejemplo: tu@email.com)"

📱 TÚ: "juan@example.com"  ✅ (formato correcto)

🤖 BOT: "✅ Email guardado correctamente..."
```

**✅ Resultado esperado:**
- Bot rechaza emails sin @
- Bot rechaza emails sin dominio
- Bot acepta emails válidos

---

### **Test 3: Usuario CON email intenta cancelar**

**Objetivo:** Verificar que el flujo normal sigue funcionando

**Preparación:**
```sql
-- Verifica que el cliente tenga email
SELECT id, name, email, phone 
FROM clients 
WHERE phone = '+56XXXXXXXXX';
```

**Conversación:**

```
📱 TÚ: "Quiero cancelar mi cita"

🤖 BOT: "🔒 Verificación de Seguridad
        
        Te he enviado un código de verificación al email ju***@example.com
        
        Por favor, responde con el código de 6 dígitos que recibiste.
        
        ⏰ El código expira en 10 minutos."

📱 TÚ: "123456"

🤖 BOT: "✅ Identidad verificada correctamente..."
```

**✅ Resultado esperado:**
- Bot NO solicita email (ya lo tiene)
- Bot envía código directamente
- Flujo continúa normalmente

---

### **Test 4: Código incorrecto (3 intentos)**

**Objetivo:** Verificar límite de intentos

**Conversación:**

```
📱 TÚ: "Quiero cancelar mi cita"
🤖 BOT: [Envía código]

📱 TÚ: "000000"  ❌ (código incorrecto)
🤖 BOT: "❌ Código incorrecto. Te quedan 2 intentos."

📱 TÚ: "111111"  ❌ (código incorrecto)
🤖 BOT: "❌ Código incorrecto. Te queda 1 intento."

📱 TÚ: "123456"  ✅ (código correcto)
🤖 BOT: "✅ Identidad verificada correctamente..."
```

**✅ Resultado esperado:**
- Bot cuenta los intentos
- Después de 3 intentos fallidos, bloquea
- Usuario debe solicitar nuevo código

---

### **Test 5: Código expirado**

**Objetivo:** Verificar expiración de 10 minutos

**Pasos:**

1. Solicita cancelación y recibe código
2. **Espera 11 minutos** ⏰
3. Intenta usar el código

**Conversación:**

```
📱 TÚ: "123456"  (después de 11 minutos)

🤖 BOT: "⏰ El código ha expirado (10 minutos). 
        Por favor, solicita uno nuevo intentando la acción nuevamente."
```

**✅ Resultado esperado:**
- Código expira después de 10 minutos
- Usuario debe solicitar nuevo código

---

## 🔍 Verificaciones en Base de Datos

### **1. Verificar que el email se guardó:**

```sql
SELECT 
    id,
    name,
    email,
    phone,
    created_at,
    updated_at
FROM clients 
WHERE phone = '+56XXXXXXXXX';
```

**✅ Esperado:** Campo `email` debe tener el valor proporcionado

---

### **2. Verificar logs de conversación:**

```sql
SELECT 
    c.id as conversation_id,
    m.sender_type,
    m.content,
    m.metadata,
    m.created_at
FROM conversations c
JOIN messages m ON m.conversation_id = c.id
WHERE c.client_id = 'CLIENT_ID_AQUI'
ORDER BY m.created_at DESC
LIMIT 20;
```

**✅ Esperado:** 
- Mensaje del cliente con el email
- Mensaje del bot confirmando email guardado
- Metadata con `emailCapture: true`

---

## 📊 Métricas a Monitorear

### **1. Tasa de captura de emails:**

```sql
-- Clientes que proporcionaron email en los últimos 7 días
SELECT 
    COUNT(*) as emails_capturados,
    DATE(updated_at) as fecha
FROM clients
WHERE email IS NOT NULL
AND updated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY DATE(updated_at)
ORDER BY fecha DESC;
```

---

### **2. Tasa de verificación exitosa:**

```sql
-- Conversaciones con verificación exitosa
SELECT 
    COUNT(*) as verificaciones_exitosas,
    DATE(created_at) as fecha
FROM messages
WHERE metadata LIKE '%"verified":true%'
AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY DATE(created_at)
ORDER BY fecha DESC;
```

---

## 🚨 Troubleshooting

### **Problema 1: Bot no solicita email**

**Síntomas:**
- Bot dice "contacta a la clínica" en lugar de solicitar email

**Solución:**
1. Verifica que el backend se reconstruyó:
```bash
# En Easypanel logs
grep "Server running" /var/log/backend.log
```

2. Verifica que los archivos se actualizaron:
```bash
# SSH al contenedor
docker exec -it <backend-container> bash
cat /app/src/services/ai/ChatAuthService.ts | grep "awaitingEmailInput"
```

3. Reinicia el backend:
```bash
# En Easypanel
# Services > Backend > Restart
```

---

### **Problema 2: Email no se envía**

**Síntomas:**
- Bot dice "email guardado" pero no llega el código

**Solución:**
1. Verifica configuración SMTP en Easypanel:
```bash
# Variables de entorno
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu@email.com
SMTP_PASS=tu_password
```

2. Revisa logs del backend:
```bash
# Busca errores de SMTP
grep "SMTP" /var/log/backend.log
grep "Email sent" /var/log/backend.log
```

3. Si el email no se envía, el bot mostrará el código en el mensaje (fallback)

---

### **Problema 3: Email no se guarda en BD**

**Síntomas:**
- Bot confirma email pero no aparece en la BD

**Solución:**
1. Verifica permisos de BD:
```sql
SHOW GRANTS FOR 'tu_usuario'@'%';
```

2. Verifica logs de error:
```bash
grep "Error capturing and saving email" /var/log/backend.log
```

3. Prueba actualización manual:
```sql
UPDATE clients 
SET email = 'test@example.com' 
WHERE id = 'CLIENT_ID';
```

---

## ✅ Checklist Final

Antes de considerar el despliegue exitoso, verifica:

- [ ] Backend reconstruido en Easypanel
- [ ] Logs muestran inicio correcto
- [ ] Test 1 completado: Usuario sin email puede cancelar
- [ ] Test 2 completado: Validación de formato funciona
- [ ] Test 3 completado: Usuario con email sigue funcionando
- [ ] Email se guarda correctamente en BD
- [ ] Código de verificación llega por email
- [ ] Validación de código funciona
- [ ] Límite de 3 intentos funciona
- [ ] Expiración de 10 minutos funciona

---

## 📞 Contacto de Soporte

Si encuentras problemas:

1. **Revisa logs de Easypanel**
2. **Verifica variables de entorno SMTP**
3. **Prueba con un cliente de prueba primero**
4. **Documenta el error exacto que ves**

---

**Fecha:** 2025-01-26
**Versión:** 1.0
**Estado:** 🚀 Desplegado en producción
