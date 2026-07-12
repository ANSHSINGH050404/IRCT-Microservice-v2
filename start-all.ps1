$root = $PSScriptRoot

$services = @(
  @{ Name = "user-service";       Cmd = "bun"; Args = "dev";            Dir = "user-service" }
  @{ Name = "search-service";     Cmd = "bun"; Args = "run index.ts";   Dir = "search-service" }
  @{ Name = "admin-service";      Cmd = "bun"; Args = "dev";            Dir = "admin-service" }
  @{ Name = "notification-service"; Cmd = "bun"; Args = "dev";          Dir = "notification-service" }
  @{ Name = "api-gateway";        Cmd = "bun"; Args = "dev";            Dir = "api-gateway" }
  @{ Name = "frontend";           Cmd = "npm"; Args = "run dev";        Dir = "frontend" }
)

Write-Host "Starting all IRCT services..." -ForegroundColor Cyan

foreach ($svc in $services) {
  $dir = Join-Path $root $svc.Dir
  Start-Process -WindowStyle Normal -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd '$dir'; $($svc.Cmd) $($svc.Args)"
  Write-Host "  Started $($svc.Name)" -ForegroundColor Green
  Start-Sleep -Milliseconds 500
}

Write-Host "`nAll services launched in separate windows." -ForegroundColor Cyan
