import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ButtonItem } from "@/lib/community";
import { buttonTitle } from "@/lib/button-code";
import { buttonCategories, categoryLabel } from "@/lib/button-tools";
import ButtonCredit from "@/components/community/button-credit";
export default function ButtonInfo({ button }: { button: ButtonItem }) {
  const framework =
    button.reactSource?.framework === "nextjs" ? "Next.js" : "React";
  return (
    <section
      aria-labelledby="button-usage"
      className="mt-12 rounded-2xl bg-muted/40 p-6"
    >
      <h2 id="button-usage" className="text-xl font-semibold">
        About {buttonTitle(button)}
      </h2>
      <p className="mt-4 max-w-3xl text-sm text-muted-foreground">
        {buttonTitle(button)} is an animated{" "}
        {button.reactSource
          ? button.styling === "tailwind"
            ? `${framework} and Tailwind CSS`
            : `${framework} and CSS`
          : button.styling === "tailwind"
            ? "Tailwind CSS v4"
            : "CSS"}{" "}
        button by{" "}
        <ButtonCredit button={button} className="text-action-accent" />.{" "}
        {button.reactSource
          ? "Try the interaction, copy the React source, or download the example with creator credit."
          : "Preview the interaction, customize its HTML, styles and JavaScript, or download the files with creator credit."}
      </p>
      <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-medium">Effects and categories</dt>
          <dd className="mt-1 text-muted-foreground">
            {buttonCategories(button).map(categoryLabel).join(", ")}
          </dd>
        </div>
        <div>
          <dt className="font-medium">Using this example</dt>
          <dd className="mt-1 text-muted-foreground">
            {button.reactSource?.framework
              ? "Copy the component or download its original source, stylesheet and dependencies."
              : button.reactSource
                ? "Copy a TSX file or download the original source and standalone demo."
                : "Copy the HTML or download index.html, style.css and app.js."}{" "}
            Test keyboard focus, motion and contrast in your own project.
          </dd>
        </div>
      </dl>
      <p className="mt-4 text-sm">
        <Link
          href="/faq"
          className="inline-flex items-center gap-1 text-action-accent"
        >
          Usage, Tailwind and licensing questions{" "}
          <ChevronRight size={16} aria-hidden="true" />
        </Link>
      </p>
      <details className="mt-6">
        <summary className="cursor-pointer rounded-lg text-sm font-medium">
          Read the source files
        </summary>
        <div className="mt-4 space-y-4">
          {(button.reactSource
            ? [
                ...Object.entries(button.reactSource.files),
                ["CSS", button.compiledCss || ""],
              ]
            : ([
                ["HTML", button.html],
                ["CSS", `${button.compiledCss || ""}\n${button.css}`],
                ["JavaScript", button.js],
              ] as const)
          )
            .filter(([, value]) => value.trim())
            .map(([name, value]) => (
              <div key={name}>
                <h3 className="mb-2 text-sm font-semibold">{name}</h3>
                <pre className="max-h-80 overflow-auto rounded-xl bg-background p-4 text-xs">
                  <code>{value}</code>
                </pre>
              </div>
            ))}
        </div>
      </details>
    </section>
  );
}
