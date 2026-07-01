"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { buildLemonSqueezyCheckoutUrl } from "@/lib/lemonsqueezy-checkout";

export async function startFis260Checkout() {
  const session = await auth();

  if (!session?.user?.id || !session.user.email) {
    redirect("/login?callbackUrl=/uyelik");
  }

  const checkoutUrl = process.env.LEMONSQUEEZY_FIS260_CHECKOUT_URL;

  if (!checkoutUrl) {
    redirect("/uyelik?checkout=unavailable");
  }

  redirect(
    buildLemonSqueezyCheckoutUrl({
      checkoutUrl,
      email: session.user.email,
      userId: session.user.id,
      productSlug: "fis260",
    }),
  );
}
