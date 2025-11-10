#!/bin/bash

echo "🐳 Iniciando Sistema Clínica de Belleza con Docker..."
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Levantar servicios
echo "📦 Levantando servicios..."
docker-compose up -d mysql redis

# 2. Esperar a que MySQL esté listo
echo "⏳ Esperando a que MySQL esté listo..."
sleep 15

# 3. Verificar salud de servicios
echo "🔍 Verificando servicios..."
docker-compose ps

# 4. Ejecutar migraciones
echo ""
echo "🗄️  Ejecutando migraciones de base de datos..."
docker-compose run --rm backend npm run migrate

# 5. Cargar datos de ejemplo
echo ""
echo "📊 Cargando datos de ejemplo..."
docker-compose run --rm backend npm run seed

# 6. Levantar aplicaciones
echo ""
echo "🚀 Levantando aplicaciones..."
docker-compose up -d backend dashboard frontend

# 7. Mostrar logs
echo ""
echo -e "${GREEN}✅ Sistema iniciado correctamente!${NC}"
echo ""
echo "📍 Servicios disponibles:"
echo "   - Backend API:    http://localhost:3000"
echo "   - Dashboard:      http://localhost:5173"
echo "   - Frontend Web:   http://localhost:3001"
echo "   - MySQL:          localhost:3306"
echo "   - Redis:          localhost:6379"
echo ""
echo "🔑 Credenciales Dashboard:"
echo "   Email:    admin@clinica.com"
echo "   Password: Admin123!"
echo ""
echo -e "${YELLOW}💡 Ver logs:${NC} docker-compose logs -f"
echo -e "${YELLOW}💡 Detener:${NC}  docker-compose down"
echo ""
