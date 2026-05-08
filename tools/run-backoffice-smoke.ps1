param(
    [switch]$Cleanup,
    [switch]$SkipBuild,
    [string]$AppContainer = 'sistema_inventario_app'
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
Push-Location $repoRoot

try {
    if ($Cleanup) {
        Write-Host '==> Eliminando fixtures smoke del backoffice'
        docker exec $AppContainer php artisan db:seed --class=BackofficeSmokeCleanupSeeder --force
        Write-Host ''
        Write-Host 'Fixtures smoke eliminados.'
        return
    }

    if (-not $SkipBuild) {
        Write-Host '==> Ejecutando build frontend'
        npm run build
    }

    Write-Host '==> Regenerando fixtures smoke del backoffice'
    docker exec $AppContainer php artisan db:seed --class=BackofficeSmokeSeeder --force

    Write-Host ''
    Write-Host 'Smoke test listo.'
    Write-Host 'URLs sugeridas:'
    Write-Host '  http://localhost:8080/admin/warehouses'
    Write-Host '  http://localhost:8080/admin/reports/sales'
    Write-Host '  http://localhost:8080/admin/reports/inventory'
    Write-Host '  http://localhost:8080/admin/reports/credits'
    Write-Host '  http://localhost:8080/admin/reports/credits/movements'
    Write-Host '  http://localhost:8080/admin/reports/layaways'
    Write-Host '  http://localhost:8080/admin/rmas'
    Write-Host ''
    Write-Host 'Fixtures esperados:'
    Write-Host '  Sucursal: Sucursal QA Temporal (QA01)'
    Write-Host '  Venta: QA-VENTA-001 con metodo cash'
    Write-Host '  Cliente credito: Cliente Credito QA'
    Write-Host '  Factura credito: QA-CRED-001'
    Write-Host '  Apartados: QA-LAY-001, QA-LAY-002, QA-LAY-003'
    Write-Host '  Devoluciones: QA-RMA-001, QA-RMA-002'
}
finally {
    Pop-Location
}