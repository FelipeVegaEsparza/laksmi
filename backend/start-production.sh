#!/bin/sh
set -e

echo "🚀 Iniciando backend en modo producción..."

echo "⏳ Esperando a que MySQL esté listo..."
sleep 5

echo "🗄️  Ejecutando migraciones de base de datos..."
echo "Using environment: ${NODE_ENV:-production}"

# Ejecutar migraciones SQL
echo "📄 Ejecutando migraciones SQL..."
echo "📍 Verificando archivo: dist/scripts/run-migrations.js"
ls -la dist/scripts/ || echo "❌ Carpeta dist/scripts no existe"
echo "🔄 Ejecutando node dist/scripts/run-migrations.js..."
node dist/scripts/run-migrations.js
echo "✅ Migraciones SQL completadas"

echo "🌱 Cargando datos iniciales en segundo plano..."
# Ejecutar seeds en segundo plano (no bloqueante)
node dist/scripts/run-seeds.js &

echo "✅ Base de datos lista"
echo "🚀 Iniciando servidor..."
exec node dist/index.js
