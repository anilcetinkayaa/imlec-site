const requiredVariables = [
  "LEMONSQUEEZY_API_KEY",
  "LEMONSQUEEZY_WEBHOOK_SECRET",
  "LEMONSQUEEZY_STORE_ID",
  "LEMONSQUEEZY_FIS260_CHECKOUT_URL",
  "LEMONSQUEEZY_FIS260_PRODUCT_ID",
  "LEMONSQUEEZY_FIS260_VARIANT_ID",
  "LEMONSQUEEZY_MODE",
  "CRON_SECRET",
];

const expectedEvents = [
  "order_created",
  "order_refunded",
  "subscription_created",
  "subscription_updated",
  "subscription_cancelled",
  "subscription_resumed",
  "subscription_expired",
  "subscription_paused",
  "subscription_unpaused",
  "subscription_payment_success",
  "subscription_payment_failed",
  "subscription_payment_recovered",
  "subscription_payment_refunded",
];

const missingVariables = requiredVariables.filter(
  (name) => !process.env[name]?.trim(),
);

async function getResource(path) {
  const response = await fetch(`https://api.lemonsqueezy.com/v1/${path}`, {
    headers: {
      Accept: "application/vnd.api+json",
      Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
    },
  });

  return {
    status: response.status,
    body: response.ok ? await response.json() : null,
  };
}

async function main() {
  if (missingVariables.length > 0) {
    console.log(JSON.stringify({ ready: false, missingVariables }, null, 2));
    process.exitCode = 1;
    return;
  }

  const [product, variant, webhooks] = await Promise.all([
    getResource(`products/${process.env.LEMONSQUEEZY_FIS260_PRODUCT_ID}`),
    getResource(`variants/${process.env.LEMONSQUEEZY_FIS260_VARIANT_ID}`),
    getResource(`webhooks?filter[store-id]=${process.env.LEMONSQUEEZY_STORE_ID}`),
  ]);
  const webhook = webhooks.body?.data?.find(
    (item) =>
      item.attributes?.url ===
      "https://imlecyazilim.com/api/webhooks/lemonsqueezy",
  );
  const checkoutUrl = new URL(
    process.env.LEMONSQUEEZY_FIS260_CHECKOUT_URL,
  );
  const providerBuyNowUrl =
    variant.body?.data?.attributes?.buy_now_url ??
    product.body?.data?.attributes?.buy_now_url;
  const providerCheckoutUrl = providerBuyNowUrl
    ? new URL(providerBuyNowUrl)
    : null;
  const report = {
    mode: process.env.LEMONSQUEEZY_MODE ?? "MISSING",
    product: {
      reachable: product.status === 200,
      published: product.body?.data?.attributes?.status === "published",
      testMode: product.body?.data?.attributes?.test_mode ?? null,
    },
    variant: {
      reachable: variant.status === 200,
      published: variant.body?.data?.attributes?.status === "published",
      testMode: variant.body?.data?.attributes?.test_mode ?? null,
      subscription: variant.body?.data?.attributes?.is_subscription ?? null,
      interval: variant.body?.data?.attributes?.interval ?? null,
      intervalCount: variant.body?.data?.attributes?.interval_count ?? null,
      freeTrial: variant.body?.data?.attributes?.has_free_trial ?? null,
      trialDays: variant.body?.data?.attributes?.trial_interval_count ?? null,
    },
    checkout: {
      host: checkoutUrl.host,
      matchesProduct:
        providerCheckoutUrl?.pathname === checkoutUrl.pathname,
    },
    webhook: {
      found: Boolean(webhook),
      testMode: webhook?.attributes?.test_mode ?? null,
      missingEvents: expectedEvents.filter(
        (eventName) => !webhook?.attributes?.events?.includes(eventName),
      ),
    },
  };
  const requestedMode = report.mode === "live" ? "live" : "test";
  const providerModeMatches =
    report.product.testMode === (requestedMode === "test") &&
    report.variant.testMode === (requestedMode === "test") &&
    report.webhook.testMode === (requestedMode === "test");
  const ready =
    report.product.reachable &&
    report.product.published &&
    report.variant.reachable &&
    report.variant.published &&
    report.variant.subscription === true &&
    report.checkout.matchesProduct === true &&
    report.webhook.found &&
    report.webhook.missingEvents.length === 0 &&
    providerModeMatches;

  console.log(
    JSON.stringify({ ready, providerModeMatches, ...report }, null, 2),
  );
  process.exitCode = ready ? 0 : 1;
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ready: false,
        error: error instanceof Error ? error.message : "UNKNOWN_ERROR",
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
});
