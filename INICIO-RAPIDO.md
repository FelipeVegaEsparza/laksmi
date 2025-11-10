# 🚀 Inicio Rápido - Sistema Clínica de Belleza

## ⚡ La Forma Más Rápida (Docker)

### 1️⃣ Requisitos
- ✅ Docker Desktop instalado
- ✅ Docker Compose instalado

### 2️⃣ Ejecutar

**Windows (PowerShell):**
```powershell
.\docker-init.ps1
```

**Windows (CMD):**
```cmd
.\docker-init.bat
```

**Linux/Mac:**
```bash
chmod +x docker-init.sh
./docker-init.sh
```

### 3️⃣ Acceder

Espera 2-3 minutos y abre:
- 📊 **Dashboard:** http://localhost:5173
  - Username: `admin`
  - Password: `admin123`
- 🌐 **Frontend:** http://localhost:3001
- 🔧 **API:** http://localhost:3000

---

## 📚 Documentación

| Archivo | Descripción |
|---------|-------------|
| **[DOCKER-README.md](DOCKER-README.md)** | 🐳 Comandos rápidos Docker |
| **[DOCKER-COMPLETO.md](DOCKER-COMPLETO.md)** | 🐳 Guía completa Docker |
| **[DOCKER-SETUP.md](DOCKER-SETUP.md)** | 🐳 Solo base de datos |
| **[GUIA-EJECUCION-LOCAL.md](GUIA-EJECUCION-LOCAL.md)** | 💻 Sin Docker |
| **[README.md](README.md)** | 📖 Documentación general |

---

## 🛠️ Scripts Disponibles

### Windows (.bat)
- `docker-init.bat` - Iniciar todo el sistema
- `docker-logs.bat` - Ver logs
- `docker-clean.bat` - Limpiar todo

### Linux/Mac (.sh)
- `docker-init.sh` - Iniciar todo el sistema
- `docker-logs.sh` - Ver logs
- `docker-clean.sh` - Limpiar todo

---

## 🎯 Próximos Pasos

1. ✅ Ejecuta `docker-init.bat` (o `.sh`)
2. ✅ Espera 2-3 minutos
3. ✅ Abre http://localhost:5173
4. ✅ Login con admin / admin123
5. ✅ ¡Empieza a usar el sistema!

---

## 🐛 ¿Problemas?

```bash
# Ver logs
docker-compose logs -f

# Reiniciar todo
docker-compose restart

# Limpiar y empezar de cero
docker-clean.bat  # o docker-clean.sh
```

---

¡Eso es todo! 🎉
