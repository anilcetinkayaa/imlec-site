import type { Metadata } from "next";
import {
  ProductPageLayout,
  type ProductPageConfig,
} from "@/components/products/ProductPageLayout";

export const metadata: Metadata = {
  title: "KUYVERA | İmleç Yazılım",
  description:
    "KUYVERA, kuyumcuların günlük işleyişi için geliştirme aşamasında olan üçüncü İmleç Yazılım masaüstü ürünüdür.",
};

const kuyveraConfig: ProductPageConfig = {
  slug: "kuyvera",
  name: "KUYVERA",
  accent: "var(--accent-kuyvera)",
  status: {
    label: "Geliştirme aşamasında",
    variant: "coming-soon",
  },
  hero: {
    eyebrow: "Kuyumculuk",
    title: "Kuyumcunun günlük işleyişi için tasarlanan masaüstü yüzey.",
    lead: "KUYVERA, kuyumcuların günlük iş akışını masaüstünde düzenlemek için geliştirilen üçüncü İmleç Yazılım ürünüdür. Kapsam ve ekranlar geliştirme ilerledikçe bu sayfada duyurulacak.",
    secondaryAction: {
      label: "Tüm ürünleri incele",
      href: "/products",
      variant: "outline",
    },
  },
  waitlist: {
    action: null,
    note: "KUYVERA duyuruları hazır olduğunda bu alandan bekleme listesine katılım açılacak.",
  },
  audience: [
    "Kuyumcu işletmelerinin günlük işleyişi için planlanıyor.",
    "Ürün erişimi diğer İmleç ürünlerinden ayrı, İmleç hesabı altında yönetilecek.",
    "Geliştirme tamamlandığında Windows masaüstü uygulaması olarak dağıtılacak.",
  ],
  steps: [
    {
      title: "Kapsam belirleniyor",
      description:
        "Ürünün ilk sürümünde yer alacak iş akışları kuyumcularla birlikte netleştiriliyor.",
    },
    {
      title: "Tasarım ve geliştirme",
      description:
        "Masaüstü arayüz, İmleç platformunun tasarım ve hesap standartlarıyla geliştiriliyor.",
    },
    {
      title: "Kapalı deneme",
      description:
        "İlk sürüm, seçili işletmelerle gerçek işleyişte denenecek.",
    },
    {
      title: "Duyuru ve erişim",
      description:
        "Ürün hazır olduğunda üyelik ve indirme akışı bu sayfadan açılacak.",
    },
  ],
  screenshots: [
    {
      id: "workspace",
      label: "Çalışma alanı",
      title: "KUYVERA çalışma alanı",
      description:
        "Ürün arayüzü netleştikçe bu alan gerçek uygulama görüntüleriyle güncellenecek.",
      placeholder: "Geliştirme aşamasında",
    },
    {
      id: "flows",
      label: "İş akışları",
      title: "Günlük iş akışları",
      description:
        "Kuyumcu iş akışlarının ekran turu, kapsam duyurusuyla birlikte eklenecek.",
      placeholder: "Ekran görüntüsü bekleniyor",
    },
  ],
  specs: [
    ["Platform", "Windows 10/11"],
    ["Durum", "Geliştirme aşamasında"],
    ["Dağıtım", "Yetkili web hesabı üzerinden"],
    ["Erişim", "Ürün bazlı üyelik"],
    ["Hesap", "İmleç Yazılım hesabı"],
    ["Kurulum", "Duyuruyla birlikte açıklanacak"],
  ],
  membership: {
    eyebrow: "KUYVERA üyeliği",
    title: "Diğer ürünlerden ayrı üyelikle planlanıyor.",
    description:
      "KUYVERA aktif olduğunda hesap panelinde ayrı ürün olarak görünecek; indirme ve cihaz doğrulama akışı aynı platform standartlarını kullanacak.",
    tiers: [
      {
        name: "İlk sürüm",
        price: "Yakında",
        period: "",
        description: "İlk kullanım kapsamı ürün hazır olduğunda duyurulacak.",
        features: [
          "Ayrı KUYVERA ürün erişimi",
          "Windows kurulum akışı",
          "İmleç hesabıyla oturum açma",
        ],
        ctaLabel: "Henüz aktif değil",
        disabled: true,
      },
      {
        name: "İşletme",
        price: "Planlanıyor",
        period: "",
        description:
          "Birden fazla tezgah/kullanıcı için işletme planı değerlendiriliyor.",
        features: [
          "İşletme bazlı kullanım planı",
          "Cihaz yönetimi",
          "Ürün geri bildirim süreci",
        ],
        ctaLabel: "Geliştirme aşamasında",
        disabled: true,
      },
      {
        name: "Görüşme",
        price: "İletişim",
        period: "ile",
        description:
          "Kuyumcu işletmenizin ihtiyacını şimdiden iletmek isterseniz bize yazın.",
        features: [
          "İhtiyaç değerlendirmesi",
          "Kapsam önerisi",
          "Yol haritası bilgisi",
        ],
        ctaLabel: "Görüşme talep et",
        ctaHref: "mailto:info@imlecyazilim.com?subject=KUYVERA ürün bilgisi",
      },
    ],
  },
  faq: [
    {
      question: "KUYVERA indirilebilir durumda mı?",
      answer:
        "Hayır. KUYVERA geliştirme aşamasındadır. Ürün hazır olduğunda indirme akışı ve hesap paneli görünürlüğü eklenecek.",
    },
    {
      question: "KUYVERA kimler için?",
      answer:
        "Kuyumcu işletmeleri için geliştiriliyor. İlk sürüm kapsamı netleştiğinde ayrıntılar bu sayfada duyurulacak.",
    },
    {
      question: "Diğer İmleç üyelikleri KUYVERA'yı kapsar mı?",
      answer:
        "Hayır. İmleç hesabı ortak kalır, ancak ürün erişimleri ürün bazında ayrı yönetilir.",
    },
    {
      question: "KUYVERA da masaüstü uygulama mı olacak?",
      answer:
        "Evet. Windows masaüstü uygulaması ve web hesabıyla yönetilen ürün erişimi üzerine kuruludur.",
    },
  ],
  related: [
    {
      name: "FİŞ260",
      href: "/fis260",
      status: "Satışta",
      description:
        "Fiş görsellerinden OCR ile veri çıkaran ve Excel çıktısı hazırlayan aktif masaüstü ürün.",
      accent: "var(--accent-fis260)",
    },
    {
      name: "ÇÖZVER",
      href: "/cozver",
      status: "Çok yakında",
      description:
        "Finansal analiz ve spread hazırlığı için geliştirilen ikinci İmleç ürünü.",
      accent: "var(--accent-cozver)",
    },
  ],
};

export default function KuyveraPage() {
  return <ProductPageLayout config={kuyveraConfig} />;
}
