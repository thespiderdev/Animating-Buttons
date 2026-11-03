"use client";

import Link from "next/link";
import { useState } from "react";
import { useCommunity } from "./provider";

export default function AccountButton() {
  const { user, username, loading, isAdmin, login, logout } = useCommunity();
  const [open, setOpen] = useState(false);
  if (!user)
    return (
      <button
        onClick={login}
        disabled={loading}
        className="h-12 cursor-pointer whitespace-nowrap rounded-full border border-white/10 bg-neutral-900 px-4 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
      >
        {loading ? "Connecting…" : "Sign in"}
      </button>
    );
  return (
    <div
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        aria-expanded={open}
        aria-label="Account menu"
        onClick={() => setOpen(!open)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
        className="flex h-12 items-center gap-2 rounded-full border border-white/10 bg-neutral-900 px-3 text-sm text-white"
      >
        {user.photoURL && (
          <img src={user.photoURL} alt="" className="size-7 rounded-full" />
        )}
        <span className="max-w-28 truncate">{username || "Account"}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-14 z-50 min-w-44 rounded-2xl border border-white/10 bg-neutral-900 p-2 text-sm text-white shadow-xl">
          <Link
            href={`/user/${username}`}
            onClick={() => setOpen(false)}
            className="block rounded-xl px-3 py-2 hover:bg-white/10"
          >
            Your profile
          </Link>
          <Link
            href="/add"
            onClick={() => setOpen(false)}
            className="block rounded-xl px-3 py-2 hover:bg-white/10"
          >
            Submit a button
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3 py-2 hover:bg-white/10"
            >
              Review submissions
            </Link>
          )}
          <button
            onClick={() => {
              setOpen(false);
              void logout();
            }}
            className="w-full rounded-xl px-3 py-2 text-left hover:bg-white/10"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
