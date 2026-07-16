"use server";

import { timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";
import { update } from "@/auth";
import {
  createRecoveryCodes,
  hashRecoveryCode,
  validateTotpToken,
} from "@/lib/admin-2fa";
import { prisma } from "@/src/db/prisma";
import { getAdminSession } from "@/src/server/admin";

const attempts = new Map<string, number[]>();

export type Verify2FAState = {
  ok: boolean;
  error?: string;
  recoveryCodes?: string[];
};

function checkRateLimit(userId: string) {
  const now = Date.now();
  const windowStart = now - 60_000;
  const recent = (attempts.get(userId) ?? []).filter((item) => item > windowStart);

  if (recent.length >= 5) {
    attempts.set(userId, recent);
    return false;
  }

  recent.push(now);
  attempts.set(userId, recent);
  return true;
}

function safeHashEquals(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export async function verify2FAAction(
  _previousState: Verify2FAState,
  formData: FormData,
): Promise<Verify2FAState> {
  const admin = await getAdminSession();

  if (admin.status === "unauthenticated") {
    redirect("/login?callbackUrl=/admin/2fa/verify");
  }

  if (admin.status === "forbidden") {
    return { ok: false, error: "Bu işlem yalnızca ADMIN rolü içindir." };
  }

  const token = String(formData.get("token") ?? "").trim();

  if (!/^\d{6}$/.test(token) && !/^[A-Fa-f0-9]{4}-[A-Fa-f0-9]{4}$/.test(token)) {
    return {
      ok: false,
      error: "6 haneli doğrulama kodu veya kurtarma kodu girin.",
    };
  }

  if (!checkRateLimit(admin.session.user.id)) {
    return {
      ok: false,
      error: "Çok fazla deneme yapıldı. Bir dakika sonra tekrar deneyin.",
    };
  }

  const record = await prisma.admin2FA.findUnique({
    where: {
      userId: admin.session.user.id,
    },
  });

  if (!record) {
    return { ok: false, error: "2FA kurulumu bulunamadı." };
  }

  const recoveryHash = hashRecoveryCode(token);
  const recoveryIndex = record.recoveryCodes.findIndex((storedHash) =>
    safeHashEquals(storedHash, recoveryHash),
  );
  let valid = false;

  try {
    valid =
      /^\d{6}$/.test(token) &&
      validateTotpToken({
        encryptedSecret: record.secret,
        token,
      });
  } catch {
    valid = false;
  }
  const recoveryValid = recoveryIndex >= 0;

  if (!valid && !recoveryValid) {
    return { ok: false, error: "Doğrulama kodu geçersiz." };
  }

  let recoveryCodes: string[] | undefined;

  if (!record.verified) {
    recoveryCodes = createRecoveryCodes();
    await prisma.$transaction([
      prisma.admin2FA.update({
        where: {
          userId: admin.session.user.id,
        },
        data: {
          verified: true,
          recoveryCodes: recoveryCodes.map(hashRecoveryCode),
        },
      }),
      prisma.user.update({
        where: {
          id: admin.session.user.id,
        },
        data: {
          twoFactorEnabled: true,
        },
      }),
    ]);
  } else if (recoveryValid) {
    await prisma.admin2FA.update({
      where: {
        userId: admin.session.user.id,
      },
      data: {
        recoveryCodes: record.recoveryCodes.filter(
          (_storedHash, index) => index !== recoveryIndex,
        ),
      },
    });
  }

  await update({
    user: {
      twoFactorVerified: true,
    },
  });

  attempts.delete(admin.session.user.id);

  return { ok: true, recoveryCodes };
}
