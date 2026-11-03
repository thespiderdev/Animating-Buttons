"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import {
  getButtonCount,
  getButtonPage,
  type ButtonItem,
} from "@/lib/community";
import ButtonCard from "./button-card";

export function CommunityBadge() {
  return (
    <Link
      href="/leaderboard"
      className="inline-flex min-h-8 items-center gap-3 rounded-full border border-black/5 bg-black/5 px-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-black/60 dark:border-white/10 dark:bg-white/5 dark:text-white/60"
    >
      <span className="size-1.5 rounded-full bg-brand-blue" />
      Built by the community
      <ChevronRight size={12} aria-hidden="true" />
    </Link>
  );
}

export function CommunityShowcase({
  initialPage,
}: {
  initialPage?: {
    buttons: ButtonItem[];
    total: number;
    hasMore: boolean;
    cursor?: { id: string; likes: number };
  };
}) {
  const [buttons, setButtons] = useState<ButtonItem[]>(
    initialPage?.buttons || [],
  );
  const [total, setTotal] = useState<number | undefined>(initialPage?.total);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(!initialPage);
  const [hasMore, setHasMore] = useState(initialPage?.hasMore ?? true);
  const cursor = useRef<Awaited<ReturnType<typeof getButtonPage>>["cursor"]>(
    initialPage?.cursor,
  );
  const inFlight = useRef(false);
  const moreAvailable = useRef(initialPage?.hasMore ?? true);
  const mounted = useRef(false);
  const sentinel = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (inFlight.current || !moreAvailable.current) return;
    inFlight.current = true;
    setLoading(true);
    setError(false);
    try {
      const page = await getButtonPage(cursor.current);
      if (!mounted.current) return;
      cursor.current = page.cursor;
      moreAvailable.current = page.hasMore;
      setHasMore(page.hasMore);
      setButtons((previous) => {
        const ids = new Set(previous.map((button) => button.id));
        return [
          ...previous,
          ...page.buttons.filter((button) => !ids.has(button.id)),
        ];
      });
    } catch {
      if (mounted.current) setError(true);
    } finally {
      inFlight.current = false;
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    if (!initialPage) void loadMore();
    if (!initialPage)
      getButtonCount()
        .then((count) => {
          if (mounted.current) setTotal(count);
        })
        .catch(() => {});
    return () => {
      mounted.current = false;
    };
  }, [loadMore, initialPage]);

  useEffect(() => {
    if (
      !sentinel.current ||
      loading ||
      error ||
      !hasMore ||
      !("IntersectionObserver" in window)
    )
      return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void loadMore();
      },
      { rootMargin: "500px 0px" },
    );
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [loading, error, hasMore, loadMore]);

  return (
    <section
      id="buttons"
      className="mx-auto w-full max-w-6xl scroll-mt-24 px-5 pt-24 sm:px-6 md:pt-32"
    >
      <header className="flex flex-col items-center gap-3 text-center">
        <span className="font-runde text-xs font-semibold uppercase tracking-[0.16em] text-action-accent">
          The community collection
        </span>
        <h2 className="max-w-2xl text-balance font-runde text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
          {total ? `${total} buttons. ` : "Little interactions. "}Endless
          possibilities.
        </h2>
        <p className="max-w-lg text-balance text-sm font-medium text-muted-foreground sm:text-base">
          Hover, click, and play. Real buttons by real developers, with the
          HTML, CSS or Tailwind, and JavaScript ready to make your own.
        </p>
      </header>
      <div
        className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        aria-busy={loading}
      >
        {buttons.map((button) => (
          <ButtonCard key={button.id} button={button} />
        ))}
        {loading &&
          Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              aria-label="Loading button"
              className="aspect-4/3 animate-pulse rounded-[32px] bg-muted motion-reduce:animate-none"
            />
          ))}
      </div>
      <div
        ref={sentinel}
        className="mt-8 flex flex-col items-center gap-3 text-center"
      >
        <p
          aria-live="polite"
          role={error ? "alert" : "status"}
          className="text-sm text-muted-foreground"
        >
          {error
            ? buttons.length
              ? "Could not load more buttons. Your current buttons are still here."
              : "Could not load the collection."
            : loading
              ? "Loading buttons…"
              : !buttons.length
                ? "The first button is still to come."
                : !hasMore
                  ? "You’ve reached the end of the collection."
                  : "More buttons load as you scroll."}
        </p>
        {!loading && (hasMore || error) && (
          <button className="action-secondary" onClick={loadMore}>
            {error ? "Try again" : "Load more buttons"}
          </button>
        )}
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/buttons" className="action-primary">
          Explore all buttons
          <ChevronRight size={16} aria-hidden="true" />
        </Link>
        <Link href="/add" className="action-secondary">
          Submit your button
        </Link>
      </div>
    </section>
  );
}
