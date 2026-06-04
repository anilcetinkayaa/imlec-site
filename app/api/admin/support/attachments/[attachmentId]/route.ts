import { prisma } from "@/src/db/prisma";
import { getAdminSession } from "@/src/server/admin";

export const runtime = "nodejs";

type AttachmentRouteContext = {
  params: Promise<{
    attachmentId: string;
  }>;
};

export async function GET(_request: Request, context: AttachmentRouteContext) {
  const admin = await getAdminSession();

  if (admin.status === "unauthenticated") {
    return Response.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  if (admin.status === "forbidden") {
    return Response.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const { attachmentId } = await context.params;
  const attachment = await prisma.supportAttachment.findUnique({
    where: { id: attachmentId },
    select: {
      content: true,
      contentType: true,
      fileName: true,
    },
  });

  if (!attachment) {
    return Response.json({ ok: false, error: "ATTACHMENT_NOT_FOUND" }, { status: 404 });
  }

  return new Response(attachment.content, {
    headers: {
      "content-disposition": `inline; filename="${attachment.fileName.replace(/"/g, "")}"`,
      "content-type": attachment.contentType,
    },
  });
}
