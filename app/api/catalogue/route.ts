import { getPublicCatalogue, getPublicSlice } from "@/lib/public-community";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const catalogue = await getPublicCatalogue();
  if (params.get("counts") === "true")
    return Response.json({ total: catalogue.length });
  const after = params.get("after");
  const index = after
    ? catalogue.findIndex((button) => button.id === after)
    : -1;
  if (after && index < 0)
    return Response.json(
      { error: "This catalogue cursor has expired. Reload the collection." },
      { status: 400 },
    );
  return Response.json(await getPublicSlice(index + 1));
}
