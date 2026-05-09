# İmleç Yazılım Platform Mimari Karar Dokümanı

## 1. Platform Tanımı

İmleç Yazılım tek bir ürün sitesi değildir. FİŞ260, ÇÖZVER ve ileride eklenecek masaüstü uygulamalarını aynı platform hesabı altında yöneten bir yazılım platformudur.

Platformun temel yaklaşımı şudur:

- Kullanıcı tek hesap oluşturur.
- Aynı hesap web sitesi ve masaüstü uygulamalarda kullanılır.
- Ürün erişimleri ayrı yönetilir.
- Satın alma ve fiyatlandırma her ürünün kendi sayfasında yapılır.
- Kullanıcı paneli `/account` altında toplanır.
- Yönetici paneli ileride `/admin` altında planlanır.

Bu yapı, kullanıcının yanlış ürüne ödeme yapmasını azaltır ve ürünlerin ayrı lisans/üyelik mantıklarıyla büyümesine izin verir.

## 2. Ürün Modeli

Platformda her uygulama ayrı bir ürün olarak modellenir.

İlk ürünler:

- FİŞ260: muhasebe odaklı OCR ve Excel aktarım uygulaması.
- ÇÖZVER: finansal analiz ve spread hazırlığı uygulaması.

Her ürün için ayrı alanlar olmalıdır:

- ürün sayfası
- özellikler
- fiyatlandırma
- satın alma/üyelik yönlendirmesi
- indirilebilir uygulama
- entitlement kontrolü
- cihaz limiti

Merkezi ve karmaşık bir pricing tablosu kullanılmayacaktır. Ürün bazlı satın alma akışı korunacaktır.

## 3. Kullanıcı Hesabı Modeli

Platform hesabı ortaktır. Kullanıcı tek email ve şifre ile hesap oluşturur.

Kullanıcı hesabı şunları temsil eder:

- kimlik bilgileri
- web oturumları
- desktop oturumları
- ürün erişimleri
- ödemeler
- faturalar
- kayıtlı cihazlar

Ürün erişimi kullanıcı hesabından ayrı bir entitlement katmanında yönetilir. Bir kullanıcının hesabı aktif olabilir ancak her ürüne erişimi olmayabilir.

Örnek:

```txt
User: demo@imlecyazilim.com
FİŞ260 entitlement: active
ÇÖZVER entitlement: inactive
```

## 4. Neden Modular Monolith?

Şimdilik ayrı backend kurulmayacaktır. Tüm sistem `C:\imlec-site` içinde kalacaktır.

Bu kararın nedenleri:

- Proje hâlâ erken aşamadadır.
- Next.js App Router ve route handlers web, auth, checkout ve webhook girişleri için yeterlidir.
- Vercel deploy akışı zaten aktiftir.
- Ayrı backend şu aşamada operasyonel maliyet ve bakım yükü getirir.
- Kod sınırları doğru çizilirse ileride backend ayrıştırması mümkündür.

Modular monolith yaklaşımında API giriş noktaları `app/api` altında olur. İş mantığı doğrudan route dosyalarına gömülmez; ileride `src/server` altında küçük domain modüllerine taşınır.

Backend ancak şu koşullarda ayrılmalıdır:

- desktop API trafiği web uygulamasından bağımsız ölçeklenmek isterse
- uzun çalışan lisans veya cihaz doğrulama işleri gerekirse
- admin operasyonları ayrı güvenlik/dağıtım sınırı isterse
- Vercel serverless sınırları ürün davranışını kısıtlarsa
- web ve desktop API release döngüleri ayrışırsa

## 5. Önerilen Klasör Yapısı

Başlangıç için önerilen yapı:

```txt
app/
  api/
    auth/[...nextauth]/route.ts
    checkout/[product]/route.ts
    webhooks/lemonsqueezy/route.ts
    desktop/session/route.ts
    desktop/entitlements/route.ts
    desktop/devices/route.ts
  account/page.tsx
  admin/page.tsx
  fis260/page.tsx
  cozver/page.tsx
  page.tsx

auth.ts

prisma/
  schema.prisma
  migrations/

src/
  db/
    prisma.ts
  server/
    auth/
    billing/
    entitlement/
    desktop/
    audit/
    admin/
  shared/
    product.ts
    types.ts
```

Bu yapı hemen tamamen oluşturulmak zorunda değildir. İhtiyaç oldukça eklenmelidir.

Prensipler:

- `app/api` sadece HTTP giriş noktasıdır.
- İş mantığı route dosyalarında büyütülmez.
- Prisma bağlantısı tek yerde yönetilir.
- Ürün slug ve sabitleri tek kaynakta tutulur.
- Auth, billing, entitlement, desktop ve audit ayrı domainler olarak düşünülür.

## 6. Web Auth Yaklaşımı

Web tarafında Auth.js kullanılacaktır.

Auth.js rolü:

- web login
- web session yönetimi
- `/account` koruması
- `/admin` koruması
- kullanıcı kimliğini web tarafına güvenli biçimde taşımak

Auth.js session içine ürün erişimlerinin tamamı gömülmemelidir. Session yalnızca kullanıcı kimliğini ve temel rol bilgisini taşımalıdır.

Ürün erişimi gerektiğinde entitlement katmanından okunmalıdır. Böylece ödeme, iptal, admin override veya cihaz kısıtları session yenilenmesini beklemeden doğru hesaplanabilir.

## 7. Desktop Auth Yaklaşımı

Desktop uygulamalar Auth.js web session modeline zorlanmayacaktır.

Önerilen akış:

```txt
1. Desktop uygulama login başlatır.
2. Kullanıcı tarayıcıda platform hesabıyla giriş yapar.
3. PKCE benzeri bir code flow ile desktop uygulamaya doğrulama sonucu döner.
4. Backend cihazı kaydeder veya mevcut cihazı doğrular.
5. Desktop uygulamaya kısa ömürlü access token verilir.
6. Refresh/session token veritabanında saklanır ve revoke edilebilir olur.
7. İlgili ürün için entitlement ve trusted_until bilgisi döner.
```

Desktop token sistemi web session'dan ayrı olmalıdır. Bunun nedeni desktop uygulamaların offline çalışma, cihaz limiti ve ürün bazlı erişim ihtiyaçlarının web panelinden farklı olmasıdır.

## 8. Entitlement Sistemi

Entitlement, kullanıcının belirli bir ürünü kullanma hakkıdır.

Subscription ile entitlement aynı şey değildir.

Subscription:

- Lemon Squeezy kaynaklı ticari abonelik bilgisidir.
- ödeme durumu, yenileme tarihi, iptal durumu gibi bilgileri taşır.

Entitlement:

- uygulamanın erişim kararında kullandığı gerçek izin katmanıdır.
- aktif, pasif, süresi dolmuş, admin tarafından verilmiş veya revoke edilmiş olabilir.

Örnek:

```txt
Subscription: FİŞ260 monthly, active
Entitlement: FİŞ260, active

Subscription: ÇÖZVER yok
Entitlement: ÇÖZVER, inactive
```

Bu ayrım ileride şu durumlar için kritiktir:

- deneme sürümü
- manuel erişim
- ödeme sağlayıcısı gecikmeleri
- iade
- iptal sonrası grace period
- ekip/kurum lisansı
- admin override

## 9. Lemon Squeezy Rolü

Lemon Squeezy yalnızca ödeme, subscription, renewal ve fatura katmanıdır.

Lemon Squeezy kullanılacak alanlar:

- ürün bazlı checkout
- subscription oluşturma ve yenileme
- ödeme durumu
- fatura linkleri
- customer portal yönlendirmesi
- webhook eventleri

Lemon Squeezy kullanıcı kimlik sistemi değildir. Platform kullanıcısı kendi veritabanımızda tutulur.

Ürün eşleşmesi variant üzerinden yapılmalıdır:

```txt
FİŞ260 monthly variant -> Product: fis260
FİŞ260 yearly variant -> Product: fis260
ÇÖZVER monthly variant -> Product: cozver
ÇÖZVER yearly variant -> Product: cozver
```

Checkout her zaman ilgili ürün sayfasından başlatılmalıdır:

```txt
/fis260 -> /api/checkout/fis260
/cozver -> /api/checkout/cozver
```

## 10. Webhook ve Idempotency

Lemon Squeezy webhook endpoint'i tek olmalıdır:

```txt
/api/webhooks/lemonsqueezy
```

Webhook işleme sırası:

```txt
1. Signature doğrulanır.
2. Event idempotency kontrolünden geçer.
3. Raw payload saklanır.
4. Event tipi belirlenir.
5. Lemon customer/subscription/order bilgileri kullanıcıyla eşleştirilir.
6. Subscription kaydı güncellenir.
7. Entitlement yeniden hesaplanır.
8. Payment ve Invoice kayıtları güncellenir.
9. AuditLog yazılır.
```

Idempotency için ayrı bir webhook event kaydı tutulmalıdır:

```txt
WebhookEvent
  provider
  event_id
  event_type
  payload_hash
  status
  processed_at
  error_message
```

Webhook tekrarları normal kabul edilmelidir. Aynı event birden fazla kez geldiğinde entitlement veya ödeme kayıtları bozulmamalıdır.

## 11. Device Management

Cihaz yönetimi ürün bazlı olmalıdır.

Bir kullanıcının FİŞ260 erişimi olabilir ancak ÇÖZVER erişimi olmayabilir. Bu nedenle cihaz kaydı sadece kullanıcıya değil, ürün erişimine de bağlanmalıdır.

Device alanları:

```txt
Device
  user_id
  product_id
  device_name
  device_fingerprint_hash
  last_seen_at
  trusted_until
  revoked_at
```

Temel kurallar:

- cihaz limiti ürün bazlı tanımlanır
- fingerprint düz metin saklanmaz
- kullanıcı `/account` üzerinden cihaz kaldırabilir
- admin cihaz revoke edebilir
- revoke işlemleri audit log üretir

Amaç yüzde yüz crack engeli değildir. Amaç hesap paylaşımını ve kontrolsüz yayılımı azaltmaktır.

## 12. Offline Kullanım Mantığı

Desktop uygulamalar tamamen online zorunlu olmayacaktır.

Önerilen mantık:

```txt
Başarılı online doğrulama:
  entitlement doğrulanır
  device doğrulanır
  trusted_until = now + 7 veya 14 gün
  session cache oluşturulur

Offline açılış:
  local session cache okunur
  trusted_until geçerliyse uygulama açılır
  süre dolmuşsa yeniden online doğrulama istenir
```

Offline süre ürün bazlı ayarlanabilir. Kritik olan, sınırsız offline kullanım verilmemesidir.

## 13. Kullanıcı Paneli

Kullanıcı paneli `/account` altında yer alır.

Panelin sorumlulukları:

- profil bilgileri
- aktif ürünler
- ödeme geçmişi
- faturalar
- cihaz yönetimi
- üyelik yönetimi
- indirilebilir uygulamalar

Panel merkezi pricing alanı değildir. Ürün satın alma veya plan değiştirme yönlendirmeleri ilgili ürün sayfasına veya ilgili ürünün Lemon checkout/customer portal akışına gitmelidir.

## 14. Admin Paneli

Admin paneli başlangıçta `/admin` route'u olarak planlanabilir.

Ayrı frontend veya ayrı servis şu aşamada gerekli değildir.

Admin panelinde beklenen temel alanlar:

- kullanıcı arama
- ürün erişimleri
- subscription durumu
- payment ve invoice kayıtları
- cihaz listesi
- device revoke
- entitlement override
- webhook event görüntüleme
- audit log görüntüleme

Yetki sistemi rol bazlı başlamalıdır:

```txt
user
support
admin
owner
```

Kritik işlemler sadece `admin` veya `owner` tarafından yapılmalıdır.

## 15. Audit Log ve AdminAction

AuditLog sistem olaylarını kaydeder.

Örnek olaylar:

- kullanıcı giriş yaptı
- desktop session oluşturuldu
- device registered
- device revoked
- entitlement activated
- entitlement expired
- Lemon webhook işlendi
- ödeme başarısız oldu

AdminAction admin kaynaklı değişiklikleri kaydeder.

Örnek admin işlemleri:

- kullanıcı entitlement verdi
- kullanıcı entitlement kaldırdı
- cihaz revoke etti
- subscription durumunu manuel işaretledi
- kullanıcı hesabını kilitledi

Her AdminAction aynı zamanda AuditLog ile ilişkilendirilebilir. Amaç destek, güvenlik ve hata ayıklama süreçlerinde izlenebilirlik sağlamaktır.

## 16. Gelecekte Workspace/Organization Genişlemesi

İlk aşamada bireysel kullanıcı hesabı yeterlidir. Ancak ileride muhasebe ofisleri ve ekip lisansları için Workspace/Organization yapısı gerekebilir.

Hazırlık için model tasarımında şu genişleme dikkate alınmalıdır:

```txt
Organization
  name
  billing_email

Membership
  user_id
  organization_id
  role

OrganizationEntitlement
  organization_id
  product_id
  seat_count
```

Bu yapı hemen uygulanmamalıdır. Ancak User, Subscription ve Entitlement modelleri ileride organization bağlamına genişletilebilecek şekilde tasarlanmalıdır.

## 17. Şimdilik Yapılmayacaklar

Şimdilik yapılmayacaklar:

- ayrı backend servisi kurmak
- mikroservis mimarisi kurmak
- gerçek auth implementasyonu yazmak
- gerçek ödeme entegrasyonu yazmak
- gerçek Prisma schema oluşturmak
- admin paneli implementasyonu yapmak
- desktop uygulama API'lerini implement etmek
- karmaşık role/permission sistemi kurmak
- merkezi pricing tablosu oluşturmak
- entitlement kararlarını frontend state'e bağlamak

Bu kararlar sistemi yavaşlatmak için değil, erken karmaşıklığı engellemek için alınmıştır.

## 18. Sonraki Teknik Adımlar

Önerilen sıra:

```txt
1. Prisma schema taslağı hazırlanır.
2. Product ve variant mapping kararları netleştirilir.
3. Auth.js için web auth foundation kurulur.
4. User ve Session modelleri bağlanır.
5. Entitlement service tasarlanır.
6. Lemon checkout route'u ürün bazlı eklenir.
7. Lemon webhook endpoint'i idempotent şekilde eklenir.
8. /account gerçek kullanıcı verisiyle beslenir.
9. Desktop auth flow için session ve device endpointleri tasarlanır.
10. /admin ilk internal destek paneli olarak eklenir.
```

İlk gerçek kod adımı Prisma schema taslağı olmalıdır. Auth, ödeme ve desktop API bundan sonra bağlanmalıdır.
