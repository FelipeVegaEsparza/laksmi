# 🚀 Sistema de Gestión de Clínica de Belleza

## Sistema completo con WhatsApp Business, IA y Panel de Administración

---

## ⚡ Inicio Rápido

### Despliegue en Producción (15 minutos)

```bash
# 1. Generar secrets
node generate-production-secrets.js

# 2. Subir a GitHub
git add .
git commit -m "Deploy to production"
git push origin main

# 3. Seguir guía de Easypanel
# Ver: DESPLIEGUE-RAPIDO.md
```

### Desarrollo Local

```bash
# Backend
cd backend
npm install
npm run dev

# Dashboard
cd dashboard
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

---

## 📚 Documentación

### 🎯 Para Desplegar
- **[LISTO-PARA-PRODUCCION.md](LISTO-PARA-PRODUCCION.md)** ← **EMPIEZA AQUÍ**
- **[DESPLIEGUE-RAPIDO.md](DESPLIEGUE-RAPIDO.md)** - Guía de 15 minutos
- **[GUIA-DESPLIEGUE-EASYPANEL.md](GUIA-DESPLIEGUE-EASYPANEL.md)** - Guía completa
- **[RESUMEN-DESPLIEGUE-PRODUCCION.md](RESUMEN-DESPLIEGUE-PRODUCCION.md)** - Arquitectura

### 📱 Para Configurar WhatsApp
- **[GUIA-IMPLEMENTACION-TWILIO-WHATSAPP.md](GUIA-IMPLEMENTACION-TWILIO-WHATSAPP.md)** - Guía completa
- **[IMPLEMENTACION-TWILIO-COMPLETA.md](IMPLEMENTACION-TWILIO-COMPLETA.md)** - Detalles técnicos
- **[RESUMEN-IMPLEMENTACION-TWILIO.md](RESUMEN-IMPLEMENTACION-TWILIO.md)** - Guía rápida

### 🛠️ Para Desarrollo
- **[COMO-EMPEZAR.md](COMO-EMPEZAR.md)** - Desarrollo local
- **[GUIA-EJECUCION-LOCAL.md](GUIA-EJECUCION-LOCAL.md)** - Configuración local

---

## 🎯 Características

### ✅ Frontend Web
- Sitio web público con Next.js
- Catálogo de servicios
- Sistema de reservas
- Responsive design

### ✅ Dashboard Administrativo
- Panel de control completo
- Gestión de clientes
- Gestión de citas
- Gestión de servicios
- Base de conocimientos
- Configuración de Twilio
- Analytics y reportes

### ✅ Backend API
- API REST completa
- Autenticación JWT
- Base de datos MySQL
- Cache con Redis
- Rate limiting
- Logging completo

### ✅ WhatsApp Business
- Chatbot con IA (OpenAI)
- Respuestas automáticas
- Gestión de conversaciones
- Plantillas de mensajes
- Recordatorios automáticos
- Integración con Twilio

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                    PRODUCCIÓN                            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Frontend          Dashboard         Backend            │
│  (Next.js)         (React)           (Node.js)          │
│  Port: 3000        Port: 80          Port: 3000         │
│                                                          │
│  tu-dominio.com    dashboard.        api.               │
│                    tu-dominio.com    tu-dominio.com     │
│                                                          │
└────────────┬────────────────┬────────────────┬──────────┘
             │                │                │
             └────────────────┴────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                  MySQL              Redis
                (Database)          (Cache)
```

---

## 🔐 Seguridad

### Implementado
- ✅ SSL/TLS automático (Let's Encrypt)
- ✅ Secrets únicos generados aleatoriamente
- ✅ Passwords hasheados con bcrypt
- ✅ JWT firmados
- ✅ CORS configurado
- ✅ Rate limiting
- ✅ Helmet headers
- ✅ Validación de firma de Twilio
- ✅ Usuario no-root en contenedores

---

## 🚀 Stack Tecnológico

### Frontend
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS

### Dashboard
- React 18
- TypeScript
- Material-UI (MUI)
- Vite
- Nginx (producción)

### Backend
- Node.js 20
- TypeScript
- Express
- MySQL 8
- Redis 7
- Twilio SDK
- OpenAI SDK

### DevOps
- Docker
- Docker Compose
- Easypanel
- GitHub
- Let's Encrypt

---

## 📊 URLs de Producción

| Servicio | URL | Descripción |
|----------|-----|-------------|
| Frontend | `https://tu-dominio.com` | Sitio web público |
| Dashboard | `https://dashboard.tu-dominio.com` | Panel de administración |
| API | `https://api.tu-dominio.com` | Backend API |
| Webhook | `https://api.tu-dominio.com/api/v1/twilio/webhook/receive` | Webhook de Twilio |

---

## 🛠️ Scripts Útiles

```bash
# Generar secrets de producción
node generate-production-secrets.js

# Probar conexión con Twilio
node backend/test-twilio-connection.js

# Verificar sistema local
node verificar-sistema.ps1
```

---

## 📦 Estructura del Proyecto

```
.
├── backend/                 # Backend API (Node.js + TypeScript)
│   ├── src/
│   ├── Dockerfile
│   └── Dockerfile.production
│
├── dashboard/              # Dashboard Admin (React + MUI)
│   ├── src/
│   ├── Dockerfile
│   ├── Dockerfile.production
│   └── nginx.conf
│
├── frontend/               # Frontend Web (Next.js)
│   ├── src/
│   ├── Dockerfile
│   └── Dockerfile.production
│
├── docker-compose.yml              # Desarrollo local
├── docker-compose.production.yml   # Producción
├── .env.production.example         # Template de variables
└── generate-production-secrets.js  # Generador de secrets
```

---

## 🎯 Checklist de Despliegue

### Pre-Despliegue
- [ ] Generar secrets con `node generate-production-secrets.js`
- [ ] Subir código a GitHub
- [ ] Tener dominio configurado
- [ ] Tener cuenta de Easypanel
- [ ] Tener credenciales de Twilio
- [ ] Tener API Key de OpenAI

### Despliegue
- [ ] Crear proyecto en Easypanel
- [ ] Conectar repositorio de GitHub
- [ ] Configurar variables de entorno
- [ ] Configurar DNS
- [ ] Iniciar deploy

### Post-Despliegue
- [ ] Verificar SSL activo
- [ ] Verificar health checks
- [ ] Configurar Twilio webhook
- [ ] Probar WhatsApp
- [ ] Configurar backups
- [ ] Configurar monitoreo

---

## 🆘 Soporte

### Documentación
- Ver carpeta de documentos `.md` en la raíz
- Cada documento tiene troubleshooting específico

### Logs
```bash
# En Easypanel
Proyecto → Servicio → Logs

# Twilio Debugger
https://console.twilio.com/us1/monitor/logs/debugger
```

### Health Checks
```bash
curl https://api.tu-dominio.com/health
curl https://dashboard.tu-dominio.com/health
curl https://tu-dominio.com
```

---

## 📝 Variables de Entorno

### Obligatorias
- `DOMAIN` - Tu dominio
- `MYSQL_ROOT_PASSWORD` - Password MySQL root
- `MYSQL_PASSWORD` - Password MySQL user
- `REDIS_PASSWORD` - Password Redis
- `JWT_SECRET` - Secret JWT
- `JWT_REFRESH_SECRET` - Secret refresh token
- `ENCRYPTION_KEY` - Key de encriptación
- `OPENAI_API_KEY` - API Key de OpenAI

### Opcionales (Twilio)
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_NUMBER`
- `TWILIO_WEBHOOK_URL`

**Nota**: Usa `generate-production-secrets.js` para generar valores seguros.

---

## 🎉 Características Destacadas

### Webhook URL Inteligente
El dashboard detecta automáticamente si estás en local o producción y genera la URL correcta del webhook.

### Seguridad Multi-Capa
- SSL automático
- Secrets únicos
- Rate limiting
- Validación de firma
- Headers de seguridad

### Optimización de Producción
- Build multi-stage
- Solo dependencias necesarias
- Gzip compression
- Cache de assets
- Health checks

### Monitoreo Completo
- Logs centralizados
- Health checks
- Métricas de uso
- Analytics integrado

---

## 🚀 Próximos Pasos

1. **Lee**: `LISTO-PARA-PRODUCCION.md`
2. **Ejecuta**: `node generate-production-secrets.js`
3. **Sigue**: `DESPLIEGUE-RAPIDO.md`
4. **Disfruta**: Tu app en producción

---

## 📞 Recursos

- **Easypanel**: https://easypanel.io/
- **Twilio**: https://www.twilio.com/
- **OpenAI**: https://openai.com/
- **Docker**: https://www.docker.com/
- **Let's Encrypt**: https://letsencrypt.org/

---

## 📄 Licencia

Proyecto privado - Todos los derechos reservados

---

## 👥 Equipo

Desarrollado con ❤️ para transformar la gestión de clínicas de belleza

---

**¿Listo para desplegar?** 🚀

Ejecuta: `node generate-production-secrets.js`

Luego sigue: `DESPLIEGUE-RAPIDO.md`

¡Éxito! 🎉
