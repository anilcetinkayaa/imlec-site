param(
    [string]$Root = "",
    [string[]]$Paths = @(),
    [string]$SignToolPath = $env:SIGNTOOL_PATH
)

$ErrorActionPreference = "Stop"

function Resolve-SignTool {
    param([string]$ExplicitPath)

    if ($ExplicitPath -and (Test-Path -LiteralPath $ExplicitPath)) {
        return (Resolve-Path -LiteralPath $ExplicitPath).Path
    }

    $command = Get-Command signtool.exe -ErrorAction SilentlyContinue
    if ($command) {
        return $command.Source
    }

    $kitsRoot = "${env:ProgramFiles(x86)}\Windows Kits\10\bin"
    if (Test-Path -LiteralPath $kitsRoot) {
        $candidate = Get-ChildItem -Path $kitsRoot -Filter signtool.exe -Recurse -ErrorAction SilentlyContinue |
            Where-Object { $_.FullName -match "\\x64\\signtool\.exe$" } |
            Sort-Object FullName -Descending |
            Select-Object -First 1
        if ($candidate) {
            return $candidate.FullName
        }
    }

    return $null
}

function Get-DefaultArtifactPaths {
    param([string]$RootPath)

    $resolvedRoot = if ($RootPath) { Resolve-Path -LiteralPath $RootPath } else { Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..") }
    $items = New-Object System.Collections.Generic.List[string]

    $launcherDist = Join-Path $resolvedRoot "dist\ImlecLauncher"
    if (Test-Path -LiteralPath $launcherDist) {
        Get-ChildItem -Path $launcherDist -Recurse -File -Include *.exe,*.dll |
            ForEach-Object { $items.Add($_.FullName) }
    }

    $installerOutput = Join-Path $resolvedRoot "installer\output"
    if (Test-Path -LiteralPath $installerOutput) {
        Get-ChildItem -Path $installerOutput -File -Include *.exe,*.msi |
            ForEach-Object { $items.Add($_.FullName) }
    }

    if ($env:FIS260_RELEASE_ROOT -and (Test-Path -LiteralPath $env:FIS260_RELEASE_ROOT)) {
        Get-ChildItem -Path $env:FIS260_RELEASE_ROOT -Recurse -File -Include *.exe,*.dll |
            ForEach-Object { $items.Add($_.FullName) }
    }

    return $items | Sort-Object -Unique
}

$targets = @()
if ($Paths.Count -gt 0) {
    foreach ($path in $Paths) {
        if (-not (Test-Path -LiteralPath $path)) {
            throw "Dogrulanacak dosya bulunamadi: $path"
        }
        $targets += (Resolve-Path -LiteralPath $path).Path
    }
} else {
    $targets = @(Get-DefaultArtifactPaths -RootPath $Root)
}

if ($targets.Count -eq 0) {
    throw "Dogrulanacak artifact bulunamadi."
}

$signTool = Resolve-SignTool -ExplicitPath $SignToolPath
$failed = New-Object System.Collections.Generic.List[string]

foreach ($target in $targets) {
    $signature = Get-AuthenticodeSignature -LiteralPath $target
    if ($signature.Status -ne "Valid") {
        $failed.Add("$target :: Authenticode=$($signature.Status) :: $($signature.StatusMessage)")
        continue
    }

    if ($signTool) {
        & $signTool verify /pa /v $target | Out-Host
        if ($LASTEXITCODE -ne 0) {
            $failed.Add("$target :: signtool verify failed")
        }
    }
}

if ($failed.Count -gt 0) {
    Write-Error "Imzasiz/gecersiz artifact bulundu:`n$($failed -join "`n")"
    exit 1
}

Write-Host "All artifacts are signed and valid. Files: $($targets.Count)"
