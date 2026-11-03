import { validateButton } from "@/lib/button-validation";
export async function POST(request: Request) {
  try {
    const raw = await request.text();
    if (raw.length > 310_000)
      return Response.json(
        { error: "The submission is too large." },
        { status: 413 },
      );
    const data = JSON.parse(raw);
    if (
      ![data.html, data.css, data.js].every(
        (value) => typeof value === "string",
      )
    )
      return Response.json(
        { error: "HTML, CSS, and JavaScript must be text." },
        { status: 400 },
      );
    return Response.json(validateButton(data));
  } catch {
    return Response.json(
      { error: "Could not read the button source." },
      { status: 400 },
    );
  }
}
