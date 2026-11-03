import { getImportedButton } from "@/lib/imported-buttons.server";
import { previewDocument } from "@/lib/button-code";
export const runtime = "nodejs";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const button = await getImportedButton((await params).id);
  if (!button) return new Response("Button not found", { status: 404 });
  return new Response(
    previewDocument(
      button,
      new URL(request.url).searchParams.get("theme") !== "light",
    ),
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
        "X-Robots-Tag": "noindex, nofollow",
        "Content-Security-Policy":
          "sandbox allow-scripts; frame-ancestors 'self'; base-uri 'none'; form-action 'none'",
      },
    },
  );
}
