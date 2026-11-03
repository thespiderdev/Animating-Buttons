const pages = new Set([
  "/",
  "/about",
  "/add",
  "/buttons",
  "/collections",
  "/faq",
  "/leaderboard",
  "/privacy",
  "/sponsors",
  "/terms",
]);

export function isTrackedPage(path: unknown): path is string {
  return (
    typeof path === "string" &&
    (pages.has(path) || /^\/(?:show|user)\/[\w-]{1,128}$/.test(path))
  );
}
