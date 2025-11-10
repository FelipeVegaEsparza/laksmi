# 🎯 Cómo Empezar - Guía Visual

## 🐳 Opción 1: Docker (Recomendado)

### ¿Por qué Docker?
- ✅ **Más fácil**: Un solo comando para todo
- ✅ **Sin instalaciones**: No necesitas MySQL, Redis, Node.js
- ✅ **Limpio**: Todo aislado en contenedores
- ✅ **Rápido**: 2-3 minutos y está listo

### Pasos:

```
┌─────────────────────────────────────────────────────────┐
│  PASO 1: Instalar Docker Desktop                        │
│  https://www.docker.com/products/docker-desktop         │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  PASO 2: Abrir terminal en la carpeta del proyecto      │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  PASO 3: Ejecutar el script de inicio                   │
│                                                          │
│  Windows PowerShell:                                     │
│  > .\docker-init.ps1                                     │
│                                                          │
│  Windows CMD:                                            │
│  > .\docker-init.bat                                     │
│                                                          │
│  Linux/Mac:                                              │
│  $ chmod +x docker-init.sh                               │
│  $ ./docker-init.sh                                      │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  PASO 4: Esperar 2-3 minutos                            │
│  (El script hace todo automáticamente)                  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  PASO 5: Abrir el navegador                             │
│  http://localhost:5173                                   │
│                                                          │
│  Login:                                                  │
│  Email:    admin@clinica.com                             │
│  Password: Admin123!                                     │
└─────────────────────────────────────────────────────────┘
                          ↓
                    ¡LISTO! 🎉
```

---

## 💻 Opción 2: Sin Docker (Manual)

### ¿Cuándo usar esta opción?
- Si no puedes instalar Docker
- Si prefieres tener control total
- Si ya tienes MySQL y Node.js instalados

### Pasos:

```
┌─────────────────────────────────────────────────────────┐
│  PASO 1: Instalar requisitos                            │
│  - Node.js 18+                                           │
│  - MySQL 8.0+                                            │
│  - Redis (opcional)                                      │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  PASO 2: Instalar dependencias                          │
│  > npm install                                           │
│  > cd backend && npm install                             │
│  > cd ../dashboard && npm install                        │
│  > cd ../frontend && npm install                         │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  PASO 3: Crear base de datos                            │
│  > mysql -u root -p                                      │
│  mysql> CREATE DATABASE clinica_belleza                  │
│         CHARACTER SET utf8mb4                            │
│         COLLATE utf8mb4_unicode_ci;                      │
│  mysql> EXIT;                                            │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  PASO 4: Configurar backend                             │
│  > cd backend                                            │
│  > copy .env.example .env                                │
│  > notepad .env                                          │
│  (Editar credenciales de MySQL)                         │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  PASO 5: Ejecutar migraciones                           │
│  > cd backend                                            │
│  > npm run migrate                                       │
│  > npm run seed                                          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  PASO 6: Iniciar el sistema                             │
│  > cd ..                                                 │
│  > npm run dev                                           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  PASO 7: Abrir el navegador                             │
│  http://localhost:5173                                   │
│                                                          │
│  Login:                                                  │
│  Email:    admin@clinica.com                             │
│  Password: Admin123!                                     │
└─────────────────────────────────────────────────────────┘
                          ↓
                    ¡LISTO! 🎉
```

---

## 📊 Comparación

| Característica | Docker 🐳 | Manual 💻 |
|----------------|-----------|-----------|
| **Tiempo de setup** | 2-3 minutos | 15-30 minutos |
| **Instalaciones necesarias** | Solo Docker | Node.js, MySQL, Redis |
| **Dificultad** | ⭐ Fácil | ⭐⭐⭐ Media |
| **Limpieza** | Un comando | Manual |
| **Portabilidad** | ✅ Total | ❌ Depende del sistema |
| **Recomendado para** | Principiantes | Desarrolladores avanzados |

---

## 🎯 ¿Cuál elegir?

### Elige Docker si:
- ✅ Es tu primera vez con el proyecto
- ✅ Quieres empezar rápido
- ✅ No quieres instalar MySQL/Redis
- ✅ Trabajas en equipo (mismo entorno para todos)

### Elige Manual si:
- ✅ Ya tienes MySQL y Node.js instalados
- ✅ Prefieres control total
- ✅ No puedes usar Docker
- ✅ Quieres entender cada componente

---

## 📚 Documentación por Opción

### Si elegiste Docker:
1. **[INICIO-RAPIDO.md](INICIO-RAPIDO.md)** - Empieza aquí
2. **[DOCKER-README.md](DOCKER-README.md)** - Comandos esenciales
3. **[DOCKER-COMPLETO.md](DOCKER-COMPLETO.md)** - Guía completa

### Si elegiste Manual:
1. **[GUIA-EJECUCION-LOCAL.md](GUIA-EJECUCION-LOCAL.md)** - Guía completa
2. **[README.md](README.md)** - Documentación general

---

## 🆘 ¿Necesitas Ayuda?

### Docker:
```bash
# Ver logs
docker-compose logs -f

# Ver estado
docker-compose ps

# Reiniciar
docker-compose restart

# Limpiar todo
docker-clean.bat  # o docker-clean.sh
```

### Manual:
```bash
# Ver logs del backend
cd backend
npm run dev

# Verificar MySQL
mysql -u root -p -e "SHOW DATABASES;"

# Verificar Redis
redis-cli ping
```

---

## 🎉 Próximos Pasos

Una vez que el sistema esté corriendo:

1. **Explora el Dashboard** (http://localhost:5173)
   - Gestión de servicios
   - Gestión de productos
   - Gestión de citas
   - Gestión de clientes

2. **Prueba el Frontend** (http://localhost:3001)
   - Reserva de citas
   - Chat con IA
   - Catálogo de servicios

3. **Revisa la API** (http://localhost:3000)
   - Endpoints disponibles
   - Documentación

4. **Lee la documentación**
   - Arquitectura del sistema
   - Guías de desarrollo
   - Mejores prácticas

---

¡Bienvenido al Sistema de Gestión de Clínica de Belleza! 🎊
