# Lemon Squeezy Test Mode Kurulumu

Phase 5 entegrasyonu Lemon Squeezy altyapisini hazirlar, ancak live mode'a gecis
icin end-to-end test tamamlanmadan production satis akisi acilmamalidir.

## Ortam degiskenleri

Vercel ortamlarinda asagidaki degiskenler tanimlanmalidir:

- `LEMONSQUEEZY_WEBHOOK_SECRET`: Lemon Squeezy webhook signing secret.
- `LEMONSQUEEZY_API_KEY`: Ileride API tabanli checkout ve dashboard islemleri icin.
- `LEMONSQUEEZY_FIS260_CHECKOUT_URL`: Test mode hosted checkout URL.

## Test store ayarlari

1. Lemon Squeezy Test Mode store olusturun.
2. FIS260 urunu icin bir variant olusturun.
3. Variant uzerinde license key generation ozelligini acin.
4. Personal test icin `activation_limit=2` kullanin.
5. Ekip veya kurumsal testlerde daha yuksek activation limit kullanin.
6. Webhook endpoint olarak `/api/webhooks/lemonsqueezy` adresini ekleyin.
7. Webhook event listesinde su eventleri secin:
   - `order_created`
   - `subscription_created`
   - `subscription_updated`
   - `subscription_cancelled`
   - `subscription_expired`
   - `subscription_payment_success`
   - `subscription_payment_failed`
   - `license_key_created`
   - `license_key_updated`

## Checkout custom data

Checkout linki su query parametreleri ile olusturulur:

- `checkout[email]`
- `checkout[custom][user_id]`
- `checkout[custom][product_slug]`

Webhook isleme sirasinda kullanici eslestirme once `custom_data.user_id` ile,
sonra e-posta adresi ile yapilir.

## Live mode oncesi kontrol listesi

- Test kullanicisi ile subscribe akisi tamamlandi.
- Admin Lemon Squeezy panelinde subscription kaydi goruldu.
- `Entitlement.source=LEMON_SQUEEZY` ve `status=ACTIVE` olustu.
- Payment success e-postasi Resend uzerinden gitti.
- Cancel ve expire eventleri entitlement'i revoke etti.
- Duplicate webhook tekrar gonderiminde yeni islem yapilmadi.
- License key eventleri admin panelinde goruldu.
- Live mode checkout URL production'a ancak bu testlerden sonra eklendi.
