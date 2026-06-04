import { NextResponse } from "next/server";
import { prisma } from "@/src/db/prisma";
import {
  getClientIp,
  requireAdminSession,
  toJsonValue,
} from "@/src/server/admin-action-log";

export const runtime = "nodejs";

function jsonError(error: string, status: number) {
  return Response.json({ ok: false, error }, { status });
}

async function parseBody(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as Record<string, unknown>;
    return {
      shouldRedirect: false,
      productId: typeof body.productId === "string" ? body.productId.trim() : "",
      version: typeof body.version === "string" ? body.version.trim() : "",
      minimumVersion:
        typeof body.minimumVersion === "string" ? body.minimumVersion.trim() : "",
      filePath: typeof body.filePath === "string" ? body.filePath.trim() : "",
      sha256: typeof body.sha256 === "string" ? body.sha256.trim().toLowerCase() : "",
      releaseNotes:
        typeof body.releaseNotes === "string" ? body.releaseNotes.trim() : "",
    };
  }

  const formData = await request.formData();
  return {
    shouldRedirect: true,
    productId: String(formData.get("productId") ?? "").trim(),
    version: String(formData.get("version") ?? "").trim(),
    minimumVersion: String(formData.get("minimumVersion") ?? "").trim(),
    filePath: String(formData.get("filePath") ?? "").trim(),
    sha256: String(formData.get("sha256") ?? "").trim().toLowerCase(),
    releaseNotes: String(formData.get("releaseNotes") ?? "").trim(),
  };
}

export async function POST(request: Request) {
  const admin = await requireAdminSession({ write: true });

  if (admin.error) {
    return admin.error;
  }

  const input = await parseBody(request);

  if (!input.productId || !input.version || !input.filePath || !/^[a-f0-9]{64}$/.test(input.sha256)) {
    return jsonError("INVALID_BODY", 400);
  }

  const product = await prisma.product.findUnique({
    where: { id: input.productId },
    select: { id: true, slug: true },
  });

  if (!product) {
    return jsonError("PRODUCT_NOT_FOUND", 404);
  }

  const productVersion = await prisma.$transaction(async (tx) => {
    const before = await tx.productVersion.findUnique({
      where: {
        productId_version: {
          productId: product.id,
          version: input.version,
        },
      },
    });

    const after = await tx.productVersion.upsert({
      where: {
        productId_version: {
          productId: product.id,
          version: input.version,
        },
      },
      update: {
        minimumVersion: input.minimumVersion || null,
        releaseNotes: input.releaseNotes || null,
        filePath: input.filePath,
        sha256: input.sha256,
      },
      create: {
        productId: product.id,
        version: input.version,
        minimumVersion: input.minimumVersion || null,
        releaseNotes: input.releaseNotes || null,
        filePath: input.filePath,
        sha256: input.sha256,
      },
    });

    await tx.adminActionLog.create({
      data: {
        adminId: admin.session.user.id,
        action: "PRODUCT_VERSION_UPSERT",
        before: toJsonValue(before),
        after: toJsonValue(after),
        ipAddress: getClientIp(request),
      },
    });

    return after;
  });

  if (input.shouldRedirect) {
    return NextResponse.redirect(new URL("/admin/versions", request.url), 303);
  }

  return Response.json({ ok: true, versionId: productVersion.id });
}
