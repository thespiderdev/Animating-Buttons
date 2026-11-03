import Link from "next/link";
import JsonLd from "./json-ld";
import { breadcrumbSchema } from "@/lib/seo";
export default function Breadcrumbs({
  items,
}: {
  items: Array<{ name: string; path: string }>;
}) {
  return (
    <>
      <JsonLd data={breadcrumbSchema(items)} />
      <nav
        aria-label="Breadcrumb"
        className="mb-6 text-sm text-muted-foreground"
      >
        <ol className="flex flex-wrap items-center gap-2">
          {items.map((item, index) => (
            <li key={item.path} className="flex min-w-0 items-center gap-2">
              {index > 0 && <span aria-hidden="true">/</span>}
              {index === items.length - 1 ? (
                <span aria-current="page">{item.name}</span>
              ) : (
                <Link href={item.path} className="hover:text-action-accent">
                  {item.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
