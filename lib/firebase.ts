import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, GithubAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const app = getApps().length
  ? getApp()
  : initializeApp({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    });

export const auth = getAuth(app);
export const db = getFirestore(app);
export const githubProvider = new GithubAuthProvider();
export const adminUsers = (process.env.NEXT_PUBLIC_ADMIN_USERS ?? "")
  .split(",")
  .map((name) => name.trim().toLowerCase())
  .filter(Boolean);
