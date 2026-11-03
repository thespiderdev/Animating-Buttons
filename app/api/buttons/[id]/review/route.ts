import { revalidateTag } from "next/cache";
import { NextRequest } from "next/server";
import {
  apiFailure,
  ApiError,
  authenticate,
  checkedCode,
  readButton,
  readPayload,
  writeButton,
} from "@/lib/button-server";
export const runtime = "nodejs";
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await authenticate(request);
    if (!session.admin)
      throw new ApiError("Administrator access required.", 403);
    const { id } = await context.params;
    const data = await readPayload(request);
    if (data.status !== "approved" && data.status !== "rejected")
      throw new ApiError("Choose approve or reject.");
    const source = await readButton(id, session);
    const code =
      data.status === "approved"
        ? await checkedCode({
            html: source.html || "",
            css: source.css || "",
            js: source.js || "",
            styling: source.styling,
            reactSource: source.reactSource,
          })
        : {};
    await writeButton({ ...code, status: data.status }, session, id);
    revalidateTag("public-buttons", { expire: 0 });
    return Response.json({ id, status: data.status });
  } catch (error) {
    return apiFailure(error);
  }
}
