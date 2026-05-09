export const PRODUCT_SLUGS = {
  fis260: "fis260",
  cozver: "cozver",
} as const;

export const PRODUCT_DOWNLOADS: Record<string, string> = {
  [PRODUCT_SLUGS.fis260]: "FİŞ260 Windows için indir",
  [PRODUCT_SLUGS.cozver]: "ÇÖZVER Windows için indir",
};
