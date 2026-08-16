# SSL Sertifikasyon Dosyası

Bu klasör SSL.com code signing süreci için ayrılmıştır.

## Klasörler

- `user-provided/`
  - SSL.com panel ekran görüntüleri
  - Sertifika sipariş bilgileri
  - CKA ekran görüntüleri
  - Microsoft / Windows hata ekran görüntüleri
  - Destek yazışmaları
  - Notlar

- `analysis/`
  - Codex/Claude analizleri
  - Karar dokümanları
  - Test sonuçları
  - Release imzalama raporları

## Güvenlik

Bu klasöre şunları koyma:

- SSL.com şifresi
- TOTP secret / QR kod
- OTP kodları
- Microsoft hesabı şifresi
- Recovery code
- API secret

Ekran görüntüsünde bu bilgiler varsa önce karart.

## Ana Karar

FIS260, İmleç Launcher, Çözver ve sonraki ürünler için hedef imzalama yolu:

```text
SSL.com eSigner CKA + Windows SignTool + yerel Release Manager
```

Agentlar SSL.com veya Microsoft hesabına giriş yapmayacak.
