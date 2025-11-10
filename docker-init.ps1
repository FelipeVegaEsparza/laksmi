# Script de inicializacion para PowerShell
# Configurar codificacion UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " Iniciando Sistema Clinica de Belleza con Docker" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Levantar servicios
Write-Host "[1/6] Levantando MySQL y Redis..." -ForegroundColor Yellow
docker-compose up -d mysql redis

# 2. Esperar a que MySQL este listo
Write-Host "[2/6] Esperando a que MySQL este listo (15 segundos)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# 3. Verificar salud de servicios
Write-Host "[3/6] Verificando servicios..." -ForegroundColor Yellow
docker-compose ps
Write-Host ""

# 3.5 Configurar MySQL sql_mode
Write-Host "[3.5/6] Configurando MySQL..." -ForegroundColor Yellow
docker-compose exec mysql mysql -u root -proot123 -e "SET GLOBAL sql_mode='STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';" 2>$null
Write-Host ""

# 4. Ejecutar migraciones
Write-Host "[4/6] Ejecutando migraciones de base de datos..." -ForegroundColor Yellow
docker-compose run --rm backend npm run migrate
Write-Host ""

# 5. Cargar datos de ejemplo
Write-Host "[5/6] Cargando datos de ejemplo..." -ForegroundColor Yellow
docker-compose run --rm backend npm run seed
Write-Host ""

# 5.5 Crear usuario admin
Write-Host "[5.5/6] Creando usuario admin..." -ForegroundColor Yellow
docker-compose exec backend node create-admin.js
Write-Host ""

# 6. Levantar aplicaciones
Write-Host "[6/6] Levantando aplicaciones..." -ForegroundColor Yellow
docker-compose up -d backend dashboard frontend
Write-Host ""

# 7. Mostrar informacion
Write-Host "==================================================" -ForegroundColor Green
Write-Host " SISTEMA INICIADO CORRECTAMENTE!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Servicios disponibles:" -ForegroundColor Cyan
Write-Host "  - Backend API:    http://localhost:3000" -ForegroundColor White
Write-Host "  - Dashboard:      http://localhost:5173" -ForegroundColor White
Write-Host "  - Frontend Web:   http://localhost:3001" -ForegroundColor White
Write-Host "  - MySQL:          localhost:3306" -ForegroundColor White
Write-Host "  - Redis:          localhost:6379" -ForegroundColor White
Write-Host ""
Write-Host "Credenciales Dashboard:" -ForegroundColor Cyan
Write-Host "  Username: admin" -ForegroundColor White
Write-Host "  Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "Comandos utiles:" -ForegroundColor Yellow
Write-Host "  Ver logs:  docker-compose logs -f" -ForegroundColor White
Write-Host "  Detener:   docker-compose down" -ForegroundColor White
Write-Host "  Estado:    docker-compose ps" -ForegroundColor White
Write-Host ""
Write-Host "Presiona cualquier tecla para continuar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
