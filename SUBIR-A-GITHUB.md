# 📤 Guía para Subir el Proyecto a GitHub

## ✅ Estado Actual

- ✅ Git inicializado
- ✅ Commit inicial creado
- ✅ 399 archivos listos para subir

---

## 🚀 Pasos para Subir a GitHub

### 1. Crear Repositorio en GitHub

1. Ve a https://github.com/
2. Click en el botón **"+"** (arriba derecha) → **"New repository"**
3. Completa:
   - **Repository name**: `laxmi-beauty-clinic` (o el nombre que prefieras)
   - **Description**: `Sistema completo de gestión para clínica de belleza con WhatsApp Business, IA y Dashboard`
   - **Visibility**: **Private** (recomendado) o Public
   - **NO marques** "Initialize this repository with a README"
   - **NO agregues** .gitignore ni license (ya los tenemos)
4. Click en **"Create repository"**

### 2. Conectar tu Repositorio Local con GitHub

GitHub te mostrará instrucciones. Usa estas:

```bash
# Agregar el remote de GitHub (CAMBIA la URL por la tuya)
git remote add origin https://github.com/TU-USUARIO/laxmi-beauty-clinic.git

# Cambiar el nombre de la rama a 'main' (si es necesario)
git branch -M main

# Subir el código a GitHub
git push -u origin main
```

**Ejemplo con URL real:**
```bash
git remote add origin https://github.com/tu-usuario/laxmi-beauty-clinic.git
git branch -M main
git push -u origin main
```

### 3. Autenticación

GitHub te pedirá autenticación. Tienes dos opciones:

#### Opción A: Personal Access Token (Recomendado)

1. Ve a GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click en "Generate new token (classic)"
3. Nombre: `Laxmi Project`
4. Selecciona: `repo` (todos los permisos de repositorio)
5. Click en "Generate token"
6. **COPIA EL TOKEN** (solo se muestra una vez)
7. Cuando Git pida password, pega el token

#### Opción B: GitHub CLI

```bash
# Instalar GitHub CLI
winget install GitHub.cli

# Autenticar
gh auth login

# Seguir las instrucciones
```

---

## 📋 Comandos Completos (Copia y Pega)

```bash
# 1. Agregar remote (CAMBIA LA URL)
git remote add origin https://github.com/TU-USUARIO/TU-REPO.git

# 2. Verificar que se agregó correctamente
git remote -v

# 3. Cambiar a rama main
git branch -M main

# 4. Subir a GitHub
git push -u origin main
```

---

## ✅ Verificación

Después de hacer push, verifica:

1. Ve a tu repositorio en GitHub
2. Deberías ver todos los archivos
3. El README.md se mostrará en la página principal
4. Verás el commit: "Initial commit: Sistema completo..."

---

## 🔐 Configurar Secrets en GitHub (Para CI/CD futuro)

Si quieres configurar GitHub Actions más adelante:

1. Ve a tu repositorio en GitHub
2. Settings → Secrets and variables → Actions
3. Click en "New repository secret"
4. Agrega los secrets necesarios (los generarás con `generate-production-secrets.js`)

---

## 📝 Próximos Pasos Después de Subir

### 1. Configurar Easypanel

Ahora que está en GitHub, puedes:

1. Ir a Easypanel
2. Crear nuevo proyecto
3. Conectar con GitHub
4. Seleccionar tu repositorio
5. Seguir [DESPLIEGUE-RAPIDO.md](DESPLIEGUE-RAPIDO.md)

### 2. Proteger la Rama Main

En GitHub:
1. Settings → Branches
2. Add rule para `main`
3. Marcar "Require pull request reviews before merging"

### 3. Agregar Colaboradores (Opcional)

1. Settings → Collaborators
2. Add people
3. Invitar por email o username

---

## 🐛 Problemas Comunes

### Error: "remote origin already exists"

```bash
# Eliminar el remote existente
git remote remove origin

# Agregar de nuevo
git remote add origin https://github.com/TU-USUARIO/TU-REPO.git
```

### Error: "Authentication failed"

- Asegúrate de usar un Personal Access Token, no tu password
- El token debe tener permisos de `repo`
- Copia el token completo sin espacios

### Error: "Permission denied"

- Verifica que el repositorio sea tuyo o tengas permisos
- Verifica que la URL sea correcta

---

## 📊 Estructura del Repositorio en GitHub

Después de subir, tu repositorio tendrá:

```
laxmi-beauty-clinic/
├── README.md                          ← Se muestra en la página principal
├── backend/                           ← Backend API
├── dashboard/                         ← Dashboard Admin
├── frontend/                          ← Frontend Web
├── docker-compose.production.yml      ← Para Easypanel
├── generate-production-secrets.js     ← Generador de secrets
├── LISTO-PARA-PRODUCCION.md          ← Guía principal
└── ... (más archivos)
```

---

## 🎉 ¡Listo!

Una vez que hayas subido el código a GitHub:

1. ✅ Tu código está respaldado en la nube
2. ✅ Puedes colaborar con otros
3. ✅ Puedes desplegar en Easypanel
4. ✅ Tienes historial de cambios
5. ✅ Puedes trabajar desde cualquier lugar

---

## 🚀 Siguiente Paso

**Desplegar en Easypanel:**

Lee: [DESPLIEGUE-RAPIDO.md](DESPLIEGUE-RAPIDO.md)

O ejecuta:
```bash
node generate-production-secrets.js
```

---

**¿Necesitas ayuda?**

- Documentación de GitHub: https://docs.github.com/
- Crear Personal Access Token: https://github.com/settings/tokens
- GitHub CLI: https://cli.github.com/
