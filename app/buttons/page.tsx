import { Suspense } from "react";
import { notFound } from "next/navigation";
import PageShell from "@/components/community/page-shell";
import ButtonGallery from "@/components/community/gallery";
import Breadcrumbs from "@/components/seo/breadcrumbs";
import JsonLd from "@/components/seo/json-ld";
import { getPublicPage } from "@/lib/public-community";
import {
  cataloguePage,
  itemListSchema,
  pageMetadata,
  webPageSchema,
} from "@/lib/seo";
type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};
export async function generateMetadata({ searchParams }: Props) {
  const params = await searchParams;
  const page = cataloguePage(params.page);
  const filtered = !!(
    params.category ||
    params.styling ||
    params.saved ||
    params.source
  );
  return pageMetadata({
    title: `Animated HTML, CSS and Tailwind buttons${page > 1 ? `: page ${page}` : ""}`,
    description:
      "Browse community animated buttons. Filter hover, loading, toggle, icon and 3D effects; preview interactions and copy or download the code.",
    path: !filtered && page > 1 ? `/buttons?page=${page}` : "/buttons",
    index: !filtered,
  });
}
export default async function Page({ searchParams }: Props) {
  const params = await searchParams;
  const pageNumber = cataloguePage(params.page);
  const page = await getPublicPage(pageNumber);
  if (pageNumber > page.pageCount) notFound();
  const filtered = !!(
    params.category ||
    params.styling ||
    params.saved ||
    params.source
  );
  return (
    <PageShell>
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Buttons", path: "/buttons" },
        ]}
      />
      <JsonLd
        data={webPageSchema(
          pageNumber > 1 ? `/buttons?page=${pageNumber}` : "/buttons",
          "Animated button collection",
          "Community HTML, CSS, Tailwind and JavaScript buttons.",
          "CollectionPage",
        )}
      />
      {!filtered && (
        <JsonLd
          data={itemListSchema(
            page.buttons.map((button) => ({
              name: button.title || "Animated button",
              path: `/show/${button.id}`,
            })),
            (pageNumber - 1) * 12,
          )}
        />
      )}
      <Suspense
        fallback={<div className="h-96 animate-pulse rounded-2xl bg-muted" />}
      >
        <ButtonGallery
          key={JSON.stringify(params)}
          initialButtons={page.buttons}
          initialTotal={page.total}
          page={pageNumber}
          pageCount={page.pageCount}
        />
      </Suspense>
    </PageShell>
  );
}
