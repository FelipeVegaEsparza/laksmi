# Script para limpiar en PowerShell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "==================================" -ForegroundColor Cyan
Write-Host " Limpiando Sistema Docker" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "ADVERTENCIA: Esto eliminara TODOS los datos!" -ForegroundColor Red
Write-Host ""

$confirm = Read-Host "Estas seguro? (S/N)"

if ($confirm -eq "S" -or $confirm -eq "s") {
    Write-Host ""
    Write-Host "[1/3] Deteniendo contenedores..." -ForegroundColor Yellow
    docker-compose down
    
    Write-Host "[2/3] Eliminando volumenes..." -ForegroundColor Yellow
    docker-compose down -v
    
    Write-Host "[3/3] Limpiando imagenes..." -ForegroundColor Yellow
    docker-compose rm -f
    
    Write-Host ""
    Write-Host "Sistema limpiado completamente!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Para iniciar de nuevo: .\docker-init.ps1" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "Operacion cancelada" -ForegroundColor Red
}
Write-Host ""
