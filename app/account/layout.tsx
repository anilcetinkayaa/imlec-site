import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AccountShell } from "@/components/account/AccountShell";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return <AccountShell user={session.user}>{children}</AccountShell>;
}
