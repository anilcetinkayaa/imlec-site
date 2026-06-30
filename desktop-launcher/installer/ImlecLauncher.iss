#define MyAppName "Imlec Yazilim Launcher"
#define MyAppVersion "0.1.3"
#define MyAppPublisher "Imlec Yazilim"
#define MyAppExeName "ImlecLauncher.exe"
#define SourceDir "..\dist\ImlecLauncher"
#define IconFile "..\assets\branding\imlec-yazilim.ico"

[Setup]
AppId={{A0AA3F06-35D5-4A95-9E7F-4A1E57C0DE11}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\Imlec Yazilim Launcher
DefaultGroupName=Imlec Yazilim
DisableProgramGroupPage=yes
AllowNoIcons=yes
OutputDir=output
OutputBaseFilename=ImlecLauncher_Setup_v0.1.3
SetupIconFile={#IconFile}
UninstallDisplayIcon={app}\{#MyAppExeName}
Compression=lzma2/ultra64
SolidCompression=yes
LZMAUseSeparateProcess=yes
WizardStyle=modern
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
PrivilegesRequired=admin
CloseApplications=yes
RestartApplications=no
VersionInfoVersion={#MyAppVersion}
VersionInfoCompany={#MyAppPublisher}
VersionInfoDescription=Imlec Yazilim Launcher
VersionInfoProductName={#MyAppName}
VersionInfoProductVersion={#MyAppVersion}

[Languages]
Name: "turkish"; MessagesFile: "compiler:Languages\Turkish.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: checkedonce

[Dirs]
Name: "{localappdata}\ImlecYazilim"; Permissions: users-modify
Name: "{localappdata}\ImlecYazilim\Products"; Permissions: users-modify
Name: "{localappdata}\ImlecYazilim\Downloads"; Permissions: users-modify

[Files]
Source: "{#SourceDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\Imlec Yazilim Launcher"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; IconFilename: "{app}\assets\branding\imlec-yazilim.ico"
Name: "{commondesktop}\Imlec Yazilim Launcher"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; IconFilename: "{app}\assets\branding\imlec-yazilim.ico"; Tasks: desktopicon

[Run]
Filename: "{sys}\WindowsPowerShell\v1.0\powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -Command ""Get-ChildItem -LiteralPath '{app}' -Recurse -Force | Unblock-File -ErrorAction SilentlyContinue"""; Flags: runhidden waituntilterminated
Filename: "{app}\{#MyAppExeName}"; Description: "Imlec Yazilim Launcher'i baslat"; Flags: nowait postinstall skipifsilent
