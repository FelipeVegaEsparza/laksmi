# Script para arreglar el sql_mode de MySQL
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " Arreglando MySQL sql_mode" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/3] Configurando sql_mode en MySQL..." -ForegroundColor Yellow
docker-compose exec mysql mysql -u root -proot123 -e "SET GLOBAL sql_mode='STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';"

Write-Host ""
Write-Host "[2/3] Verificando configuracion..." -ForegroundColor Yellow
docker-compose exec mysql mysql -u clinica_user -pclinica_pass -e "SELECT @@sql_mode;"

Write-Host ""
Write-Host "[3/3] Reiniciando backend..." -ForegroundColor Yellow
docker-compose restart backend

Write-Host ""
Write-Host "==================================================" -ForegroundColor Green
Write-Host " MySQL configurado correctamente!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Ahora recarga el dashboard (Ctrl+Shift+R)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Presiona cualquier tecla para continuar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
