"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { doc, getDoc } from "firebase/firestore";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import type { ButtonItem } from "@/lib/community";
import Select from "@/components/ui/select";
import { useCommunity } from "./provider";

const starter = `import { useState } from "react";

export default function Button() {
  const [pressed, setPressed] = useState(false);
  return (
    <button type="button" aria-pressed={pressed} onClick={() => setPressed(!pressed)}>
      {pressed ? "Pressed" : "Press me"}
    </button>
  );
}`;

export default function ReactButtonEditor({ editId }: { editId?: string }) {
  const { user, username, isAdmin, login, loading } = useCommunity();
  const { resolvedTheme } = useTheme();
  const [framework, setFramework] = useState("react");
  const [language, setLanguage] = useState("tsx");
  const [styling, setStyling] = useState("css");
  const [title, setTitle] = useState("");
  const [source, setSource] = useState(starter);
  const [css, setCss] = useState(
    "button { padding: .75rem 1.25rem; border: 0; border-radius: .75rem; background: royalblue; color: white; cursor: pointer; }",
  );
  const [preview, setPreview] = useState<{ key: string; document: string }>();
  const [validPreview, setValidPreview] = useState<string>();
  const iframe = useRef<HTMLIFrameElement>(null);
  const previewKey = JSON.stringify([
    framework,
    language,
    source,
    css,
    styling,
    resolvedTheme,
  ]);
  const ready = preview?.key === previewKey && validPreview === previewKey;
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(!editId);

  useEffect(() => {
    if (!editId || !user || !/^[\w-]{1,128}$/.test(editId)) return;
    let active = true;
    getDoc(doc(db, "buttons", editId))
      .then((snapshot) => {
        const button = snapshot.data() as ButtonItem | undefined;
        const react = button?.reactSource;
        if (
          !button ||
          !react?.framework ||
          (!isAdmin &&
            (button.ownerUid
              ? button.ownerUid !== user.uid
              : button.githubUsername.toLowerCase() !== username.toLowerCase()))
        ) {
          throw new Error("This component cannot be edited from your account.");
        }
        const file = Object.entries(react.files).find(([name]) =>
          /^Button\.(jsx|tsx)$/.test(name),
        );
        if (!file) throw new Error("Component source not found.");
        if (!active) return;
        setTitle(button.title || "");
        setFramework(react.framework);
        setLanguage(file[0].endsWith(".jsx") ? "jsx" : "tsx");
        setStyling(button.styling || "css");
        setSource(file[1]);
        setCss(button.css || "");
        setLoaded(true);
      })
      .catch((failure: unknown) => {
        if (active)
          setError(
            failure instanceof Error
              ? failure.message
              : "Could not load this component.",
          );
      });
    return () => {
      active = false;
    };
  }, [editId, user, isAdmin, username]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (
        event.source === iframe.current?.contentWindow &&
        event.data?.type === "react-button-preview"
      ) {
        setValidPreview(event.data.valid === true ? preview?.key : undefined);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [preview?.key]);

  useEffect(() => {
    if (!loaded) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/buttons/react-preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reactSource: {
              framework,
              files: { [`Button.${language}`]: source },
            },
            css,
            styling,
            dark: resolvedTheme !== "light",
          }),
          signal: controller.signal,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        if (!controller.signal.aborted) {
          setError("");
          setPreview({ key: previewKey, document: result.document });
        }
      } catch (failure) {
        if (!controller.signal.aborted) {
          setPreview(undefined);
          setError(
            failure instanceof Error
              ? failure.message
              : "Could not generate the preview.",
          );
        }
      }
    }, 400);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [
    loaded,
    framework,
    language,
    source,
    css,
    styling,
    resolvedTheme,
    previewKey,
  ]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ready) return;
    if (!user) {
      await login();
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/buttons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({
          id: editId,
          title,
          css,
          styling,
          reactSource: { framework, files: { [`Button.${language}`]: source } },
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      toast.success(
        result.status === "pending"
          ? "Component submitted for review"
          : "Component saved",
      );
    } catch (failure) {
      toast.error(
        failure instanceof Error
          ? failure.message
          : "Could not save your component.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!loaded)
    return (
      <div className="empty-state">
        <p role="status">
          {error ||
            (loading || user
              ? "Loading component…"
              : "Sign in to review or edit this component.")}
        </p>
        {!loading && !user && (
          <button className="action-primary" onClick={login}>
            Sign in with GitHub
          </button>
        )}
      </div>
    );

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-2">
      <div className="min-w-0 space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">
          {editId ? "Edit button component" : "Submit a button component"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Paste one React or Next.js client component with a default export. Use
          React or Motion imports and keep the preview to one button or a group
          of up to six.
        </p>
        <label className="block text-sm">
          Button name
          <input
            className="field mt-2 w-full"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={80}
            required
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          <Select
            aria-label="Framework"
            value={framework}
            onValueChange={setFramework}
            options={[
              { value: "react", label: "React" },
              { value: "nextjs", label: "Next.js" },
            ]}
          />
          <Select
            aria-label="Source language"
            value={language}
            onValueChange={setLanguage}
            options={[
              { value: "tsx", label: "TSX" },
              { value: "jsx", label: "JSX" },
            ]}
          />
          <Select
            aria-label="Styling"
            value={styling}
            onValueChange={setStyling}
            options={[
              { value: "css", label: "CSS" },
              { value: "tailwind", label: "Tailwind CSS" },
            ]}
          />
        </div>
        <label className="block text-sm">
          Button.{language}
          <textarea
            className="field mt-2 min-h-64 w-full resize-y font-mono text-sm"
            value={source}
            onChange={(event) => setSource(event.target.value)}
            maxLength={30000}
            spellCheck={false}
            required
          />
        </label>
        <label className="block text-sm">
          Optional CSS
          <textarea
            className="field mt-2 min-h-28 w-full resize-y font-mono text-sm"
            value={css}
            onChange={(event) => setCss(event.target.value)}
            maxLength={20000}
            spellCheck={false}
          />
        </label>
        <button
          className="action-primary"
          type="submit"
          disabled={saving || loading || !ready || !!error}
        >
          {saving
            ? "Saving…"
            : user
              ? isAdmin && editId
                ? "Save component"
                : "Submit for review"
              : "Sign in to submit"}
        </button>
      </div>
      <section
        aria-label="Component preview"
        className="min-w-0 self-start overflow-hidden rounded-3xl border border-foreground/10 bg-muted/40"
      >
        <h2 className="border-b border-foreground/10 px-4 py-3 text-sm font-semibold">
          Live preview
        </h2>
        {preview ? (
          <iframe
            title="Live component preview"
            sandbox="allow-scripts"
            key={preview.key}
            ref={iframe}
            srcDoc={preview.document}
            className="h-80 w-full border-0"
          />
        ) : (
          <p
            role="status"
            className="grid min-h-80 place-content-center px-6 text-center text-sm text-muted-foreground"
          >
            {error || "Preparing your preview…"}
          </p>
        )}
      </section>
    </form>
  );
}
