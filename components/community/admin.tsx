"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, query, where } from "firebase/firestore";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { getCommunityButtons, type ButtonItem } from "@/lib/community";
import { useCommunity } from "./provider";
import ButtonCard from "./button-card";

export default function AdminPanel() {
  const { user, isAdmin, loading: sessionLoading, login } = useCommunity();
  const [buttons, setButtons] = useState<ButtonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string>();
  const [status, setStatus] = useState("pending");
  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    getDocs(query(collection(db, "buttons"), where("status", "==", status)))
      .then((items) => {
        if (active) {
          setButtons(
            items.docs.map(
              (item) => ({ ...item.data(), id: item.id }) as ButtonItem,
            ),
          );
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setError(
            "Could not load submissions. Your account may not have access.",
          );
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [isAdmin, status]);
  async function review(id: string, nextStatus: string) {
    setBusy(id);
    try {
      const response = await fetch(`/api/buttons/${id}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await user!.getIdToken()}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setButtons((items) => items.filter((item) => item.id !== id));
      void getCommunityButtons(true).catch(() => {});
      toast.success(
        nextStatus === "approved" ? "Button approved" : "Button rejected",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not update this submission.",
      );
    } finally {
      setBusy(undefined);
    }
  }
  if (sessionLoading)
    return (
      <div className="h-80 animate-pulse rounded-3xl bg-muted motion-reduce:animate-none" />
    );
  if (!user)
    return (
      <div className="empty-state">
        <h1>Review submissions</h1>
        <p>Sign in with an administrator account to continue.</p>
        <button onClick={login} className="action-primary">
          Sign in with GitHub
        </button>
      </div>
    );
  if (!isAdmin)
    return (
      <div className="empty-state">
        <h1>Administrator access required</h1>
        <p>This account does not have permission to review submissions.</p>
        <Link href="/buttons" className="action-secondary">
          Back to buttons
        </Link>
      </div>
    );
  return (
    <>
      <header className="mb-10">
        <p className="eyebrow">Community moderation</p>
        <h1 className="mt-3 font-runde text-4xl font-bold tracking-tight">
          Review submissions.
        </h1>
        <p className="mt-4 text-muted-foreground">
          Preview each contribution before it joins the public collection.
        </p>
      </header>
      <div className="mb-8 flex flex-wrap gap-2">
        {["pending", "approved", "rejected"].map((value) => (
          <button
            key={value}
            onClick={() => {
              setLoading(true);
              setError("");
              setStatus(value);
            }}
            aria-pressed={status === value}
            className={status === value ? "action-primary" : "action-secondary"}
          >
            {value[0].toUpperCase() + value.slice(1)}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="h-96 animate-pulse rounded-3xl bg-muted motion-reduce:animate-none" />
      ) : error ? (
        <div className="empty-state" role="alert">
          <p>{error}</p>
        </div>
      ) : buttons.length ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {buttons.map((button) => (
            <div key={button.id}>
              <ButtonCard button={button} />
              <div className="mt-3 flex flex-wrap gap-2">
                {button.reactSource?.framework && (
                  <Link
                    className="action-secondary flex-1"
                    href={`/add?format=component&edit=${encodeURIComponent(button.id)}`}
                  >
                    Review source
                  </Link>
                )}
                {status !== "approved" && (
                  <button
                    className="action-primary flex-1"
                    disabled={busy === button.id}
                    onClick={() => review(button.id, "approved")}
                  >
                    {busy === button.id ? "Saving…" : "Approve"}
                  </button>
                )}
                {status !== "rejected" && (
                  <button
                    className="action-secondary flex-1"
                    disabled={busy === button.id}
                    onClick={() => review(button.id, "rejected")}
                  >
                    Reject
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>
            {status === "pending"
              ? "All caught up."
              : "No submissions here yet."}
          </h2>
          <p>
            {status === "pending"
              ? "New contributions will appear here for review."
              : `There are no ${status} buttons.`}
          </p>
        </div>
      )}
    </>
  );
}
