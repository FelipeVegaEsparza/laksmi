# 🔍 Diagnóstico: Problema con Cancelación de Reserva

## 🚨 Problema Reportado

**Usuario dice:** "me gustaría cancelar la hora que tengo para hoy"

**Bot responde:** "Lo siento, ha ocurrido un problema. Un especialista te contactará pronto."

**Esperado:** Bot debería solicitar el email del usuario

---

## 🔎 Posibles Causas

### **Causa 1: Backend no se reconstruyó en Easypanel**

El código está en GitHub pero Easypanel no lo desplegó.

**Verificación:**
1. Ve a Easypanel > Tu proyecto > Backend
2. Mira la fecha del último deploy
3. Debe ser de hace pocos minutos (después de las 14:00 aprox)

**Solución:**
```bash
# En Easypanel, forzar rebuild:
# Services > Backend > Rebuild
```

---

### **Causa 2: Error en tiempo de ejecución**

El código se desplegó pero hay un error al ejecutarse.

**Verificación:**
```bash
# Ver logs del backend en Easypanel
# Services > Backend > Logs

# Busca errores como:
- "Error in client verification"
- "Error handling booking management"
- "TypeError"
- "ReferenceError"
```

**Solución:**
- Revisar el error específico en los logs
- Corregir el código según el error

---

### **Causa 3: Cliente tiene email pero está vacío o null**

El cliente tiene el campo `email` pero está vacío.

**Verificación:**
```sql
-- Busca el cliente por teléfono
SELECT id, name, email, phone 
FROM clients 
WHERE phone LIKE '%TUS_ULTIMOS_4_DIGITOS%';

-- Verifica si email es NULL, '', o tiene valor
```

**Solución:**
```sql
-- Si email está vacío pero no NULL, actualízalo a NULL
UPDATE clients 
SET email = NULL 
WHERE email = '' OR email = ' ';
```

---

### **Causa 4: ContextManager falla al guardar variables**

El código intenta guardar `awaitingEmailInput` pero falla.

**Verificación:**
```bash
# En logs, busca:
- "Error setting variable"
- "ContextManager"
```

**Solución:**
- Verificar que la tabla `conversation_context` existe
- Verificar permisos de escritura en BD

---

## 🛠️ Pasos de Diagnóstico

### **Paso 1: Verificar despliegue**

```bash
# SSH a tu servidor o usa Easypanel logs
docker ps | grep backend

# Ver logs recientes
docker logs <backend-container-id> --tail 100

# Buscar línea de inicio
# Debe mostrar: "Server running on port 3000"
```

### **Paso 2: Verificar que el código nuevo está presente**

```bash
# SSH al contenedor
docker exec -it <backend-container-id> bash

# Verificar que el método existe
grep -n "awaitingEmailInput" /app/dist/services/ai/ChatAuthService.js

# Debe mostrar varias líneas con "awaitingEmailInput"
```

### **Paso 3: Probar con logs detallados**

Agrega logs temporales para debug:

```typescript
// En ChatAuthService.ts, línea 165 (después de verificar hasEmail)
if (!hasEmail) {
  logger.info('🔍 DEBUG: Cliente sin email detectado', {
    clientId: client.id,
    conversationId,
    action
  });
  
  await ContextManager.setVariable(conversationId, 'awaitingEmailInput', true);
  // ... resto del código
}
```

Luego:
```bash
# Rebuild backend
# Prueba de nuevo
# Revisa logs para ver si aparece "🔍 DEBUG: Cliente sin email detectado"
```

---

## 🧪 Test Manual Rápido

### **Opción A: Probar con cliente conocido**

```sql
-- 1. Encuentra un cliente
SELECT id, name, email, phone FROM clients LIMIT 5;

-- 2. Borra su email temporalmente
UPDATE clients SET email = NULL WHERE id = 'CLIENT_ID_AQUI';

-- 3. Prueba cancelar desde WhatsApp con ese número

-- 4. Restaura el email después
UPDATE clients SET email = 'email_original@example.com' WHERE id = 'CLIENT_ID_AQUI';
```

### **Opción B: Crear cliente de prueba**

```sql
-- Crear cliente sin email
INSERT INTO clients (id, name, phone, email, created_at, updated_at)
VALUES (
  UUID(),
  'Test Usuario',
  '+56912345678',  -- Reemplaza con tu número de prueba
  NULL,
  NOW(),
  NOW()
);
```

---

## 🔧 Solución Temporal (Workaround)

Si necesitas que funcione YA mientras investigamos:

```typescript
// En MessageRouter.ts, línea ~740
// Cambiar:
if (!authResult.isVerified) {
  return {
    message: authResult.message,
    action: 'auth_required',
    bookingId: undefined
  };
}

// Por:
if (!authResult.isVerified) {
  logger.info('🔍 AUTH RESULT:', {
    isVerified: authResult.isVerified,
    message: authResult.message,
    requiresVerification: authResult.requiresVerification,
    verificationMethod: authResult.verificationMethod
  });
  
  return {
    message: authResult.message,
    action: 'auth_required',
    bookingId: undefined
  };
}
```

Esto agregará logs para ver exactamente qué está retornando `verifyClientForSensitiveAction`.

---

## 📊 Checklist de Verificación

- [ ] Backend reconstruido en Easypanel (fecha reciente)
- [ ] Logs no muestran errores
- [ ] Código nuevo está en el contenedor (`awaitingEmailInput` existe)
- [ ] Cliente de prueba NO tiene email (NULL, no '')
- [ ] Variable `awaitingEmailInput` se guarda correctamente
- [ ] Mensaje de autenticación se retorna correctamente

---

## 🎯 Siguiente Acción Recomendada

**1. Verifica el despliegue:**
```bash
# En Easypanel
Services > Backend > Ver última fecha de deploy
```

**2. Si no se desplegó, fuerza rebuild:**
```bash
# En Easypanel
Services > Backend > Rebuild
```

**3. Espera 2-3 minutos y prueba de nuevo**

**4. Si sigue fallando, revisa logs:**
```bash
# En Easypanel
Services > Backend > Logs
# Busca errores cuando intentas cancelar
```

**5. Comparte los logs conmigo para ayudarte a diagnosticar**

---

## 📞 Información para Soporte

Si necesitas ayuda, comparte:

1. **Fecha/hora del último deploy en Easypanel**
2. **Logs del backend** (últimas 50 líneas cuando intentas cancelar)
3. **Resultado de esta query:**
```sql
SELECT id, name, email, phone 
FROM clients 
WHERE phone = 'TU_NUMERO_DE_PRUEBA';
```

---

**Fecha:** 2025-01-26
**Estado:** 🔍 Investigando
