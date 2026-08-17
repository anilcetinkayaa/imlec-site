const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

export function isPaidOrderCreated(eventName: string, amount: number) {
  return eventName !== "order_created" || amount > 0;
}

export function trialEndingWindow(now: Date) {
  return {
    gt: now,
    lte: new Date(now.getTime() + THREE_DAYS_MS),
  };
}
