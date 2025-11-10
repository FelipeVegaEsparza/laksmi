# 🐳 Configuración con Docker - Base de Datos

## 📦 ¿Qué incluye?

El archivo `docker-compose.yml` levanta automáticamente:
- ✅ **MySQL 8.0** en puerto 3306
- ✅ **Redis 7** en puerto 6379

## 🚀 Inicio Rápido

### 1️⃣ Levantar los servicios

```bash
# Desde la raíz del proyecto
docker-compose up -d
```

Esto iniciará MySQL y Redis en segundo plano.

### 2️⃣ Verificar que están corriendo

```bash
docker-compose ps
```

Deberías ver:
```
NAME                      STATUS
clinica-belleza-mysql     Up (healthy)
clinica-belleza-redis     Up (healthy)
```

### 3️⃣ Configurar el backend

El archivo `backend/.env` ya está configurado con las credenciales correctas:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=clinica_belleza
DB_USER=clinica_user
DB_PASSWORD=clinica_pass

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

### 4️⃣ Ejecutar migraciones

```bash
cd backend
npm run migrate
npm run seed
```

### 5️⃣ Iniciar el sistema

```bash
# Desde la raíz
npm run dev
```

---

## 🛠️ Comandos Útiles

### Ver logs de los contenedores
```bash
# Todos los logs
docker-compose logs -f

# Solo MySQL
docker-compose logs -f mysql

# Solo Redis
docker-compose logs -f redis
```

### Detener los servicios
```bash
docker-compose stop
```

### Iniciar los servicios detenidos
```bash
docker-compose start
```

### Detener y eliminar contenedores (mantiene los datos)
```bash
docker-compose down
```

### Eliminar TODO (incluyendo datos)
```bash
docker-compose down -v
```

### Reiniciar un servicio específico
```bash
docker-compose restart mysql
docker-compose restart redis
```

---

## 🔧 Acceso Directo a MySQL

### Desde la línea de comandos
```bash
docker exec -it clinica-belleza-mysql mysql -u clinica_user -pclinica_pass clinica_belleza
```

### Con herramientas GUI
Puedes conectarte con MySQL Workbench, DBeaver, etc:
- **Host:** localhost
- **Puerto:** 3306
- **Usuario:** clinica_user
- **Contraseña:** clinica_pass
- **Base de datos:** clinica_belleza

### Usuario root (si lo necesitas)
```bash
docker exec -it clinica-belleza-mysql mysql -u root -proot123
```

---

## 🔴 Acceso a Redis

### Redis CLI
```bash
docker exec -it clinica-belleza-redis redis-cli
```

Comandos útiles dentro de Redis:
```redis
PING                    # Verificar conexión
KEYS *                  # Ver todas las claves
GET nombre_clave        # Obtener valor
FLUSHALL               # Limpiar todo (¡cuidado!)
```

---

## 📊 Credenciales

### MySQL
| Campo | Valor |
|-------|-------|
| Host | localhost |
| Puerto | 3306 |
| Base de datos | clinica_belleza |
| Usuario | clinica_user |
| Contraseña | clinica_pass |
| Usuario root | root |
| Contraseña root | root123 |

### Redis
| Campo | Valor |
|-------|-------|
| Host | localhost |
| Puerto | 6379 |
| Contraseña | (sin contraseña) |

---

## 🔄 Backup y Restore

### Hacer backup de MySQL
```bash
docker exec clinica-belleza-mysql mysqldump -u clinica_user -pclinica_pass clinica_belleza > backup.sql
```

### Restaurar backup
```bash
docker exec -i clinica-belleza-mysql mysql -u clinica_user -pclinica_pass clinica_belleza < backup.sql
```

---

## 🐛 Solución de Problemas

### ❌ Error: "Port 3306 already in use"
**Causa:** Ya tienes MySQL corriendo en tu máquina

**Solución 1:** Detener tu MySQL local
```bash
# Windows
net stop MySQL80

# O cambiar el puerto en docker-compose.yml
ports:
  - "3307:3306"  # Usar puerto 3307 en tu máquina
```

Luego actualiza `backend/.env`:
```env
DB_PORT=3307
```

### ❌ Error: "Port 6379 already in use"
**Causa:** Ya tienes Redis corriendo

**Solución:** Cambiar el puerto en docker-compose.yml
```yaml
redis:
  ports:
    - "6380:6379"
```

Y en `backend/.env`:
```env
REDIS_PORT=6380
```

### ❌ Los contenedores no inician
```bash
# Ver logs detallados
docker-compose logs

# Eliminar y recrear
docker-compose down -v
docker-compose up -d
```

### ❌ Error de conexión desde el backend
**Verifica:**
1. Los contenedores están corriendo: `docker-compose ps`
2. Las credenciales en `backend/.env` son correctas
3. El puerto no está bloqueado por firewall

---

## 🎯 Ventajas de usar Docker

✅ **No necesitas instalar MySQL ni Redis** en tu máquina
✅ **Configuración consistente** entre desarrolladores
✅ **Fácil de limpiar** y empezar de cero
✅ **Aislamiento** - no afecta otras instalaciones
✅ **Mismo entorno** en desarrollo y producción

---

## 📝 Flujo de Trabajo Completo

```bash
# 1. Levantar base de datos
docker-compose up -d

# 2. Esperar a que estén healthy (10-20 segundos)
docker-compose ps

# 3. Configurar backend
cd backend
npm install

# 4. Ejecutar migraciones
npm run migrate
npm run seed

# 5. Iniciar todo el sistema
cd ..
npm run dev
```

---

## 🔄 Reiniciar desde Cero

Si quieres empezar de nuevo con la base de datos limpia:

```bash
# 1. Detener y eliminar todo (incluyendo datos)
docker-compose down -v

# 2. Levantar de nuevo
docker-compose up -d

# 3. Esperar a que estén healthy
docker-compose ps

# 4. Ejecutar migraciones y seeds
cd backend
npm run migrate
npm run seed
```

---

¡Listo! 🎉 Ahora tienes MySQL y Redis corriendo en Docker sin necesidad de instalarlos en tu sistema.
