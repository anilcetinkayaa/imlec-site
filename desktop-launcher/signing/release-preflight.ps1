param(
    [string]$Root = "",
    [string]$ReleaseVersion = $(if ($env:IMLEC_LAUNCHER_VERSION) { $env:IMLEC_LAUNCHER_VERSION } else { "0.1.3" })
)

$ErrorActionPreference = "Stop"

$launcherRoot = if ($Root) { $Root } else { Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..") }
$setupPath = Join-Path $launcherRoot "installer\output\ImlecLauncher_Setup_v$ReleaseVersion.exe"
$launcherExe = Join-Path $launcherRoot "dist\ImlecLauncher\ImlecLauncher.exe"
$updaterExe = Join-Path $launcherRoot "dist\ImlecLauncher\ImlecLauncherUpdater.exe"

$required = @($launcherExe, $updaterExe, $setupPath)

foreach ($path in $required) {
    if (-not (Test-Path -LiteralPath $path)) {
        throw "Release artifact eksik: $path"
    }
}

& (Join-Path $PSScriptRoot "verify-signed-artifacts.ps1") -Root $launcherRoot -ReleaseVersion $ReleaseVersion
if ($LASTEXITCODE -ne 0) {
    throw "Signature preflight failed."
}

Write-Host "Release preflight passed."
