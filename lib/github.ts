import { SITE_REPO } from "@/lib/site";

export async function fetchStarCount() {
  try {
    const res = await fetch(`https://api.github.com/repos/${SITE_REPO.replace("https://github.com/", "")}`, {
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    return (data.stargazers_count as number) ?? null;
  } catch {
    return null;
  }
}
