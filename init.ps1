# Reemplaza con tus valores reales
$token = "tu-clave-super-secreta-aleatoria"
$url = "https://tu-app.vercel.app/api/admin/init"

Write-Host "Inicializando base de datos en Vercel..." -ForegroundColor Cyan

$response = Invoke-WebRequest -Uri $url -Method POST `
  -Headers @{ "Authorization" = "Bearer $token" } `
  -ContentType "application/json"

Write-Host $response.Content -ForegroundColor Green
Write-Host "✓ Base de datos inicializada exitosamente!" -ForegroundColor Green