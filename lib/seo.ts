import type { Metadata } from "next";
import {
  SITE_ALT_NAMES,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_REPO,
  SITE_URL,
  SITE_X,
} from "./site";
import type { ButtonItem } from "./community";
import { buttonTitle } from "./button-code";

export const SITE_KEYWORDS = [
  "animating buttons",
  "animated buttons",
  "CSS buttons",
  "HTML buttons",
  "Tailwind CSS buttons",
  "JavaScript buttons",
  "button animations",
  "community button collection",
  "copy paste buttons",
  "microinteractions",
];
export const socialImage = {
  url: `${SITE_URL}/brand/social-card.png?v=4`,
  width: 1200,
  height: 630,
  alt: "Animating Buttons: animated HTML, CSS, Tailwind and JavaScript buttons",
  type: "image/png",
};
export function pageMetadata({
  title,
  description,
  path,
  index = true,
}: {
  title: string;
  description: string;
  path: string;
  index?: boolean;
}): Metadata {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const url = `${SITE_URL}${path}`;
  return {
    title: { absolute: fullTitle },
    description,
    alternates: { canonical: url },
    robots: {
      index,
      follow: true,
      googleBot: {
        index,
        follow: true,
        "max-snippet": -1,
        "max-image-preview": "large",
        "max-video-preview": -1,
      },
    },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      locale: "en_US",
      type: "website",
      images: [socialImage],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [socialImage.url],
    },
  };
}
export const jsonLd = (value: unknown) =>
  JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
export function siteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        alternateName: SITE_ALT_NAMES,
        url: SITE_URL,
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/brand/icon-512.png?v=4`,
          width: 512,
          height: 512,
        },
        sameAs: [SITE_REPO, SITE_X],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: SITE_NAME,
        alternateName: SITE_ALT_NAMES,
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        publisher: { "@id": `${SITE_URL}/#organization` },
        inLanguage: "en",
      },
    ],
  };
}
export function webPageSchema(
  path: string,
  name: string,
  description: string,
  type = "WebPage",
) {
  return {
    "@context": "https://schema.org",
    "@type": type,
    "@id": `${SITE_URL}${path}#webpage`,
    url: `${SITE_URL}${path}`,
    name,
    description,
    inLanguage: "en",
    isPartOf: { "@id": `${SITE_URL}/#website` },
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}
export function breadcrumbSchema(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}
export function itemListSchema(
  items: Array<{ name: string; path: string }>,
  start = 0,
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: start + index + 1,
      name: item.name,
      url: `${SITE_URL}${item.path}`,
    })),
  };
}
export function buttonSchema(button: ButtonItem) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    "@id": `${SITE_URL}/show/${button.id}#code`,
    name: buttonTitle(button),
    url: `${SITE_URL}/show/${button.id}`,
    description: buttonDescription(button),
    codeSampleType: "snippet",
    programmingLanguage: button.reactSource
      ? [
          Object.keys(button.reactSource.files).some((name) =>
            name.endsWith(".jsx"),
          ) &&
          !Object.keys(button.reactSource.files).some((name) =>
            name.endsWith(".tsx"),
          )
            ? "JavaScript"
            : "TypeScript",
          "CSS",
        ]
      : ["HTML", "CSS", ...(button.js.trim() ? ["JavaScript"] : [])],
    ...(button.styling === "tailwind"
      ? { runtimePlatform: "Tailwind CSS v4" }
      : {}),
    author: {
      "@type": "Person",
      name: button.source?.authorName || button.githubUsername,
      ...(button.source
        ? !button.source.authorUrl.includes("uiverse.io")
          ? { url: button.source.authorUrl, sameAs: button.source.authorUrl }
          : {}
        : {
            url: `${SITE_URL}/user/${encodeURIComponent(button.githubUsername)}`,
            sameAs: `https://github.com/${encodeURIComponent(button.githubUsername)}`,
          }),
    },
    isPartOf: { "@id": `${SITE_URL}/#website` },
    ...(button.source
      ? {
          ...(button.source.provider !== "uiverse"
            ? { codeRepository: button.source.componentUrl }
            : {}),
          creditText: button.source.authorName,
          license:
            button.source.license === "MIT"
              ? "https://opensource.org/license/mit"
              : button.source.componentUrl,
        }
      : {}),
    ...(button.remixOf
      ? { isBasedOn: `${SITE_URL}/show/${button.remixOf.id}` }
      : {}),
  };
}
export function buttonDescription(button: ButtonItem) {
  const title = buttonTitle(button);
  const author = button.source?.authorName || button.githubUsername;
  const styles = button.styling === "tailwind" ? "Tailwind CSS" : "CSS";
  return button.reactSource
    ? `Preview ${title}, an animated ${button.reactSource.framework === "nextjs" ? "Next.js" : "React"} button by ${author}. Copy its component source or download the example with ${styles} and dependencies.`
    : `Preview ${title} by ${author}. Customize its HTML, ${styles} and JavaScript, then copy or download the button.`;
}
export function cataloguePage(value: unknown) {
  const text = typeof value === "string" ? value : "1";
  return /^[1-9]\d{0,4}$/.test(text) ? Number(text) : 1;
}
