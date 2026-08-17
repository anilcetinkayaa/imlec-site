"use server";

import { SubscriptionStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getLemonSqueezyMode } from "@/lib/lemonsqueezy-config";
import { prisma } from "@/src/db/prisma";
import { createFis260Checkout } from "@/src/server/lemonsqueezy-api";

const currentSubscriptionStatuses = new Set<SubscriptionStatus>([
  SubscriptionStatus.ACTIVE,
  SubscriptionStatus.TRIALING,
  SubscriptionStatus.PAST_DUE,
  SubscriptionStatus.PAUSED,
]);

export async function startFis260Checkout() {
  const session = await auth();

  if (!session?.user?.id || !session.user.email) {
    redirect("/login?callbackUrl=/uyelik");
  }

  const [product, user] = await Promise.all([
    prisma.product.findUnique({
      where: { slug: "fis260" },
      select: { id: true },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { emailVerifiedAt: true },
    }),
  ]);

  if (!product) {
    redirect("/uyelik?checkout=unavailable");
  }

  if (!user?.emailVerifiedAt) {
    redirect("/uyelik?checkout=verify_email");
  }

  const testMode = getLemonSqueezyMode() === "test";
  const subscriptions = await prisma.subscription.findMany({
    where: {
      userId: session.user.id,
      productId: product.id,
      provider: "lemonsqueezy",
      testMode,
    },
    select: {
      status: true,
      endsAt: true,
      trialUsedAt: true,
    },
  });

  const now = new Date();
  const hasCurrentSubscription = subscriptions.some(
    (subscription) =>
      currentSubscriptionStatuses.has(subscription.status) ||
      (subscription.status === SubscriptionStatus.CANCELED &&
        Boolean(subscription.endsAt && subscription.endsAt > now)),
  );

  if (hasCurrentSubscription) {
    redirect("/account/billing");
  }

  const hasUsedTrial = subscriptions.some(
    (subscription) => subscription.trialUsedAt !== null,
  );
  let checkoutUrl: string;

  try {
    checkoutUrl = await createFis260Checkout({
      email: session.user.email,
      userId: session.user.id,
      skipTrial: hasUsedTrial,
      testMode,
    });
  } catch (error) {
    console.error(
      "[LEMONSQUEEZY CHECKOUT ERROR]",
      error instanceof Error ? error.message : "UNKNOWN_ERROR",
    );
    redirect("/uyelik?checkout=unavailable");
  }

  redirect(checkoutUrl);
}
