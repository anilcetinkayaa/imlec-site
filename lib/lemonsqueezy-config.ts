export type LemonSqueezyMode = "test" | "live";

export function getLemonSqueezyMode(): LemonSqueezyMode {
  return process.env.LEMONSQUEEZY_MODE?.trim().toLowerCase() === "live"
    ? "live"
    : "test";
}
