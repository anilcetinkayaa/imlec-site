# Resend + Cloudflare DNS

Resend domain verification için Cloudflare üzerinde aşağıdaki kayıtlar gerekir.
DKIM değerleri Resend dashboard tarafından domain eklenince üretilir; bu değerler
elde edilmeden otomatik DNS eklemek mümkün değildir.

## SPF

Type: `TXT`

Name: `@`

Value:

```txt
v=spf1 include:amazonses.com ~all
```

## DKIM

Resend dashboard içinde `imlecyazilim.com` domain verification ekranında verilen
3 adet DKIM kaydını Cloudflare DNS'e ekleyin.

Type: `CNAME`

Name: Resend tarafından verilen selector host

Value: Resend tarafından verilen DKIM target

## DMARC

Type: `TXT`

Name: `_dmarc`

Value:

```txt
v=DMARC1; p=quarantine; rua=mailto:admin@imlecyazilim.com; adkim=s; aspf=s
```

## Production Env

Vercel Production ortamında şu değişkenler gerekir:

```txt
RESEND_API_KEY=<resend-api-key>
MAIL_FROM=İmleç Yazılım <noreply@imlecyazilim.com>
ADMIN_ALERT_EMAIL=admin@imlecyazilim.com
```

`RESEND_API_KEY` yoksa `sendMail` güvenli şekilde `skipped` döner ve register,
desktop device register veya admin mutation akışlarını bozmaz.
