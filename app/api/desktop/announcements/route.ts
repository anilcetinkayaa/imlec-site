import { prisma } from "@/src/db/prisma";

export const runtime = "nodejs";

export async function GET() {
  const now = new Date();
  const announcements = await prisma.announcement.findMany({
    where: {
      isPublished: true,
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
