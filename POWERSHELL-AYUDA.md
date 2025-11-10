# 💡 Ayuda para PowerShell

## ⚠️ Nota Importante

En PowerShell, para ejecutar scripts en el directorio actual, debes usar `.\` antes del nombre del archivo.

## ✅ Comandos Correctos

### Iniciar el sistema
```powershell
# ✅ CORRECTO
.\docker-init.ps1

# ❌ INCORRECTO
docker-init.ps1
```

### Ver logs
```powershell
# ✅ CORRECTO
.\docker-logs.ps1

# ❌ INCORRECTO
docker-logs.ps1
```

### Limpiar todo
```powershell
# ✅ CORRECTO
.\docker-clean.ps1

# ❌ INCORRECTO
docker-clean.ps1
```

---

## 🔒 Error de Política de Ejecución

Si ves este error:
```
.\docker-init.ps1 : No se puede cargar el archivo porque la ejecución de scripts está deshabilitada en este sistema.
```

### Solución:

**Opción 1: Permitir solo este script (Recomendado)**
```powershell
powershell -ExecutionPolicy Bypass -File .\docker-init.ps1
```

**Opción 2: Cambiar política temporalmente**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
.\docker-init.ps1
```

**Opción 3: Usar los archivos .bat en su lugar**
```cmd
.\docker-init.bat
```

---

## 🎯 Comandos Rápidos

### Iniciar todo
```powershell
.\docker-init.ps1
```

### Ver estado
```powershell
docker-compose ps
```

### Ver logs
```powershell
.\docker-logs.ps1
# o directamente:
docker-compose logs -f
```

### Detener
```powershell
docker-compose stop
```

### Iniciar (si ya está configurado)
```powershell
docker-compose start
```

### Limpiar todo
```powershell
.\docker-clean.ps1
```

---

## 🔄 Alternativas

Si prefieres no usar scripts PowerShell, puedes:

### 1. Usar archivos .bat
```cmd
.\docker-init.bat
.\docker-logs.bat
.\docker-clean.bat
```

### 2. Usar comandos directos
```powershell
# Iniciar
docker-compose up -d mysql redis
Start-Sleep -Seconds 15
docker-compose run --rm backend npm run migrate
docker-compose run --rm backend npm run seed
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener
docker-compose down
```

---

## 📚 Más Información

- [DOCKER-README.md](DOCKER-README.md) - Comandos Docker esenciales
- [DOCKER-COMPLETO.md](DOCKER-COMPLETO.md) - Guía completa
- [INICIO-RAPIDO.md](INICIO-RAPIDO.md) - Inicio rápido

---

¡Listo! Ahora ya sabes cómo usar PowerShell con el proyecto. 🚀
