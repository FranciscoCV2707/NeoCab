; NeoCab v3.0 Windows Installer
; NSIS Configuration File
; Built for: Windows 7+ (x86_64)

!include "MUI2.nsh"
!include "x64.nsh"
!include "LogicLib.nsh"

; Constants
!define PRODUCT_NAME "NeoCab"
!define PRODUCT_VERSION "3.0.0"
!define PRODUCT_PUBLISHER "NeoCab Project"
!define PRODUCT_WEB_SITE "https://github.com/neocab/NeoCab"
!define PRODUCT_DIR_REGKEY "Software\Microsoft\Windows\CurrentVersion\App Paths\NeoCab.exe"
!define PRODUCT_UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"

; Basic Settings
Name "${PRODUCT_NAME} ${PRODUCT_VERSION}"
OutFile "dist\NeoCab-v${PRODUCT_VERSION}-windows.msi"
InstallDir "$PROGRAMFILES64\${PRODUCT_NAME}"
InstallDirRegKey HKLM "${PRODUCT_DIR_REGKEY}" ""

; Request admin privileges
RequestExecutionLevel admin

; Version Information
VIProductVersion "${PRODUCT_VERSION}.0"
VIAddVersionKey /LANG=1033 "ProductName" "${PRODUCT_NAME}"
VIAddVersionKey /LANG=1033 "ProductVersion" "${PRODUCT_VERSION}"
VIAddVersionKey /LANG=1033 "CompanyName" "${PRODUCT_PUBLISHER}"
VIAddVersionKey /LANG=1033 "FileVersion" "${PRODUCT_VERSION}"
VIAddVersionKey /LANG=1033 "FileDescription" "Professional Arcade Cabinet Operating System"
VIAddVersionKey /LANG=1033 "LegalCopyright" "© 2026 NeoCab Project"

; UI Settings
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "LICENSE"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

; Language
!insertmacro MUI_LANGUAGE "English"

; MUI Settings
!define MUI_ABORTWARNING
!define MUI_ICON "public\icon.ico"
!define MUI_UNICON "public\icon.ico"
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP "public\header.bmp"

; Installation Sections
Section "Install NeoCab"
    SetOutPath "$INSTDIR"

    ; Check for WebView2
    ReadRegStr $0 HKLM "HKEY_LOCAL_MACHINE\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" "pv"
    ${If} $0 == ""
        MessageBox MB_OK "WebView2 Runtime is required. Please install it from microsoft.com/webview2"
        Goto InstallAbort
    ${EndIf}

    ; Copy executable
    File /oname=NeoCab.exe "src-tauri\target\release\neocab.exe"

    ; Copy data directory
    SetOutPath "$INSTDIR\data"
    File /r "data\*"

    ; Copy config files
    SetOutPath "$INSTDIR\config"
    File /r "config\*"

    ; Copy public assets
    SetOutPath "$INSTDIR\public"
    File /r "public\*"

    ; Copy documentation
    SetOutPath "$INSTDIR\docs"
    File /r "docs\*"

    ; Create Start Menu shortcuts
    CreateDirectory "$SMPROGRAMS\${PRODUCT_NAME}"
    CreateShortCut "$SMPROGRAMS\${PRODUCT_NAME}\${PRODUCT_NAME}.lnk" "$INSTDIR\NeoCab.exe"
    CreateShortCut "$SMPROGRAMS\${PRODUCT_NAME}\Documentation.lnk" "$INSTDIR\docs\README.md"
    CreateShortCut "$SMPROGRAMS\${PRODUCT_NAME}\Uninstall.lnk" "$INSTDIR\uninstall.exe"

    ; Create Desktop shortcut
    CreateShortCut "$DESKTOP\${PRODUCT_NAME}.lnk" "$INSTDIR\NeoCab.exe"

    ; Registry entries
    WriteRegStr HKLM "${PRODUCT_DIR_REGKEY}" "" "$INSTDIR\NeoCab.exe"
    WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "DisplayName" "${PRODUCT_NAME} ${PRODUCT_VERSION}"
    WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "DisplayVersion" "${PRODUCT_VERSION}"
    WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "Publisher" "${PRODUCT_PUBLISHER}"
    WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "URLInfoAbout" "${PRODUCT_WEB_SITE}"
    WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "UninstallString" "$INSTDIR\uninstall.exe"
    WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "DisplayIcon" "$INSTDIR\NeoCab.exe,0"

    ; Install size
    ${GetSize} "$INSTDIR" /S=0K $0
    WriteRegDWORD HKLM "${PRODUCT_UNINST_KEY}" "EstimatedSize" $0

    ; Write uninstaller
    WriteUninstaller "$INSTDIR\uninstall.exe"

    Goto InstallEnd
    InstallAbort:
        Quit
    InstallEnd:
SectionEnd

; Uninstall Section
Section "Uninstall"
    ; Stop running process
    ExecWait "taskkill /IM NeoCab.exe /F 2>nul || true"

    ; Wait for process to close
    Sleep 1000

    ; Delete application files
    Delete "$INSTDIR\NeoCab.exe"
    Delete "$INSTDIR\uninstall.exe"
    RMDir /r "$INSTDIR\data"
    RMDir /r "$INSTDIR\config"
    RMDir /r "$INSTDIR\public"
    RMDir /r "$INSTDIR\docs"
    RMDir "$INSTDIR"

    ; Delete shortcuts
    RMDir /r "$SMPROGRAMS\${PRODUCT_NAME}"
    Delete "$DESKTOP\${PRODUCT_NAME}.lnk"

    ; Delete registry entries
    DeleteRegKey HKLM "${PRODUCT_DIR_REGKEY}"
    DeleteRegKey HKLM "${PRODUCT_UNINST_KEY}"
SectionEnd

; Helper function to get directory size
!include "nsDialogs.nsh"
!include "WinMessages.nsh"
