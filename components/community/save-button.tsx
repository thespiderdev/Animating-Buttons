"use client";
import { Bookmark } from "lucide-react";
import { toast } from "sonner";
import { toggleSaved, useCollections } from "@/lib/collections";
import { buttonTitle, type ButtonItem } from "@/lib/community";
export default function SaveButton({
  button,
  compact = false,
}: {
  button: ButtonItem;
  compact?: boolean;
}) {
  const data = useCollections();
  const saved = data.entries.some(
    (entry) => entry.id === button.id && entry.groups.includes("Favorites"),
  );
  return (
    <button
      className={
        compact
          ? "flex min-h-8 items-center gap-1.5 rounded-lg px-1 text-xs text-muted-foreground hover:text-action-accent"
          : "action-secondary"
      }
      aria-label={`${saved ? "Unsave" : "Save"} ${buttonTitle(button)}`}
      aria-pressed={saved}
      onClick={() => {
        try {
          toggleSaved({
            id: button.id,
            title: buttonTitle(button),
            creator: button.githubUsername,
          });
          toast.success(
            saved
              ? "Removed from Favorites"
              : "Saved to Favorites on this browser",
          );
        } catch {
          toast.error(
            "Your browser could not save this button. Check available storage.",
          );
        }
      }}
    >
      <Bookmark
        size={compact ? 14 : 16}
        fill={saved ? "currentColor" : "none"}
      />
      {saved ? "Saved" : "Save"}
    </button>
  );
}
