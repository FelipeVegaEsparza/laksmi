# 🚀 Despliegue Rápido en Easypanel

## ⚡ Inicio Rápido (15 minutos)

### 1️⃣ Generar Secrets (2 minutos)

```bash
node generate-production-secrets.js
```

Copia el output completo. Lo necesitarás en el paso 3.

### 2️⃣ Subir a GitHub (3 minutos)

```bash
# Si no tienes git inicializado
git init
git add .
git commit -m "Ready for production deployment"

# Crear repo en GitHub y conectar
git remote add origin https://github.com/tu-usuario/tu-repo.git
git branch -M main
git push -u origin main
```

### 3️⃣ Configurar Easypanel (5 minutos)

1. **Crear Proyecto**
   - Ve a Easypanel
   - Click en "Create Project"
   - Nombre: `clinica-belleza`

2. **Conectar GitHub**
   - Add Service → GitHub
   - Selecciona tu repositorio
   - Branch: `main`
   - Docker Compose: `docker-compose.production.yml`

3. **Agregar Variables de Entorno**
   - Ve a Environment Variables
   - Pega el output del paso 1
   - **IMPORTANTE**: Cambia `DOMAIN=tu-dominio.com` por tu dominio real
   - Agrega tus credenciales:
     - `OPENAI_API_KEY=sk-...`
     - `TWILIO_ACCOUNT_SID=AC...` (opcional, puedes configurar después)
     - `TWILIO_AUTH_TOKEN=...` (opcional)

4. **Deploy**
   - Click en "Deploy"
   - Espera 5-10 minutos

### 4️⃣ Configurar DNS (3 minutos)

En tu proveedor de DNS, agrega estos registros A:

| Nombre | Valor |
|--------|-------|
| @ | IP de Easypanel |
| www | IP de Easypanel |
| api | IP de Easypanel |
| dashboard | IP de Easypanel |

**Nota**: La IP la encuentras en Easypanel → Settings → Server IP

### 5️⃣ Configurar Twilio (2 minutos)

1. Ve a https://console.twilio.com/
2. Copia Account SID y Auth Token
3. Ve a WhatsApp Sandbox Settings
4. En "When a message comes in" pega:
   ```
   https://api.tu-dominio.com/api/v1/twilio/webhook/receive
   ```
5. Actualiza las variables en Easypanel:
   ```env
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=tu_auth_token
   TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
   TWILIO_WEBHOOK_URL=https://api.tu-dominio.com/api/v1/twilio/webhook/receive
   ```
6. Reinicia el servicio backend

---

## ✅ Verificación

### Verificar que todo funciona:

```bash
# Backend
curl https://api.tu-dominio.com/health
# Debe responder: {"status":"ok"}

# Dashboard
curl https://dashboard.tu-dominio.com/health
# Debe responder: healthy

# Frontend
curl https://tu-dominio.com
# Debe responder con HTML
```

### Probar WhatsApp:

1. Envía un mensaje de WhatsApp a tu número de Twilio
2. Deberías recibir una respuesta automática
3. Verifica en https://dashboard.tu-dominio.com que se creó la conversación

---

## 🎯 URLs Finales

- **Frontend**: https://tu-dominio.com
- **Dashboard**: https://dashboard.tu-dominio.com
- **API**: https://api.tu-dominio.com
- **Webhook**: https://api.tu-dominio.com/api/v1/twilio/webhook/receive

---

## 📚 Documentación Completa

Para más detalles, consulta:
- **Guía completa**: `GUIA-DESPLIEGUE-EASYPANEL.md`
- **Configuración Twilio**: `GUIA-IMPLEMENTACION-TWILIO-WHATSAPP.md`

---

## 🐛 Problemas Comunes

### "Cannot connect to database"
- Espera 2-3 minutos, MySQL tarda en inicializar
- Verifica las variables de entorno
- Reinicia el backend

### "CORS error"
- Verifica que `CORS_ORIGINS` tenga tus dominios correctos
- Formato: `https://dominio1.com,https://dominio2.com` (sin espacios)
- Reinicia el backend

### "SSL certificate error"
- Espera 5-10 minutos para que Let's Encrypt genere el certificado
- Verifica que el DNS esté propagado

### "Twilio webhook not working"
- Verifica la URL en Twilio Console
- Prueba manualmente: `curl -X POST https://api.tu-dominio.com/api/v1/twilio/webhook/receive`
- Revisa logs en Easypanel

---

## 🎉 ¡Listo!

Tu aplicación está en producción con:
- ✅ SSL automático
- ✅ Dominios configurados
- ✅ Base de datos persistente
- ✅ WhatsApp funcionando
- ✅ Backups automáticos

**¡Felicidades!** 🚀
