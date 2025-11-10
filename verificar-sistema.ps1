# Script de verificacion del sistema
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " Verificacion del Sistema" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar contenedores
Write-Host "[1/5] Estado de contenedores:" -ForegroundColor Yellow
docker-compose ps
Write-Host ""

# 2. Verificar logs del backend
Write-Host "[2/5] Ultimas lineas del log del backend:" -ForegroundColor Yellow
docker-compose logs --tail=20 backend
Write-Host ""

# 3. Verificar conexion a MySQL
Write-Host "[3/5] Verificando conexion a MySQL:" -ForegroundColor Yellow
docker-compose exec mysql mysql -u clinica_user -pclinica_pass -e "SELECT 'Conexion exitosa' as status;"
Write-Host ""

# 4. Verificar tablas en la base de datos
Write-Host "[4/5] Tablas en la base de datos:" -ForegroundColor Yellow
docker-compose exec mysql mysql -u clinica_user -pclinica_pass clinica_belleza -e "SHOW TABLES;"
Write-Host ""

# 5. Verificar usuario admin
Write-Host "[5/5] Verificando usuario admin:" -ForegroundColor Yellow
docker-compose exec mysql mysql -u clinica_user -pclinica_pass clinica_belleza -e "SELECT id, email, role FROM users WHERE email='admin@clinica.com';"
Write-Host ""

Write-Host "==================================================" -ForegroundColor Green
Write-Host " Verificacion completada" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Presiona cualquier tecla para continuar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
