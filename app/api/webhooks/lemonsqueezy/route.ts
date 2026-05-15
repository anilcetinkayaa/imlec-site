import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { after } from "next/server";
import { verifyLemonSqueezySignature } from "@/lib/lemonsqueezy-signature";
import { prisma } from "@/src/db/prisma";
import {
  processLemonSqueezyEvent,
  type LemonSqueezyPayload,
} from "@/src/server/lemonsqueezy";

export const runtime = "nodejs";

function jsonError(error: string, status: number) {
  return Response.json({ ok: false, error }, { status });
}

export async function POST(request: Request) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

  if (!secret) {
    return jsonError("WEBHOOK_SECRET_MISSING", 500);
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");

  const verified = verifyLemonSqueezySignature({
    rawBody,
    signature,
    secret,
  });

  if (!verified) {
    return jsonError("INVALID_SIGNATURE", 401);
  }

  let payload: LemonSqueezyPayload;

  try {
    payload = JSON.parse(rawBody) as LemonSqueezyPayload;
  } catch {
    return jsonError("INVALID_JSON", 400);
  }

  const eventName =
    request.headers.get("x-event-name") ?? payload.meta?.event_name;
  const eventId =
    request.headers.get("x-event-id") ??
    `${eventName}:${createHash("sha256").update(rawBody).digest("hex")}`;

  if (!eventName) {
    return jsonError("EVENT_NAME_MISSING", 400);
  }

  payload.meta = {
    ...payload.meta,
    event_name: eventName,
  };

  const insertResult = await prisma.lemonSqueezyWebhookEvent
    .create({
      data: {
        eventId,
        eventName,
        payload: payload as Prisma.InputJsonValue,
      },
    })
    .catch((error: unknown) => {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2002"
      ) {
        return null;
      }

      throw error;
    });

  if (!insertResult) {
    return Response.json({ ok: true, duplicate: true });
  }

  after(async () => {
    try {
      await processLemonSqueezyEvent(payload);
      await prisma.lemonSqueezyWebhookEvent.update({
        where: { eventId },
        data: {
          processedAt: new Date(),
        },
      });
    } catch (error) {
      await prisma.lemonSqueezyWebhookEvent.update({
        where: { eventId },
        data: {
          error: error instanceof Error ? error.message : "UNKNOWN_ERROR",
          processedAt: new Date(),
        },
      });
    }
  });

  return Response.json({ ok: true });
}
