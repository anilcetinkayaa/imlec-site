export const PRODUCT_SLUGS = {
  fis260: "fis260",
  cozver: "cozver",
  kuyvera: "kuyvera",
} as const;

export const PRODUCT_DOWNLOADS: Record<string, string> = {
  [PRODUCT_SLUGS.fis260]: "FİŞ260 Windows için indir",
  [PRODUCT_SLUGS.cozver]: "ÇÖZVER Windows için indir",
  [PRODUCT_SLUGS.kuyvera]: "KUYVERA Windows için indir",
};

export const PRODUCT_DISPLAY_NAMES: Record<string, string> = {
  [PRODUCT_SLUGS.fis260]: "FİŞ260",
  [PRODUCT_SLUGS.cozver]: "ÇÖZVER",
  [PRODUCT_SLUGS.kuyvera]: "KUYVERA",
};
