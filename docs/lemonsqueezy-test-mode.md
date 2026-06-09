# Lemon Squeezy Test Mode - FIS260

Bu dosya FIS260 abonelik akışının test mode kurulumunu ve live mode'a geçmeden önce yapılacak kontrolleri özetler.

## Env

Zorunlu değerler Vercel ortam değişkenlerine girilir, koda yazılmaz.

```env
LEMONSQUEEZY_MODE=test
LEMONSQUEEZY_API_KEY=
LEMONSQUEEZY_WEBHOOK_SECRET=
LEMONSQUEEZY_STORE_ID=
LEMONSQUEEZY_FIS260_CHECKOUT_URL=https://imlecyazilim.lemonsqueezy.com/checkout/buy/381be529-dddf-4e69-bdec-c7fdb3baae78
LEMONSQUEEZY_FIS260_PRODUCT_ID=
LEMONSQUEEZY_FIS260_VARIANT_ID=
LEMONSQUEEZY_PAYMENT_GRACE_DAYS=7
```

## Webhook

Callback:

```text
https://imlecyazilim.com/api/webhooks/lemonsqueezy
```

Desteklenen eventler:

```text
order_created
order_refunded
subscription_created
subscription_updated
subscription_cancelled
subscription_expired
subscription_payment_success
subscription_payment_failed
license_key_created
license_key_updated
```

License key eventleri kaydedilebilir ama FIS260 erişim kararında kullanılmaz.

## Erişim Modeli

Lemon Squeezy yalnızca ödeme ve abonelik sağlayıcısıdır. FIS260 erişimi İmleç sistemindeki `Entitlement` kayıtları üzerinden verilir.

- Başarılı order/subscription/payment: `LEMON_SQUEEZY` kaynaklı entitlement oluşturur veya günceller.
- Ödeme başarısız: entitlement `GRACE_PERIOD` olur ve `LEMONSQUEEZY_PAYMENT_GRACE_DAYS` kadar süre tanır.
- İptal: abonelik bitiş tarihi ilerideyse erişim o tarihe kadar devam eder, bitmişse Lemon entitlement revoke edilir.
- Expired/refunded: Lemon entitlement revoke edilir.
- Admin/kampanya/trial hakları Lemon entitlement'tan ayrı kayıt olarak kalır. Erişim kararında aynı ürün için geçerli herhangi bir entitlement yeterlidir.

## Checkout Custom Data

Üyelik sayfası checkout linkine şu bilgileri ekler:

```text
checkout[email]
checkout[custom][user_id]
checkout[custom][product_slug]=fis260
checkout[custom][source]=web
```

Webhook eşleştirme önceliği:

1. `meta.custom_data.user_id`
2. Lemon payload içindeki kullanıcı/customer e-postası
3. Eşleşme yoksa webhook event kaydı hata ile kalır ve admin panelinden incelenir.

## Uçtan Uca Test

1. Vercel test env değerlerini gir.
2. Lemon test webhook secret değerini Vercel `LEMONSQUEEZY_WEBHOOK_SECRET` olarak kaydet.
3. Siteye giriş yap ve `/uyelik` sayfasından FIS260 aboneliğini başlat.
4. Lemon test kartı ile checkout'u tamamla.
5. `/admin/lemonsqueezy` sayfasında webhook event, payment ve subscription kayıtlarını kontrol et.
6. Kullanıcının `/account/products` veya launcher içinden FIS260 erişiminin aktif göründüğünü doğrula.
7. Desktop launcher ile FIS260 indirme/başlatma akışını test et.
8. Test ödeme başarısız, iptal ve iade eventlerini Lemon test panelinden tetikle; entitlement davranışını kontrol et.

## Live Mode'a Geçiş

Live mode için ayrı API key, webhook secret, product, variant ve checkout URL girilecek. Test mode değerleri live ortamda kullanılmayacak.
