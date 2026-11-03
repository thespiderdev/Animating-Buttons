"use client";
import { useSyncExternalStore } from "react";
export type SavedEntry = {
  id: string;
  title: string;
  creator: string;
  groups: string[];
  savedAt: number;
};
export type Collections = { groups: string[]; entries: SavedEntry[] };
const key = "animating-buttons:collections:v1";
const empty: Collections = { groups: ["Favorites"], entries: [] };
let cachedRaw: string | null = null;
let cached = empty;
function snapshot(): Collections {
  try {
    const raw = localStorage.getItem(key);
    if (raw === cachedRaw) return cached;
    cachedRaw = raw;
    cached = raw ? parseCollections(raw) : empty;
    return cached;
  } catch {
    return cached;
  }
}
function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener("button-collections", listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener("button-collections", listener);
  };
}
export function useCollections() {
  return useSyncExternalStore(subscribe, snapshot, () => empty);
}
export function parseCollections(raw: string): Collections {
  if (raw.length > 1_000_000)
    throw new Error("Collection backup is too large.");
  const data = JSON.parse(raw);
  if (
    !Array.isArray(data.groups) ||
    !Array.isArray(data.entries) ||
    data.entries.length > 2000
  )
    throw new Error("Choose an Animating Buttons collection backup.");
  const groups: string[] = [
    ...new Set<string>([
      "Favorites",
      ...data.groups.filter(
        (value: unknown) =>
          typeof value === "string" &&
          value.trim().length > 0 &&
          value.length <= 40,
      ),
    ]),
  ].slice(0, 50);
  const entries: SavedEntry[] = data.entries
    .filter(
      (entry: SavedEntry) =>
        entry &&
        typeof entry.id === "string" &&
        /^[\w-]{1,128}$/.test(entry.id) &&
        typeof entry.title === "string" &&
        typeof entry.creator === "string" &&
        Array.isArray(entry.groups),
    )
    .map((entry: SavedEntry) => ({
      id: entry.id,
      title: entry.title.slice(0, 120),
      creator: entry.creator.slice(0, 80),
      groups: entry.groups.filter((group) => groups.includes(group)),
      savedAt: Number(entry.savedAt) || Date.now(),
    }));
  return {
    groups,
    entries: [
      ...new Map(
        entries
          .filter((entry) => entry.groups.length)
          .map((entry) => [entry.id, entry]),
      ).values(),
    ],
  };
}
function write(value: Collections) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event("button-collections"));
}
export function toggleSaved(
  entry: Omit<SavedEntry, "groups" | "savedAt">,
  group = "Favorites",
) {
  const data = snapshot();
  const previous = data.entries.find((item) => item.id === entry.id);
  const groups = previous?.groups.includes(group)
    ? previous.groups.filter((name) => name !== group)
    : [...(previous?.groups || []), group];
  write({
    groups: data.groups.includes(group) ? data.groups : [...data.groups, group],
    entries: [
      ...data.entries.filter((item) => item.id !== entry.id),
      ...(groups.length
        ? [{ ...entry, groups, savedAt: previous?.savedAt || Date.now() }]
        : []),
    ],
  });
}
export function addCollection(name: string) {
  const clean = name.trim();
  const data = snapshot();
  if (!clean || clean.length > 40)
    throw new Error("Use a collection name of 1 to 40 characters.");
  if (data.groups.includes(clean))
    throw new Error("That collection already exists.");
  if (data.groups.length >= 50)
    throw new Error("You can create up to 50 collections.");
  write({ ...data, groups: [...data.groups, clean] });
}
export function deleteCollection(name: string) {
  const data = snapshot();
  if (name === "Favorites") throw new Error("Favorites cannot be deleted.");
  write({
    groups: data.groups.filter((group) => group !== name),
    entries: data.entries
      .map((entry) => ({
        ...entry,
        groups: entry.groups.filter((group) => group !== name),
      }))
      .filter((entry) => entry.groups.length),
  });
}
export function removeSaved(id: string) {
  const data = snapshot();
  write({ ...data, entries: data.entries.filter((entry) => entry.id !== id) });
}
export function importCollections(raw: string) {
  const incoming = parseCollections(raw);
  const data = snapshot();
  const merged = new Map(data.entries.map((entry) => [entry.id, entry]));
  for (const entry of incoming.entries) {
    const previous = merged.get(entry.id);
    merged.set(entry.id, {
      ...entry,
      groups: [...new Set([...(previous?.groups || []), ...entry.groups])],
    });
  }
  write(
    parseCollections(
      JSON.stringify({
        groups: [...data.groups, ...incoming.groups],
        entries: [...merged.values()],
      }),
    ),
  );
}
