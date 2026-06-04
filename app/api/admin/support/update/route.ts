import { NextResponse } from "next/server";
import { prisma } from "@/src/db/prisma";
import { requireAdminApi } from "@/src/server/admin";

export const runtime = "nodejs";

const ALLOWED_STATUS = new Set(["OPEN", "IN_REVIEW", "FIXED", "RELEASED", "CLOSED"]);

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
        ticketId: String(formData.get("ticketId") ?? ""),
        status: String(formData.get("status") ?? ""),
        adminNote: String(formData.get("adminNote") ?? ""),
        shouldRedirect: true,
      }
    : {
        ...((await request.json()) as Record<string, unknown>),
        shouldRedirect: false,
      };

  const ticketId = String(body.ticketId ?? "").trim();
  const status = String(body.status ?? "").trim().toUpperCase();
  const adminNote = String(body.adminNote ?? "").trim().slice(0, 2000);

  if (!ticketId || !ALLOWED_STATUS.has(status)) {
    return jsonError("INVALID_BODY", 400);
  }

  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: {
      status,
      adminNote: adminNote || null,
    },
  });

  if (body.shouldRedirect) {
    return NextResponse.redirect(new URL(`/admin/support/${ticketId}`, request.url), 303);
  }

  return Response.json({ ok: true });
}
