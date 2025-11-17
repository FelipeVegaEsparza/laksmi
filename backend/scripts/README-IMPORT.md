# 📦 Importación de Servicios desde WooCommerce

Este script importa productos de WooCommerce como servicios en Laxmi.

## 🎯 Qué hace el script

1. ✅ Se conecta a la API de WooCommerce
2. ✅ Obtiene todos los productos publicados
3. ✅ Descarga las imágenes de cada producto
4. ✅ Sube las imágenes a tu servidor de Laxmi
5. ✅ Crea los servicios en tu base de datos
6. ✅ Muestra un resumen detallado al final

## 📋 Requisitos previos

### 1. Credenciales de WooCommerce

Necesitas generar una API Key en WordPress:

1. Ve a **WordPress Admin** → **WooCommerce** → **Settings** → **Advanced** → **REST API**
2. Haz clic en **Add Key**
3. Configura:
   - **Description**: Importación a Laxmi
   - **User**: Tu usuario admin
   - **Permissions**: **Read** (solo lectura)
4. Haz clic en **Generate API Key**
5. Copia el **Consumer Key** y **Consumer Secret** (¡no los pierdas!)

### 2. Token de autenticación de Laxmi

Necesitas un token de usuario admin:

1. Inicia sesión en tu dashboard de Laxmi
2. Abre las **DevTools** del navegador (F12)
3. Ve a **Application** → **Local Storage**
4. Busca la clave `token` o `authToken`
5. Copia el valor

**Alternativa:** Puedes hacer login desde Postman o curl y copiar el token de la respuesta.

## 🚀 Instalación

### 1. Instalar dependencias

El script usa las mismas dependencias del backend, pero asegúrate de tener:

```bash
cd backend
npm install axios form-data dotenv
```

### 2. Configurar credenciales

```bash
# Copia el archivo de ejemplo
cp backend/scripts/.env.import.example backend/scripts/.env.import

# Edita el archivo con tus credenciales
# Usa tu editor favorito (VSCode, nano, vim, etc.)
```

Completa el archivo `.env.import`:

```env
# WooCommerce
WOOCOMMERCE_URL=https://tu-sitio-wordpress.com
WOOCOMMERCE_CONSUMER_KEY=ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WOOCOMMERCE_CONSUMER_SECRET=cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Laxmi API
LAXMI_API_URL=https://api.laxmi.tudominio.com
LAXMI_AUTH_TOKEN=tu_token_de_autenticacion_aqui
```

**⚠️ IMPORTANTE:**
- No incluyas `/` al final de las URLs
- El token debe ser de un usuario con rol `admin` o `manager`
- Este archivo NO se commitea a git (está en .gitignore)

## ▶️ Ejecución

```bash
node backend/scripts/import-from-woocommerce.js
```

## 📊 Salida del script

El script mostrará:

```
============================================================
🚀 IMPORTACIÓN DE SERVICIOS DESDE WOOCOMMERCE
============================================================

ℹ️  Configuración validada correctamente
ℹ️  Carpeta temporal creada: backend/scripts/temp-images
ℹ️  Obteniendo productos de WooCommerce...
✅ 15 productos obtenidos de WooCommerce

============================================================
📊 Progreso: 1/15
ℹ️  Procesando: "Masaje Relajante" (ID: 123)
============================================================
ℹ️  Descargando 3 imagen(es) de "Masaje Relajante"...
✅ 3 imagen(es) descargadas para "Masaje Relajante"
ℹ️  Subiendo imagen: product-123-0.jpg
✅ Imagen subida: /uploads/services/abc123.jpg
ℹ️  Creando servicio en Laxmi...
✅ ✨ Servicio "Masaje Relajante" importado exitosamente!

[... continúa con cada producto ...]

============================================================
📊 RESUMEN DE IMPORTACIÓN
============================================================
ℹ️  Total procesados: 15
✅ Exitosos: 14
❌ Fallidos: 1

Productos fallidos:
  - Producto X (ID: 456): Error de conexión

============================================================
✅ 🎉 Importación completada!
============================================================
```

## 🔧 Configuración avanzada

### Valores por defecto

El script establece estos valores para todos los servicios:

- **Duración**: 60 minutos
- **Sesiones**: 1
- **Estado**: Activo

Si necesitas cambiar estos valores, edita el archivo `import-from-woocommerce.js`:

```javascript
const CONFIG = {
  defaults: {
    duration: 60,    // Cambia aquí
    sessions: 1,     // Cambia aquí
    isActive: true,  // Cambia aquí
  },
};
```

### Mapeo de datos

| Campo WooCommerce | Campo Laxmi | Notas |
|-------------------|-------------|-------|
| `name` | `name` | Nombre del producto/servicio |
| `categories[0].name` | `category` | Primera categoría |
| `price` | `price` | Precio |
| `description` | `description` | Descripción larga (HTML) |
| `short_description` | `benefits` | Descripción corta (HTML) |
| `images[]` | `images[]` | Descargadas y subidas |
| `featured` | `tag` | Si es destacado → "Popular" |

## ❓ Solución de problemas

### Error: "Faltan variables de entorno"

**Causa:** No configuraste el archivo `.env.import`

**Solución:**
```bash
cp backend/scripts/.env.import.example backend/scripts/.env.import
# Edita el archivo con tus credenciales
```

### Error: "401 Unauthorized" en WooCommerce

**Causa:** Credenciales incorrectas de WooCommerce

**Solución:**
- Verifica que el Consumer Key y Secret sean correctos
- Asegúrate de que la API Key tenga permisos de "Read"
- Verifica que la URL de WordPress sea correcta

### Error: "401 Unauthorized" en Laxmi

**Causa:** Token de autenticación inválido o expirado

**Solución:**
- Genera un nuevo token iniciando sesión
- Verifica que el usuario sea admin o manager
- Asegúrate de copiar el token completo

### Error: "Error subiendo imagen"

**Causa:** Problema con el endpoint de upload o permisos

**Solución:**
- Verifica que la ruta `/api/v1/upload/image` exista
- Asegúrate de que el usuario tenga permisos para subir imágenes
- Revisa los logs del backend de Laxmi

### Error: "ECONNREFUSED" o "ETIMEDOUT"

**Causa:** No se puede conectar a la API

**Solución:**
- Verifica que las URLs sean correctas
- Asegúrate de tener conexión a internet
- Verifica que los servidores estén activos

## 🧹 Limpieza

El script limpia automáticamente las imágenes temporales al finalizar.

Si necesitas limpiar manualmente:

```bash
rm -rf backend/scripts/temp-images
```

## ⚠️ Notas importantes

1. **Este script es para uso único**: Está diseñado para la migración inicial
2. **No ejecutes múltiples veces**: Creará servicios duplicados
3. **Revisa los datos**: Después de importar, revisa que todo esté correcto
4. **Backup**: Haz un backup de tu base de datos antes de importar
5. **Categorías**: Si una categoría no existe en Laxmi, créala primero

## 📝 Después de la importación

1. ✅ Revisa los servicios importados en el dashboard
2. ✅ Verifica que las imágenes se vean correctamente
3. ✅ Ajusta precios, duraciones o descripciones si es necesario
4. ✅ Crea las categorías faltantes si las hay
5. ✅ Elimina el archivo `.env.import` por seguridad

## 🆘 Soporte

Si tienes problemas:

1. Revisa los logs del script
2. Verifica las credenciales
3. Revisa los logs del backend de Laxmi
4. Contacta al desarrollador

---

**Última actualización:** 2025-11-16
