# Prisma Veri Modeli Karar Dokümanı

## 1. Amaç

Bu doküman, İmleç Yazılım platformu için Prisma schema yazılmadan önce veri modeli kararlarını netleştirir.

Platformun temel gereksinimleri:

- PostgreSQL kullanılacak.
- Prisma ORM kullanılacak.
- Tek platform hesabı olacak.
- Ürün erişimleri ayrı yönetilecek.
- Subscription ticari abonelik kaydı olacak.
- Entitlement gerçek ürün erişim hakkı olacak.
- Desktop uygulamalar erişim kararını Subscription'dan değil Entitlement'tan okuyacak.
- Device management ürün bazlı olacak.
- Lemon Squeezy ödeme, subscription ve fatura sağlayıcısı olarak kullanılacak.
- Webhook işleme idempotent olacak.
- AuditLog ve AdminAction kayıtları izlenebilirlik için kritik olacak.

Bu doküman migration, API, auth veya ödeme implementasyonu içermez.

## 2. Genel Model Yaklaşımı

Modelleme entitlement merkezli yapılmalıdır.

Kullanıcı hesabı tekildir. FİŞ260, ÇÖZVER ve ileride eklenecek ürünler ayrı Product kayıtlarıdır. Kullanıcı hangi ürüne erişebileceğini Entitlement üzerinden öğrenir.

Subscription ve Entitlement ayrımı korunmalıdır:

- Subscription: Lemon Squeezy kaynaklı ticari abonelik durumudur.
- Entitlement: Uygulamanın erişim kararında kullandığı gerçek izin kaydıdır.

Bu ayrım trial, grace period, iade, iptal, manuel admin erişimi ve ileride workspace lisansı gibi senaryolarda sistemi esnek tutar.

## 3. ID Stratejisi

Başlangıç için önerilen ID stratejisi:

```txt
String @id @default(cuid())
```

Nedenleri:

- Prisma ile doğal ve sade kullanım sağlar.
- Public API veya URL yüzeyinde sıralı integer ID sızdırmaz.
- Serverless ortamda sequence tabanlı ID bağımlılığı oluşturmaz.
- Erken aşama için yeterince güvenli ve okunabilir bir standarttır.

Alternatif olarak PostgreSQL native UUID kullanılabilir:

```txt
String @id @default(uuid()) @db.Uuid
```

UUID, Postgres-native araçlar ve dış sistem entegrasyonları ağır basarsa tercih edilebilir. Ancak ilk aşamada `cuid()` yeterlidir.

## 4. User Modeli

Amaç:

Tek platform hesabını temsil eder. Kullanıcı web paneline ve desktop uygulamalara aynı hesapla giriş yapar.

Temel alanlar:

- `id`
- `email`
- `name`
- `passwordHash`
- `role`
- `emailVerifiedAt`
- `disabledAt`
- `createdAt`
- `updatedAt`

İlişkiler:

- User -> Session
- User -> Subscription
- User -> Entitlement
- User -> Device
- User -> Payment
- User -> Invoice
- User -> Membership
- User -> AdminAction
- User -> AuditLog actor/target ilişkileri

Unique constraint:

- `email` unique olmalıdır.

Lifecycle / delete mantığı:

User hard delete edilmemelidir. Hesap kapatma veya yasaklama için `disabledAt` kullanılmalıdır. Ticari kayıtlar, faturalar, audit kayıtları ve cihaz geçmişi nedeniyle kullanıcı kaydını fiziksel olarak silmek risklidir.

İleride dikkat edilecekler:

- KVKK/GDPR benzeri talepler için kişisel veriyi anonimleştirme stratejisi gerekebilir.
- Email değişikliği ayrı doğrulama akışı gerektirir.
- Role sistemi sade tutulmalıdır.

## 5. Session Modeli

Amaç:

Web ve desktop oturumlarını izlemek için kullanılır. Auth.js web session'ları ile desktop session kayıtları farklı tipler olarak modellenebilir.

Temel alanlar:

- `id`
- `userId`
- `type`
- `tokenHash`
- `expiresAt`
- `revokedAt`
- `createdAt`
- `lastUsedAt`

İlişkiler:

- Session -> User

Unique constraint:

- `tokenHash` unique olmalıdır.

Lifecycle / delete mantığı:

Session kayıtları süresi dolunca temizlenebilir. Ancak güvenlik incelemesi için kısa süre saklamak faydalıdır. Revoke için hard delete yerine `revokedAt` kullanılmalıdır.

İleride dikkat edilecekler:

- Desktop refresh token düz metin saklanmamalıdır.
- Access token kısa ömürlü olmalıdır.
- Desktop oturumları Auth.js browser session'larına zorlanmamalıdır.

## 6. Product Modeli

Amaç:

FİŞ260, ÇÖZVER ve ileride eklenecek uygulamaları temsil eder.

Temel alanlar:

- `id`
- `slug`
- `name`
- `status`
- `createdAt`
- `updatedAt`

İlişkiler:

- Product -> Subscription
- Product -> Entitlement
- Product -> Device
- Product -> Payment
- Product -> Invoice

Unique constraint:

- `slug` unique olmalıdır.

Lifecycle / delete mantığı:

Product hard delete edilmemelidir. Ürün yayından kalkarsa status `ARCHIVED` veya `INACTIVE` yapılmalıdır.

İleride dikkat edilecekler:

- Lemon Squeezy variant eşleşmeleri Product ile ilişkilendirilecek ayrı bir mapping modeli gerektirebilir.
- Ürün bazlı cihaz limiti ileride Product ayarı olarak tutulabilir.

## 7. Subscription Modeli

Amaç:

Lemon Squeezy kaynaklı ticari abonelik kaydını temsil eder.

Temel alanlar:

- `id`
- `userId`
- `productId`
- `provider`
- `providerCustomerId`
- `providerSubscriptionId`
- `providerVariantId`
- `status`
- `renewsAt`
- `endsAt`
- `trialEndsAt`
- `createdAt`
- `updatedAt`

İlişkiler:

- Subscription -> User
- Subscription -> Product
- Subscription -> Entitlement
- Subscription -> Payment
- Subscription -> Invoice

Unique constraint:

- `provider + providerSubscriptionId` unique olmalıdır.
- `providerCustomerId` indexlenmelidir.
- `userId + productId` indexlenmelidir.

Lifecycle / delete mantığı:

Subscription hard delete edilmemelidir. Durum değişiklikleri status ve tarih alanlarıyla tutulmalıdır.

İleride dikkat edilecekler:

- Aynı kullanıcı aynı ürün için zaman içinde birden fazla subscription geçmişine sahip olabilir.
- Erişim kararı doğrudan Subscription üzerinden verilmemelidir.
- Webhook eventleri subscription durumunu günceller, entitlement ise ayrı hesaplanır.

## 8. Entitlement Modeli

Amaç:

Kullanıcının belirli bir ürüne erişim hakkını temsil eder.

Temel alanlar:

- `id`
- `userId`
- `productId`
- `subscriptionId`
- `status`
- `source`
- `startsAt`
- `expiresAt`
- `revokedAt`
- `createdAt`
- `updatedAt`

İlişkiler:

- Entitlement -> User
- Entitlement -> Product
- Entitlement -> optional Subscription

Unique constraint:

- İlk aşamada `userId + productId` unique olmalıdır.

Lifecycle / delete mantığı:

Entitlement hard delete edilmemelidir. Erişim kaldırıldığında status `REVOKED`, `EXPIRED` veya `INACTIVE` yapılmalıdır.

İleride dikkat edilecekler:

- Admin tarafından verilen erişim `source = ADMIN` ile izlenmelidir.
- Trial erişim `source = TRIAL` ile ayrıştırılabilir.
- Organization entitlement ihtiyacı doğarsa ayrı model eklemek daha sade olabilir; ilk günden polymorphic entitlement kurulmayacaktır.

## 9. Device Modeli

Amaç:

Desktop uygulamalar için ürün bazlı cihaz kaydı, cihaz limiti ve offline trust yönetimini sağlar.

Temel alanlar:

- `id`
- `userId`
- `productId`
- `deviceName`
- `fingerprintHash`
- `status`
- `lastSeenAt`
- `trustedUntil`
- `revokedAt`
- `createdAt`
- `updatedAt`

İlişkiler:

- Device -> User
- Device -> Product

Unique constraint:

- `productId + fingerprintHash` unique olabilir.
- Daha sıkı model gerekirse `userId + productId + fingerprintHash` unique kullanılabilir.

Lifecycle / delete mantığı:

Device hard delete edilmemelidir. Cihaz kaldırma işlemi `revokedAt` ve `status = REVOKED` ile tutulmalıdır.

İleride dikkat edilecekler:

- Fingerprint düz metin saklanmamalıdır.
- Fingerprint yüzde yüz güvenlik sağlamaz; sadece hesap paylaşımını azaltır.
- Offline kullanım için `trustedUntil` kritik alandır.

## 10. Payment Modeli

Amaç:

Ödeme geçmişini saklar.

Temel alanlar:

- `id`
- `userId`
- `productId`
- `subscriptionId`
- `provider`
- `providerOrderId`
- `amount`
- `currency`
- `status`
- `paidAt`
- `createdAt`

İlişkiler:

- Payment -> User
- Payment -> Product
- Payment -> optional Subscription

Unique constraint:

- `provider + providerOrderId` unique olmalıdır.

Lifecycle / delete mantığı:

Payment hard delete edilmemelidir. Ticari kayıt olduğu için geçmiş korunmalıdır.

İleride dikkat edilecekler:

- Refund ve chargeback durumları status üzerinden takip edilmelidir.
- Amount integer minor unit olarak tutulabilir. Örneğin 49900 kuruş gibi.

## 11. Invoice Modeli

Amaç:

Fatura referanslarını ve kullanıcı panelinde gösterilecek fatura linklerini saklar.

Temel alanlar:

- `id`
- `userId`
- `productId`
- `subscriptionId`
- `provider`
- `providerInvoiceId`
- `invoiceUrl`
- `downloadUrl`
- `issuedAt`
- `createdAt`

İlişkiler:

- Invoice -> User
- Invoice -> Product
- Invoice -> optional Subscription

Unique constraint:

- `provider + providerInvoiceId` unique olmalıdır.

Lifecycle / delete mantığı:

Invoice hard delete edilmemelidir.

İleride dikkat edilecekler:

- Fatura URL'leri provider tarafında değişebilir veya süreli olabilir.
- Gerekirse invoice metadata saklanabilir.

## 12. WebhookEvent Modeli

Amaç:

Lemon Squeezy webhook işleme geçmişini ve idempotency kontrolünü sağlar.

Temel alanlar:

- `id`
- `provider`
- `eventId`
- `eventType`
- `payloadHash`
- `payload`
- `status`
- `processedAt`
- `errorMessage`
- `createdAt`

İlişkiler:

- Doğrudan zorunlu relation gerekmeyebilir.
- İleride User, Subscription veya Payment ile ilişki kurulabilir.

Unique constraint:

- `provider + eventId` unique olmalıdır.

Lifecycle / delete mantığı:

WebhookEvent hard delete edilmemelidir. Bu kayıtlar hata ayıklama ve idempotency için gereklidir.

İleride dikkat edilecekler:

- Payload içinde kişisel veri olabilir; gereksiz veri saklama sınırlandırılmalıdır.
- Başarısız eventler retry ve manuel inceleme için görüntülenebilmelidir.

## 13. AuditLog Modeli

Amaç:

Sistem olaylarının değiştirilemez izini tutar.

Temel alanlar:

- `id`
- `actorUserId`
- `targetUserId`
- `eventType`
- `entityType`
- `entityId`
- `metadata`
- `ipAddress`
- `userAgent`
- `createdAt`

İlişkiler:

- AuditLog -> optional actor User
- AuditLog -> optional target User
- AuditLog -> optional AdminAction

Unique constraint:

- Zorunlu unique constraint gerekmez.
- `eventType`, `entityType + entityId`, `createdAt` indexlenebilir.

Lifecycle / delete mantığı:

AuditLog append-only olmalıdır. Update veya delete yapılmamalıdır.

İleride dikkat edilecekler:

- Metadata JSON alanı kontrollü kullanılmalıdır.
- Hassas veriler loglanmamalıdır.
- Admin ve webhook olayları mutlaka audit üretmelidir.

## 14. AdminAction Modeli

Amaç:

Admin veya destek kullanıcısı tarafından yapılan kritik değişiklikleri ayrı izler.

Temel alanlar:

- `id`
- `adminUserId`
- `targetUserId`
- `action`
- `reason`
- `metadata`
- `createdAt`

İlişkiler:

- AdminAction -> admin User
- AdminAction -> optional target User
- AdminAction -> optional AuditLog

Unique constraint:

- Zorunlu unique constraint gerekmez.

Lifecycle / delete mantığı:

AdminAction hard delete edilmemelidir. Immutable kabul edilmelidir.

İleride dikkat edilecekler:

- Her kritik admin işlemi reason alanı istemelidir.
- Entitlement override, device revoke ve user disable işlemleri AdminAction üretmelidir.

## 15. Organization ve Membership Hazırlığı

Amaç:

İleride muhasebe ofisleri veya ekip lisansları için workspace/organization yapısına hazırlık sağlar.

Organization temel alanları:

- `id`
- `name`
- `billingEmail`
- `archivedAt`
- `createdAt`
- `updatedAt`

Membership temel alanları:

- `id`
- `userId`
- `organizationId`
- `role`
- `removedAt`
- `createdAt`

İlişkiler:

- Organization -> Membership
- Membership -> User
- Membership -> Organization

Unique constraint:

- `userId + organizationId` unique olmalıdır.

Lifecycle / delete mantığı:

Organization hard delete edilmemelidir; `archivedAt` kullanılmalıdır. Membership kaldırıldığında `removedAt` kullanılmalıdır.

İleride dikkat edilecekler:

- İlk aşamada organization entitlement veya seat sistemi kurulmayacaktır.
- Kurumsal lisans ihtiyacı netleşince OrganizationEntitlement gibi ayrı modeller eklenebilir.

## 16. Enum Stratejisi

Başlangıç enumları sade tutulmalıdır.

Önerilen enumlar:

```txt
UserRole
  USER
  SUPPORT
  ADMIN
  OWNER

SessionType
  WEB
  DESKTOP

ProductStatus
  ACTIVE
  INACTIVE
  ARCHIVED

SubscriptionStatus
  ACTIVE
  TRIALING
  PAST_DUE
  CANCELED
  EXPIRED
  PAUSED

EntitlementStatus
  ACTIVE
  INACTIVE
  EXPIRED
  REVOKED
  GRACE_PERIOD

EntitlementSource
  SUBSCRIPTION
  TRIAL
  ADMIN
  MANUAL

DeviceStatus
  ACTIVE
  REVOKED
  EXPIRED

PaymentStatus
  PENDING
  PAID
  FAILED
  REFUNDED

WebhookEventStatus
  PENDING
  PROCESSED
  FAILED
  IGNORED

AuditEventType
  USER_LOGIN
  DESKTOP_SESSION_CREATED
  DEVICE_REGISTERED
  DEVICE_REVOKED
  ENTITLEMENT_ACTIVATED
  ENTITLEMENT_REVOKED
  SUBSCRIPTION_UPDATED
  PAYMENT_SUCCEEDED
  PAYMENT_FAILED
  WEBHOOK_PROCESSED
  ADMIN_ACTION

MembershipRole
  OWNER
  ADMIN
  MEMBER
```

AuditEventType ileride büyüyebilir. Çok sık değişmesi beklenirse string tabanlı event tipi değerlendirilebilir. İlk aşamada enum okunabilirlik sağlar.

## 17. Unique Constraint Stratejisi

Kritik constraintler:

```txt
User.email unique
Product.slug unique
Subscription.provider + providerSubscriptionId unique
Entitlement.userId + productId unique
Device.productId + fingerprintHash unique
Payment.provider + providerOrderId unique
Invoice.provider + providerInvoiceId unique
WebhookEvent.provider + eventId unique
Membership.userId + organizationId unique
```

Önemli indexler:

```txt
Subscription.userId + productId
Subscription.providerCustomerId
Entitlement.productId + status
Device.userId + productId
Device.trustedUntil
Payment.userId + productId
AuditLog.entityType + entityId
AuditLog.eventType
```

Unique constraintler idempotency, ödeme tekrarları ve ürün erişimi tutarlılığı için kritik kabul edilmelidir.

## 18. Delete / Soft Delete Stratejisi

Hard delete edilmemesi gereken modeller:

- Payment
- Invoice
- WebhookEvent
- AuditLog
- AdminAction

Soft delete veya status tabanlı kapatma kullanılacak modeller:

- User: `disabledAt`
- Product: `status` veya `archivedAt`
- Subscription: `status`
- Entitlement: `status`, `revokedAt`
- Device: `status`, `revokedAt`
- Organization: `archivedAt`
- Membership: `removedAt`

Hard delete ticari kayıt, güvenlik izi ve destek süreçleri için risklidir.

## 19. Audit ve İzlenebilirlik

AuditLog append-only olmalıdır.

Kayıt üretecek olaylar:

- web login
- desktop session oluşturma
- desktop session revoke
- device register
- device revoke
- entitlement active/revoke/expire
- subscription update
- payment success/fail
- webhook processed/failed
- admin action

Entitlement değişim geçmişi ilk aşamada AuditLog üzerinden izlenebilir. Eğer destek operasyonu büyürse ileride ayrı `EntitlementHistory` modeli eklenebilir.

AdminAction ile AuditLog birlikte çalışmalıdır. AdminAction ne yapıldığını ve nedeni tutar; AuditLog sistem genelindeki olay izini tutar.

## 20. Gelecekte Workspace Genişlemesi

İlk sürüm bireysel kullanıcı hesabı üzerinden ilerlemelidir.

Gelecekte workspace ihtiyacı doğarsa şu modeller eklenebilir:

```txt
OrganizationEntitlement
  organizationId
  productId
  seatCount
  status

SeatAssignment
  organizationEntitlementId
  userId
```

İlk günden generic polymorphic entitlement kurulmayacaktır. Bu, erken karmaşıklık yaratır. Bireysel entitlement sade tutulacak; workspace lisansı gerçek ihtiyaç doğduğunda ayrı model olarak eklenecektir.

## 21. Şimdilik Yapılmayacaklar

Şimdilik yapılmayacaklar:

- gerçek Prisma schema yazmak
- migration çalıştırmak
- seed sistemi kurmak
- gerçek auth implementasyonu yapmak
- gerçek API yazmak
- Lemon Squeezy entegrasyonu yapmak
- mikroservis mimarisi kurmak
- aşırı karmaşık permission sistemi kurmak
- ilk günden polymorphic entitlement kurmak
- organization seat sistemini aktif kurmak
- gereksiz normalization yapmak

Bu kararların amacı sistemi kısıtlamak değil, doğru sırayla büyütmektir.

## 22. Bir Sonraki Teknik Adım

Bir sonraki teknik adım, bu dokümana göre `prisma/schema.prisma` taslağı hazırlamaktır.

Bu taslak hazırlanırken:

- migration çalıştırılmamalıdır
- gerçek database bağlantısı zorunlu değildir
- Auth.js bağlanmamalıdır
- Lemon Squeezy API yazılmamalıdır
- önce model isimleri, relationlar, enumlar ve constraintler review edilmelidir

Schema taslağı onaylandıktan sonra PostgreSQL bağlantısı, Prisma migration ve Auth.js foundation adımlarına geçilebilir.
