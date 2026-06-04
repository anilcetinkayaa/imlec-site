import { createHmac, timingSafeEqual } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/src/db/prisma";

export const runtime = "nodejs";

const MAX_RECEIPT_BYTES = 12 * 1024 * 1024;
const MAX_JSON_BYTES = 2 * 1024 * 1024;

type DesktopTokenPayload = {
  sub: string;
  email: string;
  role: string;
  type: "desktop-access";
  exp: number;
};

function jsonError(error: string, status: number) {
  return Response.json({ ok: false, error }, { status });
}

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function isDesktopTokenPayload(value: unknown): value is DesktopTokenPayload {
  return (
    typeof value === "object" &&
    value !== null &&
    "sub" in value &&
    "email" in value &&
    "role" in value &&
    "type" in value &&
    "exp" in value &&
    typeof value.sub === "string" &&
    typeof value.email === "string" &&
    typeof value.role === "string" &&
    value.type === "desktop-access" &&
    typeof value.exp === "number"
  );
}

function verifyDesktopToken(token: string) {
  const secret = process.env.DESKTOP_AUTH_SECRET;

  if (!secret) {
    return null;
  }

  const parts = token.split(".");

  if (parts.length !== 3) {
    return null;
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = createHmac("sha256", secret)
    .update(unsignedToken)
    .digest("base64url");

  const signatureBuffer = Buffer.from(signature);
  const expectedSignatureBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedSignatureBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedSignatureBuffer)
  ) {
    return null;
  }

  try {
    const header = JSON.parse(base64UrlDecode(encodedHeader)) as unknown;
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as unknown;

    if (
      typeof header !== "object" ||
      header === null ||
      !("alg" in header) ||
      header.alg !== "HS256"
    ) {
      return null;
    }

    if (!isDesktopTokenPayload(payload)) {
      return null;
    }

    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function cleanText(value: FormDataEntryValue | null, maxLength: number) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function safeFileName(value: string) {
  return value.replace(/[^\w.() -]/g, "_").slice(0, 180) || "attachment";
}

function parseJson(value: string): Prisma.InputJsonValue | undefined {
  if (!value) {
    return undefined;
  }

  try {
    return JSON.parse(value) as Prisma.InputJsonValue;
  } catch {
    return { raw: value.slice(0, 20_000) };
  }
}

async function fileToAttachment(file: File, kind: string, maxBytes: number) {
  const bytes = Buffer.from(await file.arrayBuffer());

  if (bytes.length > maxBytes) {
    throw new Error(`${kind.toUpperCase()}_TOO_LARGE`);
  }

  return {
    kind,
    fileName: safeFileName(file.name || `${kind}.bin`),
    contentType: file.type || "application/octet-stream",
    sizeBytes: bytes.length,
    content: bytes,
  };
}

export async function POST(request: Request) {
  const token = getBearerToken(request);

  if (!token) {
    return jsonError("MISSING_TOKEN", 401);
  }

  const tokenPayload = verifyDesktopToken(token);

  if (!tokenPayload) {
    return jsonError("INVALID_TOKEN", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: tokenPayload.sub },
    select: { id: true, disabledAt: true },
  });

  if (!user || user.disabledAt) {
    return jsonError("USER_NOT_FOUND", 404);
  }

  const form = await request.formData();
  const productSlug = cleanText(form.get("productCode"), 40).toLowerCase() || "fis260";
  const appVersion = cleanText(form.get("appVersion"), 40);
  const issueType = cleanText(form.get("issueType"), 80);
  const message = cleanText(form.get("message"), 2_000);
  const sourceFileName = cleanText(form.get("sourceFileName"), 255);
  const systemSummary = parseJson(cleanText(form.get("systemSummary"), 120_000));
  const resultJson = cleanText(form.get("resultJson"), 1_000_000);
  const receiptImage = form.get("receiptImage");

  if (!issueType || !message) {
    return jsonError("INVALID_BODY", 400);
  }

  if (!(receiptImage instanceof File) || receiptImage.size <= 0) {
    return jsonError("RECEIPT_IMAGE_REQUIRED", 400);
  }

  try {
    const receiptAttachment = await fileToAttachment(
      receiptImage,
      "receipt_image",
      MAX_RECEIPT_BYTES,
    );
    const resultBuffer = Buffer.from(resultJson || "{}", "utf8");

    if (resultBuffer.length > MAX_JSON_BYTES) {
      return jsonError("RESULT_JSON_TOO_LARGE", 413);
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: user.id,
        productSlug,
        appVersion: appVersion || null,
        issueType,
        message,
        sourceFileName: sourceFileName || receiptAttachment.fileName,
        systemSummary,
        attachments: {
          create: [
            receiptAttachment,
            {
              kind: "result_json",
              fileName: "result.json",
              contentType: "application/json",
              sizeBytes: resultBuffer.length,
              content: resultBuffer,
            },
          ],
        },
      },
      select: {
        id: true,
      },
    });

    return Response.json({ ok: true, ticketId: ticket.id });
  } catch (error) {
    const messageText = error instanceof Error ? error.message : "UPLOAD_FAILED";
    if (messageText.endsWith("_TOO_LARGE")) {
      return jsonError(messageText, 413);
    }

    console.error("[SUPPORT TICKET ERROR]", error);
    return jsonError("SUPPORT_TICKET_FAILED", 500);
  }
}

export async function GET(request: Request) {
  const token = getBearerToken(request);

  if (!token) {
    return jsonError("MISSING_TOKEN", 401);
  }

  const tokenPayload = verifyDesktopToken(token);

  if (!tokenPayload) {
    return jsonError("INVALID_TOKEN", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: tokenPayload.sub },
    select: { id: true, disabledAt: true },
  });

  if (!user || user.disabledAt) {
    return jsonError("USER_NOT_FOUND", 404);
  }

  const tickets = await prisma.supportTicket.findMany({
    where: {
      userId: user.id,
      productSlug: "fis260",
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      status: true,
      message: true,
      sourceFileName: true,
      appVersion: true,
      adminNote: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return Response.json({
    ok: true,
    tickets: tickets.map((ticket) => ({
      ticket_id: ticket.id,
      status: ticket.status,
      message: ticket.message,
      file_name: ticket.sourceFileName,
      app_version: ticket.appVersion,
      admin_note: ticket.adminNote,
      created_at: ticket.createdAt.toISOString(),
      updated_at: ticket.updatedAt.toISOString(),
    })),
  });
}
