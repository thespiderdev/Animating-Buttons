import { revalidateTag } from "next/cache";
import { NextRequest } from "next/server";
import {
  apiFailure,
  ApiError,
  authenticate,
  checkedCode,
  readButton,
  readPayload,
  validCategories,
  writeButton,
} from "@/lib/button-server";
import { getImportedButton } from "@/lib/imported-buttons.server";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  try {
    const session = await authenticate(request);
    const data = await readPayload(request);
    if (
      typeof data.title !== "string" ||
      !data.title.trim() ||
      data.title.trim().length > 80
    )
      throw new ApiError("Give your button a name of up to 80 characters.");
    const code = await checkedCode(data);
    const id = typeof data.id === "string" ? data.id : undefined;
    let existing: Record<string, unknown> | undefined;
    if (id) {
      existing = await readButton(id, session);
      if (
        !session.admin &&
        (existing.ownerUid
          ? existing.ownerUid !== session.uid
          : String(existing.githubUsername).toLowerCase() !==
            session.login.toLowerCase())
      )
        throw new ApiError(
          "You can only edit your own buttons. Make a remix instead.",
          403,
        );
    }
    if (existing && Boolean(existing.reactSource) !== "reactSource" in code)
      throw new ApiError(
        "Keep the original submission format when editing a button.",
      );
    const values: Record<string, unknown> = {
      ...code,
      title: data.title.trim(),
      categories: validCategories(data.categories ?? existing?.categories),
      status:
        session.admin && existing ? existing.status || "pending" : "pending",
    };
    if (!id) {
      Object.assign(values, {
        ownerUid: session.uid,
        githubUsername: session.login,
        displayName: session.displayName,
        likeCounter: 0,
        likedUsers: [],
      });
      if (typeof data.remixId === "string") {
        const imported = await getImportedButton(data.remixId);
        const source = imported || (await readButton(data.remixId, session));
        if (
          source.status !== "approved" &&
          source.ownerUid !== session.uid &&
          !session.admin
        )
          throw new ApiError("Only published buttons can be remixed.", 403);
        values.remixOf = {
          id: data.remixId,
          githubUsername: String(source.githubUsername || "Community"),
          title: String(source.title || "Community button").slice(0, 80),
        };
      }
    }
    const savedId = await writeButton(values, session, id);
    revalidateTag("public-buttons", { expire: 0 });
    return Response.json({ id: savedId, status: values.status });
  } catch (error) {
    return apiFailure(error);
  }
}
