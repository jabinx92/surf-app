$ErrorActionPreference = "Stop"
$env:SUPABASE_OUTPUT = $null
$env:CI = $null

Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)
Write-Host "WaveLens Supabase setup" -ForegroundColor Cyan

$supabaseUrlLine = Get-Content ".env.local" |
  Where-Object { $_ -match "^EXPO_PUBLIC_SUPABASE_URL=" } |
  Select-Object -First 1

if (-not $supabaseUrlLine) {
  throw "EXPO_PUBLIC_SUPABASE_URL is missing from .env.local."
}

$supabaseUrl = $supabaseUrlLine.Split("=", 2)[1].Trim()
$projectRef = ([uri]$supabaseUrl).Host.Split(".")[0]

npx.cmd supabase login --agent no --output-format text
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npx.cmd supabase link --project-ref $projectRef --agent no --output-format text
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npx.cmd supabase db push --include-all --agent no --output-format text
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Finished. Tell Codex: Supabase done" -ForegroundColor Green
