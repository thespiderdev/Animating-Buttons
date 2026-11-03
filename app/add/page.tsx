import JsonLd from "@/components/seo/json-ld";
import { SITE_URL } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";
import PageShell from "@/components/community/page-shell";
import ButtonEditor from "@/components/community/editor";

const workshopMetadata = pageMetadata({
  title: "Animated button editor: CSS and Tailwind",
  description:
    "Create an animated button with HTML, CSS, Tailwind CSS v4 and JavaScript. Test interactions and accessibility, then submit your button for review.",
  path: "/add",
  index: true,
});

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ remix?: string; starter?: string }>;
}) {
  const params = await searchParams;
  if (!params.remix && !params.starter) return workshopMetadata;
  return {
    ...workshopMetadata,
    robots: {
      index: false,
      follow: true,
      googleBot: { index: false, follow: true },
    },
  };
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ remix?: string; starter?: string }>;
}) {
  const { remix, starter } = await searchParams;
  return (
    <PageShell wide>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Animating Buttons workshop",
          url: `${SITE_URL}/add`,
          applicationCategory: "DeveloperApplication",
          operatingSystem: "Web",
          description:
            "Create and preview animated HTML, CSS, Tailwind CSS and JavaScript buttons.",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }}
      />
      <ButtonEditor
        key={remix || starter || "new"}
        remixId={remix}
        starterId={starter}
      />
    </PageShell>
  );
}
