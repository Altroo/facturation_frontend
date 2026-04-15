$ErrorActionPreference = 'Stop'

function Import-EnvFile {
  param(
    [string]$Path,
    [hashtable]$Replacements
  )

  foreach ($rawLine in Get-Content $Path) {
    $line = $rawLine.Trim()
    if (-not $line -or $line.StartsWith('#')) {
      continue
    }

    $parts = $line -split '=', 2
    if ($parts.Count -ne 2) {
      continue
    }

    $name = $parts[0].Trim()
    $value = $parts[1].Trim()

    if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
      $value = $value.Substring(1, $value.Length - 2)
    }

    foreach ($pair in $Replacements.GetEnumerator()) {
      $value = $value.Replace($pair.Key, $pair.Value)
    }

    Set-Item -Path "Env:$name" -Value $value
  }
}

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$siteBase = 'http://localhost:3000'
$apiBase = 'http://localhost:8000'
$sourceEnv = @('.env.production', '.env.local', '.env.example') |
  ForEach-Object { Join-Path $repoRoot $_ } |
  Where-Object { Test-Path $_ } |
  Select-Object -First 1

if ($sourceEnv) {
  Import-EnvFile -Path $sourceEnv -Replacements @{
    'wss://facturation-api.elbouazzatiholding.ma/ws' = 'ws://localhost:8000/ws'
    'https://facturation-api.elbouazzatiholding.ma/api' = 'http://localhost:8000/api'
    'https://facturation-api.elbouazzatiholding.ma' = 'http://localhost:8000'
    'https://facturation.elbouazzatiholding.ma' = 'http://localhost:3000'
  }
}

$env:NODE_ENV = 'development'
$env:ALLOWED_ORIGINS = $siteBase
$env:NEXT_PUBLIC_BACKEND_DOMAIN = 'localhost:3000'
$env:NEXT_PUBLIC_BACKEND_API = "$apiBase/api"
$env:NEXT_PUBLIC_API_ROOT_URL = 'localhost'
$env:NEXT_PUBLIC_API_ROOT_PORT = '8000'
$env:NEXT_PUBLIC_API_URL = $apiBase
$env:NEXT_PUBLIC_ROOT_API_URL = "$apiBase/api"
$env:NEXT_PUBLIC_ROOT_WS_URL = 'ws://localhost:8000/ws'
$env:NEXT_PUBLIC_DOMAIN_URL_PREFIX = $siteBase
$env:NEXT_PUBLIC_HTTP_PROTOCOLE = 'http'
$env:NEXTAUTH_URL = $siteBase
$env:NEXTAUTH_URL_INTERNAL = "$siteBase/api/auth"

if (-not $env:NEXTAUTH_SECRET) {
  $env:NEXTAUTH_SECRET = 'facturation-demo-nextauth-secret'
}

Push-Location $repoRoot
try {
  bun run dev
}
finally {
  Pop-Location
}