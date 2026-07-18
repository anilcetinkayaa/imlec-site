import type { Metadata } from "next";
import fis260Preview from "@/public/fis260-preview.png";
import {
  ProductPageLayout,
  type ProductPageConfig,
} from "@/components/products/ProductPageLayout";

export const metadata: Metadata = {
  title: "FİŞ260 | İmleç Yazılım",
  description:
    "FİŞ260, muhasebe ekipleri için geliştirilen Windows masaüstü OCR ve Excel aktarım uygulamasıdır.",
};

const fis260Config: ProductPageConfig = {
  slug: "fis260",
  name: "FİŞ260",
  accent: "var(--accent-fis260)",
  status: {
    label: "Beta v0.1.0",
    variant: "beta",
  },
  hero: {
    eyebrow: "Windows OCR + Excel",
    title: "Fişten Excel'e kısa ve kontrollü akış.",
    lead: "FİŞ260, muhasebe ekiplerinin fiş görsellerinden veri çıkarması, alanları kontrol etmesi ve Excel çıktısını denetlenebilir biçimde hazırlaması için geliştirilmiş masaüstü uygulamadır.",
    primaryAction: {
      label: "Imlec Yazilim Merkezi'ni indir",
      href: "/api/downloads/launcher",
      variant: "primary",
    },
    secondaryAction: {
      label: "Akışı incele",
      href: "#workflow",
      variant: "outline",
    },
  },
  audience: [
    "Muhasebe fişlerini toplu işleyen ekipler için tasarlandı.",
    "Web hesabı ürün erişimi, cihaz doğrulama ve indirme akışını yönetir.",
    "Masaüstü uygulama Windows 10/11 üzerinde odaklı bir çalışma yüzeyi sunar.",
  ],
  steps: [
    {
      title: "Fiş yükleyin",
      description:
        "Görsel dosyalarını masaüstü uygulamasına ekleyin ve işlem sırasını tek ekrandan takip edin.",
    },
    {
      title: "OCR işlemini başlatın",
      description:
        "Firma, VKN, tarih, KDV ve toplam alanları tanınır; sonuçlar kontrol edilebilir hale gelir.",
    },
    {
      title: "Alanları kontrol edin",
      description:
        "Aktarım öncesinde eksik veya hatalı alanları düzenleyerek muhasebe akışını güvenceye alın.",
    },
    {
      title: "Excel çıktısı alın",
      description:
        "Kontrol edilen veriyi ekip içinde kullanılabilir Excel dosyası olarak dışa aktarın.",
    },
  ],
  screenshots: [
    {
      id: "processing",
      label: "İşleme",
      title: "Fiş işleme ekranı",
      description:
        "Yüklenen fişler, OCR ilerlemesi ve durum bilgileri aynı masaüstü çalışma yüzeyinde izlenir.",
      image: fis260Preview,
      alt: "FİŞ260 fiş işleme ekran görüntüsü",
    },
    {
      id: "control",
      label: "Kontrol",
      title: "Alan kontrolü",
      description:
        "OCR sonucunda çıkarılan alanlar Excel'e aktarılmadan önce kullanıcı tarafından doğrulanır.",
      image: fis260Preview,
      alt: "FİŞ260 alan kontrol ekranı",
    },
    {
      id: "export",
      label: "Excel",
      title: "Excel aktarımı",
      description:
        "Onaylanan kayıtlar muhasebe ekibinin kullanabileceği düzenli Excel çıktısına dönüştürülür.",
      image: fis260Preview,
      alt: "FİŞ260 Excel aktarım ekranı",
    },
  ],
  specs: [
    ["Platform", "Windows 10/11"],
    ["Dağıtım", "Yetkili web hesabı üzerinden"],
    ["Kurulum", "Imlec Yazilim Merkezi uzerinden"],
    ["Çıktı", "Excel dosyası"],
    ["Sürüm", "v0.1.1"],
    ["Erişim", "Ürün bazlı üyelik"],
  ],
  membership: {
    eyebrow: "FİŞ260 üyeliği",
    title: "Ürün erişimi hesabınıza bağlanır.",
    description:
      "Yetkili kullanıcılar kurulum dosyasını web hesabından indirir. Masaüstü uygulama açıldığında aynı hesapla oturum açılır ve aktif üyelik kontrol edilir.",
    tiers: [
      {
        name: "Tek Kullanıcı",
        price: "Görüşme",
        period: "ile",
        description: "Bireysel kullanım ve düşük hacimli fiş işleme için.",
        features: [
          "FİŞ260 ürün erişimi",
          "Windows kurulum dosyası",
          "Hesaba bağlı cihaz doğrulama",
        ],
        ctaLabel: "Üyeliği başlat",
        ctaHref: "/uyelik",
      },
      {
        name: "Ekip",
        price: "Görüşme",
        period: "ile",
        description: "Birden fazla kullanıcı ve düzenli operasyonlar için.",
        features: [
          "Ekip bazlı ürün erişimi",
          "Cihaz ve kullanıcı görünürlüğü",
          "Öncelikli kurulum desteği",
        ],
        ctaLabel: "Ekip üyeliği iste",
        ctaHref: "/uyelik",
      },
      {
        name: "Kurumsal",
        price: "Planlı",
        period: "kurulum",
        description: "Daha geniş dağıtım ve süreç gereksinimleri için.",
        features: [
          "Kullanım senaryosu değerlendirmesi",
          "Kurumsal dağıtım planı",
          "Ürün yol haritası görüşmesi",
        ],
        ctaLabel: "Kurumsal görüşme talep et",
        ctaHref: "mailto:info@imlecyazilim.com?subject=FİŞ260 kurumsal görüşme",
      },
    ],
  },
  faq: [
    {
      question: "FİŞ260 web uygulaması mı?",
      answer:
        "Hayır. FİŞ260 Windows üzerinde çalışan masaüstü uygulamadır. Web platformu üyelik, ürün erişimi, cihaz doğrulama ve indirme akışını yönetir.",
    },
    {
      question: "Kurulum dosyası nereden indirilir?",
      answer:
        "Ürün erişimi olan kullanıcılar giriş yaptıktan sonra hesap panelinden veya indirme CTA'larından korumalı download akışına yönlenir.",
    },
    {
      question: "Yetkisiz kullanıcı kurulum dosyasını indirebilir mi?",
      answer:
        "Hayır. Download route'u oturum ve FİŞ260 ürün erişimi kontrolünü korur; yetkisiz kullanıcılar dosyayı alamaz.",
    },
    {
      question: "ÇÖZVER ile aynı üyelik mi kullanılacak?",
      answer:
        "İmleç hesabı ortaktır, ancak ürün erişimleri ürün bazında ayrı yönetilir. ÇÖZVER aktif olduğunda kendi ürün erişimiyle görünür.",
    },
  ],
  related: [
    {
      name: "ÇÖZVER",
      href: "/cozver",
      status: "Yakında",
      description:
        "Finansal analiz ve spread hazırlığı için geliştirme aşamasındaki masaüstü ürün.",
      accent: "var(--accent-cozver)",
    },
  ],
};

export default function Fis260Page() {
  return <ProductPageLayout config={fis260Config} />;
}
