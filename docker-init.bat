@echo off
echo 🐳 Iniciando Sistema Clinica de Belleza con Docker...
echo.

REM 1. Levantar servicios
echo 📦 Levantando servicios...
docker-compose up -d mysql redis

REM 2. Esperar a que MySQL este listo
echo ⏳ Esperando a que MySQL este listo...
timeout /t 15 /nobreak > nul

REM 3. Verificar salud de servicios
echo 🔍 Verificando servicios...
docker-compose ps

REM 4. Ejecutar migraciones
echo.
echo 🗄️  Ejecutando migraciones de base de datos...
docker-compose run --rm backend npm run migrate

REM 5. Cargar datos de ejemplo
echo.
echo 📊 Cargando datos de ejemplo...
docker-compose run --rm backend npm run seed

REM 6. Levantar aplicaciones
echo.
echo 🚀 Levantando aplicaciones...
docker-compose up -d backend dashboard frontend

REM 7. Mostrar informacion
echo.
echo ✅ Sistema iniciado correctamente!
echo.
echo 📍 Servicios disponibles:
echo    - Backend API:    http://localhost:3000
echo    - Dashboard:      http://localhost:5173
echo    - Frontend Web:   http://localhost:3001
echo    - MySQL:          localhost:3306
echo    - Redis:          localhost:6379
echo.
echo 🔑 Credenciales Dashboard:
echo    Username: admin
echo    Password: admin123
echo.
echo 💡 Ver logs:  docker-compose logs -f
echo 💡 Detener:   docker-compose down
echo.
pause
