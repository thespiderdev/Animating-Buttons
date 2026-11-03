import type { NextRequest } from "next/server";
import { apiFailure, checkedCode, readPayload } from "@/lib/button-server";
import { reactPreviewDocument } from "@/lib/react-preview";

export async function POST(request: NextRequest) {
  try {
    const data = await readPayload(request);
    const button = await checkedCode(data);
    if (!("reactSource" in button))
      return Response.json(
        { error: "Provide a React component." },
        { status: 400 },
      );
    return Response.json({
      document: reactPreviewDocument(button, data.dark !== false),
    });
  } catch (error) {
    return apiFailure(error);
  }
}
