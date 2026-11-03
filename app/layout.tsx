import PageViewTracker from "@/components/community/page-view-tracker";
import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { ThemeProvider } from "@/components/theme-provider";
import { CommunityProvider } from "@/components/community/provider";
import CommunityPrompt from "@/components/community/community-prompt";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
} from "@/lib/site";
import { SITE_KEYWORDS, siteJsonLd, jsonLd } from "@/lib/seo";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const openRunde = localFont({
  variable: "--font-open-runde",
  src: [
    {
      path: "../public/fonts/OpenRunde-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/OpenRunde-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/OpenRunde-Semibold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/OpenRunde-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TAGLINE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  applicationName: SITE_NAME,
  authors: [{ name: "Om Gawande", url: "https://github.com/thespiderdev" }],
  creator: "Om Gawande",
  publisher: SITE_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      { url: "/brand/logo.svg?v=4", type: "image/svg+xml" },
      { url: "/brand/icon-32.png?v=4", type: "image/png", sizes: "32x32" },
    ],
    apple: [
      {
        url: "/brand/apple-touch-icon.png?v=4",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  manifest: "/manifest.json",
  openGraph: {
    title: SITE_TAGLINE,
    description: SITE_DESCRIPTION,
    url: "/",
    siteName: SITE_NAME,
    locale: "en_US",
    images: [
      {
        url: "/brand/social-card.png?v=4",
        width: 1200,
        height: 630,
        alt: "Animating Buttons community collection",
        type: "image/png",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TAGLINE,
    description: SITE_DESCRIPTION,
    images: ["/brand/social-card.png?v=4"],
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${geistMono.variable} ${openRunde.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(siteJsonLd()) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <CommunityProvider>
            <a href="#main-content" className="skip-link">
              Skip to content
            </a>
            <div className="flex flex-1 flex-col">{children}</div>
            <CommunityPrompt />
            <PageViewTracker />
          </CommunityProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
