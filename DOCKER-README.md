# 🐳 Docker - Inicio Rápido

## ⚡ Comandos Rápidos

### Iniciar todo el sistema
```powershell
# Windows PowerShell (recomendado)
.\docker-init.ps1

# Windows CMD
.\docker-init.bat

# Linux/Mac
./docker-init.sh
```

### Ver logs
```powershell
# Windows PowerShell
.\docker-logs.ps1

# Windows CMD
.\docker-logs.bat

# Linux/Mac
./docker-logs.sh
```

### Limpiar todo
```powershell
# Windows PowerShell
.\docker-clean.ps1

# Windows CMD
.\docker-clean.bat

# Linux/Mac
./docker-clean.sh
```

---

## 📍 URLs del Sistema

Una vez iniciado:
- 🔧 **Backend API:** http://localhost:3000
- 📊 **Dashboard:** http://localhost:5173
- 🌐 **Frontend:** http://localhost:3001

### Credenciales
- **Username:** admin
- **Password:** admin123

---

## 🛠️ Comandos Docker Compose

```bash
# Ver estado de servicios
docker-compose ps

# Ver logs en tiempo real
docker-compose logs -f

# Detener servicios
docker-compose stop

# Iniciar servicios detenidos
docker-compose start

# Reiniciar un servicio
docker-compose restart backend

# Detener y eliminar (mantiene datos)
docker-compose down

# Eliminar TODO incluyendo datos
docker-compose down -v
```

---

## 🔧 Ejecutar comandos en contenedores

```bash
# Backend - Ejecutar migraciones
docker-compose exec backend npm run migrate

# Backend - Ejecutar seeds
docker-compose exec backend npm run seed

# Backend - Ejecutar tests
docker-compose exec backend npm test

# MySQL - Acceder a CLI
docker-compose exec mysql mysql -u clinica_user -pclinica_pass clinica_belleza

# Redis - Acceder a CLI
docker-compose exec redis redis-cli
```

---

## 📖 Documentación Completa

- **[DOCKER-COMPLETO.md](DOCKER-COMPLETO.md)** - Guía completa de Docker
- **[DOCKER-SETUP.md](DOCKER-SETUP.md)** - Solo base de datos
- **[GUIA-EJECUCION-LOCAL.md](GUIA-EJECUCION-LOCAL.md)** - Ejecución sin Docker

---

## 🐛 Problemas Comunes

### Puerto ocupado
Si un puerto está ocupado, edita `docker-compose.yml`:
```yaml
backend:
  ports:
    - "3001:3000"  # Cambiar puerto local
```

### Contenedor no inicia
```bash
# Ver logs del servicio
docker-compose logs backend

# Reconstruir imagen
docker-compose build backend
docker-compose up -d backend
```

### Limpiar y empezar de cero
```bash
docker-compose down -v
./docker-init.bat  # o ./docker-init.sh
```

---

¡Listo! 🎉
