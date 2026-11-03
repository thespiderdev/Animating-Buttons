import "server-only";
import { cache } from "react";
import { buttonTitle } from "./button-code";
import type { ButtonItem, CommunityUser } from "./community";
import {
  importedButtons,
  getImportedButton,
  getImportedSummary,
} from "./imported-buttons.server";

export const CATALOGUE_PAGE_SIZE = 12;
export type PublicButtonSummary = {
  id: string;
  title: string;
  githubUsername: string;
  likeCounter: number;
  createdAt?: string;
  updatedAt?: string;
  addedAt?: string;
  source?: ButtonItem["source"];
};
export type PublicCreator = { username: string; count: number; likes: number };
type Field = {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  timestampValue?: string;
  arrayValue?: { values?: Field[] };
  mapValue?: { fields?: Record<string, Field> };
};
type FirestoreDocument = { name: string; fields?: Record<string, Field> };
function decode(field: Field): unknown {
  if (field.stringValue !== undefined) return field.stringValue;
  if (field.integerValue !== undefined) return Number(field.integerValue);
  if (field.doubleValue !== undefined) return field.doubleValue;
  if (field.booleanValue !== undefined) return field.booleanValue;
  if (field.timestampValue !== undefined) return field.timestampValue;
  if (field.arrayValue) return (field.arrayValue.values || []).map(decode);
  if (field.mapValue)
    return Object.fromEntries(
      Object.entries(field.mapValue.fields || {}).map(([key, value]) => [
        key,
        decode(value),
      ]),
    );
  return null;
}
function fields(document: FirestoreDocument): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(document.fields || {}).map(([key, value]) => [
      key,
      decode(value),
    ]),
  );
}
function root() {
  const project =
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.REACT_APP_projectId;
  if (!project) throw new Error("Firebase project configuration is missing.");
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(project)}/databases/(default)/documents`;
}
const approved = {
  fieldFilter: {
    field: { fieldPath: "status" },
    op: "EQUAL",
    value: { stringValue: "approved" },
  },
};
async function runQuery(
  query: Record<string, unknown>,
): Promise<FirestoreDocument[]> {
  const response = await fetch(`${root()}:runQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ structuredQuery: query }),
    next: { revalidate: 300, tags: ["public-buttons"] },
  });
  if (!response.ok)
    throw new Error("The public collection is temporarily unavailable.");
  const rows = (await response.json()) as Array<{
    document?: FirestoreDocument;
  }>;
  return rows.flatMap((row) => (row.document ? [row.document] : []));
}
function date(value: unknown): string | undefined {
  return typeof value === "string" && Number.isFinite(Date.parse(value))
    ? value
    : undefined;
}
const string = (value: unknown) => (typeof value === "string" ? value : "");
export const getPublicCatalogue = cache(
  async (): Promise<PublicButtonSummary[]> => {
    const documents = await runQuery({
      from: [{ collectionId: "buttons" }],
      where: approved,
      orderBy: [
        { field: { fieldPath: "likeCounter" }, direction: "DESCENDING" },
        { field: { fieldPath: "__name__" }, direction: "DESCENDING" },
      ],
      select: {
        fields: [
          "status",
          "html",
          "title",
          "githubUsername",
          "likeCounter",
          "createdAt",
          "updatedAt",
        ].map((fieldPath) => ({ fieldPath })),
      },
    });
    const community: PublicButtonSummary[] = documents.flatMap((document) => {
      const data = fields(document);
      if (data.status !== "approved") return [];
      return [
        {
          id: document.name.split("/").pop()!,
          title: buttonTitle(data as ButtonItem)
            .replace(/\s+/g, " ")
            .slice(0, 120),
          githubUsername: string(data.githubUsername),
          likeCounter: Math.max(0, Number(data.likeCounter) || 0),
          createdAt: date(data.createdAt),
          updatedAt: date(data.updatedAt),
        },
      ];
    });
    const combined: PublicButtonSummary[] = [
      ...community,
      ...importedButtons.map((button) => ({
        id: button.id,
        title: button.title || "Imported button",
        githubUsername: button.githubUsername,
        likeCounter: 0,
        source: button.source,
        addedAt: button.addedAt
          ? new Date(button.addedAt.seconds * 1000).toISOString()
          : undefined,
      })),
    ];
    return combined.sort(
      (a, b) =>
        (Date.parse(b.addedAt || b.createdAt || "") || 0) -
          (Date.parse(a.addedAt || a.createdAt || "") || 0) ||
        a.id.localeCompare(b.id),
    );
  },
);
export const getPublicButton = cache(
  async (
    id: string,
  ): Promise<
    | { state: "public"; button: ButtonItem }
    | { state: "missing" | "restricted" }
  > => {
    if (!/^[\w-]{1,128}$/.test(id)) return { state: "missing" };
    const imported = await getImportedButton(id);
    if (imported) return { state: "public", button: imported };
    const response = await fetch(
      `${root()}/buttons/${encodeURIComponent(id)}`,
      { next: { revalidate: 300, tags: ["public-buttons"] } },
    );
    if (response.status === 404) return { state: "missing" };
    if (response.status === 401 || response.status === 403)
      return { state: "restricted" };
    if (!response.ok)
      throw new Error("This button is temporarily unavailable.");
    const data = fields(await response.json());
    // Public server rendering must never serialize drafts or moderation-only records.
    if (data.status !== "approved") return { state: "restricted" };
    const created = date(data.createdAt);
    const remix = data.remixOf as Record<string, unknown> | null;
    const button: ButtonItem = {
      id,
      html: string(data.html),
      css: string(data.css),
      js: string(data.js),
      githubUsername: string(data.githubUsername),
      title: buttonTitle(data as ButtonItem)
        .replace(/\s+/g, " ")
        .slice(0, 120),
      displayName: string(data.displayName),
      likeCounter: Math.max(0, Number(data.likeCounter) || 0),
      likedUsers: Array.isArray(data.likedUsers)
        ? data.likedUsers.filter(
            (value): value is string => typeof value === "string",
          )
        : [],
      status: "approved",
      styling: data.styling === "tailwind" ? "tailwind" : "css",
      compiledCss: string(data.compiledCss),
      categories: Array.isArray(data.categories)
        ? data.categories.filter(
            (value): value is string => typeof value === "string",
          )
        : [],
      ...(typeof data.ownerUid === "string" ? { ownerUid: data.ownerUid } : {}),
      ...(created
        ? { createdAt: { seconds: Math.floor(Date.parse(created) / 1000) } }
        : {}),
      ...(remix &&
      typeof remix.id === "string" &&
      typeof remix.githubUsername === "string"
        ? {
            remixOf: {
              id: remix.id,
              githubUsername: remix.githubUsername,
              title: string(remix.title),
            },
          }
        : {}),
    };
    return { state: "public", button };
  },
);
export async function getPublicSlice(start = 0) {
  const catalogue = await getPublicCatalogue();
  const summaries = catalogue.slice(start, start + CATALOGUE_PAGE_SIZE);
  const results = await Promise.all(
    summaries.map((item) => {
      const summary = getImportedSummary(item.id);
      return summary
        ? { state: "public" as const, button: summary }
        : getPublicButton(item.id);
    }),
  );
  const buttons = results.flatMap((item) =>
    item.state === "public" ? [item.button] : [],
  );
  const last = summaries.at(-1);
  return {
    buttons,
    total: catalogue.length,
    page: Math.floor(start / CATALOGUE_PAGE_SIZE) + 1,
    pageCount: Math.max(1, Math.ceil(catalogue.length / CATALOGUE_PAGE_SIZE)),
    hasMore: start + CATALOGUE_PAGE_SIZE < catalogue.length,
    cursor: last ? { id: last.id, likes: last.likeCounter } : undefined,
  };
}
export async function getPublicPage(page = 1) {
  return getPublicSlice((page - 1) * CATALOGUE_PAGE_SIZE);
}
export function rankCreators(buttons: PublicButtonSummary[]): PublicCreator[] {
  const creators = new Map<string, PublicCreator>();
  for (const button of buttons) {
    if (!button.githubUsername || button.source) continue;
    const key = button.githubUsername.toLowerCase();
    const current = creators.get(key) || {
      username: button.githubUsername,
      count: 0,
      likes: 0,
    };
    current.count++;
    current.likes += button.likeCounter;
    creators.set(key, current);
  }
  return [...creators.values()].sort(
    (a, b) =>
      b.likes - a.likes ||
      b.count - a.count ||
      a.username.localeCompare(b.username),
  );
}
export const getPublicCreator = cache(async (username: string) => {
  const catalogue = await getPublicCatalogue();
  const contributions = catalogue.filter(
    (item) =>
      !item.source &&
      item.githubUsername.toLowerCase() === username.toLowerCase(),
  );
  const actualUsername = contributions[0]?.githubUsername || username;
  const results = await Promise.all(
    contributions.map((item) => getPublicButton(item.id)),
  );
  const buttons = results.flatMap((item) =>
    item.state === "public" ? [item.button] : [],
  );
  let profile: CommunityUser | undefined;
  if (contributions.length) {
    const documents = await runQuery({
      from: [{ collectionId: "users" }],
      where: {
        fieldFilter: {
          field: { fieldPath: "githubUsername" },
          op: "EQUAL",
          value: { stringValue: actualUsername },
        },
      },
      limit: 1,
      select: {
        fields: ["githubUsername", "name", "bio", "profilePictureUrl"].map(
          (fieldPath) => ({ fieldPath }),
        ),
      },
    });
    if (documents[0]) {
      const data = fields(documents[0]);
      profile = {
        id: documents[0].name.split("/").pop()!,
        githubUsername: actualUsername,
        name: string(data.name),
        bio: string(data.bio),
        profilePictureUrl: string(data.profilePictureUrl),
      };
    }
  }
  return { username: actualUsername, buttons, profile };
});
