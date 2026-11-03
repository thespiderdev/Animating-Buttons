"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Select from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CATEGORIES,
  buttonCategories,
  categoryLabel,
} from "@/lib/button-tools";
import { useCollections } from "@/lib/collections";
import { Search, Plus, ChevronRight } from "lucide-react";
import {
  getCommunityButtons,
  buttonTitle,
  type ButtonItem,
} from "@/lib/community";
import ButtonCard from "./button-card";

export default function ButtonGallery({
  initialButtons = [],
  initialTotal = 0,
  page = 1,
  pageCount = 1,
}: {
  initialButtons?: ButtonItem[];
  initialTotal?: number;
  page?: number;
  pageCount?: number;
}) {
  const params = useSearchParams();
  const router = useRouter();
  const collections = useCollections();
  const category =
    CATEGORIES.find((item) => item.id === params.get("category"))?.id || "all";
  const requestedStyling = params.get("styling");
  const styling =
    requestedStyling === "css" || requestedStyling === "tailwind"
      ? requestedStyling
      : "all";
  const savedOnly = params.get("saved") === "true";
  const requestedSource = params.get("source");
  const source =
    requestedSource &&
    ["community", "uiverse", "21st"].includes(requestedSource)
      ? requestedSource
      : "all";
  function filter(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    next.delete("page");
    if (value === "all" || value === "false" || !value) next.delete(key);
    else next.set(key, value);
    setVisible(12);
    router.replace(`/buttons${next.size ? `?${next}` : ""}`, { scroll: false });
  }
  const [buttons, setButtons] = useState<ButtonItem[]>(initialButtons);
  const [complete, setComplete] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [visible, setVisible] = useState(12);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(
    !initialButtons.length ||
      category !== "all" ||
      styling !== "all" ||
      source !== "all" ||
      savedOnly,
  );
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    getCommunityButtons(attempt > 0)
      .then((items) => {
        if (active) {
          setButtons(items);
          setComplete(true);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setError(
            "The collection could not be loaded. Check your connection and try again.",
          );
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const items = buttons.filter(
      (button) =>
        `${buttonTitle(button)} ${button.githubUsername} ${button.displayName || ""} ${buttonCategories(button).map(categoryLabel).join(" ")}`
          .toLowerCase()
          .includes(term) &&
        (category === "all" || buttonCategories(button).includes(category)) &&
        (styling === "all" || (button.styling || "css") === styling) &&
        (source === "all" ||
          (source === "community"
            ? !button.source
            : button.source?.provider === source)) &&
        (!savedOnly ||
          collections.entries.some((entry) => entry.id === button.id)),
    );
    return items.sort((a, b) =>
      sort === "newest"
        ? (b.addedAt?.seconds || b.createdAt?.seconds || 0) -
            (a.addedAt?.seconds || a.createdAt?.seconds || 0) ||
          a.id.localeCompare(b.id)
        : sort === "name"
          ? buttonTitle(a).localeCompare(buttonTitle(b))
          : (b.likeCounter || 0) - (a.likeCounter || 0),
    );
  }, [
    buttons,
    search,
    sort,
    category,
    styling,
    source,
    savedOnly,
    collections,
  ]);
  const offset =
    complete &&
    !search.trim() &&
    sort === "newest" &&
    source === "all" &&
    category === "all" &&
    styling === "all" &&
    !savedOnly
      ? (page - 1) * 12
      : 0;
  return (
    <>
      <header className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
        <span className="eyebrow">The community collection</span>
        <h1 className="font-runde text-4xl font-bold tracking-tight sm:text-5xl">
          Find your next click.
        </h1>
        <p className="text-balance text-muted-foreground">
          A collection of animated buttons made by the community. Try them,
          explore the code, and make something of your own.
        </p>
        <Link href="/add" className="action-primary mt-2">
          <Plus size={16} />
          Submit a button
        </Link>
      </header>
      <div className="my-10 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute top-3.5 left-4 text-muted-foreground"
            size={18}
          />
          <input
            aria-label="Search buttons or creators"
            type="search"
            placeholder="Search buttons or creators…"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setVisible(12);
            }}
            className="field pl-11"
          />
        </div>
        <Select
          aria-label="Sort buttons"
          value={sort}
          onValueChange={(value) => {
            setSort(value);
            setVisible(12);
          }}
          className="w-full sm:w-44"
          options={[
            { value: "newest", label: "Latest added" },
            { value: "popular", label: "Most loved" },
            { value: "name", label: "Name A–Z" },
          ]}
        />
      </div>
      <div className="mb-6 flex flex-wrap gap-2" aria-label="Button categories">
        {[{ id: "all", label: "All buttons" }, ...CATEGORIES].map((item) => (
          <button
            key={item.id}
            aria-pressed={category === item.id}
            onClick={() => filter("category", item.id)}
            className={
              category === item.id
                ? "action-primary text-sm"
                : "action-secondary text-sm"
            }
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Select
          aria-label="Styling support"
          className="w-48"
          value={styling}
          onValueChange={(value) => filter("styling", value)}
          options={[
            { value: "all", label: "All styling" },
            { value: "css", label: "CSS" },
            { value: "tailwind", label: "Tailwind CSS" },
          ]}
        />
        <button
          aria-pressed={savedOnly}
          className={savedOnly ? "action-primary" : "action-secondary"}
          onClick={() => filter("saved", String(!savedOnly))}
        >
          Saved buttons
        </button>
        <Link
          href="/collections"
          className="inline-flex items-center gap-1 text-sm text-action-accent hover:underline"
        >
          My collections <ChevronRight size={16} aria-hidden="true" />
        </Link>
      </div>
      <div aria-live="polite" className="mb-5 text-sm text-muted-foreground">
        {loading
          ? "Loading the collection…"
          : `${complete ? filtered.length : initialTotal} ${(complete ? filtered.length : initialTotal) === 1 ? "button" : "buttons"}${search ? ` for “${search}”` : " to explore"}`}
      </div>
      {error ? (
        <div role="alert" className="empty-state">
          <h2>Could not load buttons</h2>
          <p>{error}</p>
          <button
            className="action-primary"
            onClick={() => {
              setLoading(true);
              setError("");
              setAttempt(attempt + 1);
            }}
          >
            Try again
          </button>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }, (_, index) => (
            <div
              key={index}
              className="aspect-4/3 animate-pulse rounded-[32px] bg-muted motion-reduce:animate-none"
            />
          ))}
        </div>
      ) : filtered.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.slice(offset, offset + visible).map((button) => (
            <ButtonCard key={button.id} button={button} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>No buttons found</h2>
          <p>Try another button name or GitHub username.</p>
          <button
            className="action-secondary"
            onClick={() => {
              setSearch("");
              router.replace("/buttons", { scroll: false });
            }}
          >
            Clear filters
          </button>
        </div>
      )}
      {filtered.length > offset + visible && (
        <div className="mt-10 flex justify-center">
          <button
            className="action-secondary"
            onClick={() => setVisible(visible + 12)}
          >
            Load more buttons
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
      )}
      {!search.trim() &&
        category === "all" &&
        styling === "all" &&
        !savedOnly &&
        source === "all" &&
        sort === "newest" && (
          <nav
            aria-label="Collection pages"
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            {page > 1 && (
              <Link
                href={page === 2 ? "/buttons" : `/buttons?page=${page - 1}`}
                className="action-secondary"
              >
                Previous page
              </Link>
            )}
            <span className="text-sm text-muted-foreground">
              Page {page} of {pageCount}
            </span>
            {page < pageCount && (
              <Link
                href={`/buttons?page=${page + 1}`}
                className="action-secondary"
              >
                Next page
              </Link>
            )}
          </nav>
        )}
    </>
  );
}
