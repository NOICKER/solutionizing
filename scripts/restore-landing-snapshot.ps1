param(
  [string]$Snapshot = ""
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$snapshotsRoot = Join-Path $repoRoot "snapshots\\landing-page"
$latestFile = Join-Path $snapshotsRoot "LATEST.txt"

if (-not (Test-Path $snapshotsRoot)) {
  throw "No landing-page snapshots found at '$snapshotsRoot'."
}

if ([string]::IsNullOrWhiteSpace($Snapshot)) {
  if (-not (Test-Path $latestFile)) {
    throw "LATEST.txt not found. Pass -Snapshot explicitly."
  }
  $Snapshot = (Get-Content $latestFile -Raw).Trim()
}

$snapshotDir = Join-Path $snapshotsRoot $Snapshot
$manifestPath = Join-Path $snapshotDir "manifest.json"

if (-not (Test-Path $manifestPath)) {
  throw "Snapshot manifest not found: '$manifestPath'."
}

$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json

foreach ($relativePath in $manifest.files) {
  $sourcePath = Join-Path $snapshotDir $relativePath
  $targetPath = Join-Path $repoRoot $relativePath

  if (-not (Test-Path $sourcePath)) {
    throw "Missing file in snapshot: '$relativePath'."
  }

  $targetDir = Split-Path $targetPath -Parent
  if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
  }

  Copy-Item -Path $sourcePath -Destination $targetPath -Force
}

Write-Output "Restored landing snapshot: $Snapshot"
