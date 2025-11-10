# 🚀 Guía de Ejecución Local - Sistema Clínica de Belleza

## 📋 Resumen del Proyecto

Este es un **sistema integral de gestión para clínica de belleza** con 3 componentes principales:

1. **Backend API** (Node.js + Express + TypeScript) - Puerto 3000
2. **Dashboard Admin** (React + Vite + Material-UI) - Puerto 5173
3. **Frontend Web** (Next.js 15) - Puerto 3001

### Características principales:
- 🤖 Agente IA para atención automatizada (OpenAI)
- 📱 Integración con WhatsApp vía Twilio
- 💬 Chat en tiempo real con Socket.IO
- 📊 Dashboard administrativo completo
- 🌐 Sitio web público con reservas online
- 🔒 Seguridad: JWT, rate limiting, GDPR compliance
- ⚡ Cache con Redis
- 📦 Base de datos MySQL

---

## 🛠️ Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:

### Obligatorios:
- ✅ **Node.js 18+** (recomendado 20.x)
- ✅ **MySQL 8.0+**
- ✅ **npm** o **yarn**

### Opcionales (pero recomendados):
- 🔴 **Redis** (para cache y rate limiting)
- 📱 **Cuenta Twilio** (para WhatsApp)
- 🤖 **API Key OpenAI** (para el agente IA)

---

## 📦 Instalación Paso a Paso

### 1️⃣ Instalar Dependencias Raíz

```bash
# Desde la raíz del proyecto
npm install
```

### 2️⃣ Configurar Backend

```bash
cd backend
npm install
```

**Crear archivo `.env`:**
```bash
# Copiar el ejemplo
copy .env.example .env

# Editar con tus configuraciones
notepad .env
```

**Configuración mínima del `.env`:**
```env
# Servidor
NODE_ENV=development
PORT=3000

# Base de datos MySQL
# Si usas Docker, usa estas credenciales:
DB_HOST=localhost
DB_PORT=3306
DB_NAME=clinica_belleza
DB_USER=clinica_user
DB_PASSWORD=clinica_pass

# Si usas MySQL local, usa tu usuario/password:
# DB_USER=root
# DB_PASSWORD=tu_password_mysql

# JWT (cambiar en producción)
JWT_SECRET=mi-super-secreto-jwt-2024
JWT_REFRESH_SECRET=mi-super-secreto-refresh-2024
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Redis (opcional - comentar si no tienes Redis)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# OpenAI (opcional - para el agente IA)
OPENAI_API_KEY=sk-tu-api-key-aqui
OPENAI_MODEL=gpt-4

# Twilio (opcional - para WhatsApp)
TWILIO_ACCOUNT_SID=tu-account-sid
TWILIO_AUTH_TOKEN=tu-auth-token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# URLs Frontend
FRONTEND_URL=http://localhost:3001
DASHBOARD_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:3001,http://localhost:5173

# Seguridad
BCRYPT_ROUNDS=12
ENCRYPTION_KEY=tu-clave-256-bits-aqui-cambiar-en-produccion
```

### 3️⃣ Configurar Base de Datos MySQL

#### Opción A: Con Docker (Recomendado) 🐳

```bash
# Levantar MySQL y Redis con Docker
docker-compose up -d

# Esperar 10-20 segundos y verificar
docker-compose ps
```

✅ **Ventajas:** No necesitas instalar MySQL ni Redis, todo está aislado y es fácil de limpiar.

📖 **Ver guía completa:** [DOCKER-SETUP.md](DOCKER-SETUP.md)

#### Opción B: MySQL Local

```bash
# Conectar a MySQL
mysql -u root -p

# Crear base de datos
CREATE DATABASE clinica_belleza CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

**Ejecutar migraciones:**
```bash
# Desde la carpeta backend
npm run migrate
```

**Cargar datos de ejemplo (opcional):**
```bash
npm run seed
```

Esto creará:
- ✅ Usuario admin (email: admin@clinica.com, password: Admin123!)
- ✅ Servicios de ejemplo
- ✅ Productos de ejemplo
- ✅ Clientes de ejemplo
- ✅ Profesionales de ejemplo

### 4️⃣ Configurar Dashboard

```bash
cd dashboard
npm install
```

El archivo `.env` ya existe con:
```env
VITE_API_URL=http://localhost:3000
VITE_NODE_ENV=development
```

### 5️⃣ Configurar Frontend

```bash
cd frontend
npm install
```

El archivo `.env.local` ya existe con:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_DASHBOARD_URL=http://localhost:5173
NODE_ENV=development
```

---

## 🚀 Ejecutar el Sistema

### Opción 1: Todo en Docker (Más Fácil) 🐳

**Un solo comando para levantar TODO:**

```bash
# Windows
docker-init.bat

# Linux/Mac
chmod +x docker-init.sh
./docker-init.sh
```

Esto levanta automáticamente:
- ✅ MySQL + Redis
- ✅ Backend en http://localhost:3000
- ✅ Dashboard en http://localhost:5173
- ✅ Frontend en http://localhost:3001

📖 **Ver guía completa:** [DOCKER-COMPLETO.md](DOCKER-COMPLETO.md)

### Opción 2: Ejecutar Todo Junto (Sin Docker)

Desde la **raíz del proyecto**:
```bash
npm run dev
```

Esto iniciará automáticamente:
- ✅ Backend en http://localhost:3000
- ✅ Dashboard en http://localhost:5173
- ✅ Frontend en http://localhost:3001

### Opción 3: Ejecutar Servicios Individuales

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Dashboard:**
```bash
cd dashboard
npm run dev
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
```

---

## 🌐 Acceder al Sistema

Una vez iniciado, puedes acceder a:

| Servicio | URL | Descripción |
|----------|-----|-------------|
| 🔧 **Backend API** | http://localhost:3000 | API REST |
| 📊 **Dashboard Admin** | http://localhost:5173 | Panel administrativo |
| 🌐 **Frontend Web** | http://localhost:3001 | Sitio público |
| 📚 **API Docs** | http://localhost:3000/api/v1 | Documentación API |

### Credenciales de Acceso

**Dashboard Admin:**
- Username: `admin`
- Password: `admin123`

---

## 🧪 Verificar que Todo Funciona

### 1. Verificar Backend
```bash
# Desde otra terminal
curl http://localhost:3000/api/v1/health
```

Deberías ver: `{"status":"ok","timestamp":"..."}`

### 2. Verificar Dashboard
Abre http://localhost:5173 y deberías ver la pantalla de login

### 3. Verificar Frontend
Abre http://localhost:3001 y deberías ver el sitio web público

---

## 🔧 Comandos Útiles

### Backend
```bash
cd backend

# Desarrollo
npm run dev              # Iniciar con hot-reload

# Base de datos
npm run migrate          # Aplicar migraciones
npm run migrate:rollback # Revertir última migración
npm run seed            # Cargar datos de ejemplo

# Testing
npm test                # Ejecutar tests
npm run test:watch      # Tests en modo watch
npm run test:coverage   # Tests con cobertura

# Producción
npm run build           # Compilar TypeScript
npm start              # Iniciar en producción
```

### Dashboard
```bash
cd dashboard

# Desarrollo
npm run dev             # Iniciar con Vite

# Testing
npm test               # Ejecutar tests
npm run test:watch     # Tests en modo watch

# Producción
npm run build          # Compilar para producción
npm run preview        # Preview de producción
```

### Frontend
```bash
cd frontend

# Desarrollo
npm run dev            # Iniciar con Next.js

# Producción
npm run build          # Compilar para producción
npm start             # Iniciar en producción

# Linting
npm run lint          # Verificar código
```

---

## 🐛 Solución de Problemas

### ❌ Error: "Cannot connect to MySQL"
**Solución:**
1. Verifica que MySQL esté corriendo
2. Verifica las credenciales en `backend/.env`
3. Verifica que la base de datos `clinica_belleza` exista

### ❌ Error: "Redis connection failed"
**Solución:**
Si no tienes Redis instalado, puedes:
1. Comentar las líneas de Redis en `backend/.env`
2. O instalar Redis: https://redis.io/download

### ❌ Error: "Port 3000 already in use"
**Solución:**
Cambia el puerto en `backend/.env`:
```env
PORT=3001
```

### ❌ Error: "Module not found"
**Solución:**
```bash
# Reinstalar dependencias
cd backend && npm install
cd ../dashboard && npm install
cd ../frontend && npm install
```

### ❌ Error en migraciones
**Solución:**
```bash
cd backend
npm run migrate:rollback
npm run migrate
```

---

## 📁 Estructura del Proyecto

```
sistema-gestion-clinica-belleza/
├── backend/                    # API REST (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── config/            # Configuraciones
│   │   ├── controllers/       # Controladores de rutas
│   │   ├── middleware/        # Middleware (auth, validación, etc)
│   │   ├── models/           # Modelos de datos
│   │   ├── routes/           # Definición de rutas
│   │   ├── services/         # Lógica de negocio
│   │   ├── database/         # Migraciones y seeds
│   │   └── utils/            # Utilidades
│   ├── uploads/              # Archivos subidos
│   ├── .env                  # Variables de entorno
│   └── package.json
│
├── dashboard/                 # Panel Admin (React + Vite + MUI)
│   ├── src/
│   │   ├── components/       # Componentes React
│   │   ├── pages/           # Páginas del dashboard
│   │   ├── services/        # Servicios API
│   │   ├── contexts/        # Context API
│   │   └── utils/           # Utilidades
│   ├── .env                 # Variables de entorno
│   └── package.json
│
├── frontend/                 # Web Pública (Next.js 15)
│   ├── src/
│   │   ├── app/            # App Router de Next.js
│   │   ├── components/     # Componentes React
│   │   ├── services/       # Servicios API
│   │   └── types/          # TypeScript types
│   ├── .env.local          # Variables de entorno
│   └── package.json
│
└── package.json             # Scripts principales
```

---

## 🔑 Endpoints Principales de la API

### Autenticación
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Renovar token
- `POST /api/v1/auth/logout` - Logout

### Gestión (requieren autenticación)
- `GET /api/v1/clients` - Listar clientes
- `GET /api/v1/services` - Listar servicios
- `GET /api/v1/products` - Listar productos
- `GET /api/v1/bookings` - Listar citas
- `GET /api/v1/professionals` - Listar profesionales

### Agente IA
- `POST /api/v1/ai/chat` - Chat web
- `POST /api/v1/ai/whatsapp/webhook` - Webhook WhatsApp

### Públicos (sin autenticación)
- `GET /api/v1/services/public` - Servicios públicos
- `POST /api/v1/bookings/public` - Crear reserva pública

---

## 📊 Base de Datos

### Tablas Principales:
- **users** - Usuarios del sistema (admin, staff)
- **clients** - Clientes de la clínica
- **services** - Servicios ofrecidos
- **products** - Inventario de productos
- **professionals** - Profesionales/empleados
- **bookings** - Citas/reservas
- **conversations** - Conversaciones del chat
- **messages** - Mensajes individuales
- **scheduled_notifications** - Notificaciones programadas
- **stock_movements** - Movimientos de inventario

---

## 🎯 Próximos Pasos

1. ✅ **Verificar que todo funciona** con los comandos de arriba
2. 🔐 **Cambiar credenciales** en producción
3. 🤖 **Configurar OpenAI** si quieres usar el agente IA
4. 📱 **Configurar Twilio** si quieres WhatsApp
5. 🔴 **Instalar Redis** para mejor rendimiento
6. 📝 **Revisar documentación** en `/backend/docs`

---

## 📞 Soporte

Si tienes problemas:
1. Revisa la sección "Solución de Problemas"
2. Verifica los logs en `backend/logs/`
3. Revisa la consola del navegador (F12)
4. Verifica que todos los servicios estén corriendo

---

## 📝 Notas Importantes

- ⚠️ **No uses en producción sin cambiar las claves secretas**
- ⚠️ **Redis es opcional pero recomendado para producción**
- ⚠️ **OpenAI y Twilio son opcionales** (el sistema funciona sin ellos)
- ✅ **El sistema funciona sin Redis** (con funcionalidad reducida)
- ✅ **Puedes usar solo el backend + dashboard** sin el frontend

---

¡Listo! 🎉 Ahora tienes todo lo necesario para ejecutar el sistema localmente.
