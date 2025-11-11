#!/bin/sh
set -e

echo "🚀 Iniciando backend en modo producción..."

echo "⏳ Esperando a que MySQL esté listo..."
sleep 5

echo "🗄️  Ejecutando migraciones de base de datos..."
echo "Using environment: ${NODE_ENV:-production}"

# 1. Ejecutar migraciones de Knex (sistema viejo - tablas principales)
echo "📦 Ejecutando migraciones Knex (tablas base)..."
npm run migrate || echo "⚠️  Migraciones Knex ya ejecutadas"
echo "✅ Migraciones Knex completadas"

# 2. Ejecutar migraciones SQL (sistema nuevo - tablas adicionales)
echo "📄 Ejecutando migraciones SQL (nuevas tablas)..."
echo "📍 Verificando archivo: dist/scripts/run-migrations.js"
ls -la dist/scripts/ || echo "❌ Carpeta dist/scripts no existe"
echo "🔄 Ejecutando node dist/scripts/run-migrations.js..."
node dist/scripts/run-migrations.js
echo "✅ Migraciones SQL completadas"

echo "🌱 Verificando si necesitamos cargar datos iniciales..."
# Ejecutar seeds (solo si es necesario)
node dist/scripts/run-seeds.js || echo "⚠️  Seeds ya ejecutados previamente (esto es normal en reinicios)"

echo "✅ Base de datos lista"
echo "🚀 Iniciando servidor..."
exec node dist/index.js
