@echo off
echo 🚀 Iniciando backend en modo producción...
echo.
echo ⚠️  IMPORTANTE: Detén el servidor de desarrollo (Ctrl+C) antes de ejecutar esto
echo.
pause
echo.
echo 📁 Cambiando a directorio backend...
cd backend
echo.
echo 🔨 Compilando proyecto...
call npm run build
echo.
echo 🚀 Iniciando servidor en modo producción...
call npm run start