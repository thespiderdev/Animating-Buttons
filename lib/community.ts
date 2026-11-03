import { buttonTitle, previewDocument } from "./button-code";
export { buttonTitle, previewDocument } from "./button-code";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "./firebase";

export type ButtonItem = {
  id: string;
  html: string;
  css: string;
  js: string;
  githubUsername: string;
  displayName?: string;
  title?: string;
  likeCounter: number;
  likedUsers?: string[];
  status?: string;
  createdAt?: { seconds: number };
  addedAt?: { seconds: number };
  ownerUid?: string;
  categories?: string[];
  styling?: "css" | "tailwind";
  compiledCss?: string;
  validationVersion?: number;
  remixOf?: { id: string; githubUsername: string; title: string };
  source?: {
    provider: "uiverse" | "21st";
    authorName: string;
    authorUrl: string;
    componentUrl: string;
    license?: string;
    licenseFile?: string;
    version?: string;
  };
  reactSource?: {
    files: Record<string, string>;
    dependencies: Record<string, string>;
  };
};

export type CommunityUser = {
  id: string;
  githubUsername: string;
  bio?: string;
  name?: string;
  profilePictureUrl?: string;
};

let buttonsPromise: Promise<ButtonItem[]> | undefined;

export function getCommunityButtons(refresh = false) {
  if (!buttonsPromise || refresh) {
    buttonsPromise = getDocs(
      query(
        collection(db, "buttons"),
        where("status", "==", "approved"),
        orderBy("likeCounter", "desc"),
      ),
    )
      .then(async (result) => [
        ...result.docs.map(
          (doc) => ({ ...doc.data(), id: doc.id }) as ButtonItem,
        ),
        ...(await getImportedButtons()),
      ])
      .catch((error) => {
        buttonsPromise = undefined;
        throw error;
      });
  }
  return buttonsPromise;
}

export async function getFeaturedButtons() {
  const result = await getDocs(
    query(
      collection(db, "buttons"),
      where("status", "==", "approved"),
      orderBy("likeCounter", "desc"),
      limit(6),
    ),
  );
  return result.docs.map(
    (doc) => ({ ...doc.data(), id: doc.id }) as ButtonItem,
  );
}

export type ButtonPageCursor = { id: string; likes: number };
export async function getButtonPage(cursor?: ButtonPageCursor) {
  const response = await fetch(
    `/api/catalogue${cursor ? `?after=${encodeURIComponent(cursor.id)}` : ""}`,
  );
  if (!response.ok) throw new Error("The collection could not be loaded.");
  return response.json() as Promise<{
    buttons: ButtonItem[];
    cursor?: ButtonPageCursor;
    hasMore: boolean;
    total: number;
  }>;
}

export async function getButtonCount() {
  const response = await fetch("/api/catalogue?counts=true");
  if (!response.ok) throw new Error("The collection could not be counted.");
  return (await response.json()).total as number;
}

async function getImportedButtons(): Promise<ButtonItem[]> {
  const response = await fetch("/imported-buttons/index.json");
  if (!response.ok) throw new Error("Imported buttons could not be loaded.");
  return response.json();
}

export async function loadButtonSource(
  button: ButtonItem,
): Promise<ButtonItem> {
  if (!button.source || button.html) return button;
  const response = await fetch(
    `/imported-buttons/${encodeURIComponent(button.id)}.json`,
  );
  if (!response.ok) throw new Error("This button source could not be loaded.");
  return response.json();
}

export async function downloadButton(button: ButtonItem) {
  button = await loadButtonSource(button);
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  zip.file(
    "index.html",
    previewDocument({ ...button, css: "", compiledCss: "", js: "" })
      .replace("</head>", '<link rel="stylesheet" href="style.css"></head>')
      .replace("</body>", '<script src="app.js"></script></body>'),
  );
  zip.file("style.css", `${button.compiledCss || ""}\n${button.css || ""}`);
  zip.file("app.js", button.js || "");
  if (button.reactSource) {
    for (const [file, content] of Object.entries(button.reactSource.files))
      zip.file(file, content);
    zip.file(
      "package.json",
      JSON.stringify(
        { private: true, dependencies: button.reactSource.dependencies },
        null,
        2,
      ),
    );
  }
  if (button.source?.provider === "uiverse") {
    const license = await fetch("/imported-buttons/uiverse-LICENSE.txt");
    if (!license.ok)
      throw new Error(
        "The source license could not be included. Please retry.",
      );
    zip.file("LICENSE", await license.text());
  }
  if (
    button.source?.licenseFile &&
    /^[\w.-]+$/.test(button.source.licenseFile)
  ) {
    const license = await fetch(
      `/imported-buttons/${button.source.licenseFile}`,
    );
    if (!license.ok)
      throw new Error(
        "The source license could not be included. Please retry.",
      );
    zip.file("LICENSE", await license.text());
  }
  zip.file(
    "README.md",
    `# ${buttonTitle(button)}\n\nBy ${button.source?.authorName || `@${button.githubUsername}`}\n${button.source ? `${button.source.authorUrl.includes("uiverse.io") ? "" : `Creator: ${button.source.authorUrl}\n`}License: ${button.source.license || "See included license"}\n` : ""}Source: ${button.id ? `https://getbuttons.tech/show/${button.id}` : "Unpublished local draft"}\n${button.remixOf ? `Remixed from @${button.remixOf.githubUsername}: https://getbuttons.tech/show/${button.remixOf.id}\n` : ""}${button.styling === "tailwind" ? "\nTailwind utilities are compiled into style.css. HTML keeps the original utility classes.\n" : ""}`,
  );
  if (button.reactSource) {
    const readme = await zip.file("README.md")!.async("string");
    zip.file(
      "README.md",
      `${readme}\nOpen index.html to try the standalone compiled demo. To use the TSX source in your React project, install the dependencies listed in package.json and map the @/ alias to your source directory. Include style.css, which contains the compiled utilities and animation styles.\n`,
    );
  }
  const url = URL.createObjectURL(await zip.generateAsync({ type: "blob" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `animating-button-${button.id || "draft"}.zip`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
