export const CHANGELOG_ENTRIES = [
  {
    version: "v0.1.0-beta",
    date: "15.05.2026",
    title: "FİŞ260 beta dağıtımı",
    summary:
      "Windows kurulum dosyası GitHub release üzerinden güvenli indirme akışına bağlandı.",
    body: [
      "FİŞ260 installer dosyası korumalı download route'u üzerinden dağıtılır.",
      "Oturum ve ürün erişimi kontrolü korunur; başarılı kontrolden sonra release asset adresine yönlendirme yapılır.",
      "Download merkezi sürüm, dosya boyutu ve SHA-256 bilgisini gösterir.",
    ],
  },
  {
    version: "platform",
    date: "14.05.2026",
    title: "Hesap ve ürün erişimi",
    summary:
      "Ürün sahipliği, cihaz doğrulama ve indirme görünürlüğü hesap panelinde toplandı.",
    body: [
      "Account paneli ürün, cihaz, ödeme ve profil alanlarına ayrıldı.",
      "Erişimi olmayan ürünler gizlenmez; kullanıcı ürün durumunu açık biçimde görür.",
      "Yetkili ürünler için indirme CTA'ları mevcut route yapısını kullanır.",
    ],
  },
  {
    version: "cozver",
    date: "13.05.2026",
    title: "ÇÖZVER hazırlığı",
    summary:
      "Finansal analiz ürünü için ayrı üyelik ve ürün alanı planlandı.",
    body: [
      "ÇÖZVER sayfası geliştirme aşaması konumuyla yayına hazırlandı.",
      "Bekleme listesi formu backend endpoint bağlanana kadar pasif tutuldu.",
      "Ürün, FİŞ260 ile aynı platform chrome içinde ayrı accent tonuyla ayrıştırıldı.",
    ],
  },
];
