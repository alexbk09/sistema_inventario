param(
    [switch]$Build
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$composeArgs = @('compose', 'up', '-d')

if ($Build) {
    $composeArgs += '--build'
}

Write-Host 'Levantando stack Docker...' -ForegroundColor Cyan
docker @composeArgs | Out-Host

$services = @('sistema_inventario_db', 'sistema_inventario_app', 'sistema_inventario_nginx')
$deadline = (Get-Date).AddMinutes(3)

while ((Get-Date) -lt $deadline) {
    $states = foreach ($service in $services) {
        docker inspect $service --format '{{.Name}}|{{.State.Status}}|{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' 2>$null
    }

    if ($states.Count -ne $services.Count) {
        Start-Sleep -Seconds 2
        continue
    }

    $parsedStates = $states | ForEach-Object {
        $parts = $_ -split '\|'
        [pscustomobject]@{
            Name = $parts[0].TrimStart('/')
            Status = $parts[1]
            Health = $parts[2]
        }
    }

    $allReady = $parsedStates | Where-Object {
        $_.Status -ne 'running' -or ($_.Health -notin @('healthy', 'none'))
    }

    if (-not $allReady) {
        Write-Host 'Stack listo.' -ForegroundColor Green
        $parsedStates | Format-Table -AutoSize | Out-Host
        Write-Host 'Aplicacion disponible en http://localhost:8080' -ForegroundColor Green
        exit 0
    }

    Start-Sleep -Seconds 3
}

Write-Error 'El stack no quedo listo dentro del tiempo esperado. Revisa: docker compose ps y docker compose logs --tail=120'