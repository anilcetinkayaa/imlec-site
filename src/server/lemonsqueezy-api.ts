import {
  cancelSubscription,
  lemonSqueezySetup,
  listSubscriptions,
} from "@lemonsqueezy/lemonsqueezy.js";
import { parseLemonSqueezyDate } from "@/lib/lemonsqueezy-subscriptions";

export async function cancelLemonSqueezySubscription(
  providerSubscriptionId: string,
) {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("LEMONSQUEEZY_API_KEY_MISSING");
  }

  lemonSqueezySetup({ apiKey });

  const response = await cancelSubscription(providerSubscriptionId);

  if (response.error || !response.data) {
    throw new Error("LEMONSQUEEZY_CANCEL_FAILED");
  }

  const attributes = response.data.data.attributes;

  return {
    endsAt:
      parseLemonSqueezyDate(attributes.ends_at) ??
      parseLemonSqueezyDate(attributes.renews_at),
  };
}

export async function getLemonSqueezySubscriptionForOrder(orderId: string) {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY?.trim();

  if (!apiKey) {
    return null;
  }

  lemonSqueezySetup({ apiKey });
  const response = await listSubscriptions({
    filter: {
      orderId,
    },
    page: {
      size: 1,
    },
  });
  const subscription = response.data?.data[0];

  if (response.error || !subscription) {
    return null;
  }

  const attributes = subscription.attributes;

  return {
    providerSubscriptionId: subscription.id,
    status: attributes.status,
    renewsAt: parseLemonSqueezyDate(attributes.renews_at),
    endsAt: parseLemonSqueezyDate(attributes.ends_at),
    trialEndsAt: parseLemonSqueezyDate(attributes.trial_ends_at),
    testMode: attributes.test_mode,
  };
}
