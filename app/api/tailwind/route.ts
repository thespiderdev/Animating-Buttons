import { compileButtonTailwind } from "@/lib/tailwind";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const body = await request.text();
    if (body.length > 210_000)
      return Response.json(
        { error: "Keep the button source under 200 KB." },
        { status: 413 },
      );
    const data = JSON.parse(body);
    if (
      typeof data.html !== "string" ||
      (data.js !== undefined && typeof data.js !== "string")
    )
      return Response.json(
        { error: "Expected HTML and optional JavaScript." },
        { status: 400 },
      );
    return Response.json({
      css: await compileButtonTailwind(data.html, data.js || ""),
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not compile Tailwind.",
      },
      { status: 400 },
    );
  }
}
