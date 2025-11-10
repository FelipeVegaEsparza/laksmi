# 📚 Índice de Documentación

## 🚀 Para Empezar

| Archivo | Descripción | Para quién |
|---------|-------------|------------|
| **[COMO-EMPEZAR.md](COMO-EMPEZAR.md)** | 🎯 Guía visual para elegir tu método | **EMPIEZA AQUÍ** |
| **[INICIO-RAPIDO.md](INICIO-RAPIDO.md)** | ⚡ Inicio rápido con Docker | Principiantes |
| **[RESUMEN-DOCKER.txt](RESUMEN-DOCKER.txt)** | 📋 Resumen visual de Docker | Referencia rápida |

---

## 🐳 Documentación Docker

| Archivo | Descripción | Nivel |
|---------|-------------|-------|
| **[DOCKER-README.md](DOCKER-README.md)** | 🐳 Comandos esenciales Docker | Básico |
| **[DOCKER-COMPLETO.md](DOCKER-COMPLETO.md)** | 🐳 Guía completa de Docker | Avanzado |
| **[DOCKER-SETUP.md](DOCKER-SETUP.md)** | 🐳 Solo base de datos en Docker | Intermedio |

---

## 💻 Documentación Sin Docker

| Archivo | Descripción | Nivel |
|---------|-------------|-------|
| **[GUIA-EJECUCION-LOCAL.md](GUIA-EJECUCION-LOCAL.md)** | 💻 Ejecución manual completa | Intermedio |
| **[README.md](README.md)** | 📖 Documentación general del proyecto | Todos |

---

## 🛠️ Scripts Disponibles

### Windows PowerShell (.ps1) - Recomendado
| Script | Descripción |
|--------|-------------|
| `.\docker-init.ps1` | 🚀 Iniciar todo el sistema con Docker |
| `.\docker-logs.ps1` | 📋 Ver logs de servicios |
| `.\docker-clean.ps1` | 🧹 Limpiar todo y empezar de cero |

### Windows CMD (.bat)
| Script | Descripción |
|--------|-------------|
| `.\docker-init.bat` | 🚀 Iniciar todo el sistema con Docker |
| `.\docker-logs.bat` | 📋 Ver logs de servicios |
| `.\docker-clean.bat` | 🧹 Limpiar todo y empezar de cero |

### Linux/Mac (.sh)
| Script | Descripción |
|--------|-------------|
| `./docker-init.sh` | 🚀 Iniciar todo el sistema con Docker |
| `./docker-logs.sh` | 📋 Ver logs de servicios |
| `./docker-clean.sh` | 🧹 Limpiar todo y empezar de cero |

---

## 📁 Archivos de Configuración

| Archivo | Descripción |
|---------|-------------|
| `docker-compose.yml` | Configuración de todos los contenedores |
| `backend/Dockerfile` | Imagen Docker del backend |
| `dashboard/Dockerfile` | Imagen Docker del dashboard |
| `frontend/Dockerfile` | Imagen Docker del frontend |
| `.env.docker.example` | Ejemplo de variables de entorno para Docker |
| `backend/.env.example` | Ejemplo de variables de entorno del backend |

---

## 🎯 Guía de Lectura Recomendada

### 👶 Si eres principiante:
```
1. COMO-EMPEZAR.md          → Elige tu método
2. INICIO-RAPIDO.md         → Ejecuta el sistema
3. DOCKER-README.md         → Aprende comandos básicos
4. README.md                → Entiende el proyecto
```

### 👨‍💻 Si tienes experiencia:
```
1. DOCKER-COMPLETO.md       → Setup completo con Docker
2. README.md                → Arquitectura del sistema
3. GUIA-EJECUCION-LOCAL.md  → Alternativa sin Docker
```

### 🔧 Si solo quieres la base de datos:
```
1. DOCKER-SETUP.md          → MySQL + Redis en Docker
2. GUIA-EJECUCION-LOCAL.md  → Ejecutar apps localmente
```

---

## 🔍 Búsqueda Rápida

### ¿Cómo...?

| Pregunta | Respuesta en |
|----------|--------------|
| ¿Cómo empiezo? | [COMO-EMPEZAR.md](COMO-EMPEZAR.md) |
| ¿Cómo uso Docker? | [DOCKER-README.md](DOCKER-README.md) |
| ¿Cómo veo los logs? | [DOCKER-COMPLETO.md](DOCKER-COMPLETO.md) → Sección "Comandos Útiles" |
| ¿Cómo limpio todo? | Ejecuta `docker-clean.bat` o `docker-clean.sh` |
| ¿Cómo ejecuto sin Docker? | [GUIA-EJECUCION-LOCAL.md](GUIA-EJECUCION-LOCAL.md) |
| ¿Cómo configuro MySQL? | [DOCKER-SETUP.md](DOCKER-SETUP.md) o [GUIA-EJECUCION-LOCAL.md](GUIA-EJECUCION-LOCAL.md) |
| ¿Cómo hago backup? | [DOCKER-COMPLETO.md](DOCKER-COMPLETO.md) → Sección "Backup y Restore" |
| ¿Cómo soluciono errores? | [DOCKER-COMPLETO.md](DOCKER-COMPLETO.md) → Sección "Solución de Problemas" |

---

## 📊 Estructura del Proyecto

```
sistema-gestion-clinica-belleza/
│
├── 📚 DOCUMENTACIÓN
│   ├── COMO-EMPEZAR.md              ← EMPIEZA AQUÍ
│   ├── INICIO-RAPIDO.md
│   ├── RESUMEN-DOCKER.txt
│   ├── DOCKER-README.md
│   ├── DOCKER-COMPLETO.md
│   ├── DOCKER-SETUP.md
│   ├── GUIA-EJECUCION-LOCAL.md
│   ├── README.md
│   └── INDICE-DOCUMENTACION.md      ← ESTÁS AQUÍ
│
├── 🐳 DOCKER
│   ├── docker-compose.yml
│   ├── docker-init.bat / .sh
│   ├── docker-logs.bat / .sh
│   ├── docker-clean.bat / .sh
│   └── .env.docker.example
│
├── 🔧 BACKEND (Node.js + Express)
│   ├── src/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── .env.example
│   └── package.json
│
├── 📊 DASHBOARD (React + Vite)
│   ├── src/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── .env
│   └── package.json
│
├── 🌐 FRONTEND (Next.js)
│   ├── src/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── .env.local
│   └── package.json
│
└── package.json
```

---

## 🎓 Recursos Adicionales

### Documentación Oficial
- [Docker](https://docs.docker.com/)
- [Node.js](https://nodejs.org/docs/)
- [Next.js](https://nextjs.org/docs)
- [React](https://react.dev/)
- [MySQL](https://dev.mysql.com/doc/)
- [Redis](https://redis.io/docs/)

### Dentro del Proyecto
- `backend/docs/` - Documentación técnica del backend
- `backend/README.md` - Detalles del backend
- `dashboard/README.md` - Detalles del dashboard
- `frontend/README.md` - Detalles del frontend

---

## 💡 Consejos

### Para Desarrollo
1. Usa Docker para un setup rápido
2. Lee [DOCKER-README.md](DOCKER-README.md) para comandos diarios
3. Mantén los logs abiertos: `docker-compose logs -f`

### Para Producción
1. Lee [DOCKER-COMPLETO.md](DOCKER-COMPLETO.md) → Sección "Producción"
2. Cambia todas las claves secretas
3. Configura backups automáticos
4. Usa HTTPS

### Para Debugging
1. Revisa [DOCKER-COMPLETO.md](DOCKER-COMPLETO.md) → Sección "Debugging"
2. Usa `docker-compose logs -f nombre_servicio`
3. Accede al contenedor: `docker-compose exec nombre_servicio sh`

---

## 🆘 Soporte

### ¿Problemas?
1. Revisa [DOCKER-COMPLETO.md](DOCKER-COMPLETO.md) → "Solución de Problemas"
2. Ejecuta `docker-compose logs -f` para ver errores
3. Intenta limpiar y reiniciar: `docker-clean.bat` → `docker-init.bat`

### ¿Preguntas?
- Revisa este índice para encontrar la documentación relevante
- Lee la sección de FAQ en cada documento
- Revisa los logs para más detalles

---

## 🔄 Actualizaciones

Este índice se actualiza cuando:
- Se agrega nueva documentación
- Se crean nuevos scripts
- Se modifican archivos importantes

**Última actualización:** Noviembre 2024

---

¡Feliz desarrollo! 🚀
