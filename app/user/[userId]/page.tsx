import { notFound } from "next/navigation";
import PageShell from "@/components/community/page-shell";
import UserProfile from "@/components/community/profile";
import Breadcrumbs from "@/components/seo/breadcrumbs";
import JsonLd from "@/components/seo/json-ld";
import { getPublicCreator } from "@/lib/public-community";
import { pageMetadata, webPageSchema, itemListSchema } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
type Props = { params: Promise<{ userId: string }> };
function validUsername(name: string) {
  if (!/^[a-z\d](?:[a-z\d_-]{0,79})$/i.test(name)) notFound();
}
export async function generateMetadata({ params }: Props) {
  const { userId } = await params;
  validUsername(userId);
  const creator = await getPublicCreator(userId);
  return {
    ...pageMetadata({
      title: `@${creator.username}: animated button creator`,
      description: `Explore ${creator.buttons.length} published animated ${creator.buttons.length === 1 ? "button" : "buttons"} by @${creator.username}. Preview CSS and JavaScript interactions and reuse the code in your project.`,
      path: `/user/${encodeURIComponent(creator.username)}`,
      index: creator.buttons.length > 0,
    }),
    authors: [
      {
        name: creator.username,
        url: `${SITE_URL}/user/${encodeURIComponent(creator.username)}`,
      },
    ],
    creator: creator.username,
  };
}
export default async function Page({ params }: Props) {
  const { userId } = await params;
  validUsername(userId);
  const creator = await getPublicCreator(userId);
  const path = `/user/${encodeURIComponent(creator.username)}`;
  return (
    <PageShell>
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Community", path: "/leaderboard" },
          { name: `@${creator.username}`, path },
        ]}
      />
      {creator.buttons.length > 0 && (
        <>
          <JsonLd
            data={{
              ...webPageSchema(
                path,
                `@${creator.username}`,
                `Published animated buttons by @${creator.username}.`,
                "ProfilePage",
              ),
              mainEntity: {
                "@type": "Person",
                "@id": `${SITE_URL}${path}#person`,
                name: creator.profile?.name || creator.username,
                alternateName: creator.username,
                url: `${SITE_URL}${path}`,
                sameAs: `https://github.com/${encodeURIComponent(creator.username)}`,
                ...(creator.profile?.bio
                  ? { description: creator.profile.bio }
                  : {}),
              },
            }}
          />
          <JsonLd
            data={itemListSchema(
              creator.buttons.map((button) => ({
                name: button.title || "Animated button",
                path: `/show/${button.id}`,
              })),
            )}
          />
        </>
      )}
      <UserProfile
        key={creator.username}
        username={creator.username}
        initialButtons={creator.buttons}
        initialProfile={creator.profile}
        serverLoaded
      />
    </PageShell>
  );
}
