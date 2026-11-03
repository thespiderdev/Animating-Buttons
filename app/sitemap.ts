import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import {
  getPublicCatalogue,
  CATALOGUE_PAGE_SIZE,
} from "@/lib/public-community";
export const revalidate = 300;
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const buttons = await getPublicCatalogue();
  const staticPages = [
    "",
    "/buttons",
    "/about",
    "/leaderboard",
    "/add",
    "/faq",
    "/sponsors",
    "/privacy",
    "/terms",
  ].map((route) => ({ url: `${SITE_URL}${route}` }));
  const cataloguePages = Array.from(
    {
      length: Math.max(0, Math.ceil(buttons.length / CATALOGUE_PAGE_SIZE) - 1),
    },
    (_, index) => ({ url: `${SITE_URL}/buttons?page=${index + 2}` }),
  );
  const buttonPages = buttons.map((button) => ({
    url: `${SITE_URL}/show/${button.id}`,
    ...(button.updatedAt || button.createdAt
      ? { lastModified: button.updatedAt || button.createdAt }
      : {}),
  }));
  const uniqueCreators = new Map<string, string>();
  for (const button of buttons)
    if (
      !button.source &&
      /^[a-z\d][a-z\d_-]{0,79}$/i.test(button.githubUsername) &&
      !uniqueCreators.has(button.githubUsername.toLowerCase())
    )
      uniqueCreators.set(
        button.githubUsername.toLowerCase(),
        button.githubUsername,
      );
  const creators = [...uniqueCreators.values()].map((username) => ({
    url: `${SITE_URL}/user/${encodeURIComponent(username)}`,
  }));
  return [...staticPages, ...cataloguePages, ...buttonPages, ...creators];
}
