# Windows NSIS Installer Build Script
# Usage: .\build-nsis.ps1

param(
    [string]$version = "3.0.0",
    [string]$outputDir = "./dist",
    [switch]$sign = $false
)

Write-Host "================================================" -ForegroundColor Yellow
Write-Host "NeoCab v3.0 - Windows NSIS Installer Builder" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Cyan

# Check if Tauri build exists
if (-not (Test-Path "./src-tauri/target/release")) {
    Write-Host "Error: Tauri release build not found. Run: cargo build --release" -ForegroundColor Red
    exit 1
}

# Check if NSIS is installed
$nsis_path = "C:\Program Files (x86)\NSIS\makensis.exe"
if (-not (Test-Path $nsis_path)) {
    Write-Host "Error: NSIS not found at $nsis_path. Please install NSIS first." -ForegroundColor Red
    exit 1
}

Write-Host "✓ Prerequisites OK" -ForegroundColor Green

# Create output directory
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
}

# Create NSIS script
Write-Host "Generating NSIS installer script..." -ForegroundColor Cyan

$nsis_content = @"
; NeoCab v3.0 Installer Script
; Windows NSIS Installer

!include "MUI2.nsh"
!include "x64.nsh"

; Basic Settings
Name "NeoCab v3.0"
OutFile "$outputDir\NeoCab-v${version}-windows.msi"
InstallDir "`$PROGRAMFILES64\NeoCab"
InstallDirRegKey HKLM "Software\NeoCab" "InstallDir"

; UI Settings
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_LANGUAGE "English"

; Installation Sections
Section "Install"
    SetOutPath "`$INSTDIR"

    ; Copy executable
    File /oname=NeoCab.exe "./src-tauri/target/release/neocab.exe"

    ; Copy data directory
    SetOutPath "`$INSTDIR\data"
    File /r "./data/*"

    ; Copy config files
    SetOutPath "`$INSTDIR\config"
    File /r "./config/*"

    ; Copy public assets
    SetOutPath "`$INSTDIR\public"
    File /r "./public/*"

    ; Create Start Menu shortcuts
    CreateDirectory "`$SMPROGRAMS\NeoCab"
    CreateShortCut "`$SMPROGRAMS\NeoCab\NeoCab.lnk" "`$INSTDIR\NeoCab.exe"
    CreateShortCut "`$SMPROGRAMS\NeoCab\Uninstall.lnk" "`$INSTDIR\uninstall.exe"

    ; Create Desktop shortcut
    CreateShortCut "`$DESKTOP\NeoCab.lnk" "`$INSTDIR\NeoCab.exe"

    ; Registry entries
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\NeoCab" "DisplayName" "NeoCab v${version}"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\NeoCab" "DisplayVersion" "${version}"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\NeoCab" "UninstallString" "`$INSTDIR\uninstall.exe"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\NeoCab" "DisplayIcon" "`$INSTDIR\NeoCab.exe"
    WriteRegStr HKLM "Software\NeoCab" "InstallDir" "`$INSTDIR"

    ; Write uninstaller
    WriteUninstaller "`$INSTDIR\uninstall.exe"
SectionEnd

; Uninstall Section
Section "Uninstall"
    ; Delete application files
    Delete "`$INSTDIR\NeoCab.exe"
    RMDir /r "`$INSTDIR\data"
    RMDir /r "`$INSTDIR\config"
    RMDir /r "`$INSTDIR\public"
    Delete "`$INSTDIR\uninstall.exe"
    RMDir "`$INSTDIR"

    ; Delete shortcuts
    RMDir /r "`$SMPROGRAMS\NeoCab"
    Delete "`$DESKTOP\NeoCab.lnk"

    ; Delete registry entries
    DeleteRegKey HKLM "Software\NeoCab"
    DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\NeoCab"
SectionEnd
"@

# Write NSIS script to file
$nsis_script = "./build-scripts/NeoCab-installer.nsi"
Set-Content -Path $nsis_script -Value $nsis_content -Encoding UTF8

Write-Host "✓ NSIS script generated: $nsis_script" -ForegroundColor Green

# Build installer
Write-Host "Building Windows installer..." -ForegroundColor Cyan
& $nsis_path $nsis_script

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Installer built successfully" -ForegroundColor Green
    Get-Item "$outputDir/NeoCab-v*.msi" | ForEach-Object {
        Write-Host "  Output: $_" -ForegroundColor Green
        Write-Host "  Size: $('{0:N0}' -f $_.Length) bytes" -ForegroundColor Green
    }
} else {
    Write-Host "✗ Installer build failed" -ForegroundColor Red
    exit 1
}

# Optional code signing
if ($sign) {
    Write-Host "Signing installer..." -ForegroundColor Cyan
    $signtool = "C:\Program Files (x86)\Windows Kits\10\bin\x64\signtool.exe"

    if (Test-Path $signtool) {
        # Note: Requires certificate in store
        # & $signtool sign /f "path\to\cert.pfx" /p "password" "$outputDir\NeoCab-v${version}-windows.msi"
        Write-Host "⚠ Code signing skipped (configure certificate path in script)" -ForegroundColor Yellow
    }
}

Write-Host "================================================" -ForegroundColor Yellow
Write-Host "Build complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Yellow
