@echo off
echo 📋 Logs del Sistema
echo.
echo Selecciona el servicio:
echo 1. Todos
echo 2. Backend
echo 3. Dashboard
echo 4. Frontend
echo 5. MySQL
echo 6. Redis
echo.
set /p choice="Opcion (1-6): "

if "%choice%"=="1" docker-compose logs -f
if "%choice%"=="2" docker-compose logs -f backend
if "%choice%"=="3" docker-compose logs -f dashboard
if "%choice%"=="4" docker-compose logs -f frontend
if "%choice%"=="5" docker-compose logs -f mysql
if "%choice%"=="6" docker-compose logs -f redis
