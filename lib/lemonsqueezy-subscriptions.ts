const subscriptionLifecycleEvents = new Set([
  "subscription_created",
  "subscription_updated",
  "subscription_cancelled",
  "subscription_resumed",
  "subscription_expired",
  "subscription_paused",
  "subscription_unpaused",
]);

export function isSubscriptionLifecyclePayload({
  eventName,
  resourceType,
}: {
  eventName: string;
  resourceType?: string | null;
}) {
  return (
    subscriptionLifecycleEvents.has(eventName) &&
    resourceType === "subscriptions"
  );
}

export function parseLemonSqueezyDate(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function subscriptionAccessExpiresAt({
  status,
  trialEndsAt,
}: {
  status: string;
  trialEndsAt: Date | null;
}) {
  return status === "TRIALING" ? trialEndsAt : null;
}
