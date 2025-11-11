# 🔧 Instrucciones para Corregir Easypanel

## Problemas Identificados

1. ❌ **Error de Rate Limiting**: `ValidationError: The Express 'trust proxy' setting is true`
2. ❌ **Columna faltante**: `Unknown column 'price' in 'field list'` en tabla `bookings`
3. ❌ **Tablas faltantes**: `company_settings`, `banners`, `featured_images`

---

## 📋 Solución Paso a Paso

### PASO 1: Ejecutar Script SQL en la Base de Datos

1. **Accede a Easypanel** → Ve a tu servicio de MySQL
2. **Abre el cliente MySQL** (phpMyAdmin, Adminer, o CLI)
3. **Selecciona la base de datos** `clinica_belleza`
4. **Ejecuta el archivo SQL** (elige una opción):

   **OPCIÓN A (Recomendada)**: `easypanel-fix-simple.sql`
   - Versión simplificada
   - Más compatible con diferentes clientes MySQL
   - Usa `INSERT IGNORE` para evitar duplicados
   - Si una columna ya existe, muestra warning pero continúa

   **OPCIÓN B**: `easypanel-fix-complete.sql`
   - Versión con validaciones condicionales
   - Más compleja pero más segura
   - Verifica existencia antes de crear

Puedes copiar y pegar el contenido completo del archivo SQL directamente en el editor de consultas.

**El script hace lo siguiente:**
- ✅ Agrega columna `price` a la tabla `bookings`
- ✅ Actualiza precios existentes desde `services`
- ✅ Crea tabla `company_settings` con datos por defecto
- ✅ Crea tabla `banners` con un banner de ejemplo
- ✅ Crea tabla `featured_images` con 3 slots
- ✅ Verifica que todo se creó correctamente

### PASO 2: Recompilar y Redesplegar el Backend

Después de ejecutar el SQL, necesitas redesplegar el backend con el código corregido:

```bash
# En tu máquina local, asegúrate de que los cambios estén commiteados
git add .
git commit -m "Fix: Corregir rate limiter y agregar validaciones"
git push
```

Luego en Easypanel:
1. Ve al servicio **backend**
2. Click en **Rebuild** o **Redeploy**
3. Espera a que termine el build

### PASO 3: Verificar que Funciona

1. **Revisa los logs del backend** en Easypanel
   - Ya NO deberías ver el error de `trust proxy`
   - Ya NO deberías ver el error de `Unknown column 'price'`
   - Deberías ver: `✅ Base de datos lista` y `🚀 Iniciando servidor...`

2. **Prueba el frontend**
   - Abre el frontend en el navegador
   - El dashboard debería cargar los datos correctamente
   - Las métricas deberían aparecer sin errores

---

## 🔍 Verificación Manual (Opcional)

Si quieres verificar manualmente que las tablas se crearon:

```sql
-- Ver todas las tablas
SHOW TABLES;

-- Verificar estructura de bookings
DESCRIBE bookings;

-- Verificar que company_settings tiene datos
SELECT * FROM company_settings;

-- Verificar banners
SELECT * FROM banners;

-- Verificar featured_images
SELECT * FROM featured_images;

-- Verificar que bookings tiene precios
SELECT id, service_id, price, date_time FROM bookings LIMIT 5;
```

---

## 🚨 Si Aún Hay Problemas

### Problema: El backend sigue crasheando con error de trust proxy

**Solución**: Verifica que el código actualizado se desplegó correctamente:
1. En Easypanel, ve a los logs del backend
2. Busca la línea que dice la versión del build
3. Si sigue fallando, intenta hacer un **rebuild completo** (no solo redeploy)

### Problema: Sigue diciendo "Unknown column 'price'"

**Solución**: El script SQL no se ejecutó correctamente:
1. Conéctate a MySQL
2. Ejecuta manualmente:
```sql
ALTER TABLE bookings ADD COLUMN price DECIMAL(10,2) DEFAULT 0.00 AFTER service_id;
UPDATE bookings b INNER JOIN services s ON b.service_id = s.id SET b.price = s.price;
```

### Problema: Tablas no existen

**Solución**: Ejecuta cada CREATE TABLE por separado:
```sql
-- Ejecuta cada bloque del archivo easypanel-fix-complete.sql uno por uno
```

---

## 📝 Cambios Realizados en el Código

### 1. `backend/src/middleware/security.ts`
- Agregado `validate: { trustProxy: false }` a todos los rate limiters
- Esto evita el error de validación de trust proxy en producción

### 2. Base de Datos
- Agregada columna `price` a `bookings`
- Creadas tablas: `company_settings`, `banners`, `featured_images`

---

## ✅ Checklist Final

- [ ] Script SQL ejecutado en la base de datos
- [ ] Backend recompilado y redesplegado
- [ ] Logs del backend sin errores
- [ ] Frontend carga correctamente
- [ ] Dashboard muestra métricas
- [ ] No hay errores en la consola del navegador

---

## 💡 Notas Adicionales

- El script SQL es **idempotente**: puedes ejecutarlo múltiples veces sin problemas
- Usa `IF NOT EXISTS` y `WHERE NOT EXISTS` para evitar duplicados
- Los datos de ejemplo se insertan solo si las tablas están vacías
- La columna `price` se actualiza automáticamente desde `services`

---

¿Necesitas ayuda? Revisa los logs en Easypanel para ver el error específico.
