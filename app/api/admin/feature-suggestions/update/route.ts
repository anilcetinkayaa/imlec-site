import { FeatureSuggestionStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/src/db/prisma";
import { requireAdminApi } from "@/src/server/admin";

export const runtime = "nodejs";

const ALLOWED_STATUS = new Set<FeatureSuggestionStatus>([
  FeatureSuggestionStatus.PENDING,
  FeatureSuggestionStatus.APPROVED,
  FeatureSuggestionStatus.REJECTED,
  FeatureSuggestionStatus.PLANNED,
  FeatureSuggestionStatus.IN_PROGRESS,
  FeatureSuggestionStatus.DONE,
  FeatureSuggestionStatus.ARCHIVED,
]);

function jsonError(error: string, status: number) {
  return Response.json({ ok: false, error }, { status });
}

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi({ write: true });

  if (unauthorized) {
    return unauthorized;
  }

  const contentType = request.headers.get("content-type") ?? "";
  const formData = contentType.includes("application/json")
    ? null
    : await request.formData();
  const body = formData
    ? {
        suggestionId: String(formData.get("suggestionId") ?? ""),
        status: String(formData.get("status") ?? ""),
        adminNote: String(formData.get("adminNote") ?? ""),
        shouldRedirect: true,
      }
    : {
        ...((await request.json()) as Record<string, unknown>),
        shouldRedirect: false,
      };

  const suggestionId = String(body.suggestionId ?? "").trim();
  const status = String(body.status ?? "").trim().toUpperCase() as FeatureSuggestionStatus;
  const adminNote = String(body.adminNote ?? "").trim().slice(0, 2000);

  if (!suggestionId || !ALLOWED_STATUS.has(status)) {
    return jsonError("INVALID_BODY", 400);
  }

  await prisma.featureSuggestion.update({
    where: { id: suggestionId },
    data: {
      status,
      adminNote: adminNote || null,
      reviewedAt:
        status === FeatureSuggestionStatus.PENDING ? null : new Date(),
    },
  });

  if (body.shouldRedirect) {
    return NextResponse.redirect(new URL("/admin/feature-suggestions", request.url), 303);
  }

  return Response.json({ ok: true });
}
