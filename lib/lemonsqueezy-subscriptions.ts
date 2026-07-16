const subscriptionLifecycleEvents = new Set([
  "subscription_created",
  "subscription_updated",
  "subscription_cancelled",
  "subscription_expired",
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
