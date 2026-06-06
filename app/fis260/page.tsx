import type { Metadata } from "next";
import fis260Preview from "@/public/fis260-preview.png";
import {
  ProductPageLayout,
  type ProductPageConfig,
} from "@/components/products/ProductPageLayout";

export const metadata: Metadata = {
  title: "FÄ°Å260 | Ä°mleÃ§ YazÄ±lÄ±m",
  description:
    "FÄ°Å260, muhasebe ekipleri iÃ§in geliÅŸtirilen Windows masaÃ¼stÃ¼ OCR ve Excel aktarÄ±m uygulamasÄ±dÄ±r.",
};

const fis260Config: ProductPageConfig = {
  slug: "fis260",
  name: "FÄ°Å260",
  accent: "var(--accent-fis260)",
  status: {
    label: "Beta v0.1.0",
    variant: "beta",
  },
  hero: {
    eyebrow: "Windows OCR + Excel",
    title: "FiÅŸten Excel'e kÄ±sa ve kontrollÃ¼ akÄ±ÅŸ.",
    lead: "FÄ°Å260, muhasebe ekiplerinin fiÅŸ gÃ¶rsellerinden veri Ã§Ä±karmasÄ±, alanlarÄ± kontrol etmesi ve Excel Ã§Ä±ktÄ±sÄ±nÄ± denetlenebilir biÃ§imde hazÄ±rlamasÄ± iÃ§in geliÅŸtirilmiÅŸ masaÃ¼stÃ¼ uygulamadÄ±r.",
    primaryAction: {
      label: "Imlec Yazilim Merkezi'ni indir",
      href: "/api/downloads/launcher",
      variant: "primary",
    },
    secondaryAction: {
      label: "AkÄ±ÅŸÄ± incele",
      href: "#workflow",
      variant: "outline",
    },
  },
  audience: [
    "Muhasebe fiÅŸlerini toplu iÅŸleyen ekipler iÃ§in tasarlandÄ±.",
    "Web hesabÄ± Ã¼rÃ¼n eriÅŸimi, cihaz doÄŸrulama ve indirme akÄ±ÅŸÄ±nÄ± yÃ¶netir.",
    "MasaÃ¼stÃ¼ uygulama Windows 10/11 Ã¼zerinde odaklÄ± bir Ã§alÄ±ÅŸma yÃ¼zeyi sunar.",
  ],
  steps: [
    {
      title: "FiÅŸ yÃ¼kleyin",
      description:
        "GÃ¶rsel dosyalarÄ±nÄ± masaÃ¼stÃ¼ uygulamasÄ±na ekleyin ve iÅŸlem sÄ±rasÄ±nÄ± tek ekrandan takip edin.",
    },
    {
      title: "OCR iÅŸlemini baÅŸlatÄ±n",
      description:
        "Firma, VKN, tarih, KDV ve toplam alanlarÄ± tanÄ±nÄ±r; sonuÃ§lar kontrol edilebilir hale gelir.",
    },
    {
      title: "AlanlarÄ± kontrol edin",
      description:
        "AktarÄ±m Ã¶ncesinde eksik veya hatalÄ± alanlarÄ± dÃ¼zenleyerek muhasebe akÄ±ÅŸÄ±nÄ± gÃ¼venceye alÄ±n.",
    },
    {
      title: "Excel Ã§Ä±ktÄ±sÄ± alÄ±n",
      description:
        "Kontrol edilen veriyi ekip iÃ§inde kullanÄ±labilir Excel dosyasÄ± olarak dÄ±ÅŸa aktarÄ±n.",
    },
  ],
  screenshots: [
    {
      id: "processing",
      label: "Ä°ÅŸleme",
      title: "FiÅŸ iÅŸleme ekranÄ±",
      description:
        "YÃ¼klenen fiÅŸler, OCR ilerlemesi ve durum bilgileri aynÄ± masaÃ¼stÃ¼ Ã§alÄ±ÅŸma yÃ¼zeyinde izlenir.",
      image: fis260Preview,
      alt: "FÄ°Å260 fiÅŸ iÅŸleme ekran gÃ¶rÃ¼ntÃ¼sÃ¼",
    },
    {
      id: "control",
      label: "Kontrol",
      title: "Alan kontrolÃ¼",
      description:
        "OCR sonucunda Ã§Ä±karÄ±lan alanlar Excel'e aktarÄ±lmadan Ã¶nce kullanÄ±cÄ± tarafÄ±ndan doÄŸrulanÄ±r.",
      image: fis260Preview,
      alt: "FÄ°Å260 alan kontrol ekranÄ±",
    },
    {
      id: "export",
      label: "Excel",
      title: "Excel aktarÄ±mÄ±",
      description:
        "Onaylanan kayÄ±tlar muhasebe ekibinin kullanabileceÄŸi dÃ¼zenli Excel Ã§Ä±ktÄ±sÄ±na dÃ¶nÃ¼ÅŸtÃ¼rÃ¼lÃ¼r.",
      image: fis260Preview,
      alt: "FÄ°Å260 Excel aktarÄ±m ekranÄ±",
    },
  ],
  specs: [
    ["Platform", "Windows 10/11"],
    ["DaÄŸÄ±tÄ±m", "Yetkili web hesabÄ± Ã¼zerinden"],
    ["Kurulum", "Imlec Yazilim Merkezi uzerinden"],
    ["Ã‡Ä±ktÄ±", "Excel dosyasÄ±"],
    ["SÃ¼rÃ¼m", "v0.1.1"],
    ["EriÅŸim", "ÃœrÃ¼n bazlÄ± Ã¼yelik"],
  ],
  membership: {
    eyebrow: "FÄ°Å260 Ã¼yeliÄŸi",
    title: "ÃœrÃ¼n eriÅŸimi hesabÄ±nÄ±za baÄŸlanÄ±r.",
    description:
      "Yetkili kullanÄ±cÄ±lar kurulum dosyasÄ±nÄ± web hesabÄ±ndan indirir. MasaÃ¼stÃ¼ uygulama aÃ§Ä±ldÄ±ÄŸÄ±nda aynÄ± hesapla oturum aÃ§Ä±lÄ±r ve aktif Ã¼yelik kontrol edilir.",
    tiers: [
      {
        name: "Tek KullanÄ±cÄ±",
        price: "GÃ¶rÃ¼ÅŸme",
        period: "ile",
        description: "Bireysel kullanÄ±m ve dÃ¼ÅŸÃ¼k hacimli fiÅŸ iÅŸleme iÃ§in.",
        features: [
          "FÄ°Å260 Ã¼rÃ¼n eriÅŸimi",
          "Windows kurulum dosyasÄ±",
          "Hesaba baÄŸlÄ± cihaz doÄŸrulama",
        ],
        ctaLabel: "ÃœyeliÄŸi baÅŸlat",
        ctaHref: "/uyelik",
      },
      {
        name: "Ekip",
        price: "GÃ¶rÃ¼ÅŸme",
        period: "ile",
        description: "Birden fazla kullanÄ±cÄ± ve dÃ¼zenli operasyonlar iÃ§in.",
        features: [
          "Ekip bazlÄ± Ã¼rÃ¼n eriÅŸimi",
          "Cihaz ve kullanÄ±cÄ± gÃ¶rÃ¼nÃ¼rlÃ¼ÄŸÃ¼",
          "Ã–ncelikli kurulum desteÄŸi",
        ],
        ctaLabel: "Ekip Ã¼yeliÄŸi iste",
        ctaHref: "/uyelik",
      },
      {
        name: "Kurumsal",
        price: "PlanlÄ±",
        period: "kurulum",
        description: "Daha geniÅŸ daÄŸÄ±tÄ±m ve sÃ¼reÃ§ gereksinimleri iÃ§in.",
        features: [
          "KullanÄ±m senaryosu deÄŸerlendirmesi",
          "Kurumsal daÄŸÄ±tÄ±m planÄ±",
          "ÃœrÃ¼n yol haritasÄ± gÃ¶rÃ¼ÅŸmesi",
        ],
        ctaLabel: "Kurumsal gÃ¶rÃ¼ÅŸme talep et",
        ctaHref: "mailto:info@imlecyazilim.com?subject=FÄ°Å260 kurumsal gÃ¶rÃ¼ÅŸme",
      },
    ],
  },
  faq: [
    {
      question: "FÄ°Å260 web uygulamasÄ± mÄ±?",
      answer:
        "HayÄ±r. FÄ°Å260 Windows Ã¼zerinde Ã§alÄ±ÅŸan masaÃ¼stÃ¼ uygulamadÄ±r. Web platformu Ã¼yelik, Ã¼rÃ¼n eriÅŸimi, cihaz doÄŸrulama ve indirme akÄ±ÅŸÄ±nÄ± yÃ¶netir.",
    },
    {
      question: "Kurulum dosyasÄ± nereden indirilir?",
      answer:
        "ÃœrÃ¼n eriÅŸimi olan kullanÄ±cÄ±lar giriÅŸ yaptÄ±ktan sonra hesap panelinden veya indirme CTA'larÄ±ndan korumalÄ± download akÄ±ÅŸÄ±na yÃ¶nlenir.",
    },
    {
      question: "Yetkisiz kullanÄ±cÄ± kurulum dosyasÄ±nÄ± indirebilir mi?",
      answer:
        "HayÄ±r. Download route'u oturum ve FÄ°Å260 Ã¼rÃ¼n eriÅŸimi kontrolÃ¼nÃ¼ korur; yetkisiz kullanÄ±cÄ±lar dosyayÄ± alamaz.",
    },
    {
      question: "Ã‡Ã–ZVER ile aynÄ± Ã¼yelik mi kullanÄ±lacak?",
      answer:
        "Ä°mleÃ§ hesabÄ± ortaktÄ±r, ancak Ã¼rÃ¼n eriÅŸimleri Ã¼rÃ¼n bazÄ±nda ayrÄ± yÃ¶netilir. Ã‡Ã–ZVER aktif olduÄŸunda kendi Ã¼rÃ¼n eriÅŸimiyle gÃ¶rÃ¼nÃ¼r.",
    },
  ],
  related: [
    {
      name: "Ã‡Ã–ZVER",
      href: "/cozver",
      status: "YakÄ±nda",
      description:
        "Finansal analiz ve spread hazÄ±rlÄ±ÄŸÄ± iÃ§in geliÅŸtirme aÅŸamasÄ±ndaki masaÃ¼stÃ¼ Ã¼rÃ¼n.",
      accent: "var(--accent-cozver)",
    },
  ],
};

export default function Fis260Page() {
  return <ProductPageLayout config={fis260Config} />;
}
