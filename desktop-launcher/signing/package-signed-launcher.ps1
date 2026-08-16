param(
    [string]$Root = "",
    [Parameter(Mandatory = $true)]
    [string]$ReleaseVersion,
    [string]$SignToolPath = $env:SIGNTOOL_PATH
)

$ErrorActionPreference = "Stop"

function Resolve-LauncherRoot {
    param([string]$RootPath)

    if ($RootPath) {
        return (Resolve-Path -LiteralPath $RootPath).Path
    }
    return (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
}

function Read-LauncherVersion {
    param([string]$LauncherRoot)

    $sourcePath = Join-Path $LauncherRoot "imlec_launcher.py"
    $match = Select-String -LiteralPath $sourcePath -Pattern '^LAUNCHER_VERSION\s*=\s*"([^"]+)"' | Select-Object -First 1
    if (-not $match) {
        throw "LAUNCHER_VERSION bulunamadi: $sourcePath"
    }
    return $match.Matches[0].Groups[1].Value
}

function Read-InstallerVersion {
    param([string]$LauncherRoot)

    $issPath = Join-Path $LauncherRoot "installer\ImlecLauncher.iss"
    $match = Select-String -LiteralPath $issPath -Pattern '^#define\s+MyAppVersion\s+"([^"]+)"' | Select-Object -First 1
    if (-not $match) {
        throw "Installer MyAppVersion bulunamadi: $issPath"
    }
    return $match.Matches[0].Groups[1].Value
}

function New-ZipFromDirectory {
    param(
        [string]$SourceDirectory,
        [string]$DestinationZip
    )

    Add-Type -AssemblyName System.IO.Compression.FileSystem
    if (Test-Path -LiteralPath $DestinationZip) {
        Remove-Item -LiteralPath $DestinationZip -Force
    }
    $parent = Split-Path -Parent $SourceDirectory
    $leaf = Split-Path -Leaf $SourceDirectory
    $tempZipRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("imlec-zip-" + [guid]::NewGuid().ToString("N"))
    try {
        New-Item -ItemType Directory -Force -Path $tempZipRoot | Out-Null
        Copy-Item -LiteralPath $SourceDirectory -Destination (Join-Path $tempZipRoot $leaf) -Recurse -Force
        [System.IO.Compression.ZipFile]::CreateFromDirectory($tempZipRoot, $DestinationZip, [System.IO.Compression.CompressionLevel]::Optimal, $false)
    } finally {
        Remove-Item -LiteralPath $tempZipRoot -Recurse -Force -ErrorAction SilentlyContinue
    }
}

$launcherRoot = Resolve-LauncherRoot -RootPath $Root
$sourceVersion = Read-LauncherVersion -LauncherRoot $launcherRoot
$installerVersion = Read-InstallerVersion -LauncherRoot $launcherRoot

if ($sourceVersion -ne $ReleaseVersion) {
    throw "Surum uyumsuz: imlec_launcher.py=$sourceVersion ReleaseVersion=$ReleaseVersion"
}
if ($installerVersion -ne $ReleaseVersion) {
    throw "Surum uyumsuz: ImlecLauncher.iss=$installerVersion ReleaseVersion=$ReleaseVersion"
}

$distDir = Join-Path $launcherRoot "dist\ImlecLauncher"
$launcherExe = Join-Path $distDir "ImlecLauncher.exe"
$updaterExe = Join-Path $distDir "ImlecLauncherUpdater.exe"
$required = @($launcherExe, $updaterExe)

foreach ($path in $required) {
    if (-not (Test-Path -LiteralPath $path)) {
        throw "Paketlenecek dosya eksik: $path"
    }
}

& (Join-Path $PSScriptRoot "verify-signed-artifacts.ps1") -Root $launcherRoot -Paths $required -ReleaseVersion $ReleaseVersion -SignToolPath $SignToolPath
if ($LASTEXITCODE -ne 0) {
    throw "Imza dogrulamasi gecmedi. ZIP uretilmedi."
}

$releaseDir = Join-Path $launcherRoot "releases"
New-Item -ItemType Directory -Force -Path $releaseDir | Out-Null

$appZip = Join-Path $releaseDir "ImlecLauncher-$ReleaseVersion-app-windows-x64.zip"
New-ZipFromDirectory -SourceDirectory $distDir -DestinationZip $appZip

$hash = (Get-FileHash -LiteralPath $appZip -Algorithm SHA256).Hash.ToLowerInvariant()
$size = (Get-Item -LiteralPath $appZip).Length
$manifestPath = Join-Path $releaseDir "ImlecLauncher-$ReleaseVersion-app-windows-x64.manifest.json"

$manifest = [ordered]@{
    product = "launcher"
    kind = "app-update"
    version = $ReleaseVersion
    file = (Split-Path -Leaf $appZip)
    sizeBytes = $size
    sha256 = $hash
    createdAt = (Get-Date).ToUniversalTime().ToString("o")
    signedArtifacts = @(
        "ImlecLauncher.exe",
        "ImlecLauncherUpdater.exe"
    )
}

($manifest | ConvertTo-Json -Depth 5) | Set-Content -LiteralPath $manifestPath -Encoding UTF8

Write-Host "Launcher app update paketi hazir:"
Write-Host "  ZIP: $appZip"
Write-Host "  SHA256: $hash"
Write-Host "  SIZE: $size"
Write-Host "  MANIFEST: $manifestPath"
