import Link from "next/link";
import PageShell from "@/components/community/page-shell";
import Breadcrumbs from "@/components/seo/breadcrumbs";
import JsonLd from "@/components/seo/json-ld";
import { FAQS } from "@/lib/faq";
import { pageMetadata, webPageSchema } from "@/lib/seo";
export const metadata = pageMetadata({
  title: "Using animated buttons: frequently asked questions",
  description:
    "How to copy animated buttons, use Tailwind CSS, adapt examples for React or Next.js, contribute code and manage saved collections.",
  path: "/faq",
});
export default function Page() {
  return (
    <PageShell>
      <div className="mx-auto max-w-3xl">
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: "FAQ", path: "/faq" },
          ]}
        />
        <JsonLd
          data={{
            ...webPageSchema(
              "/faq",
              "Animated button questions",
              "Practical answers about using and contributing animated buttons.",
              "FAQPage",
            ),
            mainEntity: FAQS.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: { "@type": "Answer", text: item.answer },
            })),
          }}
        />
        <header className="mb-12">
          <p className="eyebrow">Before your next click</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Button questions, answered.
          </h1>
          <p className="mt-4 text-muted-foreground">
            How to use the code, work with Tailwind and share a contribution.
          </p>
        </header>
        <div className="space-y-8">
          {FAQS.map((item, index) => (
            <section key={item.question} aria-labelledby={`question-${index}`}>
              <h2 id={`question-${index}`} className="text-xl font-semibold">
                {item.question}
              </h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {item.answer}
              </p>
            </section>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/buttons" className="action-primary">
            Explore buttons
          </Link>
          <Link href="/add" className="action-secondary">
            Open the workshop
          </Link>
          <Link href="/terms" className="action-secondary">
            Read the terms
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
