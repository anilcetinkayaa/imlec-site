import { reconcileLemonSqueezySubscriptions } from "@/src/server/lemonsqueezy-reconcile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return Response.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const result = await reconcileLemonSqueezySubscriptions();
  return Response.json({ ok: true, ...result });
}
