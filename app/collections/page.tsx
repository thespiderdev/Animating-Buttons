import { pageMetadata } from "@/lib/seo";
import PageShell from "@/components/community/page-shell";
import SavedCollections from "@/components/community/collections";
export const metadata = pageMetadata({
  title: "Your saved button collections",
  description:
    "Organize saved animated buttons in browser-local collections and import or export collection backups.",
  path: "/collections",
  index: false,
});
export default function Page() {
  return (
    <PageShell>
      <SavedCollections />
    </PageShell>
  );
}
