import {
  cancelSubscription,
  getSubscription,
  issueOrderRefund,
  issueSubscriptionInvoiceRefund,
  lemonSqueezySetup,
  listSubscriptions,
} from "@lemonsqueezy/lemonsqueezy.js";
import { parseLemonSqueezyDate } from "@/lib/lemonsqueezy-subscriptions";

export type LemonSqueezySubscriptionSnapshot = {
  providerSubscriptionId: string;
  providerCustomerId: string;
  providerVariantId: string;
  providerOrderId: string;
  status: string;
  renewsAt: Date | null;
  endsAt: Date | null;
  trialEndsAt: Date | null;
  testMode: boolean;
  updatePaymentMethodUrl: string;
  customerPortalUrl: string;
};

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
  return getLemonSqueezySubscription({
    orderId,
  });
}

export async function getLemonSqueezySubscriptionForEmail(userEmail: string) {
  return getLemonSqueezySubscription({
    userEmail,
  });
}

export async function getLemonSqueezySubscriptionById(
  providerSubscriptionId: string,
) {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY?.trim();

  if (!apiKey) {
    return null;
  }

  lemonSqueezySetup({ apiKey });
  const response = await getSubscription(providerSubscriptionId);

  if (response.error || !response.data) {
    return null;
  }

  return subscriptionSnapshot(response.data.data);
}

export async function refundLemonSqueezyOrder({
  orderId,
  amount,
}: {
  orderId: string;
  amount: number;
}) {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("LEMONSQUEEZY_API_KEY_MISSING");
  }

  lemonSqueezySetup({ apiKey });
  const response = await issueOrderRefund(orderId, amount);

  if (response.error || !response.data) {
    throw new Error("LEMONSQUEEZY_ORDER_REFUND_FAILED");
  }
}

export async function refundLemonSqueezySubscriptionInvoice({
  subscriptionInvoiceId,
  amount,
}: {
  subscriptionInvoiceId: string;
  amount: number;
}) {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("LEMONSQUEEZY_API_KEY_MISSING");
  }

  lemonSqueezySetup({ apiKey });
  const response = await issueSubscriptionInvoiceRefund(
    subscriptionInvoiceId,
    amount,
  );

  if (response.error || !response.data) {
    throw new Error("LEMONSQUEEZY_SUBSCRIPTION_REFUND_FAILED");
  }
}

async function getLemonSqueezySubscription(
  filter: { orderId: string } | { userEmail: string },
) {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY?.trim();

  if (!apiKey) {
    return null;
  }

  lemonSqueezySetup({ apiKey });
  const response = await listSubscriptions({
    filter,
    page: {
      size: 100,
    },
  });
  const statusPriority = new Map([
    ["active", 0],
    ["on_trial", 1],
    ["past_due", 2],
    ["paused", 3],
    ["cancelled", 4],
    ["expired", 5],
  ]);
  const subscription = response.data?.data
    .slice()
    .sort(
      (left, right) =>
        (statusPriority.get(left.attributes.status) ?? 99) -
        (statusPriority.get(right.attributes.status) ?? 99),
    )[0];

  if (response.error || !subscription) {
    return null;
  }

  return subscriptionSnapshot(subscription);
}

function subscriptionSnapshot(subscription: {
  id: string;
  attributes: {
    customer_id: number;
    variant_id: number;
    order_id: number;
    status: string;
    renews_at: string;
    ends_at: string | null;
    trial_ends_at: string | null;
    test_mode: boolean;
    urls: {
      update_payment_method: string;
      customer_portal: string;
    };
  };
}): LemonSqueezySubscriptionSnapshot {
  const attributes = subscription.attributes;

  return {
    providerSubscriptionId: subscription.id,
    providerCustomerId: String(attributes.customer_id),
    providerVariantId: String(attributes.variant_id),
    providerOrderId: String(attributes.order_id),
    status: attributes.status,
    renewsAt: parseLemonSqueezyDate(attributes.renews_at),
    endsAt: parseLemonSqueezyDate(attributes.ends_at),
    trialEndsAt: parseLemonSqueezyDate(attributes.trial_ends_at),
    testMode: attributes.test_mode,
    updatePaymentMethodUrl: attributes.urls.update_payment_method,
    customerPortalUrl: attributes.urls.customer_portal,
  };
}
