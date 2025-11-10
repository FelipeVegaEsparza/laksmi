# 🌟 Sistema de Gestión para Clínica de Belleza

Sistema completo de gestión con WhatsApp Business, Inteligencia Artificial y Panel de Administración.

## 🚀 Inicio Rápido

### Despliegue en Producción (15 minutos)

```bash
# 1. Generar secrets seguros
node generate-production-secrets.js

# 2. Subir a GitHub (ya hecho si estás leyendo esto)

# 3. Desplegar en Easypanel
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

## 📚 Documentación

### 🎯 Para Desplegar en Producción
- **[LISTO-PARA-PRODUCCION.md](LISTO-PARA-PRODUCCION.md)** ← **EMPIEZA AQUÍ**
- [DESPLIEGUE-RAPIDO.md](DESPLIEGUE-RAPIDO.md) - Guía de 15 minutos
- [GUIA-DESPLIEGUE-EASYPANEL.md](GUIA-DESPLIEGUE-EASYPANEL.md) - Guía completa
- [RESUMEN-DESPLIEGUE-PRODUCCION.md](RESUMEN-DESPLIEGUE-PRODUCCION.md) - Arquitectura

### 📱 Para Configurar WhatsApp
- [GUIA-IMPLEMENTACION-TWILIO-WHATSAPP.md](GUIA-IMPLEMENTACION-TWILIO-WHATSAPP.md) - Guía completa
- [IMPLEMENTACION-TWILIO-COMPLETA.md](IMPLEMENTACION-TWILIO-COMPLETA.md) - Detalles técnicos
- [RESUMEN-IMPLEMENTACION-TWILIO.md](RESUMEN-IMPLEMENTACION-TWILIO.md) - Guía rápida

## ✨ Características

### Frontend Web
- ✅ Sitio web público con Next.js
- ✅ Catálogo de servicios
- ✅ Sistema de reservas
- ✅ Diseño responsive

### Dashboard Administrativo
- ✅ Panel de control completo
- ✅ Gestión de clientes y citas
- ✅ Gestión de servicios y productos
- ✅ Base de conocimientos para el chatbot
- ✅ Configuración de Twilio WhatsApp
- ✅ Analytics y reportes

### Backend API
- ✅ API REST completa
- ✅ Autenticación JWT
- ✅ Base de datos MySQL
- ✅ Cache con Redis
- ✅ Rate limiting y seguridad

### WhatsApp Business
- ✅ Chatbot con IA (OpenAI GPT-4)
- ✅ Respuestas automáticas inteligentes
- ✅ Gestión de conversaciones
- ✅ Plantillas de mensajes
- ✅ Recordatorios automáticos

## 🏗️ Stack Tecnológico

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Dashboard**: React 18, TypeScript, Material-UI, Vite
- **Backend**: Node.js 20, TypeScript, Express, MySQL 8, Redis 7
- **IA**: OpenAI GPT-4
- **WhatsApp**: Twilio API
- **DevOps**: Docker, Easypanel, GitHub Actions

## 🔐 Seguridad

- ✅ SSL/TLS automático (Let's Encrypt)
- ✅ Secrets únicos generados aleatoriamente
- ✅ Passwords hasheados con bcrypt
- ✅ JWT firmados
- ✅ CORS configurado
- ✅ Rate limiting
- ✅ Validación de firma de Twilio

## 📊 URLs de Producción

| Servicio | URL |
|----------|-----|
| Frontend | `https://tu-dominio.com` |
| Dashboard | `https://dashboard.tu-dominio.com` |
| API | `https://api.tu-dominio.com` |
| Webhook | `https://api.tu-dominio.com/api/v1/twilio/webhook/receive` |

## 🛠️ Scripts Útiles

```bash
# Generar secrets de producción
node generate-production-secrets.js

# Probar conexión con Twilio
node backend/test-twilio-connection.js
```

## 📦 Estructura del Proyecto

```
.
├── backend/                 # Backend API (Node.js + TypeScript)
├── dashboard/              # Dashboard Admin (React + MUI)
├── frontend/               # Frontend Web (Next.js)
├── docker-compose.yml              # Desarrollo local
├── docker-compose.production.yml   # Producción
└── generate-production-secrets.js  # Generador de secrets
```

## 🚀 Despliegue

1. **Generar secrets**: `node generate-production-secrets.js`
2. **Configurar Easypanel**: Seguir [DESPLIEGUE-RAPIDO.md](DESPLIEGUE-RAPIDO.md)
3. **Configurar DNS**: Apuntar dominios a Easypanel
4. **Configurar Twilio**: Webhook URL y credenciales
5. **¡Listo!**: Tu app en producción con SSL automático

## 📝 Licencia

Proyecto privado - Todos los derechos reservados

---

**¿Listo para desplegar?** 🚀

Lee: [LISTO-PARA-PRODUCCION.md](LISTO-PARA-PRODUCCION.md)
