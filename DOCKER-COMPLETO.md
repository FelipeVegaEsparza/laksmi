# 🐳 Guía Completa - Todo en Docker

## 📦 ¿Qué incluye?

El sistema completo corriendo en Docker con 5 contenedores:
- ✅ **MySQL 8.0** - Base de datos (puerto 3306)
- ✅ **Redis 7** - Cache (puerto 6379)
- ✅ **Backend API** - Node.js + Express (puerto 3000)
- ✅ **Dashboard Admin** - React + Vite (puerto 5173)
- ✅ **Frontend Web** - Next.js (puerto 3001)

---

## 🚀 Inicio Rápido (Automático)

### Windows:
```bash
docker-init.bat
```

### Linux/Mac:
```bash
chmod +x docker-init.sh
./docker-init.sh
```

Esto hará **TODO automáticamente**:
1. Levanta MySQL y Redis
2. Espera a que estén listos
3. Ejecuta migraciones
4. Carga datos de ejemplo
5. Levanta backend, dashboard y frontend

⏱️ **Tiempo estimado:** 2-3 minutos

---

## 🛠️ Inicio Manual (Paso a Paso)

### 1️⃣ Construir las imágenes

```bash
docker-compose build
```

### 2️⃣ Levantar base de datos primero

```bash
docker-compose up -d mysql redis
```

### 3️⃣ Esperar a que estén listos (15-20 segundos)

```bash
docker-compose ps
```

Espera a ver `(healthy)` en ambos servicios.

### 4️⃣ Ejecutar migraciones

```bash
docker-compose run --rm backend npm run migrate
```

### 5️⃣ Cargar datos de ejemplo

```bash
docker-compose run --rm backend npm run seed
```

### 6️⃣ Levantar todas las aplicaciones

```bash
docker-compose up -d
```

### 7️⃣ Verificar que todo está corriendo

```bash
docker-compose ps
```

Deberías ver 5 contenedores corriendo:
```
NAME                          STATUS
clinica-belleza-mysql         Up (healthy)
clinica-belleza-redis         Up (healthy)
clinica-belleza-backend       Up
clinica-belleza-dashboard     Up
clinica-belleza-frontend      Up
```

---

## 🌐 Acceder al Sistema

| Servicio | URL | Descripción |
|----------|-----|-------------|
| 🔧 **Backend API** | http://localhost:3000 | API REST |
| 📊 **Dashboard** | http://localhost:5173 | Panel admin |
| 🌐 **Frontend** | http://localhost:3001 | Sitio público |
| 🗄️ **MySQL** | localhost:3306 | Base de datos |
| 🔴 **Redis** | localhost:6379 | Cache |

### Credenciales Dashboard:
- **Username:** admin
- **Password:** admin123

---

## 📋 Comandos Útiles

### Ver logs de todos los servicios
```bash
docker-compose logs -f
```

### Ver logs de un servicio específico
```bash
docker-compose logs -f backend
docker-compose logs -f dashboard
docker-compose logs -f frontend
docker-compose logs -f mysql
docker-compose logs -f redis
```

### Detener todos los servicios
```bash
docker-compose stop
```

### Iniciar servicios detenidos
```bash
docker-compose start
```

### Reiniciar un servicio específico
```bash
docker-compose restart backend
docker-compose restart dashboard
docker-compose restart frontend
```

### Detener y eliminar contenedores (mantiene datos)
```bash
docker-compose down
```

### Eliminar TODO incluyendo datos
```bash
docker-compose down -v
```

### Reconstruir un servicio
```bash
docker-compose build backend
docker-compose up -d backend
```

### Reconstruir todo desde cero
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

---

## 🔧 Ejecutar Comandos en Contenedores

### Backend
```bash
# Ejecutar migraciones
docker-compose exec backend npm run migrate

# Ejecutar seeds
docker-compose exec backend npm run seed

# Ejecutar tests
docker-compose exec backend npm test

# Acceder a la terminal
docker-compose exec backend sh
```

### Dashboard
```bash
# Ejecutar tests
docker-compose exec dashboard npm test

# Acceder a la terminal
docker-compose exec dashboard sh
```

### Frontend
```bash
# Ejecutar build
docker-compose exec frontend npm run build

# Acceder a la terminal
docker-compose exec frontend sh
```

### MySQL
```bash
# Acceder a MySQL CLI
docker-compose exec mysql mysql -u clinica_user -pclinica_pass clinica_belleza

# Como root
docker-compose exec mysql mysql -u root -proot123
```

### Redis
```bash
# Acceder a Redis CLI
docker-compose exec redis redis-cli

# Ver todas las claves
docker-compose exec redis redis-cli KEYS '*'
```

---

## 🔄 Desarrollo con Hot Reload

Los contenedores están configurados con **volúmenes** para hot reload:

### Backend
```bash
# Edita archivos en ./backend/src/
# Los cambios se reflejan automáticamente (nodemon)
```

### Dashboard
```bash
# Edita archivos en ./dashboard/src/
# Los cambios se reflejan automáticamente (Vite HMR)
```

### Frontend
```bash
# Edita archivos en ./frontend/src/
# Los cambios se reflejan automáticamente (Next.js Fast Refresh)
```

---

## 📊 Monitoreo

### Ver uso de recursos
```bash
docker stats
```

### Ver procesos en un contenedor
```bash
docker-compose top backend
```

### Inspeccionar un contenedor
```bash
docker-compose exec backend ps aux
```

---

## 🔄 Backup y Restore

### Backup de MySQL
```bash
docker-compose exec mysql mysqldump -u clinica_user -pclinica_pass clinica_belleza > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore de MySQL
```bash
docker-compose exec -T mysql mysql -u clinica_user -pclinica_pass clinica_belleza < backup.sql
```

### Backup de Redis
```bash
docker-compose exec redis redis-cli SAVE
docker cp clinica-belleza-redis:/data/dump.rdb ./redis_backup.rdb
```

---

## 🐛 Solución de Problemas

### ❌ Error: "Port already in use"

**Solución:** Cambiar puertos en `docker-compose.yml`

```yaml
backend:
  ports:
    - "3001:3000"  # Usar puerto 3001 en tu máquina
```

### ❌ Los contenedores se reinician constantemente

```bash
# Ver logs para identificar el error
docker-compose logs backend

# Posibles causas:
# 1. Error en el código
# 2. Dependencias no instaladas
# 3. Variables de entorno incorrectas
```

### ❌ Error: "Cannot connect to MySQL"

```bash
# Verificar que MySQL está healthy
docker-compose ps

# Ver logs de MySQL
docker-compose logs mysql

# Reiniciar MySQL
docker-compose restart mysql
```

### ❌ Cambios en el código no se reflejan

```bash
# Reconstruir la imagen
docker-compose build backend
docker-compose up -d backend
```

### ❌ Error de permisos en Windows

```bash
# Ejecutar PowerShell como administrador
# O configurar Docker Desktop para compartir drives
```

### ❌ Contenedor se queda "Starting"

```bash
# Ver logs detallados
docker-compose logs -f nombre_servicio

# Verificar dependencias
docker-compose ps

# Reiniciar desde cero
docker-compose down -v
docker-compose up -d
```

---

## 🔍 Debugging

### Acceder a un contenedor
```bash
docker-compose exec backend sh
```

### Ver variables de entorno
```bash
docker-compose exec backend env
```

### Ver archivos en el contenedor
```bash
docker-compose exec backend ls -la
docker-compose exec backend cat package.json
```

### Ejecutar comandos personalizados
```bash
docker-compose exec backend node -v
docker-compose exec backend npm list
```

---

## 🚀 Producción

Para producción, crea un `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    environment:
      NODE_ENV: production
    command: npm start
    # ... resto de configuración
```

Y ejecuta:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📝 Flujo de Trabajo Completo

### Primera vez:
```bash
# 1. Construir imágenes
docker-compose build

# 2. Iniciar sistema
./docker-init.bat  # Windows
./docker-init.sh   # Linux/Mac

# 3. Acceder a http://localhost:5173
```

### Día a día:
```bash
# Iniciar
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener
docker-compose stop
```

### Reiniciar desde cero:
```bash
# Eliminar todo
docker-compose down -v

# Iniciar de nuevo
./docker-init.bat  # Windows
./docker-init.sh   # Linux/Mac
```

---

## 🎯 Ventajas de Docker

✅ **Entorno consistente** - Mismo setup para todos
✅ **Fácil de limpiar** - `docker-compose down -v`
✅ **No contamina tu sistema** - Todo aislado
✅ **Fácil de escalar** - Agregar servicios es simple
✅ **Portabilidad** - Funciona igual en Windows/Mac/Linux
✅ **Desarrollo rápido** - Hot reload en todos los servicios

---

## 📊 Arquitectura Docker

```
┌─────────────────────────────────────────────────────┐
│                  Docker Network                      │
│                 (clinica-network)                    │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ Frontend │  │Dashboard │  │ Backend  │         │
│  │  :3001   │  │  :5173   │  │  :3000   │         │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘         │
│       │             │              │                │
│       └─────────────┴──────────────┘                │
│                     │                               │
│       ┌─────────────┴─────────────┐                │
│       │                           │                │
│  ┌────┴─────┐              ┌─────┴────┐           │
│  │  MySQL   │              │  Redis   │           │
│  │  :3306   │              │  :6379   │           │
│  └──────────┘              └──────────┘           │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 🔐 Seguridad

### Cambiar credenciales en producción:

Edita `docker-compose.yml`:
```yaml
environment:
  JWT_SECRET: tu-secreto-super-seguro-aqui
  DB_PASSWORD: password-seguro-aqui
  ENCRYPTION_KEY: clave-256-bits-segura
```

O mejor, usa un archivo `.env`:
```bash
# .env
JWT_SECRET=tu-secreto-super-seguro
DB_PASSWORD=password-seguro
```

Y en `docker-compose.yml`:
```yaml
environment:
  JWT_SECRET: ${JWT_SECRET}
  DB_PASSWORD: ${DB_PASSWORD}
```

---

¡Listo! 🎉 Ahora tienes todo el sistema corriendo en Docker con un solo comando.
