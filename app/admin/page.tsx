import { pageMetadata } from "@/lib/seo";
import PageShell from "@/components/community/page-shell";
import AdminPanel from "@/components/community/admin";

export const metadata = pageMetadata({
  title: "Review submissions",
  description:
    "Administrator tools for reviewing community button submissions.",
  path: "/admin",
  index: false,
});

export default function Page() {
  return (
    <PageShell>
      <AdminPanel />
    </PageShell>
  );
}
