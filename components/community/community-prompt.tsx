"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import BrandMark from "@/components/BrandMark";
import { GithubLogo, XLogo } from "@/components/logos";
import { SITE_REPO, SITE_X } from "@/lib/site";

const DISMISSED_KEY = "animating-buttons:community-prompt:dismissed:v1";
const BROWSING_PATHS = new Set([
  "/",
  "/buttons",
  "/leaderboard",
  "/about",
  "/faq",
]);

export default function CommunityPrompt() {
  const pathname = usePathname();
  const browsing =
    BROWSING_PATHS.has(pathname) || pathname.startsWith("/user/");
  const [ready, setReady] = useState(false);
  const dismissed = useRef(false);
  const reduceMotion = useReducedMotion();

  const dismiss = useCallback(() => {
    dismissed.current = true;
    setReady(false);
    try {
      localStorage.setItem(DISMISSED_KEY, "true");
    } catch {
      // Keep the dismissal for this visit when browser storage is unavailable.
    }
  }, []);

  useEffect(() => {
    if (!browsing || dismissed.current) return;
    try {
      if (localStorage.getItem(DISMISSED_KEY) === "true") {
        dismissed.current = true;
        return;
      }
    } catch {
      // The prompt still works without persistent storage.
    }
    const timer = window.setTimeout(() => {
      if (!dismissed.current) setReady(true);
    }, 20_000);
    return () => window.clearTimeout(timer);
  }, [browsing]);

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key === DISMISSED_KEY && event.newValue === "true") {
        dismissed.current = true;
        setReady(false);
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!ready || !browsing) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !event.defaultPrevented) dismiss();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [ready, browsing, dismiss]);

  return (
    <AnimatePresence>
      {ready && browsing && (
        <motion.aside
          aria-labelledby="community-prompt-title"
          aria-describedby="community-prompt-description"
          initial={{ opacity: 0, y: reduceMotion ? 0 : 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
          transition={{
            duration: reduceMotion ? 0 : 0.7,
            ease: [0.32, 0.72, 0, 1],
          }}
          className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-40 rounded-3xl border border-foreground/10 bg-white p-6 font-runde text-foreground shadow-2xl sm:right-6 sm:bottom-6 sm:left-auto sm:w-96 dark:bg-[#1F1F1F]"
        >
          <div className="flex items-center justify-between">
            <BrandMark size={40} />
            <button
              type="button"
              onClick={dismiss}
              aria-label="Dismiss community prompt"
              className="-mt-2 -mr-2 flex size-11 items-center justify-center rounded-xl text-muted-foreground transition-colors duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-foreground/5 hover:text-foreground active:scale-95"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                className="size-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="m6 6 12 12M6 18 18 6" />
              </svg>
            </button>
          </div>
          <h2
            id="community-prompt-title"
            className="mt-4 text-lg font-semibold text-balance"
          >
            Enjoying Animating Buttons?
          </h2>
          <p
            id="community-prompt-description"
            className="mt-2 text-sm text-pretty text-muted-foreground"
          >
            Star the repo and follow along on X for new buttons and project
            updates.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <a
              href={SITE_X}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow the creator on X (opens in a new tab)"
              className="action-secondary text-base"
            >
              <span aria-hidden="true">
                <XLogo className="size-5" />
              </span>
              Follow
            </a>
            <a
              href={SITE_REPO}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open Animating Buttons on GitHub to star it (opens in a new tab)"
              className="action-primary text-base"
            >
              <span aria-hidden="true">
                <GithubLogo className="size-5" />
              </span>
              Star on GitHub
            </a>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
