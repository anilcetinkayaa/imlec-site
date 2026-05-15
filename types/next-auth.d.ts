import type { UserRole } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      twoFactorVerified?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
    twoFactorEnabled?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    twoFactorRequired?: boolean;
    twoFactorVerified?: boolean;
    twoFactorVerifiedAt?: number;
  }
}
