# Sistema de Migraciones - Explicación y Troubleshooting

## 🔄 Cómo Funciona el Sistema de Migraciones

### Flujo Automático

1. **Al iniciar el backend**, se ejecuta automáticamente el script de migraciones
2. El sistema verifica la tabla `schema_migrations` para ver qué migraciones ya se ejecutaron
3. Compara con los archivos `.sql` en la carpeta `backend/migrations/`
4. Ejecuta solo las migraciones pendientes (que no están en `schema_migrations`)
5. Registra cada migración ejecutada en `schema_migrations`

### Ubicación de Archivos

```
backend/
├── migrations/
│   ├── 001_add_price_to_bookings.sql
│   ├── 002_create_company_settings.sql
│   ├── 009_add_sessions_and_tag_to_services.sql
│   └── ...
└── src/
    └── database/
        └── migrator.ts  (Sistema de migraciones)
```

## 📊 Verificar Estado de Migraciones

### En phpMyAdmin:

```sql
-- Ver todas las migraciones ejecutadas
SELECT * FROM schema_migrations ORDER BY id;

-- Ver la última migración ejecutada
SELECT * FROM schema_migrations ORDER BY id DESC LIMIT 1;

-- Contar migraciones ejecutadas
SELECT COUNT(*) as total FROM schema_migrations;
```

### En los Logs del Backend:

Busca estas líneas al iniciar:

```
🔄 Iniciando sistema de migraciones...
📁 Ruta de migraciones: /app/migrations
📊 Migraciones ejecutadas: 8
📊 Migraciones disponibles: 15
🔄 Migraciones pendientes: 1
   ⏳ 009_add_sessions_and_tag_to_services.sql
📄 Ejecutando migración: 009_add_sessions_and_tag_to_services.sql
✅ Migración ejecutada exitosamente: 009_add_sessions_and_tag_to_services.sql
```

## ⚠️ Problemas Comunes

### Problema 1: Migración registrada pero no ejecutada

**Síntoma:** La migración aparece en `schema_migrations` pero las columnas no existen en la tabla.

**Causa:** La migración falló al ejecutarse pero se registró de todas formas (bug en versión anterior).

**Solución:**
```sql
-- 1. Eliminar el registro falso
DELETE FROM schema_migrations WHERE filename = '009_add_sessions_and_tag_to_services.sql';

-- 2. Reiniciar el backend para que se ejecute de nuevo
-- O ejecutar manualmente los ALTER TABLE
```

### Problema 2: "No hay archivos de migración disponibles"

**Síntoma:** Los logs dicen que no hay migraciones disponibles.

**Causa:** La carpeta `migrations` no se copió correctamente al contenedor Docker.

**Solución:**
```bash
# Verificar que la carpeta existe en el contenedor
docker exec -it <backend-container> ls -la /app/migrations

# Si no existe, verificar el Dockerfile y rebuild
```

### Problema 3: Error "Column already exists"

**Síntoma:** La migración falla porque la columna ya existe.

**Causa:** Intentaste ejecutar la migración manualmente y luego el sistema la ejecutó de nuevo.

**Solución:** El sistema ahora ignora este error automáticamente (código `ER_DUP_FIELDNAME`).

## 🔧 Mejoras Implementadas

### 1. Mejor Logging

Ahora los logs muestran:
- Ruta exacta de las migraciones
- Lista de migraciones ejecutadas y disponibles
- Progreso de cada statement SQL
- Errores más descriptivos

### 2. Manejo de Errores

- Ignora errores de "columna ya existe"
- Limpia comentarios SQL antes de ejecutar
- Divide correctamente los statements por `;`

### 3. Validación

- Verifica que la carpeta de migraciones exista
- Muestra advertencias si no hay archivos
- Registra cada paso del proceso

## 📝 Crear una Nueva Migración

### Paso 1: Crear el archivo

```bash
# Formato: XXX_descripcion.sql
# XXX = número secuencial de 3 dígitos
backend/migrations/016_add_new_column.sql
```

### Paso 2: Escribir el SQL

```sql
-- backend/migrations/016_add_new_column.sql

-- Descripción: Agregar columna nueva_columna a tabla_ejemplo
-- Relacionado con: Feature XYZ

-- ============================================
-- CAMBIOS
-- ============================================

ALTER TABLE tabla_ejemplo 
ADD COLUMN nueva_columna VARCHAR(100) DEFAULT NULL COMMENT 'Descripción de la columna';

-- ============================================
-- NOTAS
-- ============================================

-- Notas adicionales sobre la migración
```

### Paso 3: Commit y Deploy

```bash
git add backend/migrations/016_add_new_column.sql
git commit -m "feat: Agregar columna nueva_columna a tabla_ejemplo"
git push origin main
```

### Paso 4: Verificar

1. Esperar a que Easypanel despliegue
2. Revisar logs del backend
3. Verificar en phpMyAdmin que la columna existe
4. Verificar que la migración está en `schema_migrations`

## 🚨 Qué Hacer si Falla una Migración

### Opción 1: Fix Forward (Recomendado)

Crear una nueva migración que corrija el problema:

```sql
-- backend/migrations/017_fix_previous_migration.sql
ALTER TABLE tabla_ejemplo MODIFY COLUMN nueva_columna VARCHAR(200);
```

### Opción 2: Rollback Manual

```sql
-- 1. Eliminar el registro de la migración fallida
DELETE FROM schema_migrations WHERE filename = '016_add_new_column.sql';

-- 2. Revertir los cambios (si es posible)
ALTER TABLE tabla_ejemplo DROP COLUMN nueva_columna;

-- 3. Corregir el archivo de migración y redeploy
```

## ✅ Checklist de Verificación

Después de cada despliegue:

- [ ] Revisar logs del backend para confirmar que las migraciones se ejecutaron
- [ ] Verificar en phpMyAdmin que las tablas/columnas existen
- [ ] Verificar que `schema_migrations` tiene el registro
- [ ] Probar la funcionalidad que depende de la migración

## 🎯 Estado Actual

**Migraciones en el proyecto:** 15 archivos

**Última migración:** `015_add_whatsapp_to_company_settings.sql`

**Próxima migración:** `016_...`

**Sistema de migraciones:** ✅ Funcionando correctamente (después de las mejoras)

---

## 📞 Troubleshooting Rápido

**Problema:** No puedo crear servicios - "Unknown column 'sessions'"

**Solución rápida:**
```sql
ALTER TABLE services ADD COLUMN sessions INT DEFAULT 1;
ALTER TABLE services ADD COLUMN tag VARCHAR(50) DEFAULT NULL;
INSERT INTO schema_migrations (filename, executed_at) 
VALUES ('009_add_sessions_and_tag_to_services.sql', NOW());
```

**Problema:** Las migraciones no se ejecutan automáticamente

**Verificar:**
1. ¿Los archivos .sql están en `backend/migrations/`?
2. ¿El backend se reinició después del deploy?
3. ¿Hay errores en los logs del backend?
4. ¿La tabla `schema_migrations` existe?

---

**Última actualización:** 2025-11-15
**Versión del sistema:** 2.0 (con mejoras de logging y manejo de errores)
