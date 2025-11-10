@echo off
echo 🧹 Limpiando Sistema Docker...
echo.
echo ⚠️  ADVERTENCIA: Esto eliminara TODOS los datos!
echo.
set /p confirm="¿Estas seguro? (S/N): "

if /i "%confirm%"=="S" (
    echo.
    echo 🛑 Deteniendo contenedores...
    docker-compose down
    
    echo 🗑️  Eliminando volumenes...
    docker-compose down -v
    
    echo 🧹 Limpiando imagenes...
    docker-compose rm -f
    
    echo.
    echo ✅ Sistema limpiado completamente!
    echo.
    echo 💡 Para iniciar de nuevo: docker-init.bat
) else (
    echo.
    echo ❌ Operacion cancelada
)
echo.
pause
