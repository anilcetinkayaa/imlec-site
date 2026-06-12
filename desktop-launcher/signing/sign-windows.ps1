param(
    [string]$Root = "",
    [string[]]$Paths = @(),
    [string]$CertThumbprint = $env:IMLEC_SIGN_CERT_SHA1,
    [string]$CertSubject = $env:IMLEC_SIGN_CERT_SUBJECT,
    [string]$TimestampUrl = $(if ($env:IMLEC_TIMESTAMP_URL) { $env:IMLEC_TIMESTAMP_URL } else { "http://timestamp.sectigo.com" }),
    [string]$SignToolPath = $env:SIGNTOOL_PATH,
    [switch]$WhatIf
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

    throw "signtool.exe bulunamadi. Windows SDK kurun veya SIGNTOOL_PATH ayarlayin."
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

if (-not $CertThumbprint -and -not $CertSubject) {
    throw "Sertifika secilmedi. IMLEC_SIGN_CERT_SHA1 veya IMLEC_SIGN_CERT_SUBJECT ayarlayin."
}

$signTool = Resolve-SignTool -ExplicitPath $SignToolPath
$targets = @()

if ($Paths.Count -gt 0) {
    foreach ($path in $Paths) {
        if (-not (Test-Path -LiteralPath $path)) {
            throw "Imzalanacak dosya bulunamadi: $path"
        }
        $targets += (Resolve-Path -LiteralPath $path).Path
    }
} else {
    $targets = @(Get-DefaultArtifactPaths -RootPath $Root)
}

if ($targets.Count -eq 0) {
    throw "Imzalanacak artifact bulunamadi."
}

foreach ($target in $targets) {
    $args = @("sign", "/fd", "SHA256", "/tr", $TimestampUrl, "/td", "SHA256", "/v")
    if ($CertThumbprint) {
        $args += @("/sha1", $CertThumbprint)
    } else {
        $args += @("/n", $CertSubject)
    }
    $args += $target

    Write-Host "Signing: $target"
    if ($WhatIf) {
        Write-Host "  $signTool $($args -join ' ')"
        continue
    }

    & $signTool @args
    if ($LASTEXITCODE -ne 0) {
        throw "signtool sign failed: $target"
    }
}

Write-Host "Signing completed. Files: $($targets.Count)"
