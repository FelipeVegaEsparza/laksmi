# 📁 Guía de Archivos SQL para Easypanel

## 🎯 ¿Qué archivo usar?

Tienes **3 opciones** de scripts SQL. Elige según tu situación:

---

## 1️⃣ `easypanel-fix-simple.sql` ⭐ RECOMENDADO

**Cuándo usar**: Primera vez, instalación limpia, o si no estás seguro

**Características**:
- ✅ Más simple y directo
- ✅ Compatible con todos los clientes MySQL
- ✅ Usa `CREATE TABLE IF NOT EXISTS`
- ✅ Usa `INSERT IGNORE` para evitar duplicados
- ✅ Si algo ya existe, continúa sin error

**Cómo usar**:
```sql
-- Copiar TODO el contenido y ejecutar de una vez
```

**Ventajas**:
- Rápido y fácil
- No requiere conocimientos avanzados
- Seguro de ejecutar múltiples veces

**Desventajas**:
- Puede mostrar warnings (pero son normales)
- No valida antes de crear

---

## 2️⃣ `easypanel-fix-complete.sql` 🔧 AVANZADO

**Cuándo usar**: Si quieres validaciones más estrictas

**Características**:
- ✅ Valida existencia antes de crear
- ✅ Usa variables y prepared statements
- ✅ Más control sobre el proceso
- ⚠️ Más complejo

**Cómo usar**:
```sql
-- Copiar TODO el contenido y ejecutar de una vez
-- Requiere permisos para usar variables y prepared statements
```

**Ventajas**:
- Validaciones más estrictas
- Mensajes informativos
- No crea duplicados

**Desventajas**:
- Más complejo
- Puede fallar en algunos clientes MySQL
- Requiere más permisos

---

## 3️⃣ `easypanel-fix-paso-a-paso.sql` 🐢 MANUAL

**Cuándo usar**: Si los otros scripts fallan o quieres control total

**Características**:
- ✅ Comandos individuales
- ✅ Comentarios explicativos
- ✅ Verificaciones entre pasos
- ✅ Comandos de limpieza incluidos

**Cómo usar**:
```sql
-- Ejecutar COMANDO POR COMANDO
-- Leer los comentarios
-- Verificar cada paso antes de continuar
```

**Ventajas**:
- Control total del proceso
- Puedes ver qué hace cada paso
- Fácil de debuggear
- Incluye comandos de verificación

**Desventajas**:
- Más lento
- Requiere más atención
- Más propenso a errores humanos

---

## 📊 Comparación Rápida

| Característica | Simple | Complete | Paso a Paso |
|---------------|--------|----------|-------------|
| Facilidad | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| Velocidad | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| Control | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Seguridad | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Recomendado para | Principiantes | Avanzados | Debugging |

---

## 🚀 Recomendación por Escenario

### Escenario 1: Primera instalación
**Usar**: `easypanel-fix-simple.sql`
```
✅ Rápido y fácil
✅ Todo en un solo paso
```

### Escenario 2: Ya intentaste y falló
**Usar**: `easypanel-fix-paso-a-paso.sql`
```
✅ Ver exactamente dónde falla
✅ Ejecutar solo lo que falta
```

### Escenario 3: Producción con datos importantes
**Usar**: `easypanel-fix-complete.sql`
```
✅ Validaciones estrictas
✅ No sobrescribe datos existentes
```

### Escenario 4: No estás seguro qué falta
**Usar**: `easypanel-fix-paso-a-paso.sql` (solo las verificaciones)
```sql
-- Ejecutar solo los comandos SELECT para ver qué existe
SELECT COLUMN_NAME FROM information_schema.COLUMNS...
SHOW TABLES LIKE 'company_settings';
```

---

## 📝 Qué hace cada script

Todos los scripts hacen lo mismo, solo cambia el método:

### 1. Agregar columna `price` a `bookings`
```sql
ALTER TABLE bookings ADD COLUMN price DECIMAL(10,2)...
```

### 2. Crear tabla `company_settings`
```sql
CREATE TABLE company_settings (
  id, company_name, logo_url, contact_*, social_urls, colors...
)
```

### 3. Crear tabla `banners`
```sql
CREATE TABLE banners (
  id, title, description, link, image_url, order, active...
)
```

### 4. Crear tabla `featured_images`
```sql
CREATE TABLE featured_images (
  id, slot, title, description, image_url, active...
)
```

### 5. Insertar datos por defecto
- 1 registro en `company_settings`
- 1 banner de ejemplo
- 3 slots en `featured_images`

---

## ⚠️ Advertencias Importantes

### ❌ NO ejecutar múltiples scripts a la vez
```sql
-- MAL ❌
-- Ejecutar simple.sql Y complete.sql
```

### ✅ Ejecutar solo UNO
```sql
-- BIEN ✅
-- Ejecutar solo simple.sql
```

### ❌ NO ejecutar si no estás seguro de la base de datos
```sql
-- Verificar primero
SELECT DATABASE();
-- Debe mostrar: clinica_belleza
```

### ✅ Hacer backup antes (recomendado)
```bash
# En Easypanel o con mysqldump
mysqldump -u user -p clinica_belleza > backup.sql
```

---

## 🔍 Verificación Post-Ejecución

Después de ejecutar cualquier script, verifica:

```sql
-- 1. Ver todas las tablas
SHOW TABLES;
-- Debe incluir: bookings, company_settings, banners, featured_images

-- 2. Verificar columna price
DESCRIBE bookings;
-- Debe incluir: price DECIMAL(10,2)

-- 3. Contar registros
SELECT COUNT(*) FROM company_settings; -- Debe ser 1
SELECT COUNT(*) FROM banners;          -- Debe ser >= 1
SELECT COUNT(*) FROM featured_images;  -- Debe ser 3

-- 4. Ver datos
SELECT * FROM company_settings;
SELECT * FROM banners;
SELECT * FROM featured_images;
```

---

## 🆘 Troubleshooting

### Error: "Duplicate column name 'price'"
**Solución**: La columna ya existe, puedes ignorar este error y continuar.

### Error: "Table 'company_settings' already exists"
**Solución**: La tabla ya existe, puedes ignorar este error y continuar.

### Error: "Duplicate entry for key 'PRIMARY'"
**Solución**: Los datos ya existen, puedes ignorar este error.

### Error: "Access denied"
**Solución**: Tu usuario no tiene permisos suficientes. Contacta al administrador.

### Error: "Unknown database 'clinica_belleza'"
**Solución**: Estás en la base de datos incorrecta. Ejecuta:
```sql
USE clinica_belleza;
```

---

## 📚 Archivos Adicionales

- `INSTRUCCIONES-EASYPANEL.md` - Guía completa paso a paso
- `CHECKLIST-EASYPANEL.md` - Checklist interactivo
- `RESUMEN-SOLUCION.md` - Resumen técnico de los cambios

---

## 🎯 Flujo Recomendado

```
1. Leer INSTRUCCIONES-EASYPANEL.md
   ↓
2. Hacer backup de la base de datos
   ↓
3. Ejecutar easypanel-fix-simple.sql
   ↓
4. Verificar con los comandos SELECT
   ↓
5. Redesplegar backend
   ↓
6. Seguir CHECKLIST-EASYPANEL.md
   ↓
7. ✅ ¡Listo!
```

---

## 💡 Consejos

1. **Lee los comentarios** en los scripts SQL
2. **Verifica cada paso** antes de continuar
3. **No te asustes por los warnings** - son normales
4. **Guarda los logs** por si necesitas ayuda
5. **Prueba en desarrollo** primero si es posible

---

## ✅ Checklist Rápido

- [ ] Elegí el script correcto para mi situación
- [ ] Hice backup de la base de datos
- [ ] Verifiqué que estoy en la base de datos correcta
- [ ] Leí los comentarios del script
- [ ] Ejecuté el script completo
- [ ] Verifiqué que se crearon las tablas
- [ ] Verifiqué que hay datos en las tablas
- [ ] Redespliegué el backend
- [ ] Probé que funciona

---

**¿Dudas?** Revisa `INSTRUCCIONES-EASYPANEL.md` para más detalles.
