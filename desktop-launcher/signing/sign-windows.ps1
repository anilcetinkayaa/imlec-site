param(
    [string]$Root = "",
    [string[]]$Paths = @(),
    [string]$ReleaseVersion = "0.1.4",
    [ValidateSet("CodeSignTool", "SignTool")]
    [string]$Backend = $(if ($env:IMLEC_SIGN_BACKEND) { $env:IMLEC_SIGN_BACKEND } else { "CodeSignTool" }),
    [string]$CodeSignToolRoot = $env:IMLEC_CODESIGNTOOL_ROOT,
    [string]$CredentialId = $env:IMLEC_ESIGNER_CREDENTIAL_ID,
    [string]$CertThumbprint = $env:IMLEC_SIGN_CERT_SHA1,
    [string]$CertSubject = $env:IMLEC_SIGN_CERT_SUBJECT,
    [string]$TimestampUrl = $(if ($env:IMLEC_TIMESTAMP_URL) { $env:IMLEC_TIMESTAMP_URL } else { "http://ts.ssl.com" }),
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

function Resolve-CodeSignToolRoot {
    param([string]$ExplicitPath)

    $candidates = @()
    if ($ExplicitPath) {
        $candidates += $ExplicitPath
    }
    if ($env:LOCALAPPDATA) {
        $candidates += (Join-Path $env:LOCALAPPDATA "ImlecYazilim\SigningTools\CodeSignTool-v1.3.2-windows")
    }

    foreach ($candidate in $candidates) {
        if (Test-Path -LiteralPath (Join-Path $candidate "CodeSignTool.bat")) {
            return (Resolve-Path -LiteralPath $candidate).Path
        }
    }

    throw "SSL.com CodeSignTool bulunamadi. IMLEC_CODESIGNTOOL_ROOT ayarlayin."
}

function Get-DefaultArtifactPaths {
    param(
        [string]$RootPath,
        [string]$Version
    )

    $resolvedRoot = if ($RootPath) { Resolve-Path -LiteralPath $RootPath } else { Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..") }
    return @(
        (Join-Path $resolvedRoot "dist\ImlecLauncher\ImlecLauncher.exe"),
        (Join-Path $resolvedRoot "dist\ImlecLauncher\ImlecLauncherUpdater.exe"),
        (Join-Path $resolvedRoot "installer\output\ImlecLauncher_Setup_v$Version.exe")
    )
}

if ($Backend -eq "SignTool" -and -not $CertThumbprint -and -not $CertSubject) {
    throw "Sertifika secilmedi. IMLEC_SIGN_CERT_SHA1 veya IMLEC_SIGN_CERT_SUBJECT ayarlayin."
}

$targets = @()

if ($Paths.Count -gt 0) {
    foreach ($path in $Paths) {
        if (-not (Test-Path -LiteralPath $path)) {
            throw "Imzalanacak dosya bulunamadi: $path"
        }
        $targets += (Resolve-Path -LiteralPath $path).Path
    }
} else {
    $targets = @(Get-DefaultArtifactPaths -RootPath $Root -Version $ReleaseVersion)
}

foreach ($target in $targets) {
    if (-not (Test-Path -LiteralPath $target)) {
        throw "Imzalanacak artifact bulunamadi: $target"
    }
}

Write-Host "Signing launcher release $ReleaseVersion"
$targets | ForEach-Object { Write-Host "  $_" }
if ($WhatIf) {
    Write-Host "Backend: $Backend"
    exit 0
}

if ($Backend -eq "CodeSignTool") {
    $toolRoot = Resolve-CodeSignToolRoot -ExplicitPath $CodeSignToolRoot
    $java = Join-Path $toolRoot "jdk-11.0.2\bin\java.exe"
    $javac = Join-Path $toolRoot "jdk-11.0.2\bin\javac.exe"
    $jar = Get-ChildItem -LiteralPath (Join-Path $toolRoot "jar") -Filter "code_sign_tool-*.jar" |
        Select-Object -First 1
    if (-not (Test-Path -LiteralPath $java) -or -not (Test-Path -LiteralPath $javac) -or -not $jar) {
        throw "CodeSignTool Java bilesenleri eksik: $toolRoot"
    }

    $helperSource = Join-Path $PSScriptRoot "SecureCodeSign.java"
    $helperBuild = Join-Path $env:TEMP "imlec-secure-signing-helper"
    New-Item -ItemType Directory -Force -Path $helperBuild | Out-Null
    & $javac -cp $jar.FullName -d $helperBuild $helperSource
    if ($LASTEXITCODE -ne 0) {
        throw "Guvenli CodeSignTool baslaticisi derlenemedi."
    }

    $previousInput = $env:IMLEC_SIGN_INPUT
    $previousCredential = $env:IMLEC_SIGN_CREDENTIAL_ID
    try {
        $env:IMLEC_SIGN_INPUT = $targets -join "|"
        if ($CredentialId) {
            $env:IMLEC_SIGN_CREDENTIAL_ID = $CredentialId
        } else {
            Remove-Item Env:IMLEC_SIGN_CREDENTIAL_ID -ErrorAction SilentlyContinue
        }

        Push-Location $toolRoot
        try {
            & $java -cp "$helperBuild;$($jar.FullName)" SecureCodeSign
            if ($LASTEXITCODE -ne 0) {
                throw "CodeSignTool signing failed with exit code $LASTEXITCODE."
            }
        } finally {
            Pop-Location
        }
    } finally {
        if ($null -eq $previousInput) { Remove-Item Env:IMLEC_SIGN_INPUT -ErrorAction SilentlyContinue } else { $env:IMLEC_SIGN_INPUT = $previousInput }
        if ($null -eq $previousCredential) { Remove-Item Env:IMLEC_SIGN_CREDENTIAL_ID -ErrorAction SilentlyContinue } else { $env:IMLEC_SIGN_CREDENTIAL_ID = $previousCredential }
    }
} else {
    $signTool = Resolve-SignTool -ExplicitPath $SignToolPath
    $args = @("sign", "/fd", "SHA256", "/tr", $TimestampUrl, "/td", "SHA256", "/v")
    if ($CertThumbprint) {
        $args += @("/sha1", $CertThumbprint)
    } else {
        $args += @("/n", $CertSubject)
    }
    $args += $targets

    & $signTool @args
    if ($LASTEXITCODE -ne 0) {
        throw "signtool sign failed for launcher release $ReleaseVersion"
    }
}

& (Join-Path $PSScriptRoot "verify-signed-artifacts.ps1") -Root $Root -Paths $targets -ReleaseVersion $ReleaseVersion
if ($LASTEXITCODE -ne 0) {
    throw "Signature verification failed after signing."
}

Write-Host "Signing completed. Files: $($targets.Count)"
