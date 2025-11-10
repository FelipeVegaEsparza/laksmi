# 🔍 Diagnóstico del Backend en Easypanel

## Problema Actual
El backend desplegado en `https://laksmi-backend.0ieu13.easypanel.host/` no está respondiendo.

El único log visible es:
```
Redis not available, using memory store for brute force protection
```

## ✅ Logs Agregados

He agregado logs detallados en los siguientes archivos para diagnosticar el problema:

### 1. `backend/src/config/index.ts`
```
🔧 Cargando configuración del servidor...
   PORT: [valor]
   NODE_ENV: [valor]
   DB_HOST: [valor]
   DB_NAME: [valor]
```

### 2. `backend/src/app.ts`
```
🔧 Configurando aplicación Express...
📡 CORS configurado para: [origins]
✅ Aplicando middleware CORS...
✅ Configurando health check endpoint...
✅ Registrando rutas de API...
✅ Aplicación Express configurada completamente
📋 Rutas registradas:
   - GET  /health
   - POST /api/v1/auth/login
   - GET  /api/v1/products
   ...
```

### 3. `backend/src/index.ts`
```
=== INICIANDO SERVIDOR LAKSMI ===
Node version: [version]
Platform: [platform]
Environment: [env]
Port configured: [port]
Redis disabled - running without cache
Attempting database connection...
✅ Database connected successfully
Attempting to start server on port [port]...
=== ✅ SERVIDOR INICIADO EXITOSAMENTE ===
🚀 Servidor escuchando en puerto [port]
🌍 Ambiente: [env]
📦 API Version: v1
❤️  Health check: http://localhost:[port]/health
📊 API Base: http://localhost:[port]/api/v1
```

## 🔧 Pasos para Diagnosticar en Easypanel

### 1. Verificar Logs Completos
En el panel de Easypanel:
1. Ve a tu servicio "laksmi-backend"
2. Haz clic en "Logs"
3. Busca los nuevos logs que agregamos
4. Copia TODOS los logs y compártelos

### 2. Verificar Variables de Entorno
Asegúrate de que estas variables estén configuradas en Easypanel:

#### Variables Obligatorias:
```bash
# Puerto (Easypanel puede asignar uno automáticamente)
PORT=3000

# Entorno
NODE_ENV=production

# Base de Datos
DB_HOST=tu-db-host
DB_PORT=3306
DB_NAME=laksmi_db
DB_USER=tu-usuario
DB_PASSWORD=tu-password

# JWT
JWT_SECRET=tu-secret-key-segura-aqui
JWT_REFRESH_SECRET=tu-refresh-secret-key-aqui

# API
API_VERSION=v1
```

#### Variables Opcionales (pero recomendadas):
```bash
# CORS
CORS_ORIGINS=https://tu-dashboard.com,https://tu-frontend.com

# Twilio (si usas WhatsApp)
TWILIO_ACCOUNT_SID=tu-account-sid
TWILIO_AUTH_TOKEN=tu-auth-token
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890

# OpenAI (si usas IA)
OPENAI_API_KEY=tu-openai-key
```

### 3. Verificar Estado del Servicio
En Easypanel:
- ✅ El servicio debe estar en estado "Running" (verde)
- ❌ Si está en "Stopped" o "Error" (rojo), revisa los logs

### 4. Verificar Configuración del Puerto
Easypanel puede asignar un puerto automáticamente. Verifica:
1. En la configuración del servicio, busca "Port Mapping"
2. Asegúrate de que el puerto interno (3000) esté mapeado al puerto externo
3. El puerto debe estar expuesto públicamente

### 5. Verificar Base de Datos
El backend necesita conectarse a una base de datos MySQL:
1. ¿Tienes una base de datos MySQL configurada en Easypanel?
2. ¿Las credenciales en las variables de entorno son correctas?
3. ¿La base de datos está en la misma red que el backend?

### 6. Verificar Build del Proyecto
En Easypanel, verifica:
1. ¿El build se completó exitosamente?
2. ¿Se ejecutó `npm install`?
3. ¿Se compiló TypeScript correctamente?

## 🐛 Posibles Problemas y Soluciones

### Problema 1: El servidor no inicia
**Síntomas**: No ves el log "=== SERVIDOR INICIADO EXITOSAMENTE ==="

**Posibles causas**:
- Error en la conexión a la base de datos
- Puerto ya en uso
- Error en la compilación de TypeScript

**Solución**:
1. Revisa los logs completos
2. Busca mensajes de error antes del log de Redis
3. Verifica las credenciales de la base de datos

### Problema 2: El servidor inicia pero no responde
**Síntomas**: Ves el log de inicio pero curl falla

**Posibles causas**:
- Puerto no expuesto correctamente
- Firewall bloqueando conexiones
- Configuración de red incorrecta en Easypanel

**Solución**:
1. Verifica la configuración de puertos en Easypanel
2. Asegúrate de que el puerto esté expuesto públicamente
3. Verifica que no haya reglas de firewall bloqueando

### Problema 3: Error de base de datos
**Síntomas**: Log "Attempting database connection..." pero no "Database connected successfully"

**Posibles causas**:
- Credenciales incorrectas
- Base de datos no accesible
- Base de datos no existe

**Solución**:
1. Verifica las variables DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
2. Asegúrate de que la base de datos esté corriendo
3. Verifica que el backend pueda acceder a la base de datos (misma red)

## 📝 Checklist de Verificación

Marca cada item cuando lo hayas verificado:

- [ ] Variables de entorno configuradas en Easypanel
- [ ] Base de datos MySQL creada y accesible
- [ ] Servicio en estado "Running"
- [ ] Puerto expuesto correctamente
- [ ] Build completado sin errores
- [ ] Logs completos revisados
- [ ] No hay errores de conexión a DB en los logs
- [ ] El log "SERVIDOR INICIADO EXITOSAMENTE" aparece

## 🚀 Próximos Pasos

Una vez que el backend esté funcionando:

1. **Verificar health check**:
   ```bash
   curl https://laksmi-backend.0ieu13.easypanel.host/health
   ```
   Debería responder:
   ```json
   {
     "status": "OK",
     "timestamp": "2024-...",
     "version": "v1",
     "environment": "production"
   }
   ```

2. **Probar login**:
   ```bash
   curl -X POST https://laksmi-backend.0ieu13.easypanel.host/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin123"}'
   ```

3. **Actualizar dashboard**:
   - El archivo `dashboard/.env` ya está configurado con la URL del backend
   - Solo necesitas reiniciar el dashboard

## 📞 Información Adicional Necesaria

Para ayudarte mejor, necesito que me proporciones:

1. **Logs completos** del servicio en Easypanel (después de reiniciar)
2. **Variables de entorno** configuradas (sin mostrar valores sensibles)
3. **Estado del servicio** (Running, Stopped, Error)
4. **Configuración de la base de datos** (¿existe?, ¿está accesible?)
5. **Configuración de puertos** en Easypanel

Con esta información podré identificar exactamente dónde está el problema.
