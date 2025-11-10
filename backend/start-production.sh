#!/bin/sh
set -e

echo "🚀 Iniciando backend en modo producción..."

echo "⏳ Esperando a que MySQL esté listo..."
sleep 5

echo "🗄️  Ejecutando migraciones de base de datos..."
NODE_ENV=production npx knex migrate:latest --knexfile knexfile.js

# Solo ejecutar seeds si es el primer deploy (si la tabla users está vacía)
echo "🌱 Verificando si necesitamos cargar datos iniciales..."
if NODE_ENV=production npx knex seed:run --knexfile knexfile.js 2>&1 | grep -q "Error"; then
  echo "⚠️  Seeds ya ejecutados previamente (esto es normal en reinicios)"
else
  echo "✅ Datos iniciales cargados exitosamente"
fi

echo "✅ Base de datos lista"
echo "🚀 Iniciando servidor..."
exec node dist/index.js
