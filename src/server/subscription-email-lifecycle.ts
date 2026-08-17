import { SubscriptionStatus } from "@prisma/client";
import { createElement } from "react";
import { SubscriptionCanceledEmail } from "@/emails/SubscriptionCanceledEmail";
import { TrialEndedEmail } from "@/emails/TrialEndedEmail";
import { TrialEndingEmail } from "@/emails/TrialEndingEmail";
import { trialEndingWindow } from "@/lib/billing-notifications";
import { sendMail } from "@/lib/mail";
import { prisma } from "@/src/db/prisma";

function formatDate(value: Date | null) {
  return value?.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Istanbul",
  });
}

async function mailWasAccepted(input: Parameters<typeof sendMail>[0]) {
  try {
    const delivery = await sendMail(input);

    if (delivery.skipped) {
      console.warn("[SUBSCRIPTION EMAIL SKIPPED]", delivery.reason);
      return false;
    }

    if (delivery.result.error) {
      console.error("[SUBSCRIPTION EMAIL ERROR]", delivery.result.error);
      return false;
    }

    return true;
  } catch (error) {
    console.error(
      "[SUBSCRIPTION EMAIL ERROR]",
      error instanceof Error ? error.message : "UNKNOWN_ERROR",
    );
    return false;
  }
}

export async function sendCancellationConfirmation(subscriptionId: string) {
  const subscription = await prisma.subscription.findFirst({
    where: {
      id: subscriptionId,
      status: SubscriptionStatus.CANCELED,
      canceledEmailSentAt: null,
    },
    select: {
      id: true,
      endsAt: true,
      user: { select: { email: true } },
      product: { select: { name: true } },
    },
  });

  if (!subscription) {
    return false;
  }

  const accepted = await mailWasAccepted({
    to: subscription.user.email,
    subject: `${subscription.product.name} aboneliğiniz iptal edildi`,
    react: createElement(SubscriptionCanceledEmail, {
      productName: subscription.product.name,
      accessEndsAt: formatDate(subscription.endsAt),
    }),
  });

  if (accepted) {
    await prisma.subscription.updateMany({
      where: { id: subscription.id, canceledEmailSentAt: null },
      data: { canceledEmailSentAt: new Date() },
    });
  }

  return accepted;
}

export async function sendSubscriptionLifecycleEmails(now = new Date()) {
  const [endingTrials, endedTrials, canceledSubscriptions] = await Promise.all([
    prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.TRIALING,
        trialEndsAt: trialEndingWindow(now),
        trialEndingEmailSentAt: null,
      },
      select: {
        id: true,
        user: { select: { email: true } },
        product: { select: { name: true } },
      },
    }),
    prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.EXPIRED,
        trialEndsAt: { not: null, lte: now },
        trialEndedEmailSentAt: null,
      },
      select: {
        id: true,
        user: { select: { email: true } },
        product: { select: { name: true } },
      },
    }),
    prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.CANCELED,
        canceledEmailSentAt: null,
      },
      select: { id: true },
    }),
  ]);

  let sent = 0;
  let failed = 0;

  for (const subscription of endingTrials) {
    const accepted = await mailWasAccepted({
      to: subscription.user.email,
      subject: `${subscription.product.name} denemeniz yakında bitiyor`,
      react: createElement(TrialEndingEmail, {
        productName: subscription.product.name,
      }),
    });
    if (accepted) {
      await prisma.subscription.updateMany({
        where: { id: subscription.id, trialEndingEmailSentAt: null },
        data: { trialEndingEmailSentAt: now },
      });
      sent += 1;
    } else {
      failed += 1;
    }
  }

  for (const subscription of endedTrials) {
    const accepted = await mailWasAccepted({
      to: subscription.user.email,
      subject: `${subscription.product.name} denemeniz sona erdi`,
      react: createElement(TrialEndedEmail, {
        productName: subscription.product.name,
      }),
    });
    if (accepted) {
      await prisma.subscription.updateMany({
        where: { id: subscription.id, trialEndedEmailSentAt: null },
        data: { trialEndedEmailSentAt: now },
      });
      sent += 1;
    } else {
      failed += 1;
    }
  }

  for (const subscription of canceledSubscriptions) {
    if (await sendCancellationConfirmation(subscription.id)) {
      sent += 1;
    } else {
      failed += 1;
    }
  }

  return {
    checked:
      endingTrials.length + endedTrials.length + canceledSubscriptions.length,
    sent,
    failed,
  };
}
