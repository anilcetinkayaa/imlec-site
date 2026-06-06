import { prisma } from "@/src/db/prisma";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const now = new Date();
  const url = new URL(request.url);
  const target = url.searchParams.get("target")?.trim().toLowerCase();
  const announcements = await prisma.announcement.findMany({
    where: {
      isPublished: true,
      ...(target
        ? {
            productSlug: target,
          }
        : {}),
      AND: [
        {
          OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        },
        {
          OR: [{ endsAt: null }, { endsAt: { gte: now } }],
        },
      ],
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
    select: {
      id: true,
      title: true,
      body: true,
      type: true,
      imageUrl: true,
      productSlug: true,
      createdAt: true,
    },
  });

  return Response.json({
    ok: true,
    announcements: announcements.map((announcement) => ({
      ...announcement,
      createdAt: announcement.createdAt.toISOString(),
    })),
  });
}
