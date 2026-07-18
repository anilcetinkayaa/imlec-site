import type { Metadata } from "next";
import {
  ProductPageLayout,
  type ProductPageConfig,
} from "@/components/products/ProductPageLayout";

export const metadata: Metadata = {
  title: "ÇÖZVER | İmleç Yazılım",
  description:
    "ÇÖZVER, finansal analiz ve spread hazırlığı için geliştirme aşamasında olan Windows masaüstü ürünüdür.",
};

const cozverConfig: ProductPageConfig = {
  slug: "cozver",
  name: "ÇÖZVER",
  accent: "var(--accent-cozver)",
  status: {
    label: "Geliştirme aşamasında",
    variant: "coming-soon",
  },
  hero: {
    eyebrow: "Finansal analiz",
    title: "Finansal analiz için sakin bir masaüstü yüzeyi.",
    lead: "ÇÖZVER, finansal analiz, spread hazırlığı ve belge tabanlı çalışma adımlarını tek masaüstü yüzeyinde düzenlemek için geliştirilen ikinci İmleç Yazılım ürünüdür.",
    secondaryAction: {
      label: "Platform ürünlerini incele",
      href: "/#products",
      variant: "outline",
    },
  },
  waitlist: {
    action: null,
    note: "Bekleme listesi endpoint'i belirlendiğinde bu form aynı tasarım içinde aktif hale getirilecek.",
  },
  audience: [
    "Finansal analiz hazırlığını düzenli ve izlenebilir yapmak için planlanıyor.",
    "Ürün erişimi FİŞ260'dan ayrı, İmleç hesabı altında yönetilecek.",
    "Geliştirme tamamlandığında Windows masaüstü uygulaması olarak dağıtılacak.",
  ],
  steps: [
    {
      title: "Belgeyi içeri alın",
      description:
        "Analiz için kullanılan finansal dokümanlar tek çalışma alanında toplanacak.",
    },
    {
      title: "Veriyi sınıflandırın",
      description:
        "Tablo, dönem ve hesap bilgileri kontrollü biçimde ayrıştırılacak.",
    },
    {
      title: "Spread hazırlayın",
      description:
        "Analiz çıktıları, ekiplerin kullandığı finansal değerlendirme formatlarına hazırlanacak.",
    },
    {
      title: "Sonucu gözden geçirin",
      description:
        "Üretilen çalışma, aktarım öncesinde kullanıcı kontrolünden geçecek.",
    },
  ],
  screenshots: [
    {
      id: "workspace",
      label: "Çalışma alanı",
      title: "Analiz çalışma alanı",
      description:
        "ÇÖZVER ekran turu ürün arayüzü netleştikçe bu alana gerçek uygulama görüntüleriyle eklenecek.",
      placeholder: "Geliştirme aşamasında",
    },
    {
      id: "classification",
      label: "Sınıflandırma",
      title: "Veri sınıflandırma",
      description:
        "Finansal veri sınıflandırma akışı, ürün erişimi hazır olduğunda ayrıntılı olarak gösterilecek.",
      placeholder: "Ekran görüntüsü bekleniyor",
    },
    {
      id: "spread",
      label: "Spread",
      title: "Spread hazırlığı",
      description:
        "Spread çıktısı ve kontrol adımları, beta sürüm kapsamı netleştiğinde bu turda yer alacak.",
      placeholder: "Demo yakında",
    },
  ],
  specs: [
    ["Platform", "Windows 10/11"],
    ["Durum", "Geliştirme aşamasında"],
    ["Dağıtım", "Yetkili web hesabı üzerinden"],
    ["Erişim", "Ürün bazlı üyelik"],
    ["Hesap", "İmleç Yazılım hesabı"],
    ["Kurulum", "Beta sürümde duyurulacak"],
  ],
  membership: {
    eyebrow: "ÇÖZVER üyeliği",
    title: "FİŞ260'dan ayrı ürün erişimiyle planlanıyor.",
    description:
      "ÇÖZVER aktif olduğunda hesap panelinde ayrı ürün olarak görünecek. İndirme ve cihaz doğrulama akışı aynı platform standartlarını kullanacak.",
    tiers: [
      {
        name: "Beta erişimi",
        price: "Yakında",
        period: "",
        description: "İlk kullanım kapsamı ürün hazır olduğunda duyurulacak.",
        features: [
          "Ayrı ÇÖZVER ürün erişimi",
          "Windows kurulum akışı",
          "İmleç hesabıyla oturum açma",
        ],
        ctaLabel: "Henüz aktif değil",
        disabled: true,
      },
      {
        name: "Ekip",
        price: "Planlanıyor",
        period: "",
        description: "Finans ekipleri için ortak çalışma gereksinimleri değerlendiriliyor.",
        features: [
          "Ekip bazlı kullanım planı",
          "Cihaz yönetimi",
          "Ürün geri bildirim süreci",
        ],
        ctaLabel: "Geliştirme aşamasında",
        disabled: true,
      },
      {
        name: "Kurumsal",
        price: "Görüşme",
        period: "ile",
        description: "Ürün kapsamı olgunlaştığında kurumsal ihtiyaçlar ayrıca ele alınacak.",
        features: [
          "Kapsam değerlendirmesi",
          "Dağıtım planı",
          "Yol haritası görüşmesi",
        ],
        ctaLabel: "Görüşme talep et",
        ctaHref: "mailto:info@imlecyazilim.com?subject=ÇÖZVER ürün bilgisi",
      },
    ],
  },
  faq: [
    {
      question: "ÇÖZVER indirilebilir durumda mı?",
      answer:
        "Hayır. ÇÖZVER geliştirme aşamasındadır. Ürün hazır olduğunda ayrı indirme akışı ve hesap paneli görünürlüğü eklenecek.",
    },
    {
      question: "FİŞ260 üyeliği ÇÖZVER'i kapsar mı?",
      answer:
        "Hayır. İmleç hesabı ortak kalır, ancak ürün erişimleri ayrı yönetilir.",
    },
    {
      question: "Bekleme listesi aktif mi?",
      answer:
        "Bekleme listesi formu için endpoint henüz bağlanmadı. Backend endpoint belirlendiğinde aynı form aktif hale getirilecek.",
    },
    {
      question: "ÇÖZVER de masaüstü uygulama mı olacak?",
      answer:
        "Evet. Planlanan ürün yapısı Windows masaüstü uygulaması ve web hesabıyla yönetilen ürün erişimi üzerine kuruludur.",
    },
  ],
  related: [
    {
      name: "FİŞ260",
      href: "/fis260",
      status: "Beta",
      description:
        "Fiş görsellerinden OCR ile veri çıkaran ve Excel çıktısı hazırlayan aktif masaüstü ürün.",
      accent: "var(--accent-fis260)",
    },
  ],
};

export default function CozverPage() {
  return <ProductPageLayout config={cozverConfig} />;
}
