"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { isTrackedPage } from "@/lib/page-view-path";

export default function PageViewTracker() {
  const path = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (lastPath.current === path) return;
    if (!isTrackedPage(path)) {
      lastPath.current = null;
      return;
    }

    function record() {
      if (document.visibilityState !== "visible" || lastPath.current === path)
        return;
      lastPath.current = path;
      void fetch("/api/page-view", {
        method: "POST",
        headers: { "X-Page-Path": path },
        credentials: "omit",
        keepalive: true,
      }).catch(() => {});
    }

    record();
    document.addEventListener("visibilitychange", record);
    return () => document.removeEventListener("visibilitychange", record);
  }, [path]);

  return null;
}
