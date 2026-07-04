#define MyAppName "İmleç Yazılım Merkezi"
#define MyAppVersion "0.1.6"
#define MyAppPublisher "İmleç Yazılım"
#define MyAppExeName "ImlecLauncher.exe"
#define SourceDir "..\dist\ImlecLauncher"
#define IconFile "..\assets\branding\imlec-yazilim.ico"

[Setup]
AppId={{A0AA3F06-35D5-4A95-9E7F-4A1E57C0DE11}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\İmleç Yazılım Merkezi
DefaultGroupName=İmleç Yazılım
DisableProgramGroupPage=yes
AllowNoIcons=yes
OutputDir=output
OutputBaseFilename=ImlecLauncher_Setup_v0.1.6
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
VersionInfoDescription=İmleç Yazılım Merkezi
VersionInfoProductName={#MyAppName}
VersionInfoProductVersion={#MyAppVersion}

[Languages]
Name: "turkish"; MessagesFile: "compiler:Languages\Turkish.isl"

[Dirs]
Name: "{localappdata}\ImlecYazilim"; Permissions: users-modify
Name: "{localappdata}\ImlecYazilim\Products"; Permissions: users-modify
Name: "{localappdata}\ImlecYazilim\Downloads"; Permissions: users-modify

[Files]
Source: "{#SourceDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\İmleç Yazılım Merkezi"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; IconFilename: "{app}\assets\branding\imlec-yazilim.ico"

[InstallDelete]
Type: files; Name: "{commondesktop}\Imlec Yazilim Launcher.lnk"
Type: files; Name: "{userdesktop}\Imlec Yazilim Launcher.lnk"
Type: files; Name: "{commondesktop}\İmleç Yazılım Merkezi.lnk"
Type: files; Name: "{userdesktop}\İmleç Yazılım Merkezi.lnk"

[Run]
Filename: "{sys}\WindowsPowerShell\v1.0\powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -Command ""Get-ChildItem -LiteralPath '{app}' -Recurse -Force | Unblock-File -ErrorAction SilentlyContinue"""; Flags: runhidden waituntilterminated
Filename: "{app}\{#MyAppExeName}"; Description: "Imlec Yazilim Launcher'i baslat"; Flags: nowait postinstall skipifsilent
