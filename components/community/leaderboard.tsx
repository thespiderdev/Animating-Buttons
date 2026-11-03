"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, Heart } from "lucide-react";
import { getCommunityButtons } from "@/lib/community";

export type Creator = { username: string; count: number; likes: number };
export default function Leaderboard({
  initialCreators,
}: {
  initialCreators?: Creator[];
}) {
  const [creators, setCreators] = useState<Creator[]>(initialCreators || []);
  const [loading, setLoading] = useState(!initialCreators);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (initialCreators) return;
    let active = true;
    getCommunityButtons()
      .then((buttons) => {
        const byUser = new Map<string, Creator>();
        for (const button of buttons) {
          const name = button.githubUsername;
          if (!name) continue;
          const current = byUser.get(name) || {
            username: name,
            count: 0,
            likes: 0,
          };
          current.count += 1;
          current.likes += Math.max(0, button.likeCounter || 0);
          byUser.set(name, current);
        }
        if (active) {
          setCreators(
            [...byUser.values()].sort(
              (a, b) => b.likes - a.likes || b.count - a.count,
            ),
          );
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setError(true);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [initialCreators]);
  return (
    <>
      <header className="mx-auto mb-12 max-w-xl text-center">
        <p className="eyebrow">Good things are made together</p>
        <h1 className="mt-4 font-runde text-4xl font-bold tracking-tight sm:text-5xl">
          Meet the makers.
        </h1>
        <p className="mt-4 text-muted-foreground">
          The people behind the collection, ranked by the love their buttons
          receive.
        </p>
      </header>
      {loading ? (
        <div className="h-96 animate-pulse rounded-3xl bg-muted motion-reduce:animate-none" />
      ) : error ? (
        <div className="empty-state" role="alert">
          <h2>Could not load the leaderboard</h2>
          <p>Please check your connection and try again later.</p>
        </div>
      ) : (
        <div className="mx-auto max-w-3xl">
          <div className="grid grid-cols-[40px_1fr_64px_64px] gap-3 border-b border-foreground/10 px-3 pb-4 text-xs text-muted-foreground sm:grid-cols-[48px_1fr_90px_80px]">
            <span>Rank</span>
            <span>Creator</span>
            <span className="text-right">Buttons</span>
            <span className="text-right">Likes</span>
          </div>
          {creators.map((creator, index) => (
            <Link
              key={creator.username}
              href={`/user/${creator.username}`}
              className="grid min-h-20 grid-cols-[40px_minmax(0,1fr)_64px_64px] items-center gap-3 border-b border-foreground/10 px-3 transition-colors hover:bg-muted sm:grid-cols-[48px_minmax(0,1fr)_90px_80px]"
            >
              <span
                className={`font-mono text-sm ${index < 3 ? "text-action-accent" : "text-muted-foreground"}`}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="flex min-w-0 items-center gap-3">
                <img
                  src={`https://github.com/${encodeURIComponent(creator.username)}.png?size=80`}
                  alt=""
                  width={40}
                  height={40}
                  loading="lazy"
                  className="size-10 rounded-full"
                />
                <span className="truncate text-sm font-medium">
                  {creator.username}
                </span>
                <ChevronRight
                  aria-hidden="true"
                  size={14}
                  className="hidden text-muted-foreground sm:block"
                />
              </span>
              <span className="text-right text-sm tabular-nums text-muted-foreground">
                {creator.count}
              </span>
              <span className="flex items-center justify-end gap-1.5 text-sm tabular-nums">
                <Heart size={13} className="text-action-accent" />
                {creator.likes}
              </span>
            </Link>
          ))}
        </div>
      )}
      <div className="mt-10 flex justify-center">
        <Link href="/add" className="action-primary">
          Add your button to the collection
        </Link>
      </div>
    </>
  );
}
