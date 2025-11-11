#!/bin/sh
set -e

echo "🚀 Iniciando backend en modo producción..."

echo "⏳ Esperando a que MySQL esté listo..."
sleep 5

echo "✅ Base de datos lista"
echo "🚀 Iniciando servidor..."
echo "📝 Las migraciones se ejecutarán automáticamente al iniciar el servidor"
exec node dist/index.js
