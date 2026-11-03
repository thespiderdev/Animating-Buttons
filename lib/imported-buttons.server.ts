import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cache } from "react";
import index from "@/public/imported-buttons/index.json";
import type { ButtonItem } from "./community";

export const importedButtons = index as ButtonItem[];
const summaries = new Map(importedButtons.map((button) => [button.id, button]));
export const getImportedSummary = (id: string) => summaries.get(id);
export const getImportedButton = cache(
  async (id: string): Promise<ButtonItem | undefined> => {
    if (!summaries.has(id)) return undefined;
    const assetPath = `/imported-buttons/${encodeURIComponent(id)}.json`;
    const context = await getCloudflareContext({ async: true }).catch(
      () => null,
    );
    const assets = (
      context?.env as
        | { ASSETS?: { fetch(url: string): Promise<Response> } }
        | undefined
    )?.ASSETS;
    let button: ButtonItem;
    if (assets) {
      const response = await assets.fetch(`https://assets.invalid${assetPath}`);
      if (!response.ok) return undefined;
      button = await response.json();
    } else {
      button = JSON.parse(
        await readFile(
          path.join(process.cwd(), "public/imported-buttons", `${id}.json`),
          "utf8",
        ),
      );
    }
    return button.id === id && button.source && button.status === "approved"
      ? button
      : undefined;
  },
);
