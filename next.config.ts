import type { NextConfig } from "next";

const PUBLIC_CACHE = [
  {
    key: "Cache-Control",
    value: "public, max-age=345600, stale-while-revalidate=604800",
  },
];

const nextConfig: NextConfig = {
  turbopack: {
    // The Firestore Node entry uses gRPC and runtime code generation.
    resolveAlias: {
      "@firebase/firestore":
        "./node_modules/@firebase/firestore/dist/index.esm2017.js",
    },
  },
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY:
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? process.env.REACT_APP_apiKey,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ??
      process.env.REACT_APP_authDomain,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
      process.env.REACT_APP_projectId,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ??
      process.env.REACT_APP_storageBucket,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ??
      process.env.REACT_APP_messagingSenderId,
    NEXT_PUBLIC_FIREBASE_APP_ID:
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? process.env.REACT_APP_appId,
    NEXT_PUBLIC_ADMIN_USERS:
      process.env.NEXT_PUBLIC_ADMIN_USERS ?? process.env.REACT_APP_admin_id,
  },
  async redirects() {
    return [{ source: "/explore", destination: "/buttons", permanent: true }];
  },
  async headers() {
    return [
      {
        source: "/sponsors/checkout",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/api/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/brand/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
      {
        source: "/fonts/:path*",
        headers: PUBLIC_CACHE,
      },
    ];
  },
};

export default nextConfig;
