import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { hasProductAccess } from "@/src/server/entitlements";
import { PRODUCT_SLUGS } from "@/src/server/products";

const FIS260_RELEASE_DOWNLOAD_URL =
  "https://github.com/anilcetinkayaa/imlec-site/releases/download/v0.1.0-beta/FIS260_Setup_v0.1.0.exe";

export async function GET(request: Request) {
  const session = await auth();
  const requestUrl = new URL(request.url);

  if (!session?.user?.id) {
    const loginUrl = new URL("/login", requestUrl.origin);
    loginUrl.searchParams.set("callbackUrl", "/api/downloads/fis260");

    return NextResponse.redirect(loginUrl);
  }

  const allowed = await hasProductAccess(session.user.id, PRODUCT_SLUGS.fis260);

  if (!allowed) {
    return NextResponse.redirect(new URL("/fis260#uyelikler", requestUrl.origin));
  }

  return NextResponse.redirect(FIS260_RELEASE_DOWNLOAD_URL);
}
