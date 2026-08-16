# SSL.com Code Signing Mimari Analizi

Tarih: 2026-08-16

## Amaç

İmleç ürünleri için tekrar edilebilir, güvenli ve kullanıcı hatasına dayanıklı bir Windows code signing süreci kurmak.

Ürünler:

- İmleç Yazılım Merkezi / Launcher
- FİŞ260
- Çözver
- Kuyvera
- Sonraki masaüstü ürünler

## Sonuç Kararı

Bu proje için ana yol:

```text
SSL.com eSigner CKA + Windows SDK SignTool + İmleç Release Manager
```

Kullanılmayacak yol:

```text
Agent ortamından SSL.com / Microsoft hesabına giriş
Repo içinden username/password isteyen CodeSignTool otomasyonu
```

## Neden CKA + SignTool?

SSL.com resmi dokümanları eSigner CKA'nın Windows CNG/KSP arayüzü üzerinden `signtool.exe` gibi standart imzalama araçlarıyla çalıştığını açıklar. Bu bizim senaryomuza daha uygundur:

- İmzalama kullanıcının kendi Windows oturumunda olur.
- MFA / CKA onayı kullanıcının kendi bilgisayarında görünür.
- Agent cloud lokasyonu yüzünden Microsoft Authenticator number matching bozulmaz.
- Private key export edilmez; eSigner cloud HSM / CKA üzerinden kullanılır.
- `signtool verify /pa /v` ile standart Windows doğrulaması yapılır.

## Neden CodeSignTool Otomasyonu Kapalı?

SSL.com CodeSignTool resmi olarak desteklenir; hatta CI/CD ve yüksek hacimli imzalama için uygundur. Ancak bu projede önceki denemede şu riskler görüldü:

- Agent ortamından login denemesi MFA'yı Amerika lokasyonlu tetikledi.
- Kullanıcı telefonda sayı girmesi gereken ekran gördü ama sayı agent ekranında kaldı.
- Repo içinde username/password toplayan akış operasyonel olarak karışık ve riskli hale geldi.

Bu nedenle `sign-windows.ps1` içinde CodeSignTool backend bilerek devre dışı bırakıldı.

## Release Manager'ın Rolü

`release-manager/imlec_release_manager.py` şunları yapar:

- Ürün profilini okur.
- Sürüm numarasını gösterir.
- Build komutunu çalıştırır.
- İmzalanacak EXE'leri listeler.
- `signtool.exe` var mı kontrol eder.
- Sertifika Windows store'da görünüyor mu kontrol eder.
- Yerel `signtool sign` komutunu çalıştırır.
- `signtool verify /pa /v` veya Authenticode ile imzayı doğrular.
- İmza yoksa paketleme adımını durdurur.

Release Manager şunları yapmaz:

- SSL.com hesabına giriş yapmaz.
- Microsoft hesabına giriş yapmaz.
- OTP istemez.
- TOTP secret saklamaz.
- Kullanıcı şifresi saklamaz.

## Entegrasyon Noktaları

### Launcher

Profil:

```text
release-manager/profiles.json
```

Artifact'ler:

```text
C:/imlec-site/desktop-launcher/dist/ImlecLauncher/ImlecLauncher.exe
C:/imlec-site/desktop-launcher/dist/ImlecLauncher/ImlecLauncherUpdater.exe
```

Paketleme kilidi:

```text
C:/imlec-site/desktop-launcher/signing/package-signed-launcher.ps1
```

Bu script:

- `LAUNCHER_VERSION` ile hedef sürümü karşılaştırır.
- `ImlecLauncher.iss` sürümü ile hedef sürümü karşılaştırır.
- İki EXE imzasızsa ZIP üretmez.
- ZIP üretirse SHA256 manifest üretir.

### FİŞ260

Profil başlangıç seviyesinde eklendi.

Artifact'ler:

```text
C:/FIS260/dist/FIS260/FIS260.exe
C:/FIS260/dist/FIS260/FIS260Updater.exe
```

FİŞ260 için ayrı paketleme script'i ileride Launcher paketleme script'iyle aynı güvenlik kurallarını taşımalı:

- EXE imzası zorunlu
- model/assets varlığı kontrolü
- ZIP içeriği kontrolü
- SHA256 manifest
- admin/version seed uyumu

## Hata Önleme Kuralları

1. İmzasız EXE ile ZIP üretme.
2. Sürüm uyuşmazsa paketleme yapma.
3. SHA256 manifest olmadan GitHub Release'e yükleme.
4. GitHub Release'e yüklenen dosya SHA256 ile DB/admin sürüm kaydı bire bir aynı olmalı.
5. Canlı `/api/version/{slug}` endpoint'i yeni sürümü göstermeden önce paket doğrulanmalı.
6. Agentlar hesap login adımı başlatmamalı.
7. CKA / MFA / PIN ekranı sadece kullanıcının kendi Windows oturumunda görünmeli.

## Resmi Kaynaklar

- SSL.com Downloads: https://www.ssl.com/downloads/
- eSigner CodeSignTool Command Guide: https://www.ssl.com/guide/esigner-codesigntool-command-guide/
- How to Install SSL.com eSigner Cloud Key Adapter (CKA): https://www.ssl.com/how-to/how-to-install-ssl-com-esigner-cloud-key-adapter-cka/
- Getting Started With Your Code Signing Certificate: https://www.ssl.com/how-to/getting-started-with-your-code-signing-certificate-installation-configuration-and-your-first-signing-operation/
- Automate EV Code Signing With SignTool.exe or Certutil.exe Using eSigner CKA: https://www.ssl.com/how-to/automate-ev-code-signing-with-signtool-or-certutil-esigner/

## Bir Sonraki Test

1. Kullanıcı kendi Windows oturumunda CKA'nın sertifikayı Windows store'a yüklediğini doğrular.
2. Release Manager açılır.
3. `Kontrolleri Yenile` çalıştırılır.
4. Sertifika ve SignTool yeşil görünürse `İmzala` denenir.
5. İmzalama başarılıysa `İmzayı Doğrula`.
6. Sonra `Paketle`.

Başarısız olursa hata ekran görüntüsü `user-provided/` altına konur ve analiz bu dosyanın devamına işlenir.
