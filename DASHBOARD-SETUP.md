# 🎨 Dashboard - Sistema de Gestión de Clínica de Belleza

## 🚀 Inicio Rápido

### 1. Verificar que el sistema esté funcionando
```bash
# Desde la raíz del proyecto
node start-system.js
```

### 2. Si necesitas iniciar los servicios manualmente:

#### Backend (Terminal 1):
```bash
cd backend
npm run dev
```
Deberías ver: `Server running on port 3000`

#### Dashboard (Terminal 2):
```bash
cd dashboard
npm run dev
```
Se abrirá automáticamente en: `http://localhost:5173`

## 🔐 Acceso al Dashboard

1. **URL**: http://localhost:5173
2. **Credenciales**:
   - Usuario: `admin`
   - Contraseña: `admin123`

## 📦 Ver Productos en el Dashboard

1. Abre http://localhost:5173
2. Inicia sesión con las credenciales de admin
3. En el menú lateral, haz clic en **"Productos"**
4. Deberías ver **10 productos de muestra** con información como:
   - Crema Hidratante Facial Premium
   - Sérum Anti-Edad con Retinol
   - Mascarilla Purificante de Arcilla
   - Y 7 productos más...

## 🔧 Solución de Problemas

### Error: "ERR_CONNECTION_REFUSED"
- Verifica que el backend esté ejecutándose en puerto 3000
- Ejecuta: `cd backend && npm run dev`

### Error: "Failed to load resource: 404"
- Verifica que el dashboard esté ejecutándose en puerto 5173
- Ejecuta: `cd dashboard && npm run dev`

### No se muestran productos
- Verifica que hayas iniciado sesión correctamente
- Revisa la consola del navegador (F12) para errores
- Verifica que el backend tenga datos: `cd backend && node check-data.js`

## 📊 Funcionalidades del Dashboard

### ✅ Implementadas:
- 🔐 **Autenticación**: Login/logout seguro
- 👥 **Gestión de Clientes**: CRUD completo
- 📅 **Gestión de Citas**: Calendario y reservas
- 💅 **Gestión de Servicios**: Catálogo completo
- 📦 **Gestión de Productos**: Inventario y stock
- 💬 **Monitor de Conversaciones**: IA y WhatsApp
- 📊 **Dashboard Principal**: Métricas y estadísticas
- ⚙️ **Configuración**: Ajustes del sistema

### 🎯 Navegación:
- **Dashboard**: Métricas generales y resumen
- **Clientes**: Lista y gestión de clientes
- **Citas**: Calendario y reservas
- **Servicios**: Catálogo de tratamientos
- **Productos**: Inventario y control de stock
- **Conversaciones**: Monitor de chat IA
- **Configuración**: Ajustes del sistema

## 🌐 URLs del Sistema Completo

- **Backend API**: http://localhost:3000
- **Dashboard Admin**: http://localhost:5173  ← **Para ver productos**
- **Frontend Público**: http://localhost:3001

## 📋 Datos de Prueba

El sistema incluye datos de muestra:
- **10 productos** con diferentes categorías
- **10 servicios** de belleza
- **5 clientes** de ejemplo
- **1 usuario admin** para el dashboard

## 🔍 Verificación Rápida

```bash
# Verificar que todo funcione
cd backend && node diagnose-system.js
```

---

## 🎉 ¡Listo!

Una vez que ambos servicios estén ejecutándose, podrás:
1. Acceder al dashboard en http://localhost:5173
2. Iniciar sesión como admin
3. Ver y gestionar los 10 productos de muestra
4. Explorar todas las funcionalidades implementadas

Si tienes problemas, revisa los logs en las terminales donde ejecutaste los servicios.