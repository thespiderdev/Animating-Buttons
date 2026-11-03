"use client";

import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { type ButtonItem, type CommunityUser } from "@/lib/community";
import { useCommunity } from "./provider";
import ButtonCard from "./button-card";

export default function UserProfile({
  username,
  initialButtons = [],
  initialProfile,
  serverLoaded = false,
}: {
  username: string;
  initialButtons?: ButtonItem[];
  initialProfile?: CommunityUser;
  serverLoaded?: boolean;
}) {
  const session = useCommunity();
  const [profile, setProfile] = useState<CommunityUser | undefined>(
    initialProfile,
  );
  const [buttons, setButtons] = useState<ButtonItem[]>(initialButtons);
  const [bio, setBio] = useState(initialProfile?.bio || "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!serverLoaded);
  const [error, setError] = useState("");
  const ownProfile =
    !!session.user && session.username.toLowerCase() === username.toLowerCase();
  useEffect(() => {
    if (serverLoaded && !ownProfile) return;
    let active = true;
    const filters = [where("githubUsername", "==", username)];
    if (!ownProfile) filters.push(where("status", "==", "approved"));
    Promise.all([
      getDocs(
        query(collection(db, "users"), where("githubUsername", "==", username)),
      ),
      getDocs(query(collection(db, "buttons"), ...filters)),
    ])
      .then(([users, items]) => {
        if (!active) return;
        const user = users.docs[0];
        if (user) {
          setProfile({ ...user.data(), id: user.id } as CommunityUser);
          setBio(user.data().bio || "");
        }
        setButtons(
          items.docs.map(
            (item) => ({ ...item.data(), id: item.id }) as ButtonItem,
          ),
        );
        setLoading(false);
      })
      .catch(() => {
        if (active) {
          setError("Could not load this profile. Please try again later.");
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [username, ownProfile, serverLoaded]);

  async function saveBio() {
    if (!profile || !ownProfile) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", profile.id), { bio: bio.trim() });
      setProfile({ ...profile, bio: bio.trim() });
      setEditing(false);
      toast.success("Bio updated");
    } catch {
      toast.error("Could not update your bio.");
    } finally {
      setSaving(false);
    }
  }
  if (loading)
    return (
      <div
        className="h-96 animate-pulse rounded-3xl bg-muted motion-reduce:animate-none"
        aria-label="Loading profile"
      />
    );
  if (error)
    return (
      <div className="empty-state" role="alert">
        <h1>Profile unavailable</h1>
        <p>{error}</p>
      </div>
    );
  return (
    <>
      <header className="mb-12 flex flex-col items-start gap-6 sm:flex-row">
        <img
          src={
            profile?.profilePictureUrl ||
            `https://github.com/${encodeURIComponent(username)}.png?size=160`
          }
          alt={`${username}'s profile`}
          width={88}
          height={88}
          className="size-22 rounded-3xl"
        />
        <div className="flex-1">
          <span className="eyebrow">Community creator</span>
          <h1 className="mt-3 font-runde text-3xl font-bold tracking-tight sm:text-4xl">
            {profile?.name || username}
          </h1>
          <a
            href={`https://github.com/${encodeURIComponent(username)}`}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-action-accent"
          >
            @{username} <ChevronRight size={16} aria-hidden="true" />
          </a>
          {editing ? (
            <div className="mt-4 max-w-xl">
              <label htmlFor="profile-bio" className="sr-only">
                Your bio
              </label>
              <textarea
                id="profile-bio"
                className="field min-h-24"
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                maxLength={300}
              />
              <div className="mt-3 flex gap-2">
                <button
                  onClick={saveBio}
                  disabled={saving}
                  className="action-primary"
                >
                  {saving ? "Saving…" : "Save bio"}
                </button>
                <button
                  className="action-secondary"
                  onClick={() => {
                    setEditing(false);
                    setBio(profile?.bio || "");
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="mt-4 max-w-xl text-muted-foreground">
                {profile?.bio ||
                  "Making the web a little more interactive, one button at a time."}
              </p>
              {ownProfile && profile && (
                <button
                  className="mt-3 text-sm text-action-accent"
                  onClick={() => setEditing(true)}
                >
                  Edit your bio
                </button>
              )}
            </>
          )}
        </div>
      </header>
      <h2 className="mb-6 font-runde text-xl font-semibold">
        {ownProfile ? "Your buttons" : "The collection"}{" "}
        <span className="text-muted-foreground">[{buttons.length}]</span>
      </h2>
      {buttons.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {buttons.map((button) => (
            <div key={button.id}>
              {ownProfile && button.status !== "approved" && (
                <p className="mb-2 pl-3 text-xs text-muted-foreground">
                  {button.status === "pending"
                    ? "Awaiting review"
                    : "Not published"}
                </p>
              )}
              <ButtonCard button={button} />
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>No buttons yet</h2>
          <p>
            {ownProfile
              ? "Your submitted buttons will appear here."
              : "This creator has not published any buttons yet."}
          </p>
        </div>
      )}
    </>
  );
}
