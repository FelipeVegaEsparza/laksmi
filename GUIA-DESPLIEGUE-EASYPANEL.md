# 🚀 Guía de Despliegue en Easypanel

## 📋 Índice
1. [Preparación del Repositorio](#preparación-del-repositorio)
2. [Configuración en Easypanel](#configuración-en-easypanel)
3. [Variables de Entorno](#variables-de-entorno)
4. [Configuración de Dominios](#configuración-de-dominios)
5. [Configuración de Twilio](#configuración-de-twilio)
6. [Verificación y Pruebas](#verificación-y-pruebas)
7. [Troubleshooting](#troubleshooting)

---

## 1. Preparación del Repositorio

### Paso 1.1: Subir código a GitHub

```bash
# Inicializar git si no está inicializado
git init

# Agregar todos los archivos
git add .

# Commit inicial
git commit -m "Initial commit - Ready for Easypanel deployment"

# Crear repositorio en GitHub y conectar
git remote add origin https://github.com/tu-usuario/tu-repo.git
git branch -M main
git push -u origin main
```

### Paso 1.2: Verificar archivos necesarios

Asegúrate de que estos archivos existan:
- ✅ `docker-compose.production.yml`
- ✅ `backend/Dockerfile.production`
- ✅ `dashboard/Dockerfile.production`
- ✅ `frontend/Dockerfile.production`
- ✅ `.env.production.example`

---

## 2. Configuración en Easypanel

### Paso 2.1: Crear Proyecto

1. Accede a tu panel de Easypanel
2. Click en **"Create Project"**
3. Nombre del proyecto: `clinica-belleza`
4. Click en **"Create"**

### Paso 2.2: Conectar con GitHub

1. En tu proyecto, click en **"Add Service"**
2. Selecciona **"GitHub"**
3. Autoriza Easypanel a acceder a tu repositorio
4. Selecciona tu repositorio
5. Branch: `main`

### Paso 2.3: Configurar Servicios

Easypanel detectará automáticamente el `docker-compose.production.yml`. Configura cada servicio:

#### MySQL
- **Nombre**: `mysql`
- **Puerto interno**: 3306
- **Volumen**: `/var/lib/mysql` → `mysql_data`
- **No exponer públicamente**

#### Redis
- **Nombre**: `redis`
- **Puerto interno**: 6379
- **Volumen**: `/data` → `redis_data`
- **No exponer públicamente**

#### Backend
- **Nombre**: `backend`
- **Puerto interno**: 3000
- **Dominio**: `api.tu-dominio.com`
- **SSL**: Activar (Let's Encrypt automático)
- **Health Check**: `/health`

#### Dashboard
- **Nombre**: `dashboard`
- **Puerto interno**: 80
- **Dominio**: `dashboard.tu-dominio.com`
- **SSL**: Activar
- **Health Check**: `/health`

#### Frontend
- **Nombre**: `frontend`
- **Puerto interno**: 3000
- **Dominio**: `tu-dominio.com` y `www.tu-dominio.com`
- **SSL**: Activar
- **Health Check**: `/api/health`

---

## 3. Variables de Entorno

### Paso 3.1: Generar Secrets

Genera valores seguros para tus secrets:

```bash
# JWT Secret (32 caracteres)
openssl rand -base64 32

# JWT Refresh Secret (32 caracteres)
openssl rand -base64 32

# Encryption Key (64 caracteres hex)
openssl rand -hex 32

# Passwords seguros
openssl rand -base64 24
```

### Paso 3.2: Configurar en Easypanel

En Easypanel, ve a **"Environment Variables"** y agrega:

#### Variables Globales (para todos los servicios)

```env
DOMAIN=tu-dominio.com
```

#### Variables del Backend

```env
# Database
MYSQL_ROOT_PASSWORD=<password-generado>
MYSQL_DATABASE=clinica_belleza
MYSQL_USER=clinica_user
MYSQL_PASSWORD=<password-generado>

# Redis
REDIS_PASSWORD=<password-generado>

# JWT
JWT_SECRET=<secret-generado>
JWT_REFRESH_SECRET=<secret-generado>
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Twilio (dejar vacío por ahora, configurar después)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_NUMBER=
TWILIO_WEBHOOK_URL=

# OpenAI
OPENAI_API_KEY=<tu-api-key>
OPENAI_MODEL=gpt-4

# URLs
FRONTEND_URL=https://tu-dominio.com
DASHBOARD_URL=https://dashboard.tu-dominio.com
CORS_ORIGINS=https://tu-dominio.com,https://dashboard.tu-dominio.com,https://www.tu-dominio.com

# Security
ENCRYPTION_KEY=<key-generado>
BCRYPT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Uploads
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp
```

---

## 4. Configuración de Dominios

### Paso 4.1: Configurar DNS

En tu proveedor de DNS (Cloudflare, Namecheap, etc.), agrega estos registros:

| Tipo | Nombre | Valor | TTL |
|------|--------|-------|-----|
| A | @ | IP de Easypanel | 300 |
| A | www | IP de Easypanel | 300 |
| A | api | IP de Easypanel | 300 |
| A | dashboard | IP de Easypanel | 300 |

**Nota**: La IP de Easypanel la encuentras en tu panel.

### Paso 4.2: Esperar Propagación

La propagación DNS puede tomar de 5 minutos a 48 horas. Verifica con:

```bash
# Verificar dominio principal
nslookup tu-dominio.com

# Verificar subdominios
nslookup api.tu-dominio.com
nslookup dashboard.tu-dominio.com
```

### Paso 4.3: Verificar SSL

Easypanel configurará automáticamente SSL con Let's Encrypt. Verifica:

```bash
# Debe mostrar certificado válido
curl -I https://api.tu-dominio.com/health
curl -I https://dashboard.tu-dominio.com/health
curl -I https://tu-dominio.com
```

---

## 5. Configuración de Twilio

### Paso 5.1: Obtener Credenciales

1. Ve a https://console.twilio.com/
2. Copia tu **Account SID**
3. Copia tu **Auth Token**
4. Configura WhatsApp Sandbox o número oficial

### Paso 5.2: Configurar Webhook URL

Tu Webhook URL será:
```
https://api.tu-dominio.com/api/v1/twilio/webhook/receive
```

1. Ve a Twilio Console → WhatsApp Sandbox Settings
2. En "When a message comes in" pega la URL
3. Método: **POST**
4. Click en **Save**

### Paso 5.3: Actualizar Variables de Entorno

En Easypanel, actualiza las variables del backend:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=tu_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
TWILIO_WEBHOOK_URL=https://api.tu-dominio.com/api/v1/twilio/webhook/receive
```

### Paso 5.4: Reiniciar Backend

En Easypanel, reinicia el servicio backend para aplicar los cambios.

---

## 6. Verificación y Pruebas

### Paso 6.1: Verificar Servicios

```bash
# Backend Health Check
curl https://api.tu-dominio.com/health
# Debe responder: {"status":"ok"}

# Dashboard
curl https://dashboard.tu-dominio.com/health
# Debe responder: healthy

# Frontend
curl https://tu-dominio.com
# Debe responder con HTML
```

### Paso 6.2: Verificar Base de Datos

1. Accede al dashboard: https://dashboard.tu-dominio.com
2. Intenta hacer login (si no hay usuario, créalo desde el backend)
3. Verifica que carguen los datos

### Paso 6.3: Probar Twilio WhatsApp

1. Envía un mensaje de WhatsApp a tu número de Twilio
2. Deberías recibir una respuesta automática del chatbot
3. Verifica en el dashboard que se creó la conversación

### Paso 6.4: Verificar Logs

En Easypanel, revisa los logs de cada servicio:

```
Backend → Logs → Buscar errores
Dashboard → Logs → Verificar build exitoso
Frontend → Logs → Verificar inicio correcto
```

---

## 7. Troubleshooting

### Error: "Cannot connect to database"

**Causa**: MySQL no está listo o credenciales incorrectas

**Solución**:
1. Verifica que el servicio MySQL esté corriendo
2. Verifica las variables de entorno
3. Espera a que MySQL termine de inicializar (puede tomar 1-2 minutos)
4. Reinicia el backend

### Error: "Redis connection failed"

**Causa**: Redis no está listo o password incorrecto

**Solución**:
1. Verifica que Redis esté corriendo
2. Verifica `REDIS_PASSWORD` en variables de entorno
3. Reinicia el backend

### Error: "CORS policy blocked"

**Causa**: URLs no configuradas correctamente en CORS_ORIGINS

**Solución**:
1. Verifica que `CORS_ORIGINS` incluya todos tus dominios
2. Formato correcto: `https://dominio1.com,https://dominio2.com`
3. Sin espacios entre dominios
4. Reinicia el backend

### Error: "SSL certificate error"

**Causa**: Let's Encrypt aún no ha generado el certificado

**Solución**:
1. Espera 5-10 minutos
2. Verifica que el DNS esté propagado
3. En Easypanel, fuerza la renovación del certificado

### Error: "Twilio webhook not receiving messages"

**Causa**: Webhook URL incorrecta o backend no accesible

**Solución**:
1. Verifica que la URL sea exactamente: `https://api.tu-dominio.com/api/v1/twilio/webhook/receive`
2. Prueba la URL manualmente: `curl -X POST https://api.tu-dominio.com/api/v1/twilio/webhook/receive`
3. Verifica los logs del backend cuando envíes un mensaje
4. Verifica en Twilio Debugger: https://console.twilio.com/us1/monitor/logs/debugger

### Error: "Build failed"

**Causa**: Dependencias faltantes o error en el código

**Solución**:
1. Revisa los logs de build en Easypanel
2. Verifica que todas las dependencias estén en `package.json`
3. Prueba el build localmente: `docker-compose -f docker-compose.production.yml build`
4. Corrige errores y haz push a GitHub

---

## 📊 Checklist de Despliegue

### Pre-Despliegue
- [ ] ✅ Código subido a GitHub
- [ ] ✅ Archivos Docker creados
- [ ] ✅ Variables de entorno preparadas
- [ ] ✅ Secrets generados

### Configuración Easypanel
- [ ] ✅ Proyecto creado
- [ ] ✅ Repositorio conectado
- [ ] ✅ Servicios configurados
- [ ] ✅ Variables de entorno agregadas
- [ ] ✅ Dominios configurados

### DNS y SSL
- [ ] ✅ Registros DNS creados
- [ ] ✅ DNS propagado
- [ ] ✅ SSL activo en todos los dominios

### Twilio
- [ ] ✅ Credenciales obtenidas
- [ ] ✅ Webhook URL configurada
- [ ] ✅ Variables actualizadas
- [ ] ✅ Prueba de mensaje exitosa

### Verificación Final
- [ ] ✅ Backend responde en /health
- [ ] ✅ Dashboard carga correctamente
- [ ] ✅ Frontend carga correctamente
- [ ] ✅ Login funciona
- [ ] ✅ WhatsApp funciona
- [ ] ✅ Sin errores en logs

---

## 🎯 URLs Finales

Una vez desplegado, tendrás:

- **Frontend**: https://tu-dominio.com
- **Dashboard**: https://dashboard.tu-dominio.com
- **API**: https://api.tu-dominio.com
- **Webhook Twilio**: https://api.tu-dominio.com/api/v1/twilio/webhook/receive

---

## 🔐 Seguridad Post-Despliegue

1. **Cambiar passwords por defecto**: Si usaste passwords temporales, cámbialos
2. **Habilitar backups**: Configura backups automáticos en Easypanel
3. **Monitoreo**: Configura alertas para errores críticos
4. **Rate limiting**: Verifica que esté activo
5. **Logs**: Revisa logs regularmente

---

## 📞 Soporte

Si tienes problemas:

1. **Logs de Easypanel**: Revisa los logs de cada servicio
2. **Twilio Debugger**: https://console.twilio.com/us1/monitor/logs/debugger
3. **Health Checks**: Verifica que todos respondan correctamente
4. **DNS**: Usa herramientas como https://dnschecker.org/

---

## 🎉 ¡Listo!

Tu aplicación está desplegada en producción con:
- ✅ SSL automático
- ✅ Dominios configurados
- ✅ WhatsApp funcionando
- ✅ Base de datos persistente
- ✅ Redis cache
- ✅ Backups automáticos (si configuraste)

**¡Felicidades por tu despliegue!** 🚀
