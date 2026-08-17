const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

export function isPaidOrderCreated(eventName: string, amount: number) {
  if (
    eventName === "order_created" ||
    eventName === "subscription_payment_success" ||
    eventName === "subscription_payment_recovered"
  ) {
    return amount > 0;
  }

  return true;
}

export function trialEndingWindow(now: Date) {
  return {
    gt: now,
    lte: new Date(now.getTime() + THREE_DAYS_MS),
  };
}
