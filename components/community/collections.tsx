"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Select from "@/components/ui/select";
import { toast } from "sonner";
import {
  addCollection,
  deleteCollection,
  importCollections,
  removeSaved,
  toggleSaved,
  useCollections,
} from "@/lib/collections";
import { getCommunityButtons, type ButtonItem } from "@/lib/community";
import ButtonCard from "./button-card";
export default function SavedCollections() {
  const data = useCollections();
  const [active, setActive] = useState("Favorites");
  const [name, setName] = useState("");
  const [buttons, setButtons] = useState<ButtonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const upload = useRef<HTMLInputElement>(null);
  useEffect(() => {
    let current = true;
    getCommunityButtons(attempt > 0)
      .then((items) => {
        if (current) {
          setButtons(items);
          setLoading(false);
        }
      })
      .catch(() => {
        if (current) {
          setError(
            "Could not load saved previews. Your saved IDs are still on this browser.",
          );
          setLoading(false);
        }
      });
    return () => {
      current = false;
    };
  }, [attempt]);
  const entries = data.entries.filter((entry) => entry.groups.includes(active));
  const byId = useMemo(
    () => new Map(buttons.map((item) => [item.id, item])),
    [buttons],
  );
  function backup() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "animating-buttons-collections.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <>
      <header className="mb-10">
        <p className="eyebrow">Your button shelf</p>
        <h1 className="mt-3 text-4xl font-bold sm:text-5xl">
          Keep the good clicks.
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Collect buttons for your next project. Saved on this browser, with
          backups you can take anywhere.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/buttons" className="action-primary">
            Explore buttons
          </Link>
          <button onClick={backup} className="action-secondary">
            Export backup
          </button>
          <button
            onClick={() => upload.current?.click()}
            className="action-secondary"
          >
            Import backup
          </button>
          <input
            ref={upload}
            type="file"
            accept=".json,application/json"
            className="hidden"
            aria-label="Import collection backup"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (file) {
                try {
                  importCollections(await file.text());
                  toast.success("Collections imported");
                } catch (error) {
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : "Could not import collections.",
                  );
                }
              }
              event.target.value = "";
            }}
          />
        </div>
      </header>
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <label className="sr-only" htmlFor="collection">
          Collection
        </label>
        <Select
          id="collection"
          aria-label="Collection"
          className="sm:max-w-64"
          value={active}
          onValueChange={setActive}
          options={data.groups.map((group) => ({ value: group, label: group }))}
        />
        <form
          className="flex min-w-0 flex-wrap gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            try {
              addCollection(name);
              setActive(name.trim());
              setName("");
            } catch (error) {
              toast.error((error as Error).message);
            }
          }}
        >
          <input
            aria-label="New collection name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={40}
            className="field w-48"
            placeholder="New collection…"
            required
          />
          <button className="action-secondary">Create</button>
        </form>
        {active !== "Favorites" && (
          <button
            className="action-secondary"
            onClick={() => {
              try {
                deleteCollection(active);
                setActive("Favorites");
              } catch {
                toast.error("Could not remove collection.");
              }
            }}
          >
            Delete collection
          </button>
        )}
      </div>
      <p className="mb-6 text-sm text-muted-foreground" aria-live="polite">
        {entries.length} saved in {active}
      </p>
      {error && (
        <div role="alert" className="mb-6 flex flex-wrap items-center gap-3">
          <p>{error}</p>
          <button
            className="action-secondary"
            onClick={() => {
              setError("");
              setLoading(true);
              setAttempt(attempt + 1);
            }}
          >
            Retry previews
          </button>
        </div>
      )}
      {loading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-muted motion-reduce:animate-none" />
      ) : entries.length ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => {
            const button = byId.get(entry.id);
            return (
              <div key={entry.id}>
                {button ? (
                  <ButtonCard button={button} />
                ) : (
                  <div className="empty-state">
                    <Link href={`/show/${entry.id}`}>{entry.title}</Link>
                    <p>
                      Preview unavailable. This button may no longer be public.
                    </p>
                  </div>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Select
                    aria-label={`Add ${entry.title} to a collection`}
                    className="min-w-0 flex-1 text-sm"
                    value=""
                    placeholder="Add to collection…"
                    emptyLabel="In every collection"
                    onValueChange={(value) => {
                      try {
                        if (!entry.groups.includes(value))
                          toggleSaved(
                            {
                              id: entry.id,
                              title: entry.title,
                              creator: entry.creator,
                            },
                            value,
                          );
                        toast.success("Added to collection");
                      } catch {
                        toast.error("Could not save collection.");
                      }
                    }}
                    options={data.groups
                      .filter((group) => !entry.groups.includes(group))
                      .map((group) => ({ value: group, label: group }))}
                  />
                  <button
                    className="action-secondary text-sm"
                    aria-label={`Remove ${entry.title} from ${active}`}
                    onClick={() => {
                      try {
                        toggleSaved(
                          {
                            id: entry.id,
                            title: entry.title,
                            creator: entry.creator,
                          },
                          active,
                        );
                      } catch {
                        toast.error("Could not remove saved button.");
                      }
                    }}
                  >
                    Remove
                  </button>
                  {!button && (
                    <button
                      className="action-secondary"
                      onClick={() => {
                        try {
                          removeSaved(entry.id);
                        } catch {
                          toast.error("Could not remove saved button.");
                        }
                      }}
                    >
                      Forget button
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <h2>Your collection starts with a click.</h2>
          <p>
            {active === "Favorites"
              ? "Use Save on any button to keep it here."
              : "Save a button to Favorites, then add it to this collection."}
          </p>
          <Link href="/buttons" className="action-primary">
            Find a button
          </Link>
        </div>
      )}
    </>
  );
}
