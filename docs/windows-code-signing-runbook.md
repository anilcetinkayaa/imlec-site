# Windows Code Signing Runbook

Bu not, Imlec Launcher ve FIS260 public release surecinde imzasiz EXE cikmasini engellemek icin hazirlandi.

## Karar

- Imzasiz EXE ile musteri dagitimi yapilmayacak.
- SSL.com validation tamamlanana kadar yeni public installer release cikmayacak.
- Launcher, updater, FIS260 ve setup dosyalari Windows Authenticode ile imzalanacak.
- GitHub Release artifact'leri imzali dosyalardan olusacak.

## Imzalanacak dosyalar

Launcher:

- `desktop-launcher/dist/ImlecLauncher/ImlecLauncher.exe`
- `desktop-launcher/dist/ImlecLauncher/ImlecLauncherUpdater.exe`
- `desktop-launcher/installer/output/ImlecLauncher_Setup_v*.exe`
- Launcher dagitim klasorundeki yardimci `.dll` dosyalari

FIS260:

- `FIS260.exe`
- `FIS260Updater.exe`
- FIS260 installer veya updater tarafindan calistirilan yardimci `.exe` dosyalari
- Dagitim paketindeki yardimci `.dll` dosyalari

## Ortam degiskenleri

Sertifika aktif olduktan sonra makinede su degiskenlerden biri ayarlanir:

```powershell
$env:IMLEC_SIGN_CERT_SHA1 = "<certificate-thumbprint>"
```

veya:

```powershell
$env:IMLEC_SIGN_CERT_SUBJECT = "Anil Cetinkaya"
```

Opsiyonel:

```powershell
$env:SIGNTOOL_PATH = "C:\Program Files (x86)\Windows Kits\10\bin\<version>\x64\signtool.exe"
$env:IMLEC_TIMESTAMP_URL = "http://timestamp.sectigo.com"
$env:FIS260_RELEASE_ROOT = "C:\FIS260\dist\FIS260"
```

## Imzalama

Launcher artifact'leri icin:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\desktop-launcher\signing\sign-windows.ps1 -Root .\desktop-launcher
```

FIS260 artifact'lerini ayni kontrolden gecirmek icin once:

```powershell
$env:FIS260_RELEASE_ROOT = "C:\FIS260\dist\FIS260"
```

sonra ayni imza script'i calistirilir.

## Dogrulama

Toplu dogrulama:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\desktop-launcher\signing\verify-signed-artifacts.ps1 -Root .\desktop-launcher
```

Tek dosya icin resmi dogrulama:

```powershell
signtool verify /pa /v <dosya>
```

Windows arayuz kontrolu:

- Dosya ozellikleri acilir.
- `Digital Signatures` sekmesi gorunmelidir.
- Imza sahibi SSL.com sertifikasindaki isimle uyumlu olmalidir.

## Release kapisi

Public release oncesi:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\desktop-launcher\signing\release-preflight.ps1 -Root .\desktop-launcher
```

Bu komut basarisizsa GitHub Release'e artifact yuklenmez.

## Notlar

- `Unblock-File`, ZIP ve installer workaround'lari Smart App Control icin kalici cozum degildir.
- Kalici cozum imzali ve zaman damgali artifact uretmektir.
- Sertifika aktif olmadan bu script'ler hazirlik amaclidir; gercek imza atmayi denemeyin.
