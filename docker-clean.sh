#!/bin/bash

echo "🧹 Limpiando Sistema Docker..."
echo ""
echo "⚠️  ADVERTENCIA: Esto eliminará TODOS los datos!"
echo ""
read -p "¿Estás seguro? (s/n): " confirm

if [ "$confirm" = "s" ] || [ "$confirm" = "S" ]; then
    echo ""
    echo "🛑 Deteniendo contenedores..."
    docker-compose down
    
    echo "🗑️  Eliminando volúmenes..."
    docker-compose down -v
    
    echo "🧹 Limpiando imágenes..."
    docker-compose rm -f
    
    echo ""
    echo "✅ Sistema limpiado completamente!"
    echo ""
    echo "💡 Para iniciar de nuevo: ./docker-init.sh"
else
    echo ""
    echo "❌ Operación cancelada"
fi
echo ""
