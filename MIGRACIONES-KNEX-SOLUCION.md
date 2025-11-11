# Solución: Sistema de Migraciones en Easypanel

## 🔍 Problema Identificado

El backend en Easypanel tenía **DOS sistemas de migraciones diferentes**:

1. **Sistema SQL personalizado** (`backend/migrations/`) - Archivos `.sql`
2. **Sistema Knex.js** (`backend/src/database/migrations/`) - Archivos `.js`

El problema era que:
- Las migraciones SQL en `backend/migrations/` NO se estaban ejecutando
- Knex estaba ejecutando solo las migraciones en `backend/src/database/migrations/`
- Faltaban las migraciones de las nuevas tablas en formato Knex

## ✅ Solución Implementada

### 1. Migraciones Knex Creadas

Se crearon las siguientes migraciones en formato Knex.js:

#### `20251111111305_add_price_to_bookings.js`
```javascript
exports.up = function(knex) {
  return knex.schema.alterTable('bookings', (table) => {
    table.decimal('price', 10, 2).nullable();
  });
};
```

#### `20251111111304_create_banners_table.js` (completada)
```javascript
exports.up = function(knex) {
  return knex.schema.createTable('banners', (table) => {
    table.increments('id').primary();
    table.string('title', 255).notNullable();
    table.text('description').nullable();
    table.string('image_url', 500).notNullable();
    table.string('link_url', 500).nullable();
    table.boolean('active').defaultTo(true);
    table.integer('order').defaultTo(0);
    table.timestamps(true, true);
  });
};
```

#### `20251111111306_create_company_settings.js`
```javascript
exports.up = function(knex) {
  return knex.schema.createTable('company_settings', (table) => {
    table.increments('id').primary();
    table.string('company_name', 255).notNullable();
    table.string('phone', 50).nullable();
    table.string('email', 255).nullable();
    table.text('address').nullable();
    table.string('whatsapp', 50).nullable();
    table.string('facebook', 255).nullable();
    table.string('instagram', 255).nullable();
    table.string('twitter', 255).nullable();
    table.string('logo_url', 500).nullable();
    table.text('description').nullable();
    table.string('currency', 10).defaultTo('CLP');
    table.timestamps(true, true);
  });
};
```

#### `20251111111307_create_featured_images.js`
```javascript
exports.up = function(knex) {
  return knex.schema.createTable('featured_images', (table) => {
    table.increments('id').primary();
    table.integer('slot').notNullable().unique();
    table.string('image_url', 500).notNullable();
    table.string('title', 255).nullable();
    table.text('description').nullable();
    table.string('link_url', 500).nullable();
    table.boolean('active').defaultTo(true);
    table.timestamps(true, true);
  });
};
```

### 2. Script de Inicio Actualizado

**Archivo**: `backend/start-production.sh`

```bash
#!/bin/sh
set -e

echo "🚀 Iniciando backend en modo producción..."

echo "⏳ Esperando a que MySQL esté listo..."
sleep 5

echo "🗄️  Ejecutando migraciones de base de datos..."
echo "Using environment: ${NODE_ENV:-production}"

# Ejecutar migraciones de Knex
npm run migrate

echo "🌱 Verificando si necesitamos cargar datos iniciales..."
# Ejecutar seeds (solo si es necesario)
npm run seed || echo "⚠️  Seeds ya ejecutados previamente (esto es normal en reinicios)"

echo "✅ Base de datos lista"
echo "🚀 Iniciando servidor..."
exec node dist/index.js
```

### 3. Código del Servidor Actualizado

**Archivo**: `backend/src/index.ts`

Se removió la ejecución automática de migraciones del código TypeScript para evitar problemas de concurrencia. Ahora las migraciones se ejecutan ANTES de iniciar el servidor mediante el script de shell.

## 📋 Próximos Pasos

### Para Desplegar en Easypanel:

1. **Hacer commit de los cambios**:
```bash
git add .
git commit -m "fix: Agregar migraciones Knex faltantes para producción"
git push
```

2. **Easypanel hará rebuild automático**

3. **Verificar logs en Easypanel**:
   - Debe mostrar: "Batch X run: Y migrations"
   - Las tablas deben crearse correctamente
   - No debe haber errores de "Table doesn't exist"

### Para Desarrollo Local:

Si quieres usar el mismo sistema en local:

```bash
# Ejecutar migraciones
cd backend
npm run migrate

# Ejecutar seeds
npm run seed

# Iniciar servidor
npm run dev
```

## 🎯 Sistema de Migraciones Unificado

De ahora en adelante, **SOLO usar migraciones Knex.js**:

### Crear nueva migración:

```bash
cd backend
npx knex migrate:make nombre_de_la_migracion
```

Esto creará un archivo en `backend/src/database/migrations/` con el formato correcto.

### Plantilla de migración:

```javascript
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  // Cambios a aplicar
  return knex.schema.createTable('nombre_tabla', (table) => {
    table.increments('id').primary();
    // ... más columnas
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  // Cómo revertir los cambios
  return knex.schema.dropTableIfExists('nombre_tabla');
};
```

## 📚 Documentación Knex

Para más información sobre cómo crear migraciones con Knex:
- [Knex Schema Builder](https://knexjs.org/guide/schema-builder.html)
- [Knex Migrations](https://knexjs.org/guide/migrations.html)

## ⚠️ Notas Importantes

1. **NO modificar migraciones ya ejecutadas** - Crear nuevas migraciones para cambios adicionales
2. **Siempre probar localmente** antes de hacer push a producción
3. **Las migraciones SQL en `backend/migrations/`** ya no se usan - mantener solo como referencia
4. **Knex usa su propia tabla de control**: `knex_migrations` (diferente de `schema_migrations`)

---

**Fecha**: 2025-11-11
**Estado**: ✅ Listo para desplegar
