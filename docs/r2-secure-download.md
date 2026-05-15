# R2 Secure Download Kurulumu

Phase 6 ile installer dagitimi GitHub release redirect yerine Cloudflare R2
presigned URL akisi ile calisir. Uygulama binary proxy yapmaz; download route'u
once oturum ve entitlement kontrolu yapar, sonra 10 dakika gecerli imzali GET
linki uretir.

## R2 bucket

- Bucket adi: `imlec-installers`
- FIS260 object key: `fis260/FIS260_Setup_v0.1.0.exe`
- SHA-256:
  `828466679dbe554957e93f21aa4e53f01bb055282edbad3dc283ce010ae253d0`

## Ortam degiskenleri

Vercel production ortaminda su degiskenler tanimlanmalidir:

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET=imlec-installers`

## Davranis

- `/api/downloads/fis260` authenticated olmayan kullaniciyi reddeder.
- Entitlement olmayan kullanici dosya linki alamaz.
- ADMIN rolundeki kullanici entitlement kontrolunu bypass eder.
- Basarili indirmede route `ProductVersion.filePath` degerinden R2 presigned URL
  uretir.
- Presigned URL TTL: 10 dakika.

## Version endpoint

Desktop uygulama startup sirasinda `/api/version/fis260` endpoint'ini okuyabilir.
Endpoint su alanlari dondurur:

- `latest`
- `minimum`
- `releaseNotes`
- `sha256`
- `releasedAt`
