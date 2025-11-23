# Solución: Error de Email en Producción (Connection Timeout)

## 🔍 Problema Identificado

**Error**: `Connection timeout` al intentar enviar emails desde Easypanel
**Causa**: El contenedor Docker no puede conectarse al servidor SMTP externo

```
Error: Connection timeout
code: 'ETIMEDOUT'
command: 'CONN'
```

## ⚠️ Por qué funciona en local pero no en producción

1. **Firewall del hosting**: Easypanel/Docker puede bloquear conexiones SMTP salientes
2. **Restricciones de red**: Muchos proveedores bloquean puertos 25, 587, 465 por seguridad
3. **Gmail bloquea contenedores**: Gmail detecta y bloquea conexiones desde IPs de datacenters
4. **Timeout de red**: La red del contenedor puede tener timeouts más agresivos

## ✅ Soluciones Implementadas

### 1. Mejoras en el código (Ya aplicadas)

- ✅ Aumentado timeout de conexión a 60 segundos
- ✅ Sistema de reintentos (3 intentos con backoff exponencial)
- ✅ Mejor logging para debugging
- ✅ Manejo de errores específicos

### 2. Soluciones Recomendadas (Elegir una)

#### Opción A: Usar Resend (RECOMENDADO) ⭐

**Por qué Resend:**
- ✅ Diseñado para desarrolladores
- ✅ 100 emails gratis al día
- ✅ Funciona perfecto en Docker/contenedores
- ✅ API simple y confiable
- ✅ No requiere configuración compleja

**Pasos:**

1. Crear cuenta en [resend.com](https://resend.com)
2. Obtener API Key
3. Actualizar variables de entorno en Easypanel:

```env
# Opción 1: Usar Resend con SMTP
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=re_tu_api_key_aqui

# Opción 2: Usar Resend API directamente (más confiable)
RESEND_API_KEY=re_tu_api_key_aqui
EMAIL_PROVIDER=resend
```

#### Opción B: Usar SendGrid

**Pasos:**

1. Crear cuenta en [sendgrid.com](https://sendgrid.com)
2. Obtener API Key
3. Actualizar variables de entorno:

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=tu_sendgrid_api_key_aqui
```

#### Opción C: Usar Mailgun

**Pasos:**

1. Crear cuenta en [mailgun.com](https://mailgun.com)
2. Verificar dominio
3. Obtener credenciales SMTP
4. Actualizar variables de entorno:

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@tu-dominio.mailgun.org
SMTP_PASS=tu_mailgun_password
```

#### Opción D: Gmail con App Password (NO RECOMENDADO para producción)

**Solo si insistes en usar Gmail:**

1. Habilitar verificación en 2 pasos en tu cuenta Google
2. Generar "App Password" en configuración de seguridad
3. Actualizar variables de entorno:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu_app_password_de_16_caracteres
```

**⚠️ Limitaciones de Gmail:**
- Límite de 500 emails/día
- Puede ser bloqueado por Google
- No confiable en producción
- Puede requerir "Allow less secure apps"

## 🚀 Implementación Rápida con Resend (RECOMENDADO)

### Paso 1: Instalar dependencia (opcional, si usas API)

```bash
npm install resend
```

### Paso 2: Actualizar variables en Easypanel

En la interfaz de Easypanel, ve a tu servicio backend → Variables de entorno:

```env
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=re_tu_api_key_aqui
SMTP_FROM=noreply@tu-dominio.com
```

### Paso 3: Reiniciar el backend

```bash
# Easypanel lo hace automáticamente al guardar variables
```

### Paso 4: Probar

El sistema ya tiene reintentos y mejor logging, así que verás en los logs si funciona.

## 🔧 Verificación

### Ver logs en Easypanel

1. Ve a tu servicio backend
2. Click en "Logs"
3. Busca mensajes que empiecen con 📧

### Logs exitosos deberían mostrar:

```
📧 sendEmail called
📧 Attempt 1/3
📧 SMTP Configuration: { host: 'smtp.resend.com', port: '587', user: 'SET', pass: 'SET' }
✅ SMTP credentials are configured
📧 Getting transporter...
📧 Transporter obtained
📧 Sending email...
✅ Email sent successfully to contacto@esteticalaksmi.cl: <message-id>
```

### Si sigue fallando, verás:

```
❌ Error sending email (attempt 1/3): { code: 'ETIMEDOUT', ... }
⏳ Waiting 2000ms before retry...
```

## 📊 Comparación de Servicios

| Servicio | Gratis/mes | Confiabilidad | Facilidad | Docker-friendly |
|----------|------------|---------------|-----------|-----------------|
| **Resend** | 100/día | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ Excelente |
| SendGrid | 100/día | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ Muy bueno |
| Mailgun | 100/día | ⭐⭐⭐⭐ | ⭐⭐⭐ | ✅ Muy bueno |
| Gmail | 500/día | ⭐⭐ | ⭐⭐⭐ | ❌ Problemático |

## 🎯 Recomendación Final

**Usa Resend** - Es la solución más simple, confiable y diseñada específicamente para este caso de uso.

1. Crea cuenta en resend.com (2 minutos)
2. Copia tu API key
3. Actualiza las variables en Easypanel
4. Reinicia el backend
5. ¡Listo!

## 🆘 Si Nada Funciona

### Opción de emergencia: Desactivar emails temporalmente

Si necesitas que el sistema funcione YA y arreglar los emails después:

```env
# Dejar vacío para desactivar emails
SMTP_USER=
SMTP_PASS=
```

El sistema detectará que no hay credenciales y no intentará enviar emails, pero todo lo demás funcionará.

## 📝 Notas Adicionales

- El código ya tiene reintentos automáticos (3 intentos)
- Los timeouts se aumentaron a 60 segundos
- El logging es detallado para debugging
- El sistema es tolerante a fallos (no rompe si falla el email)

## 🔗 Enlaces Útiles

- [Resend Docs](https://resend.com/docs)
- [SendGrid SMTP](https://docs.sendgrid.com/for-developers/sending-email/integrating-with-the-smtp-api)
- [Mailgun SMTP](https://documentation.mailgun.com/en/latest/user_manual.html#sending-via-smtp)

---

**Última actualización**: 2025-11-22
**Estado**: Código mejorado, esperando configuración de servicio SMTP
