import { pageMetadata } from "@/lib/seo";
import { getPublicCatalogue, rankCreators } from "@/lib/public-community";
import Breadcrumbs from "@/components/seo/breadcrumbs";
import JsonLd from "@/components/seo/json-ld";
import { itemListSchema, webPageSchema } from "@/lib/seo";
import PageShell from "@/components/community/page-shell";
import Leaderboard from "@/components/community/leaderboard";

export const metadata = pageMetadata({
  title: "Animated button creators and community leaderboard",
  description:
    "Meet the developers behind Animating Buttons. Browse creators ranked by the likes their published buttons receive.",
  path: "/leaderboard",
  index: true,
});

export default async function Page() {
  const creators = rankCreators(await getPublicCatalogue());
  return (
    <PageShell>
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Community", path: "/leaderboard" },
        ]}
      />
      <JsonLd
        data={webPageSchema(
          "/leaderboard",
          "Animated button creators",
          "Creators ranked by likes on their published buttons.",
          "CollectionPage",
        )}
      />
      <JsonLd
        data={itemListSchema(
          creators.map((creator) => ({
            name: creator.username,
            path: `/user/${encodeURIComponent(creator.username)}`,
          })),
        )}
      />
      <Leaderboard initialCreators={creators} />
    </PageShell>
  );
}
