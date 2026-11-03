import { getPublicButton } from "@/lib/public-community";
import { reactPreviewDocument } from "@/lib/react-preview";
import { getImportedButton } from "@/lib/imported-buttons.server";
import { previewDocument } from "@/lib/button-code";
export const runtime = "nodejs";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const imported = await getImportedButton(id);
  const result = imported ? null : await getPublicButton(id);
  const button =
    imported || (result?.state === "public" ? result.button : null);
  if (!button || (!imported && !button.reactSource?.framework))
    return new Response("Button not found", { status: 404 });
  const dark = new URL(request.url).searchParams.get("theme") !== "light";
  return new Response(
    button.reactSource?.framework
      ? reactPreviewDocument(button, dark)
      : previewDocument(button, dark),
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": imported ? "public, max-age=3600" : "no-store",
        "X-Robots-Tag": "noindex, nofollow",
        "Content-Security-Policy":
          "sandbox allow-scripts; frame-ancestors 'self'; base-uri 'none'; form-action 'none'",
      },
    },
  );
}
