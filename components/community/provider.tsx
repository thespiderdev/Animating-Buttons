"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  getAdditionalUserInfo,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { MotionConfig } from "motion/react";
import { Toaster, toast } from "sonner";
import { auth, db, githubProvider, adminUsers } from "@/lib/firebase";

type Session = {
  user: User | null;
  username: string;
  loading: boolean;
  isAdmin: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
};
const Context = createContext<Session | null>(null);

export function CommunityProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(
    () =>
      onAuthStateChanged(auth, (nextUser) => {
        setUser(nextUser);
        setUsername(nextUser ? localStorage.getItem("username") || "" : "");
        setLoading(false);
        if (nextUser && !localStorage.getItem("username")) {
          const githubId = nextUser.providerData.find(
            (provider) => provider.providerId === "github.com",
          )?.uid;
          if (githubId)
            fetch(`https://api.github.com/user/${encodeURIComponent(githubId)}`)
              .then((res) => (res.ok ? res.json() : null))
              .then((profile) => {
                if (profile?.login) {
                  setUsername(profile.login);
                  localStorage.setItem("username", profile.login);
                }
              })
              .catch(() => {});
        }
      }),
    [],
  );

  async function login() {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, githubProvider);
      const info = getAdditionalUserInfo(result);
      const name = info?.username || "";
      const profile = info?.profile as {
        bio?: string;
        avatar_url?: string;
      } | null;
      if (!name)
        throw new Error("GitHub did not return a username. Please try again.");
      localStorage.setItem("username", name);
      setUsername(name);
      setUser(result.user);
      try {
        const existing = await getDocs(
          query(collection(db, "users"), where("githubUsername", "==", name)),
        );
        const ref = existing.empty
          ? doc(collection(db, "users"))
          : existing.docs[0].ref;
        await setDoc(
          ref,
          {
            githubUsername: name,
            profilePictureUrl:
              result.user.photoURL || profile?.avatar_url || "",
            name: result.user.displayName || name,
            ...(!existing.empty ? {} : { bio: profile?.bio || "" }),
          },
          { merge: true },
        );
      } catch {
        toast.error("Signed in. Your profile could not be synced yet.");
      }
      toast.success(`Signed in as @${name}`);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not sign in. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      await signOut(auth);
      localStorage.removeItem("username");
      setUsername("");
      toast.success("Signed out");
    } catch {
      toast.error("Could not sign out. Please try again.");
    }
  }

  return (
    <Context.Provider
      value={{
        user,
        username,
        loading,
        isAdmin: !!user && adminUsers.includes(username.toLowerCase()),
        login,
        logout,
      }}
    >
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
      <Toaster richColors position="bottom-right" closeButton />
    </Context.Provider>
  );
}

export function useCommunity() {
  const value = useContext(Context);
  if (!value) throw new Error("CommunityProvider is required");
  return value;
}
