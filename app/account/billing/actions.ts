"use server";

import {
  BillingRequestReason,
  BillingRequestType,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/src/db/prisma";

const requestTypes = new Set(Object.values(BillingRequestType));
const requestReasons = new Set(Object.values(BillingRequestReason));

function cleanOptional(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text ? text.slice(0, 1500) : null;
}

export async function createBillingRequest(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/account/billing");
  }

  const rawType = String(formData.get("type") ?? "");
  const rawReason = String(formData.get("reason") ?? "");
  const productId = String(formData.get("productId") ?? "").trim();
  const subscriptionId = cleanOptional(formData.get("subscriptionId"));
  const paymentId = cleanOptional(formData.get("paymentId"));
  const message = cleanOptional(formData.get("message"));

  if (!requestTypes.has(rawType as BillingRequestType)) {
    redirect("/account/billing?billingRequest=invalid");
  }

  if (!requestReasons.has(rawReason as BillingRequestReason)) {
    redirect("/account/billing?billingRequest=invalid");
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });

  if (!product) {
    redirect("/account/billing?billingRequest=invalid");
  }

  const [subscription, payment] = await Promise.all([
    subscriptionId
      ? prisma.subscription.findFirst({
          where: {
            id: subscriptionId,
            userId: session.user.id,
            productId: product.id,
          },
          select: { id: true },
        })
      : null,
    paymentId
      ? prisma.payment.findFirst({
          where: {
            id: paymentId,
            userId: session.user.id,
            productId: product.id,
          },
          select: { id: true },
        })
      : null,
  ]);

  if (subscriptionId && !subscription) {
    redirect("/account/billing?billingRequest=invalid");
  }

  if (paymentId && !payment) {
    redirect("/account/billing?billingRequest=invalid");
  }

  await prisma.billingRequest.create({
    data: {
      userId: session.user.id,
      productId: product.id,
      subscriptionId: subscription?.id,
      paymentId: payment?.id,
      type: rawType as BillingRequestType,
      reason: rawReason as BillingRequestReason,
      message,
    },
  });

  revalidatePath("/account/billing");
  revalidatePath("/admin/accounting");
  redirect("/account/billing?billingRequest=sent");
}
