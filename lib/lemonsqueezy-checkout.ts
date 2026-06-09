export function buildLemonSqueezyCheckoutUrl({
  checkoutUrl,
  email,
  userId,
  productSlug,
}: {
  checkoutUrl: string;
  email: string;
  userId: string;
  productSlug: string;
}) {
  const url = new URL(checkoutUrl);

  url.searchParams.set("checkout[email]", email);
  url.searchParams.set("checkout[custom][user_id]", userId);
  url.searchParams.set("checkout[custom][product_slug]", productSlug);
  url.searchParams.set("checkout[custom][source]", "web");

  return url.toString();
}
