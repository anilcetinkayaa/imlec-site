import type { Metadata } from "next";
import {
  ProductPageLayout,
  type ProductPageConfig,
} from "@/components/products/ProductPageLayout";
import shotGenelBakis from "./shots/cozver-genel-bakis.png";
import shotSektor from "./shots/cozver-sektor.png";
import shotSpreadAnatomi from "./shots/cozver-spread-anatomi.png";
import shotSpreadKarsilikli from "./shots/cozver-spread-karsilikli.png";

export const metadata: Metadata = {
  title: "ÇÖZVER | İmleç Yazılım",
  description:
    "ÇÖZVER, finansal analiz ve spread hazırlığı için geliştirme aşamasında olan Windows masaüstü ürünüdür.",
};

const cozverConfig: ProductPageConfig = {
  slug: "cozver",
  name: "ÇÖZVER",
  accent: "var(--accent-cozver)",
  icon: "/products/cozver-mark.png",
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
      href: "/products",
      variant: "outline",
    },
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
      label: "Genel Bakış",
      title: "Analiz çalışma alanı",
      description:
        "Sol menü, mali analizin tüm aşamalarını tek akışta toplar: Genel Bakış, Firma Kimliği, Spread, Oranlar, Findeks, Risk Merkezi, Grup Analizi ve Sektör Kıyası. Dönem ve kaynak bağlamı her an görünür.",
      image: shotGenelBakis,
      alt: "ÇÖZVER Genel Bakış ekranı — grup dosyası ve analiz aşamaları",
    },
    {
      id: "spread",
      label: "Spread — Karşılıklı",
      title: "Mali Tablolar / Spread — Üç Kanat",
      description:
        "Aktif, pasif ve gelir tablosu üç kanat halinde yan yana; dönemler karşılaştırmalı, değişimler yüzdeleriyle. Terazi şeridi aktif-pasif eşitliğini kuruş düzeyinde doğrular.",
      image: shotSpreadKarsilikli,
      alt: "ÇÖZVER Spread Karşılıklı görünümü — aktif, pasif ve gelir tablosu yan yana",
    },
    {
      id: "anatomi",
      label: "Anatomi",
      title: "Bilanço Anatomisi",
      description:
        "Bilançonun orantılı kompozisyonu tek bakışta: hangi kalem ne kadar yer tutuyor, aktif ile pasif nasıl dengeleniyor. Bloklara tıklayınca hesap detayına inilir.",
      image: shotSpreadAnatomi,
      alt: "ÇÖZVER Anatomi görünümü — bilançonun orantılı kompozisyonu",
    },
    {
      id: "sektor",
      label: "Sektör Kıyası",
      title: "Sektör Kıyası",
      description:
        "Firmanın oranları, TCMB ve TÜİK sektör istatistikleriyle kartil tablosunda kıyaslanır: firma değeri, sektör alt çeyreği, medyanı ve üst çeyreği yan yana — her satırda konum hükmüyle.",
      image: shotSektor,
      alt: "ÇÖZVER Sektör Kıyası ekranı — firma ve sektör kartil tablosu",
    },
  ],
  screenshotsNote:
    "Ekran görüntülerindeki firma ve kuruluş adları tamamen temsilîdir; gerçek kişi veya kuruluşları ifade etmez. Görüntülenen tutar ve oranlar yalnızca tanıtım amacıyla oluşturulmuş örnek verilerdir.",
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
        price: "Planlanıyor",
        period: "",
        description: "Ürün kapsamı olgunlaştığında kurumsal ihtiyaçlar ayrıca ele alınacak.",
        features: [
          "Şirket hesabı altında çok kullanıcı",
          "Dağıtım planı",
          "Yol haritası",
        ],
        ctaLabel: "Yakında",
        disabled: true,
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
};

export default function CozverPage() {
  return <ProductPageLayout config={cozverConfig} />;
}
