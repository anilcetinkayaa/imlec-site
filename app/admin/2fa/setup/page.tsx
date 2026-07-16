import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { auth } from "@/auth";
import {
  createTotpSecret,
  createTotpUri,
  decryptTotpSecret,
  encryptTotpSecret,
  isValidTotpSecret,
} from "@/lib/admin-2fa";
import { prisma } from "@/src/db/prisma";
import { getAdminSession } from "@/src/server/admin";

export const metadata: Metadata = {
  title: "Admin 2FA Kurulum | İmleç Yazılım",
};

export default async function Admin2FASetupPage() {
  const admin = await getAdminSession();

  if (admin.status === "unauthenticated") {
    redirect("/login?callbackUrl=/admin/2fa/setup");
  }

  if (admin.status === "forbidden") {
    redirect("/");
  }

  const session = await auth();
  const email = session?.user?.email ?? "admin@imlecyazilim.com";
  const [user, existingRecord] = await Promise.all([
    prisma.user.findUnique({
      where: {
        id: admin.session.user.id,
      },
      select: {
        twoFactorEnabled: true,
      },
    }),
    prisma.admin2FA.findUnique({
      where: {
        userId: admin.session.user.id,
      },
    }),
  ]);

  if (user?.twoFactorEnabled || existingRecord?.verified) {
    if (session?.user?.twoFactorVerified) {
      redirect("/admin");
    }

    redirect("/admin/2fa/verify");
  }

  let secret: string;

  if (existingRecord) {
    try {
      secret = decryptTotpSecret(existingRecord.secret);

      if (!isValidTotpSecret(secret)) {
        throw new Error("INVALID_TOTP_SECRET");
      }
    } catch {
      secret = createTotpSecret();
      await prisma.admin2FA.update({
        where: {
          userId: admin.session.user.id,
        },
        data: {
          secret: encryptTotpSecret(secret),
          verified: false,
          recoveryCodes: [],
        },
      });
    }
  } else {
    secret = createTotpSecret();
    await prisma.admin2FA.create({
      data: {
        userId: admin.session.user.id,
        secret: encryptTotpSecret(secret),
        verified: false,
        recoveryCodes: [],
      },
    });
  }

  const uri = createTotpUri({ email, secret });
  const qrDataUrl = await QRCode.toDataURL(uri, {
    margin: 1,
    width: 240,
  });

  return (
    <main className="min-h-screen px-6 py-12 text-zinc-100">
      <section className="mx-auto max-w-xl rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-blue-300">
          Admin 2FA
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          Microsoft Authenticator ile kurulum.
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          QR kodu Microsoft Authenticator veya RFC 6238 uyumlu TOTP uygulaması
          ile tarayın. Ardından doğrulama kodunu girin.
        </p>
        <div className="mt-6 flex justify-center rounded-xl border border-white/[0.08] bg-white p-4">
          <Image
            alt="Admin 2FA QR kodu"
            height={240}
            src={qrDataUrl}
            width={240}
          />
        </div>
        <a
          className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-lg bg-zinc-100 px-5 text-sm font-medium text-zinc-950 transition hover:bg-white"
          href="/admin/2fa/verify"
        >
          Kodu doğrula
        </a>
      </section>
    </main>
  );
}
