"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import Select from "@/components/ui/select";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { ChevronLeft, Copy, Download, RotateCcw, Trash2 } from "lucide-react";
import { deleteDoc, doc, getDoc } from "firebase/firestore";
import ButtonCredit from "./button-credit";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import {
  buttonTitle,
  downloadButton,
  getCommunityButtons,
  previewDocument,
  type ButtonItem,
} from "@/lib/community";
import {
  CATEGORIES,
  STARTERS,
  buttonCategories,
  starterById,
  type ButtonCode,
} from "@/lib/button-tools";
import type { ValidationResult } from "@/lib/button-validation";
import { useCommunity } from "./provider";
import { useHydrated } from "@/lib/use-hydrated";
import SaveButton from "./save-button";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="h-96 animate-pulse rounded-2xl bg-muted motion-reduce:animate-none" />
  ),
});
type FileType = "html" | "css" | "js";
type Draft = {
  code: ButtonCode;
  title: string;
  categories: string[];
  savedAt: number;
};
type Checks = {
  controls: number;
  issues: string[];
  checkedContrast: number;
  manualContrast: number;
};
const files: FileType[] = ["html", "css", "js"];

export default function ButtonEditor({
  id,
  remixId,
  starterId,
  initialButton,
}: {
  id?: string;
  remixId?: string;
  starterId?: string;
  initialButton?: ButtonItem;
}) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const hydrated = useHydrated();
  const { user, username, isAdmin, login } = useCommunity();
  const initial = starterById(starterId);
  const initialCode: ButtonCode = initialButton
    ? {
        html: initialButton.html,
        css: initialButton.css,
        js: initialButton.js,
        styling: initialButton.styling,
        compiledCss: initialButton.compiledCss,
      }
    : initial.code;
  const [original, setOriginal] = useState<ButtonItem | undefined>(
    initialButton,
  );
  const [remixSource, setRemixSource] = useState<ButtonItem>();
  const [code, setCode] = useState<ButtonCode>(initialCode);
  const [preview, setPreview] = useState<ButtonCode>(initialCode);
  const [file, setFile] = useState<FileType>("html");
  const [title, setTitle] = useState(
    initialButton ? buttonTitle(initialButton) : "",
  );
  const [categories, setCategories] = useState<string[]>(
    initialButton
      ? buttonCategories(initialButton).slice(0, 4)
      : [initial.category],
  );
  const [loading, setLoading] = useState(!initialButton && !!(id || remixId));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [background, setBackground] = useState("auto");
  const [width, setWidth] = useState("fluid");
  const [zoom, setZoom] = useState("1");
  const [disabled, setDisabled] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [restart, setRestart] = useState(0);
  const [validation, setValidation] = useState<ValidationResult>();
  const [checking, setChecking] = useState(false);
  const [compileError, setCompileError] = useState("");
  const [checks, setChecks] = useState<Checks>();
  const [draft, setDraft] = useState<Draft>();
  const [draftStatus, setDraftStatus] = useState("");
  const [dirty, setDirty] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  const draftKey = `animating-buttons:draft:${id || (remixId ? `remix-${remixId}` : "new")}`;
  const editable =
    !!user &&
    !!original &&
    !original.source &&
    (isAdmin ||
      (original.ownerUid
        ? user.uid === original.ownerUid
        : username.toLowerCase() === original.githubUsername?.toLowerCase()));
  const canEdit = !id || editable;
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const raw = localStorage.getItem(draftKey);
        if (raw) {
          const value = JSON.parse(raw);
          if (
            value.code &&
            typeof value.code.html === "string" &&
            typeof value.code.css === "string" &&
            typeof value.code.js === "string" &&
            typeof value.title === "string" &&
            Array.isArray(value.categories)
          )
            setDraft(value);
        }
      } catch {
        setDraftStatus("Draft storage is unavailable on this browser.");
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [draftKey]);
  useEffect(() => {
    const target = id || remixId;
    if (!target || initialButton) return;
    let active = true;
    const source = /^(uiverse|21st)-/.test(target)
      ? fetch(`/imported-buttons/${encodeURIComponent(target)}.json`).then(
          async (response) => {
            if (!response.ok)
              throw new Error("This imported button could not be found.");
            return response.json() as Promise<ButtonItem>;
          },
        )
      : getDoc(doc(db, "buttons", target)).then((snapshot) => {
          if (!snapshot.exists())
            throw new Error("This button could not be found.");
          return { ...snapshot.data(), id: snapshot.id } as ButtonItem;
        });
    source
      .then((item) => {
        if (!active) return;
        const values: ButtonCode = {
          html: item.html || "",
          css: item.css || "",
          js: item.js || "",
          styling: item.styling || "css",
          compiledCss: item.compiledCss || "",
        };
        if (id) setOriginal(item);
        else setRemixSource(item);
        setCode(values);
        setPreview(values);
        setTitle(`${id ? "" : "Remix of "}${buttonTitle(item)}`.slice(0, 80));
        setCategories(buttonCategories(item).slice(0, 4));
        setLoading(false);
      })
      .catch((error) => {
        if (active) {
          setError(
            error instanceof Error
              ? error.message
              : "Could not load this button. Check your connection.",
          );
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [id, remixId, initialButton]);
  useEffect(() => {
    if (loading || error) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setChecking(true);
      setCompileError("");
      try {
        const validateRequest = fetch("/api/buttons/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ html: code.html, css: code.css, js: code.js }),
          signal: controller.signal,
        }).then(async (response) => {
          const data = await response.json();
          if (!response.ok)
            throw new Error(data.error || "Could not check submission.");
          return data as ValidationResult;
        });
        const compileRequest =
          code.styling === "tailwind"
            ? fetch("/api/tailwind", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ html: code.html, js: code.js }),
                signal: controller.signal,
              }).then(async (response) => {
                const result = await response.json();
                if (!response.ok)
                  throw new Error(
                    result.error || "Tailwind compilation failed.",
                  );
                return result.css as string;
              })
            : Promise.resolve("");
        const [result, compiledCss] = await Promise.all([
          validateRequest,
          compileRequest,
        ]);
        if (!controller.signal.aborted) {
          setValidation(result);
          setPreview({ ...code, compiledCss });
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setCompileError(
            error instanceof Error
              ? error.message
              : "Preview could not be updated.",
          );
          setValidation(undefined);
        }
      } finally {
        if (!controller.signal.aborted) setChecking(false);
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [code, loading, error]);
  useEffect(() => {
    function receive(event: MessageEvent) {
      if (
        event.source !== frame.current?.contentWindow ||
        event.data?.type !== "button-preview-checks"
      )
        return;
      const data = event.data;
      if (!Array.isArray(data.issues)) return;
      setChecks({
        controls: Number(data.controls) || 0,
        issues: data.issues
          .filter((issue: unknown) => typeof issue === "string")
          .slice(0, 20),
        checkedContrast: Number(data.checkedContrast) || 0,
        manualContrast: Number(data.manualContrast) || 0,
      });
    }
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, []);
  const source = useMemo(
    () =>
      previewDocument(preview, !hydrated || resolvedTheme !== "light", {
        inspect: true,
        disabled,
        reducedMotion,
        background:
          background === "auto"
            ? undefined
            : background === "light"
              ? "#ffffff"
              : background === "blue"
                ? "#4169e1"
                : "#000000",
      }),
    [preview, hydrated, resolvedTheme, disabled, reducedMotion, background],
  );
  function writeDraft() {
    try {
      const value = {
        code: { ...code, compiledCss: "" },
        title,
        categories,
        savedAt: Date.now(),
      };
      localStorage.setItem(draftKey, JSON.stringify(value));
      setDraftStatus("Draft saved on this browser");
    } catch {
      setDraftStatus("Draft could not be saved. Browser storage may be full.");
    }
  }
  useEffect(() => {
    if (!dirty || loading) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          draftKey,
          JSON.stringify({
            code: { ...code, compiledCss: "" },
            title,
            categories,
            savedAt: Date.now(),
          }),
        );
        setDraftStatus("Draft saved on this browser");
      } catch {
        setDraftStatus(
          "Draft could not be saved. Browser storage may be full.",
        );
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [code, title, categories, dirty, loading, draftKey]);
  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        writeDraft();
      }
    }
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  });
  function changeCode(value: ButtonCode) {
    setCode(value);
    setDirty(true);
    setCompileError("");
  }
  function resetCode() {
    writeDraft();
    setDraft({ code, title, categories, savedAt: Date.now() });
    const saved = original || remixSource;
    changeCode(
      saved
        ? {
            html: saved.html || "",
            css: saved.css || "",
            js: saved.js || "",
            styling: saved.styling || "css",
            compiledCss: saved.compiledCss || "",
          }
        : initial.code,
    );
  }
  async function preparedCode() {
    if (code.styling !== "tailwind") return { ...code, compiledCss: "" };
    const response = await fetch("/api/tailwind", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ html: code.html, js: code.js }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    return { ...code, compiledCss: result.css };
  }
  async function save() {
    if (!user || !username) {
      await login();
      return;
    }
    if (id && !editable) return;
    if (!title.trim()) {
      toast.error("Give your button a name first.");
      return;
    }
    if (validation && !validation.valid) {
      toast.error(validation.errors[0]);
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
          html: code.html,
          css: code.css,
          js: code.js,
          styling: code.styling,
          categories,
          title,
          id,
          remixId,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setDirty(false);
      try {
        localStorage.removeItem(draftKey);
      } catch {}
      setDraft(undefined);
      setDraftStatus("");
      void getCommunityButtons(true).catch(() => {});
      toast.success(
        result.status === "pending"
          ? "Button saved for review. It will appear after approval."
          : "Button updated",
      );
      if (!id) router.push(`/show/${result.id}`);
      else
        setOriginal((item) =>
          item ? { ...item, status: result.status } : item,
        );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save your button.",
      );
    } finally {
      setSaving(false);
    }
  }
  async function remove() {
    if (!id || !editable) return;
    setSaving(true);
    try {
      await deleteDoc(doc(db, "buttons", id));
      void getCommunityButtons(true).catch(() => {});
      router.push("/buttons");
      toast.success("Button deleted");
    } catch {
      toast.error("Could not delete this button. Try again.");
    } finally {
      setSaving(false);
    }
  }
  async function copy(kind: "file" | "html") {
    try {
      await navigator.clipboard.writeText(
        kind === "file" ? code[file] : previewDocument(await preparedCode()),
      );
      toast.success(
        kind === "file"
          ? `${file.toUpperCase()} copied`
          : "Standalone HTML copied",
      );
    } catch {
      toast.error("Could not copy. Check clipboard access and try again.");
    }
  }
  async function download() {
    try {
      await downloadButton({
        ...original,
        ...(await preparedCode()),
        id: id || "",
        title: title || "My button",
        githubUsername: original?.githubUsername || username || "You",
        likeCounter: original?.likeCounter || 0,
        remixOf:
          original?.remixOf ||
          (remixSource
            ? {
                id: remixSource.id,
                githubUsername: remixSource.githubUsername,
                title: buttonTitle(remixSource),
              }
            : undefined),
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Download failed.");
    }
  }
  const credit =
    original?.remixOf ||
    (remixSource
      ? {
          id: remixSource.id,
          githubUsername: remixSource.githubUsername,
          title: buttonTitle(remixSource),
        }
      : undefined);
  if (loading)
    return (
      <div className="h-96 animate-pulse rounded-3xl bg-muted motion-reduce:animate-none" />
    );
  if (error)
    return (
      <div className="empty-state" role="alert">
        <h1>Could not open this button</h1>
        <p>{error}</p>
        <Link href="/buttons" className="action-primary">
          Back to buttons
        </Link>
      </div>
    );
  const details = (
    <>
      <header className="mt-8 mb-8 flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
        <div>
          {!id && (
            <p className="eyebrow">
              {id
                ? "Inside the button"
                : remixId
                  ? "Make it your own"
                  : "The button workshop"}
            </p>
          )}
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            {id
              ? buttonTitle(original!)
              : remixId
                ? "A new take on a good click."
                : "Small button. Big personality."}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            HTML, CSS or Tailwind, and a little JavaScript. One button or a
            group of up to six.
          </p>
          {original && (
            <p className="mt-3 text-sm">
              By{" "}
              <ButtonCredit button={original} className="text-action-accent" />
              {original.status && original.status !== "approved" && (
                <span className="ml-3 text-muted-foreground">
                  {original.status === "pending"
                    ? "Awaiting review"
                    : "Changes requested"}
                </span>
              )}
            </p>
          )}
          {credit && (
            <p className="mt-2 text-sm text-muted-foreground">
              Remixed from{" "}
              <Link href={`/show/${credit.id}`} className="text-action-accent">
                {credit.title} by @{credit.githubUsername}
              </Link>
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {original && <SaveButton button={original} />}
          {id && (
            <Link className="action-secondary" href={`/add?remix=${id}`}>
              Remix button
            </Link>
          )}
          <button className="action-secondary" onClick={download}>
            <Download size={16} /> Download
          </button>
          <button className="action-secondary" onClick={() => copy("html")}>
            Copy HTML
          </button>
          {id && (
            <button
              className="action-secondary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(window.location.href);
                  toast.success("Button link copied");
                } catch {
                  toast.error("Could not copy link.");
                }
              }}
            >
              Share
            </button>
          )}
          {canEdit && (
            <button
              className="action-primary"
              disabled={saving || checking || !!compileError}
              onClick={save}
            >
              {saving
                ? "Saving…"
                : !user
                  ? "Sign in to submit"
                  : id
                    ? "Save changes"
                    : "Submit for review"}
            </button>
          )}
        </div>
      </header>
      {draft && (
        <div
          className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl bg-muted p-4"
          role="status"
        >
          <p className="flex-1 text-sm">
            You have a local draft from{" "}
            {new Date(draft.savedAt).toLocaleString()}.
          </p>
          <button
            className="action-secondary"
            onClick={() => {
              setCode(draft.code);
              setTitle(draft.title);
              setCategories(
                draft.categories.filter((id) =>
                  CATEGORIES.some((item) => item.id === id),
                ),
              );
              setDirty(true);
              setDraft(undefined);
              toast.success("Draft restored");
            }}
          >
            Restore draft
          </button>
          <button
            className="action-secondary"
            onClick={() => {
              try {
                localStorage.removeItem(draftKey);
                setDraft(undefined);
              } catch {
                toast.error("Could not discard draft.");
              }
            }}
          >
            Discard
          </button>
        </div>
      )}
      {canEdit && (
        <>
          <div className="mb-6 grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_200px_240px]">
            <label className="text-sm font-medium">
              Button name
              <input
                className="field mt-2"
                maxLength={80}
                value={title}
                readOnly={!canEdit}
                placeholder="Give your click a name"
                onChange={(event) => {
                  setTitle(event.target.value);
                  setDirty(true);
                }}
              />
            </label>
            <label className="text-sm font-medium">
              Styling
              <Select
                aria-label="Styling"
                className="mt-2"
                value={code.styling || "css"}
                onValueChange={(value) =>
                  changeCode({
                    ...code,
                    styling: value as "css" | "tailwind",
                    compiledCss: "",
                  })
                }
                options={[
                  { value: "css", label: "CSS" },
                  { value: "tailwind", label: "Tailwind CSS v4" },
                ]}
              />
            </label>
            <label className="text-sm font-medium">
              Start from a template
              <Select
                aria-label="Start from a template"
                className="mt-2"
                value=""
                placeholder="Choose a starter…"
                onValueChange={(value) => {
                  const starter = starterById(value);
                  writeDraft();
                  setDraft({ code, title, categories, savedAt: Date.now() });
                  changeCode(starter.code);
                  setCategories([starter.category]);
                }}
                options={STARTERS.map((item) => ({
                  value: item.id,
                  label: item.name,
                }))}
              />
            </label>
          </div>
          <fieldset className="mb-8">
            <legend className="mb-3 text-sm font-medium">
              Categories{" "}
              <span className="font-normal text-muted-foreground">
                Choose up to four
              </span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  aria-pressed={categories.includes(item.id)}
                  disabled={
                    !canEdit ||
                    (!categories.includes(item.id) && categories.length >= 4)
                  }
                  className={
                    categories.includes(item.id)
                      ? "action-primary text-sm"
                      : "action-secondary text-sm"
                  }
                  onClick={() => {
                    setCategories(
                      categories.includes(item.id)
                        ? categories.filter((id) => id !== item.id)
                        : [...categories, item.id],
                    );
                    setDirty(true);
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </fieldset>
        </>
      )}
    </>
  );
  return (
    <>
      <Link
        href="/buttons"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft size={16} aria-hidden="true" /> Back to buttons
      </Link>
      {!id && details}
      <div className="grid min-w-0 items-start gap-6 xl:grid-cols-2">
        <section
          className="min-w-0 overflow-hidden rounded-3xl border border-foreground/10 bg-muted/30"
          aria-label="Button preview"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 p-4">
            <h2 className="font-semibold">Live preview</h2>
            <button
              className="action-secondary text-sm"
              onClick={() => {
                setRestart(restart + 1);
                setChecks(undefined);
              }}
            >
              <RotateCcw size={14} /> Restart
            </button>
          </div>
          <div className="h-96 overflow-auto bg-background p-2">
            <div
              className="mx-auto h-full"
              style={{
                width:
                  width === "fluid"
                    ? "100%"
                    : `${Number(width) * Number(zoom)}px`,
                minWidth:
                  width === "fluid"
                    ? undefined
                    : `${Number(width) * Number(zoom)}px`,
              }}
            >
              <iframe
                key={restart}
                ref={frame}
                onLoad={() => setChecks(undefined)}
                title="Live button preview"
                sandbox="allow-scripts"
                srcDoc={source}
                className="border-0"
                style={{
                  width:
                    width === "fluid" ? `${100 / Number(zoom)}%` : `${width}px`,
                  height: `${384 / Number(zoom)}px`,
                  transform: `scale(${zoom})`,
                  transformOrigin: "top left",
                }}
              />
            </div>
          </div>
          <details open={!id} className="px-4 pt-4">
            <summary className="mb-4 cursor-pointer text-sm text-muted-foreground">
              Preview settings
            </summary>
            <div className="flex flex-wrap gap-3 px-4 pb-4">
              <label className="text-xs text-muted-foreground">
                Background
                <Select
                  aria-label="Preview background"
                  className="mt-1 w-32 text-sm"
                  value={background}
                  onValueChange={setBackground}
                  options={[
                    { value: "auto", label: "Original" },
                    { value: "dark", label: "Black" },
                    { value: "light", label: "White" },
                    { value: "blue", label: "Royal blue" },
                  ]}
                />
              </label>
              <label className="text-xs text-muted-foreground">
                Viewport
                <Select
                  aria-label="Preview viewport"
                  className="mt-1 w-32 text-sm"
                  value={width}
                  onValueChange={setWidth}
                  options={[
                    { value: "fluid", label: "Fit panel" },
                    { value: "375", label: "Phone 375" },
                    { value: "768", label: "Tablet 768" },
                    { value: "1280", label: "Desktop 1280" },
                  ]}
                />
              </label>
              <label className="text-xs text-muted-foreground">
                Zoom
                <Select
                  aria-label="Preview zoom"
                  className="mt-1 w-24 text-sm"
                  value={zoom}
                  onValueChange={setZoom}
                  options={["0.5", "0.75", "1", "1.25", "1.5"].map((value) => ({
                    value,
                    label: `${Number(value) * 100}%`,
                  }))}
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-6 px-4 pb-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={disabled}
                  onChange={(event) => setDisabled(event.target.checked)}
                />{" "}
                Disabled state
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={reducedMotion}
                  onChange={(event) => setReducedMotion(event.target.checked)}
                />{" "}
                Reduce motion
              </label>
            </div>
          </details>
          <p aria-live="polite" className="p-4 text-xs text-muted-foreground">
            {checking
              ? code.styling === "tailwind"
                ? "Compiling Tailwind and checking submission…"
                : "Updating preview…"
              : compileError ||
                (code.styling === "tailwind"
                  ? "Tailwind preview ready. Custom CSS is applied after utilities."
                  : "Changes appear as you type. Use Tab to test keyboard focus.")}
          </p>
        </section>
        <section
          className="min-w-0 overflow-hidden rounded-3xl border border-foreground/10 bg-muted/30"
          aria-label="Code editor"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="flex gap-2" role="tablist" aria-label="Code files">
              {files.map((value) => (
                <button
                  role="tab"
                  id={`tab-${value}`}
                  aria-selected={file === value}
                  tabIndex={file === value ? 0 : -1}
                  onKeyDown={(event) => {
                    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft")
                      return;
                    event.preventDefault();
                    const next =
                      files[
                        (files.indexOf(value) +
                          (event.key === "ArrowRight" ? 1 : files.length - 1)) %
                          files.length
                      ];
                    setFile(next);
                    document.getElementById(`tab-${next}`)?.focus();
                  }}
                  aria-controls="code-panel"
                  key={value}
                  className={
                    file === value
                      ? "action-primary text-sm"
                      : "action-secondary text-sm"
                  }
                  onClick={() => setFile(value)}
                >
                  {value.toUpperCase()}
                </button>
              ))}
            </div>
            <button
              className="action-secondary text-sm"
              onClick={() => copy("file")}
            >
              <Copy size={14} /> Copy
            </button>
          </div>
          <div id="code-panel" role="tabpanel" aria-labelledby={`tab-${file}`}>
            <MonacoEditor
              height="448px"
              language={file === "js" ? "javascript" : file}
              theme={resolvedTheme === "light" ? "light" : "vs-dark"}
              value={code[file]}
              onChange={(value) => changeCode({ ...code, [file]: value || "" })}
              onMount={(editor, monaco) => {
                editor.addCommand(
                  monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
                  () => document.getElementById("save-local-draft")?.click(),
                );
              }}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                padding: { top: 16 },
                wordWrap: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
              }}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 p-4">
            <button
              id="save-local-draft"
              className="action-secondary text-sm"
              onClick={writeDraft}
            >
              Save draft
            </button>
            <button className="action-secondary text-sm" onClick={resetCode}>
              Reset code
            </button>
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {draftStatus || "⌘ / Ctrl + S saves locally"}
            </p>
          </div>
        </section>
      </div>
      {id && details}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl bg-muted/40 p-6">
          <h2 className="font-semibold">Button submission checks</h2>
          <div className="mt-3 text-sm" aria-live="polite">
            {checking ? (
              <p>Checking your code…</p>
            ) : validation ? (
              <>
                <p className="text-action-accent">
                  {validation.valid
                    ? `${validation.controls} ${validation.controls === 1 ? "control" : "controls"} · Ready for review`
                    : "Fix these before submitting"}
                </p>
                {validation.errors.length > 0 && (
                  <ul className="mt-3 list-disc space-y-2 pl-4">
                    {validation.errors.map((issue) => (
                      <li key={issue}>{issue}</li>
                    ))}
                  </ul>
                )}
                {validation.warnings.length > 0 && (
                  <ul className="mt-3 list-disc space-y-2 pl-4 text-muted-foreground">
                    {validation.warnings.map((issue) => (
                      <li key={issue}>{issue}</li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <p>
                {compileError ||
                  "Checks will appear after the preview updates."}
              </p>
            )}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Buttons only: no full pages, forms, cards or navigation. Put scripts
            in the JavaScript tab. Tailwind uses utilities from HTML and
            JavaScript; use complete class names. Custom CSS supports plain CSS,
            without @apply, imports or plugins.
          </p>
        </section>
        <section className="rounded-2xl bg-muted/40 p-6">
          <h2 className="font-semibold">Accessibility quick check</h2>
          <div className="mt-3 text-sm" aria-live="polite">
            {checks ? (
              <>
                <p>
                  {checks.controls} visible{" "}
                  {checks.controls === 1 ? "control" : "controls"} ·{" "}
                  {checks.checkedContrast} text contrast{" "}
                  {checks.checkedContrast === 1 ? "sample" : "samples"}
                </p>
                {checks.issues.length ? (
                  <ul className="mt-3 list-disc space-y-2 pl-4">
                    {checks.issues.map((issue) => (
                      <li key={issue}>{issue}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-action-accent">
                    No issues found in these automated checks.
                  </p>
                )}
                {checks.manualContrast > 0 && (
                  <p className="mt-3">
                    Some text needs a manual contrast check because of image
                    fills, transparency or text effects.
                  </p>
                )}
              </>
            ) : (
              <p>Waiting for the rendered preview…</p>
            )}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Try Tab, Enter and Space in the preview. Check the focus ring, hover
            and disabled states, then enable Reduce motion. These checks are
            guidance, not an accessibility certification.
          </p>
        </section>
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
        <p>
          {id && !editable
            ? "Explore freely here. Remix to publish your version with credit to the creator."
            : "New submissions and creator edits enter the moderation queue."}
        </p>
        {editable && (
          <div className="flex flex-wrap gap-2">
            {confirmDelete ? (
              <>
                <span>Delete permanently?</span>
                <button
                  className="action-secondary"
                  disabled={saving}
                  onClick={remove}
                >
                  Delete button
                </button>
                <button
                  className="action-secondary"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                className="action-secondary"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 size={14} /> Delete
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
