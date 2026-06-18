$ErrorActionPreference = 'Stop'

$port = 8000
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$python = Get-Command python -ErrorAction SilentlyContinue
if (-not $python) {
  $python = Get-Command py -ErrorAction SilentlyContinue
}

if (-not $python) {
  throw 'Python is not available. Please install Python or start a local static server manually.'
}

$server = Start-Process -WindowStyle Hidden -PassThru -FilePath $python.Source -ArgumentList @('-m', 'http.server', $port) -WorkingDirectory $root
Start-Sleep -Seconds 1

$previewUrl = "http://127.0.0.1:$port/index.html"
$previewProfile = Join-Path $env:TEMP 'revid-preview-profile'
New-Item -ItemType Directory -Force -Path $previewProfile | Out-Null

$browserCandidates = @()
$chromeCommand = Get-Command chrome -ErrorAction SilentlyContinue
$edgeCommand = Get-Command msedge -ErrorAction SilentlyContinue
if ($chromeCommand) { $browserCandidates += $chromeCommand.Source }
if ($edgeCommand) { $browserCandidates += $edgeCommand.Source }
$browserCandidates += @(
  'C:\Program Files\Google\Chrome\Application\chrome.exe'
  'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe'
  'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
  'C:\Program Files\Microsoft\Edge\Application\msedge.exe'
)
$browserCandidates = $browserCandidates | Where-Object { $_ -and (Test-Path $_) } | Select-Object -Unique

$opened = $false
foreach ($browserPath in $browserCandidates) {
  try {
    Start-Process -FilePath $browserPath -ArgumentList @(
      "--user-data-dir=$previewProfile"
      '--no-first-run'
      '--no-default-browser-check'
      '--new-window'
      $previewUrl
    )
    $opened = $true
    Write-Host "Preview opened in: $browserPath"
    break
  } catch {
    continue
  }
}

if (-not $opened) {
  Start-Process $previewUrl
  Write-Host 'Preview opened in the default browser.'
}

Write-Host "Preview server started at $previewUrl"
Write-Host "Server PID: $($server.Id)"
