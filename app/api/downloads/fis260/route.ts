import { existsSync, statSync, createReadStream } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { auth } from "@/auth";
import { hasProductAccess } from "@/src/server/entitlements";
import { PRODUCT_SLUGS } from "@/src/server/products";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const allowed = await hasProductAccess(session.user.id, PRODUCT_SLUGS.fis260);

  if (!allowed) {
    return new Response("FIS260 access required", { status: 403 });
  }

  const filePath = path.join(
    process.cwd(),
    "downloads",
    "FIS260_Setup_v0.1.0.exe",
  );

  if (!existsSync(filePath)) {
    return new Response("Installer not found", { status: 404 });
  }

  const stat = statSync(filePath);
  const stream = Readable.toWeb(createReadStream(filePath));

  return new Response(stream as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.microsoft.portable-executable",
      "Content-Length": stat.size.toString(),
      "Content-Disposition": 'attachment; filename="FIS260_Setup_v0.1.0.exe"',
      "Cache-Control": "private, no-store",
    },
  });
}
