# Script para ver logs en PowerShell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "==================================" -ForegroundColor Cyan
Write-Host " Logs del Sistema" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Selecciona el servicio:" -ForegroundColor Yellow
Write-Host "  1. Todos"
Write-Host "  2. Backend"
Write-Host "  3. Dashboard"
Write-Host "  4. Frontend"
Write-Host "  5. MySQL"
Write-Host "  6. Redis"
Write-Host ""

$choice = Read-Host "Opcion (1-6)"

switch ($choice) {
    "1" { docker-compose logs -f }
    "2" { docker-compose logs -f backend }
    "3" { docker-compose logs -f dashboard }
    "4" { docker-compose logs -f frontend }
    "5" { docker-compose logs -f mysql }
    "6" { docker-compose logs -f redis }
    default { Write-Host "Opcion invalida" -ForegroundColor Red }
}
