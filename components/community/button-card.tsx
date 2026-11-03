"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { Download, Heart, ChevronRight } from "lucide-react";
import { doc, runTransaction } from "firebase/firestore";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import {
  buttonTitle,
  downloadButton,
  previewDocument,
  type ButtonItem,
} from "@/lib/community";
import SaveButton from "./save-button";
import ButtonCredit from "./button-credit";
import { buttonCategories, categoryLabel } from "@/lib/button-tools";
import { useCommunity } from "./provider";

export default function ButtonCard({ button }: { button: ButtonItem }) {
  const { resolvedTheme } = useTheme();
  const { user, username, login } = useCommunity();
  const [likes, setLikes] = useState(Math.max(0, button.likeCounter || 0));
  const [likedUsers, setLikedUsers] = useState(button.likedUsers || []);
  const [busy, setBusy] = useState(false);
  const title = buttonTitle(button);
  const source = useMemo(
    () => previewDocument(button, resolvedTheme !== "light"),
    [button, resolvedTheme],
  );
  const liked = !!username && likedUsers.includes(username);

  async function toggleLike() {
    if (!user || !username) {
      await login();
      return;
    }
    setBusy(true);
    try {
      const result = await runTransaction(db, async (transaction) => {
        const ref = doc(db, "buttons", button.id);
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists())
          throw new Error("This button is no longer available.");
        const data = snapshot.data();
        const users: string[] = data.likedUsers || [];
        const hasLiked = users.includes(username);
        const nextUsers = hasLiked
          ? users.filter((name) => name !== username)
          : [...users, username];
        const count = Math.max(
          0,
          (data.likeCounter || 0) + (hasLiked ? -1 : 1),
        );
        transaction.update(ref, { likedUsers: nextUsers, likeCounter: count });
        return { count, users: nextUsers };
      });
      setLikes(result.count);
      setLikedUsers(result.users);
    } catch {
      toast.error("Could not save your like. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="group flex min-w-0 flex-col rounded-[32px] border border-black/[0.04] bg-[#F5F5F7] p-2 dark:border-white/[0.08] dark:bg-[#121212]">
      <div className="relative aspect-4/3 overflow-hidden rounded-3xl border border-black/[0.06] bg-white dark:border-white/10 dark:bg-neutral-950">
        <iframe
          src={
            button.source
              ? `/api/catalogue/${encodeURIComponent(button.id)}/preview?theme=${resolvedTheme === "light" ? "light" : "dark"}&v=${encodeURIComponent(button.source.version || "1")}`
              : undefined
          }
          srcDoc={button.source ? undefined : source}
          title={`${title} interactive preview`}
          sandbox="allow-scripts"
          loading="lazy"
          className="h-full w-full border-0"
        />
      </div>
      <div className="flex items-start justify-between gap-3 px-3 pb-2 pt-3">
        <div className="min-w-0">
          <Link
            href={`/show/${button.id}`}
            className="block truncate font-runde text-sm font-semibold sm:text-base"
            title={title}
          >
            {title}
          </Link>
          <ButtonCredit
            button={button}
            className="mt-1 block truncate text-xs text-muted-foreground hover:text-foreground"
          />
        </div>
        <Link
          href={`/show/${button.id}`}
          aria-label={`View code for ${title}`}
          className="rounded-full p-1.5 text-action-accent transition-transform group-hover:translate-x-0.5"
        >
          <ChevronRight size={19} aria-hidden="true" />
        </Link>
      </div>
      <div className="flex flex-wrap gap-2 px-3 pb-3 text-xs text-muted-foreground">
        {buttonCategories(button)
          .slice(0, 2)
          .map((category) => (
            <Link
              href={`/buttons?category=${category}`}
              key={category}
              className="hover:text-action-accent"
            >
              {categoryLabel(category)}
            </Link>
          ))}
        {button.styling === "tailwind" && (
          <span className="text-action-accent">Tailwind</span>
        )}
      </div>
      <div className="mx-3 mt-auto flex items-center justify-between border-t border-foreground/10 pt-2 pb-1">
        {!button.source && (
          <button
            onClick={toggleLike}
            disabled={busy}
            aria-label={`${liked ? "Unlike" : "Like"} ${title}`}
            aria-pressed={liked}
            className={`flex min-h-8 items-center gap-1.5 rounded-lg px-1 text-xs ${liked ? "text-action-accent" : "text-muted-foreground"} hover:text-action-accent disabled:opacity-50`}
          >
            <Heart size={15} fill={liked ? "currentColor" : "none"} />
            <span className="tabular-nums">{likes}</span>
          </button>
        )}
        <SaveButton button={button} compact />
        <button
          aria-label={`Download ${title}`}
          onClick={() => {
            void downloadButton(button).catch(() =>
              toast.error("Download failed. Please try again."),
            );
          }}
          className="flex min-h-8 items-center gap-1.5 rounded-lg px-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <Download size={14} />
          Download
        </button>
      </div>
    </article>
  );
}
