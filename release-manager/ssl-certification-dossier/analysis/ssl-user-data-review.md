# SSL Verileri İnceleme Notu

Tarih: 2026-08-16

Bu not, `release-manager/ssl-certification-dossier` klasörüne eklenen yerel PDF ve metin belgelerinden çıkarılan güvenli özettir. Ham PDF/TXT dosyaları kullanıcıya ait yerel kanıt dosyalarıdır ve git'e eklenmemelidir.

## İncelenen Yerel Dosyalar

- `Yeni Metin Belgesi.txt`
- `Yeni Metin Belgesi (2).txt`
- `Yeni Metin Belgesi (3).txt`
- `eSigner_guide-*.pdf` dosyaları

Ham dosyalar içinde sertifika, eSigner credential ID ve denetim çıktıları bulunduğu için bu bilgiler kod deposuna taşınmadı.

## Bulgular

### 1. Code Signing Sertifikası Doğru Görünüyor

`Yeni Metin Belgesi (2).txt` içindeki sertifika çıktısı gerçek Windows code signing sertifikasını gösteriyor:

- Issuer: SSL.com Code Signing Intermediate CA RSA R1
- Subject/Publisher: Anıl Çetinkaya
- Serial: `4AD4313D43608C87E9B3509710AD4A57`
- Extended Key Usage: Code Signing
- Key Usage: Digital Signature
- Geçerlilik: 2026-06-23 - 2027-06-23

Bu, EXE/installer imzalamada kullanılması gereken sertifika türüdür.

### 2. eSigner Credential Kaydı Mevcut

`Yeni Metin Belgesi (3).txt` içinde eSigner credential kaydı görünüyor. Bu kayıt, SSL.com tarafındaki remote signing kimliğinin oluştuğunu doğruluyor. Credential ID operasyonel olarak hassas sayılabileceği için bu notta tekrar edilmedi.

Bu bilgi, CKA veya CSC tabanlı imzalama altyapısının hesabında tanımlı olduğunu gösterir. Ancak otomasyonun kullanıcı adı/parola/TOTP ile çalıştırılması tercih edilmemelidir.

### 3. PDF'ler EXE İmzalama Rehberi Değil, Doküman/eSeal Kanıtı Gibi

PDF envanterinde çoğu dosyanın aynı içeriğin kopyası olduğu görüldü. İçeriklerde `Certificate of Signature and Timestamp`, `eSigner Eseal` ve PDF/doküman imzalama izleri var.

Bu PDF'ler Windows Authenticode EXE imzalama yolu için ana kaynak değil. Arşiv/kanıt olarak kalabilirler, ama Release Manager akışını değiştirmemeliler.

### 4. Doğru Mimari Aynı Kalıyor

FIS260, İmleç Launcher ve ilerideki ürünler için güvenli imzalama yolu:

```text
SSL.com eSigner CKA
→ Windows certificate store / CurrentUser\My
→ Windows SDK SignTool
→ signtool verify
→ Release Manager paketleme/yayınlama
```

Repo içinde kapatılan eski yol doğru karardı:

```text
CodeSignTool + repo scriptinden SSL.com kullanıcı adı/parola/TOTP isteme
```

Bu yol tekrar açılmamalı. Hesap girişini veya OTP akışını agent değil, yerel CKA/Windows oturumu yönetmeli.

## Güvenlik Kararı

`.gitignore` içine SSL dossier altındaki ham PDF/TXT dosyaları ve `user-provided` klasörü eklendi. Böylece:

- sertifika/credential ekran çıktıları yanlışlıkla commit edilmez,
- Claude/Codex aynı temiz analiz dosyalarını okuyabilir,
- ham kanıtlar sadece bu bilgisayarda kalır.

## Sonraki Sağlam Test Sırası

1. CKA uygulamasında sertifika görünür olmalı.
2. Windows sertifika deposunda `CurrentUser\My` altında aynı serial görünmeli.
3. Release Manager içinde `Kontrolleri Yenile` çalıştırılmalı.
4. SignTool sertifikayı buluyorsa küçük bir test EXE imzalanmalı.
5. `signtool verify /pa /v <dosya>` başarılı olmalı.
6. İmzalanmamış EXE kalmadığını Release Manager kontrol etmeli.
7. Ancak bu doğrulamalardan sonra launcher/FIS260 paketi release'e çıkarılmalı.

## Sonuç

Elindeki veriler code signing sertifikasının issued ve doğru türde olduğunu doğruluyor. Karışıklık, eSigner web/PDF imzalama ekranları ile Windows EXE imzalama hattının birbirine karışmasından kaynaklanmış. Ürün dağıtımı için esas hat CKA + SignTool + Release Manager olmalı.
