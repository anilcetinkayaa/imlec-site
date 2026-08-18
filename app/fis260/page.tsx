import type { Metadata } from "next";
import shotAyarlar from "./shots/fis260-ayarlar-performans.png";
import shotBitti from "./shots/fis260-islem-bitti.png";
import shotIsleniyor from "./shots/fis260-isleniyor.png";
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
  icon: "/products/fis260-mark.png",
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
      title: "Fişler okunurken",
      description:
        "Üç adımlı akış: Yükle → İşle → Excel. Fişler okunurken ilerleme, sıradaki fiş ve tahmini süre büyük ve sade Türkçeyle gösterilir; program o sırada kullanılmaya devam edilebilir.",
      image: shotIsleniyor,
      alt: "FİŞ260 fiş işleme ekranı — ilerleme ve tahmini süre",
    },
    {
      id: "results",
      label: "Sonuç ve kontrol",
      title: "Sonuç tablosu ve Excel",
      description:
        "Her fişin firması, tarihi, toplamı ve KDV'si tabloda; işlem bitince Excel dosyası hazırdır. Sistem emin olamadığı alanı boş bırakır ve Excel'de 'KONTROL EDİN' diye işaretler — sessiz yanlış rakam üretmez.",
      image: shotBitti,
      alt: "FİŞ260 sonuç tablosu — işlenen fişler ve hazır Excel",
    },
    {
      id: "performance",
      label: "Performans",
      title: "Bilgisayarınızı yormayan ayar",
      description:
        "Tek kaydırıcı: sola çektikçe bilgisayar rahatlar, sağa çektikçe tam hız. Doğruluk her kademede aynıdır. Tema tercihi launcher ile ortaktır.",
      image: shotAyarlar,
      alt: "FİŞ260 Ayarlar — performans kaydırıcısı ve temalar",
    },
  ],
  screenshotsNote:
    "Ekran görüntülerindeki firma adları tamamen temsilîdir; gerçek kişi veya kuruluşları ifade etmez. Görüntülenen tutarlar yalnızca tanıtım amacıyla oluşturulmuş örnek verilerdir.",
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
};

export default function Fis260Page() {
  return <ProductPageLayout config={fis260Config} />;
}
