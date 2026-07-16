import { UserRole, type Prisma } from "@prisma/client";

export function customerRelationshipWhere(): Prisma.UserWhereInput {
  return {
    OR: [
      { role: UserRole.USER },
      { entitlements: { some: {} } },
      { payments: { some: {} } },
      { subscriptions: { some: {} } },
      { devices: { some: {} } },
      { accessRequests: { some: {} } },
    ],
  };
}
