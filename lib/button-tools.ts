import type { ButtonItem } from "./community";

export type Styling = "css" | "tailwind";
export type ButtonCode = {
  html: string;
  css: string;
  js: string;
  styling?: Styling;
  compiledCss?: string;
};
export const CATEGORIES = [
  { id: "hover", label: "Hover effects" },
  { id: "loading", label: "Loading" },
  { id: "toggle", label: "Toggle" },
  { id: "icon", label: "Icon" },
  { id: "social", label: "Social" },
  { id: "download", label: "Download" },
  { id: "3d", label: "3D" },
  { id: "animated", label: "Animated" },
  { id: "minimal", label: "Minimal" },
] as const;
export type Category = (typeof CATEGORIES)[number]["id"];
export const categoryLabel = (id: string) =>
  CATEGORIES.find((category) => category.id === id)?.label || id;
export function buttonCategories(
  button: Pick<ButtonItem, "html" | "css" | "js" | "categories">,
): Category[] {
  const explicit = button.categories?.filter((id): id is Category =>
    CATEGORIES.some((item) => item.id === id),
  );
  if (explicit?.length) return explicit;
  const source = `${button.html} ${button.css} ${button.js}`.toLowerCase();
  const categories: Category[] = [];
  if (/:hover|hover:/.test(source)) categories.push("hover");
  if (/loading|spinner|spinning|aria-busy/.test(source))
    categories.push("loading");
  if (/aria-pressed|role=["']switch|type=["']checkbox|toggle/.test(source))
    categories.push("toggle");
  if (/<svg|<i\b|icon|fontawesome/.test(source)) categories.push("icon");
  if (
    /github|twitter|facebook|instagram|linkedin|discord|whatsapp/.test(source)
  )
    categories.push("social");
  if (/download|save file/.test(source)) categories.push("download");
  if (/perspective|rotate[xy]\(|translatez|preserve-3d/.test(source))
    categories.push("3d");
  if (/@keyframes|animation:|animate-/.test(source))
    categories.push("animated");
  return categories.length ? categories : ["minimal"];
}

const baseCss = `button { font: 600 16px system-ui; cursor: pointer; }\nbutton:focus-visible { outline: 3px solid #91acff; outline-offset: 5px; }\nbutton:disabled { opacity: .45; cursor: not-allowed; }\n@media (prefers-reduced-motion: reduce) { *,*::before,*::after { animation: none !important; transition: none !important; } }`;
export const STARTERS: Array<{
  id: string;
  name: string;
  description: string;
  category: Category;
  code: ButtonCode;
}> = [
  {
    id: "lift",
    name: "Lift",
    description: "A simple hover lift",
    category: "hover",
    code: {
      html: '<button class="lift" type="button">Let’s build <span aria-hidden="true">→</span></button>',
      css: `${baseCss}\n.lift { display: flex; align-items: center; gap: 24px; background: #4169e1; color: white; border: 0; border-radius: 16px; padding: 16px 24px; transition: transform .25s, box-shadow .25s; }\n.lift:hover { transform: translateY(-4px); box-shadow: 0 8px 0 #1e3580; }\n.lift:active { transform: translateY(0); box-shadow: none; }`,
      js: "",
      styling: "css",
    },
  },
  {
    id: "tailwind",
    name: "Tailwind lift",
    description: "Utility classes, ready to edit",
    category: "hover",
    code: {
      html: '<button type="button" class="rounded-2xl bg-blue-600 px-6 py-4 font-semibold text-white shadow-lg transition-transform hover:-translate-y-1 hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-300 disabled:opacity-40 motion-reduce:transition-none">Make something →</button>',
      css: "",
      js: "",
      styling: "tailwind",
    },
  },
  {
    id: "loading",
    name: "Loading",
    description: "An interactive loading state",
    category: "loading",
    code: {
      html: '<button class="load" type="button"><span class="label">Save changes</span><span class="spinner" aria-hidden="true"></span></button>',
      css: `${baseCss}\n.load { display: flex; align-items: center; gap: 12px; padding: 16px 24px; border: 0; border-radius: 16px; background: #4169e1; color: white; min-width: 180px; justify-content: center; }\n.spinner { display: none; width: 16px; height: 16px; border: 2px solid #ffffff55; border-top-color: white; border-radius: 50%; animation: spin .7s linear infinite; }\n.load[aria-busy="true"] .spinner { display: block; }\n@keyframes spin { to { transform: rotate(360deg); } }`,
      js: `const button = document.querySelector('button');\nbutton.addEventListener('click', () => {\n  if (button.getAttribute('aria-busy') === 'true') return;\n  button.setAttribute('aria-busy', 'true');\n  button.querySelector('.label').textContent = 'Saving…';\n  setTimeout(() => {\n    button.setAttribute('aria-busy', 'false');\n    button.querySelector('.label').textContent = 'Saved';\n  }, 1400);\n});`,
      styling: "css",
    },
  },
  {
    id: "toggle",
    name: "Toggle",
    description: "A keyboard-friendly pressed state",
    category: "toggle",
    code: {
      html: '<button class="toggle" type="button" aria-pressed="false"><span class="dot" aria-hidden="true"></span> Available</button>',
      css: `${baseCss}\n.toggle { display: flex; align-items: center; gap: 12px; border: 1px solid #777; border-radius: 999px; padding: 14px 22px; background: #181818; color: white; transition: background .2s; }\n.dot { width: 12px; height: 12px; border-radius: 50%; background: #777; }\n.toggle[aria-pressed="true"] { background: #4169e1; border-color: #4169e1; }\n.toggle[aria-pressed="true"] .dot { background: white; }`,
      js: `const button = document.querySelector('button');\nbutton.addEventListener('click', () => { button.setAttribute('aria-pressed', String(button.getAttribute('aria-pressed') !== 'true')); });`,
      styling: "css",
    },
  },
  {
    id: "icon",
    name: "Icon button",
    description: "A labelled icon action",
    category: "icon",
    code: {
      html: '<button class="icon-button" type="button" aria-label="Add to favorites" aria-pressed="false"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9Z"/></svg></button>',
      css: `${baseCss}\n.icon-button { display: grid; place-items: center; width: 60px; height: 60px; border-radius: 20px; background: #4169e1; color: white; border: 0; transition: transform .2s; }\n.icon-button:hover { transform: rotate(-10deg) scale(1.06); }\n.icon-button[aria-pressed="true"] svg { fill: currentColor; }`,
      js: `const button = document.querySelector('button');\nbutton.addEventListener('click', () => { const selected = button.getAttribute('aria-pressed') !== 'true'; button.setAttribute('aria-pressed', String(selected)); button.setAttribute('aria-label', selected ? 'Remove from favorites' : 'Add to favorites'); });`,
      styling: "css",
    },
  },
  {
    id: "press",
    name: "Physical press",
    description: "A tactile 3D button",
    category: "3d",
    code: {
      html: '<button class="press" type="button">Push me</button>',
      css: `${baseCss}\n.press { padding: 18px 32px; background: #4169e1; color: white; border: 0; border-radius: 16px; box-shadow: 0 7px 0 #243b88; transform: perspective(500px) rotateX(8deg); transition: transform .15s, box-shadow .15s; }\n.press:active { transform: translateY(6px); box-shadow: 0 1px 0 #243b88; }`,
      js: "",
      styling: "css",
    },
  },
];
export const starterById = (id?: string) =>
  STARTERS.find((starter) => starter.id === id) || STARTERS[0];
