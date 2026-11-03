"use client";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { buttonTitle, downloadButton, type ButtonItem } from "@/lib/community";
import Select from "@/components/ui/select";
import ButtonCredit from "./button-credit";
import SaveButton from "./save-button";
import { useCommunity } from "./provider";

export default function ReactButtonViewer({ button }: { button: ButtonItem }) {
  const { user, username, isAdmin } = useCommunity();
  const files = button.reactSource!.files;
  const implementation = Object.keys(files).find(
    (name) =>
      name.endsWith(".tsx") &&
      /button/i.test(name) &&
      !/(?:demo|example|variants|particles)/i.test(name) &&
      /<button\b|<motion\.button\b|buttonVariants|<ButtonPrimitive\b|<AriaButton\b|asChild[\s\S]{0,120}["']button["']/.test(
        files[name],
      ),
  );
  const [file, setFile] = useState(implementation || Object.keys(files)[0]);
  const { resolvedTheme } = useTheme();
  return (
    <>
      <Link
        href="/buttons"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft size={16} aria-hidden="true" /> Back to buttons
      </Link>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section
          aria-label="Live button preview"
          className="overflow-hidden rounded-3xl border border-foreground/10 bg-muted"
        >
          <iframe
            title={`${buttonTitle(button)} interactive preview`}
            src={`/api/catalogue/${encodeURIComponent(button.id)}/preview?theme=${resolvedTheme === "light" ? "light" : "dark"}&v=${encodeURIComponent(button.source?.version || "1")}`}
            sandbox="allow-scripts"
            className="h-96 w-full border-0"
          />
        </section>
        <section
          aria-label="React source"
          className="min-w-0 rounded-3xl border border-foreground/10 bg-muted/40 p-4"
        >
          <Select
            aria-label="Source file"
            value={file}
            onValueChange={setFile}
            options={Object.keys(files).map((name) => ({
              value: name,
              label: name,
            }))}
          />
          <pre
            tabIndex={0}
            className="mt-4 h-80 overflow-auto rounded-xl bg-background p-4 font-mono text-xs"
          >
            <code>{files[file]}</code>
          </pre>
        </section>
      </div>
      <header className="my-8 flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {buttonTitle(button)}
          </h1>
          <p className="mt-3 text-sm">
            By <ButtonCredit button={button} className="text-action-accent" />
          </p>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">
            Try the interaction, copy the React source files, or download the
            complete example.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SaveButton button={button} />
          {button.reactSource?.framework &&
            user &&
            (isAdmin ||
              (button.ownerUid
                ? button.ownerUid === user.uid
                : button.githubUsername.toLowerCase() ===
                  username.toLowerCase())) && (
              <Link
                className="action-secondary"
                href={`/add?format=component&edit=${encodeURIComponent(button.id)}`}
              >
                Edit component
              </Link>
            )}
          <button
            className="action-secondary"
            onClick={() =>
              void downloadButton(button).catch(() =>
                toast.error("Download failed. Please try again."),
              )
            }
          >
            Download
          </button>
          <button
            className="action-primary"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(files[file]);
                toast.success("Source copied");
              } catch {
                toast.error("Could not copy the source.");
              }
            }}
          >
            Copy file
          </button>
        </div>
      </header>
    </>
  );
}
