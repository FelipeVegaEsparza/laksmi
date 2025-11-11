# 🔄 Sistema de Migraciones Automáticas

## ✅ Implementado

Se ha implementado un sistema completo de migraciones automáticas que resuelve los problemas de despliegue entre local y producción.

---

## 🎯 Qué Hace el Sistema

### 1. **Migraciones Automáticas**
- Se ejecutan automáticamente al iniciar el backend
- Solo ejecuta las migraciones que faltan
- Registra cuáles ya se ejecutaron
- Si falla una migración, el backend NO inicia (seguridad)

### 2. **Seeds Opcionales**
- Se ejecutan solo si la base de datos está vacía
- En producción: solo datos mínimos necesarios
- En desarrollo: todos los datos de prueba
- No son críticos (si fallan, el backend sigue)

### 3. **Tabla de Control**
```sql
schema_migrations
├─ id (auto)
├─ filename (nombre del archivo .sql)
└─ executed_at (cuándo se ejecutó)
```

---

## 📁 Estructura de Archivos

```
backend/
├── migrations/                    ← Cambios de estructura BD
│   ├── 001_add_price_to_bookings.sql
│   ├── 002_create_company_settings.sql
│   ├── 003_create_banners.sql
│   ├── 004_create_featured_images.sql
│   └── ...
│
├── seeds/                         ← Datos iniciales
│   ├── production_base.sql        (solo producción)
│   ├── dev_clients.sql            (solo desarrollo)
│   └── dev_services.sql           (solo desarrollo)
│
└── src/
    └── database/
        ├── migrator.ts            ← Sistema de migraciones
        └── seeder.ts              ← Sistema de seeds
```

---

## 🚀 Cómo Funciona

### Al Iniciar el Backend:

```
1. Conectar a MySQL ✅
   ↓
2. Crear tabla schema_migrations (si no existe) ✅
   ↓
3. Leer migraciones ejecutadas ✅
   ↓
4. Leer archivos .sql disponibles ✅
   ↓
5. Identificar migraciones pendientes ✅
   ↓
6. Ejecutar migraciones pendientes en orden ✅
   ↓
7. Registrar cada migración ejecutada ✅
   ↓
8. Verificar si BD está vacía ✅
   ↓
9. Ejecutar seeds si es necesario ✅
   ↓
10. Iniciar servidor ✅
```

### Logs que Verás:

```
🔄 Running database migrations...
📄 Ejecutando migración: 001_add_price_to_bookings.sql
✅ Migración ejecutada exitosamente: 001_add_price_to_bookings.sql
📄 Ejecutando migración: 002_create_company_settings.sql
✅ Migración ejecutada exitosamente: 002_create_company_settings.sql
✅ Database migrations completed
🌱 Checking if seeds are needed...
ℹ️  Base de datos ya tiene datos, omitiendo seeds
✅ Database seeding completed
```

---

## 📝 Cómo Crear una Nueva Migración

### Paso 1: Crear archivo numerado

```bash
# Formato: XXX_descripcion.sql
# XXX = número secuencial (001, 002, 003...)

backend/migrations/005_add_discount_to_services.sql
```

### Paso 2: Escribir SQL

```sql
-- Descripción de qué hace la migración

ALTER TABLE services 
ADD COLUMN discount DECIMAL(5,2) DEFAULT 0.00;

-- Puedes tener múltiples statements
UPDATE services 
SET discount = 0 
WHERE discount IS NULL;
```

### Paso 3: Commit y Push

```bash
git add backend/migrations/005_add_discount_to_services.sql
git commit -m "feat: agregar columna discount a services"
git push
```

### Paso 4: Desplegar

```
Easypanel detecta cambios
→ Rebuild automático
→ Backend inicia
→ Migración se ejecuta automáticamente
→ ✅ Listo
```

---

## 🌱 Cómo Crear Seeds

### Para Producción:

```sql
-- backend/seeds/production_base.sql
-- Solo datos MÍNIMOS necesarios

INSERT IGNORE INTO company_settings (...) VALUES (...);
INSERT IGNORE INTO banners (...) VALUES (...);
```

### Para Desarrollo:

```sql
-- backend/seeds/dev_clients.sql
-- Datos de prueba para desarrollo

INSERT INTO clients (name, email, phone) VALUES
  ('Cliente Prueba 1', 'test1@example.com', '+56912345678'),
  ('Cliente Prueba 2', 'test2@example.com', '+56987654321');
```

---

## 🔍 Comandos Útiles

### Ver Estado de Migraciones

```typescript
// En el código
import { migrator } from './database/migrator';

const status = await migrator.getStatus();
console.log(status);
// {
//   executed: 4,
//   pending: 0,
//   total: 4,
//   lastMigration: '004_create_featured_images.sql'
// }
```

### Listar Todas las Migraciones

```typescript
const migrations = await migrator.listMigrations();
console.log(migrations);
// [
//   { filename: '001_...', status: 'executed', executedAt: Date },
//   { filename: '002_...', status: 'executed', executedAt: Date },
//   { filename: '003_...', status: 'pending' }
// ]
```

### Verificar en MySQL

```sql
-- Ver migraciones ejecutadas
SELECT * FROM schema_migrations ORDER BY id;

-- Ver última migración
SELECT * FROM schema_migrations ORDER BY id DESC LIMIT 1;

-- Contar migraciones
SELECT COUNT(*) as total FROM schema_migrations;
```

---

## ⚠️ Reglas Importantes

### ✅ HACER:

1. **Numerar secuencialmente**: 001, 002, 003...
2. **Nombres descriptivos**: `add_column`, `create_table`, `update_data`
3. **Una migración = un cambio lógico**
4. **Usar `IF NOT EXISTS`** cuando sea posible
5. **Probar localmente primero**
6. **Commit la migración con el código que la usa**

### ❌ NO HACER:

1. **NO modificar migraciones ya ejecutadas**
2. **NO eliminar migraciones viejas**
3. **NO usar números duplicados**
4. **NO poner código que dependa de datos específicos**
5. **NO hacer cambios destructivos sin backup**

---

## 🔧 Solución de Problemas

### Problema: Migración falla en producción

```
❌ Error ejecutando migración 005_...
```

**Solución**:
1. El backend NO inicia (esto es intencional, seguridad)
2. Revisa los logs para ver el error SQL
3. Corrige el archivo de migración
4. Haz commit y push
5. Redesplega

### Problema: Migración se ejecutó a medias

```sql
-- Marcar como no ejecutada para reintentar
DELETE FROM schema_migrations 
WHERE filename = '005_problema.sql';
```

### Problema: Quiero ejecutar seeds manualmente

```typescript
// En el código o crear script
import { seeder } from './database/seeder';
await seeder.runSeeds(true); // force = true
```

### Problema: Migración duplicada

```
Error: Duplicate entry '003_...' for key 'filename'
```

**Solución**: Ya se ejecutó, no hacer nada. Es normal.

---

## 📊 Ventajas del Sistema

### Antes:
```
❌ Scripts SQL manuales
❌ Olvidar ejecutar migraciones
❌ Diferencias entre local y producción
❌ Perder track de qué se ejecutó
❌ Errores difíciles de debuggear
```

### Ahora:
```
✅ Migraciones automáticas
✅ Imposible olvidar ejecutarlas
✅ Mismo comportamiento local y producción
✅ Historial completo en schema_migrations
✅ Errores claros y controlados
✅ Versionado con Git
```

---

## 🎯 Flujo de Trabajo Completo

### Desarrollo de Nueva Feature:

```
1. Desarrollar código localmente
   ├─ Modificar modelos/controladores
   └─ Si cambias BD: crear migración

2. Crear migración (si es necesario)
   ├─ backend/migrations/XXX_descripcion.sql
   └─ Probar localmente (reiniciar backend)

3. Commit todo junto
   ├─ git add .
   ├─ git commit -m "feat: nueva feature"
   └─ git push

4. Desplegar a producción
   ├─ Easypanel rebuild automático
   ├─ Migraciones se ejecutan automáticamente
   └─ ✅ Feature funcionando
```

### Ejemplo Real:

```
Feature: Agregar sistema de descuentos

1. Crear migración:
   backend/migrations/005_add_discounts.sql
   
2. Modificar código:
   backend/src/models/Service.ts (agregar campo discount)
   backend/src/controllers/serviceController.ts (manejar descuentos)
   
3. Commit:
   git add backend/migrations/005_add_discounts.sql
   git add backend/src/models/Service.ts
   git add backend/src/controllers/serviceController.ts
   git commit -m "feat: sistema de descuentos en servicios"
   git push
   
4. Desplegar:
   Easypanel → Rebuild → ✅ Funciona
```

---

## 🚀 Próximos Pasos

Ahora que tienes el sistema de migraciones:

1. ✅ **Ya no necesitas ejecutar SQL manualmente**
2. ✅ **Las migraciones se ejecutan automáticamente**
3. ✅ **Mismo comportamiento local y producción**
4. 📝 **Siguiente**: Configurar volumen persistente para imágenes

---

## 📞 Referencia Rápida

```bash
# Crear nueva migración
touch backend/migrations/XXX_descripcion.sql

# Ver migraciones en MySQL
SELECT * FROM schema_migrations;

# Reiniciar backend (ejecuta migraciones pendientes)
npm run dev  # local
# o rebuild en Easypanel

# Forzar re-ejecución (CUIDADO)
DELETE FROM schema_migrations WHERE filename = 'XXX.sql';
```

---

**Estado**: ✅ Implementado y funcionando
**Próximo**: Configurar volumen persistente para uploads
