export const runtime = "nodejs";

export async function GET() {
  return Response.json({
    ok: true,
    service: "desktop-auth",
    timestamp: new Date().toISOString(),
  });
}
