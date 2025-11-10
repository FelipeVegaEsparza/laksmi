#!/bin/sh
set -e

echo "🚀 Iniciando backend en modo producción..."

echo "⏳ Esperando a que MySQL esté listo..."
sleep 5

echo "🗄️  Ejecutando migraciones de base de datos..."
NODE_ENV=production npx knex migrate:latest --knexfile knexfile.js

echo "🌱 Cargando datos iniciales (seeds)..."
NODE_ENV=production npx knex seed:run --knexfile knexfile.js || echo "⚠️  Seeds ya ejecutados o fallaron (esto es normal)"

echo "✅ Base de datos lista"
echo "🚀 Iniciando servidor..."
node dist/index.js
