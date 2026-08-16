# İmleç Release Manager

Bu araç, İmleç masaüstü ürünleri için yerel yayın güvenlik kapısıdır.

Amaç:

- Ürün sürümünü ve artifact dosyalarını kontrol etmek
- `signtool.exe` ve Windows sertifika store durumunu göstermek
- Dosyaları yerel Windows oturumunda imzalamak
- İmzaları doğrulamak
- İmzasız dosya varsa paket üretimini engellemek

Bu araç SSL.com, Microsoft veya e-posta hesabına giriş yapmaz. OTP, şifre veya Authenticator kodu istemez. İmza sırasında SSL.com CKA bir onay penceresi açarsa bu kullanıcının kendi Windows oturumunda görünür.

## Çalıştırma

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File C:\imlec-site\release-manager\run-release-manager.ps1
```

## İlk Desteklenen Ürünler

- İmleç Yazılım Merkezi
- FİŞ260

Ürün profilleri:

```text
C:\imlec-site\release-manager\profiles.json
```

Yeni ürün eklemek için bu dosyaya build, artifact ve paketleme tanımı eklenir.

## Güvenlik Kuralları

- İmzasız EXE paketlenmez.
- Sürüm numarası uyuşmazsa paketleme durur.
- SHA256 manifest üretmeden release hazırlanmış sayılmaz.
- Agentlar hesap girişi başlatmaz; hesap işlemleri kullanıcı tarafından yerel tarayıcıda yapılır.
