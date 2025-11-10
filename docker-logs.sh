#!/bin/bash

echo "📋 Logs del Sistema"
echo ""
echo "Selecciona el servicio:"
echo "1. Todos"
echo "2. Backend"
echo "3. Dashboard"
echo "4. Frontend"
echo "5. MySQL"
echo "6. Redis"
echo ""
read -p "Opción (1-6): " choice

case $choice in
    1) docker-compose logs -f ;;
    2) docker-compose logs -f backend ;;
    3) docker-compose logs -f dashboard ;;
    4) docker-compose logs -f frontend ;;
    5) docker-compose logs -f mysql ;;
    6) docker-compose logs -f redis ;;
    *) echo "Opción inválida" ;;
esac
