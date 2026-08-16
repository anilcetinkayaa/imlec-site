# SSL.com Code Signing Runbook

Bu proje icin imzalama akisi bilincli olarak ikiye ayrildi:

1. Hesap / MFA / SSL.com girisi: yalnizca kullanicinin kendi yerel Windows oturumunda yapilir.
2. Repo tarafi: sadece build, imza dogrulama, ZIP uretme, SHA256 manifest ve release metadata kontrolu yapar.

Agentlar SSL.com, Microsoft veya e-posta hesaplarina giris denemesi baslatmaz. MFA veya number matching gereken ekrani agent acarsa telefon Amerika lokasyonu gibi gorunur ve kullanici sayiyi goremez. Bu akisi tekrar kullanma.

## Resmi Dayanak

SSL.com dokumanlarinda eSigner ile kod imzalama icin uc yol anlatilir:

- eSigner Express web uygulamasi
- eSigner CodeSignTool
- eSigner CKA uzerinden SignTool / certutil

Windows release icin tercih edilen hedef:

- Yerel Windows makinesinde CKA + Windows SDK `signtool.exe`
- Imza sonrasi `signtool verify /pa /v <dosya>`

## Yayinlanacak Dosyalar

Launcher icin once su dosyalar imzalanir:

- `desktop-launcher/dist/ImlecLauncher/ImlecLauncher.exe`
- `desktop-launcher/dist/ImlecLauncher/ImlecLauncherUpdater.exe`

Installer uretildiyse ayrica:

- `desktop-launcher/installer/output/ImlecLauncher_Setup_vX.Y.Z.exe`

## Yasakli Akis

Repo icinden kullanici adi / parola toplayip SSL.com CodeSignTool calistiran otomasyon devre disidir.

Calistirma:

```powershell
npm run sign:launcher
```

Bu komut sadece yerel SignTool/CKA yolu dogru ayarlandiysa kullanilmalidir. SSL.com web login veya Microsoft login gerektirirse dur.

## Guvenli 0.1.9 Launcher App Update Akisi

1. Build al:

```powershell
pyinstaller C:\imlec-site\desktop-launcher\ImlecLauncher.spec --noconfirm --clean
```

2. Kullanici kendi Windows oturumunda resmi SSL.com/CKA/SignTool akisi ile iki EXE'yi imzalar.

3. Imzalar dogrulanir:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File C:\imlec-site\desktop-launcher\signing\verify-signed-artifacts.ps1 `
  -Root C:\imlec-site\desktop-launcher `
  -ReleaseVersion 0.1.9 `
  -Paths @(
    "C:\imlec-site\desktop-launcher\dist\ImlecLauncher\ImlecLauncher.exe",
    "C:\imlec-site\desktop-launcher\dist\ImlecLauncher\ImlecLauncherUpdater.exe"
  )
```

4. Imzalar gecerse app update ZIP'i uretilir:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File C:\imlec-site\desktop-launcher\signing\package-signed-launcher.ps1 `
  -Root C:\imlec-site\desktop-launcher `
  -ReleaseVersion 0.1.9
```

Bu komut imza yoksa ZIP uretmez.

5. Olusan dosyalar:

- `desktop-launcher/releases/ImlecLauncher-0.1.9-app-windows-x64.zip`
- `desktop-launcher/releases/ImlecLauncher-0.1.9-app-windows-x64.manifest.json`

6. ZIP GitHub Release'e yuklenir.

7. `prisma/seed.mjs` launcher version, filePath ve sha256 degerleri manifest ile ayni olacak sekilde guncellenir.

8. Canli DB guncellenir:

```powershell
npm run seed
```

9. Canli endpoint kontrol edilir:

```powershell
Invoke-WebRequest -UseBasicParsing https://imlecyazilim.com/api/version/launcher
```

Beklenen:

- `latest` yeni surum olmalidir.
- `downloadUrl` yeni app ZIP olmalidir.
- `sha256` manifest ile bire bir ayni olmalidir.

## Eski Launcher Dongusu Icin Musteri Cozumu

Eski launcher otomatik guncelleme yapamazsa kullaniciya su yol verilir:

```text
https://imlecyazilim.com/download
```

Buradaki imzali onarim kurulum paketi mevcut FIS260 kurulumunu ve hesap bilgilerini koruyarak launcher'i yeniler.
