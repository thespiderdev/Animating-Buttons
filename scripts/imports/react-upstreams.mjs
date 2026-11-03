import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { build } from "esbuild";
import { compile } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";
import postcss from "postcss";
import { execFileSync } from "node:child_process";
import ts from "typescript";
import { createHash } from "node:crypto";

// Public upstream checkouts linked by creator profiles or component Source links.
const parent = path.resolve(process.argv[2] || "/tmp");
const only = process.argv[3];
const configs = [
  {
    author: "tom_ui",
    name: "tom",
    repo: "xxtomm/spell-ui",
    match: /^docs\/(?:flow|rich|copy|pop)-button\/demo(?:-[^/]+)?\.tsx$/,
    css: "app/globals.css",
    parentDemoTitle: true,
  },
  {
    author: "cult-ui",
    name: "cult/ui",
    repo: "nolly-studio/cult-ui",
    base: "apps/www",
    match: /^registry\/default\/example\/[^/]*button[^/]*-demo\.tsx$/,
    exclude: /family-button-demo/,
    css: "styles/globals.css",
  },
  {
    author: "ruixen-ui",
    profile: "ruixen.ui",
    name: "Ruixen",
    repo: "ruixenui/ruixen.com",
    match: /^registry\/example\/[^/]*button[^/]*-demo\.tsx$/,
    aliases: ["registry/", ""],
    exclude: /slide-to-delete-button-demo/,
    css: "app/globals.css",
  },
  {
    author: "shadcnspace",
    name: "ShadcnSpace",
    repo: "shadcnspace/shadcnspace",
    base: "src",
    match:
      /^components\/shadcn-space\/button(?:-group)?\/button(?:-group)?-\d+\.tsx$/,
    css: "app/globals.css",
  },
  {
    author: "originui",
    name: "Origin UI",
    repo: "origin-space/originui",
    base: "apps/ui",
    match: /^registry\/default\/particles\/p-button-\d+\.tsx$/,
    css: "app/globals.css",
  },
  {
    author: "preetsuthar17",
    name: "Preet Suthar",
    repo: "preetsuthar17/hextaui",
    match: /^components\/examples\/button\/[^/]+\.tsx$/,
    css: "app/globals.css",
  },
  {
    author: "molecule-lab-rushil",
    name: "Rushil Dhinoja",
    repo: "molecule-lab/molecule-ui",
    match:
      /^registry\/example\/(?:expandable-button(?:-group)?|liquid-glass-button)-demo\.tsx$/,
    css: "app/globals.css",
  },
  {
    author: "voxlet-ui",
    name: "Voxlet UI",
    repo: "voxletlabs/voxlet-ui",
    match:
      /^registry\/default\/components\/(?:loaderButton|download-button|flip-coin-button)\/(?:usage|variants)\.tsx$/,
    css: "app/globals.css",
  },
  {
    author: "moumensoliman",
    name: "Moumen Soliman",
    repo: "moumen-soliman/uitripled",
    match:
      /^packages\/components\/react-shadcn\/src\/components\/native\/demo\/[^/]*button[^/]*-demo\.tsx$/,
    rewrites: {
      "@/components/ui/button":
        "@/packages/components/react-shadcn/src/ui/button",
      "@/lib/utils": "@/packages/components/react-shadcn/src/lib/utils",
      "@uitripled/utils": "@/packages/utils/src/cn",
    },
  },
  {
    author: "sean0205",
    name: "Sean Hello",
    repo: "keenthemes/reui",
    match:
      /^registry-reui\/bases\/base\/components\/button(?:-group)?\/c-button(?:-group)?-\d+\.tsx$/,
    css: "styles/globals.css",
    buttonStyles: "registry/styles/style-vega.css",
  },
  {
    author: "designali-in",
    name: "Ali Imam",
    repo: "designali-com/designali",
    match:
      /^apps\/web\/registry\/designali\/examples\/button\/button-\d+\.tsx$/,
    css: "packages/ui/src/styles/globals.css",
    rewrites: { "@workspace/ui/": "@/packages/ui/src/" },
  },
  {
    author: "hyperiux",
    name: "Hyperiux Vault",
    repo: "Hyperiux-Immersion-Labs/hyperiux-components",
    match: /^registry\/effects\/buttons\/[^/]+\/index\.tsx$/,
  },
  {
    author: "jolbol1",
    name: "James Shopland",
    repo: "jolbol1/jolly-ui",
    base: "src",
    match: /^registry\/(?:default|new-york)\/example\/button\/[^/]+\.tsx$/,
    styles: true,
    css: "styles/globals.css",
  },
  {
    author: "shadcn",
    name: "shadcn",
    repo: "shadcn-ui/ui",
    base: "apps/v4",
    match: /^registry\/new-york-v4\/examples\/button(?:-group)?-[^/]+\.tsx$/,
    css: "app/globals.css",
    skipUtilities: true,
  },
  {
    author: "crysta1221",
    name: "crysta1221",
    repo: "Crysta1221/shadcn-m3e",
    match: /^apps\/docs\/src\/docs\/examples\/button\/[^/]+\.tsx$/,
    css: "packages/m3e/src/styles/m3e.css",
    cssAdditional: ["packages/m3e/src/styles/m3e.generated.css"],
    rewrites: {
      "@/components/m3e/": "@/packages/m3e/src/components/",
      "@/lib/m3e/": "@/packages/m3e/src/lib/",
    },
  },
  {
    author: "uilayout-contact",
    profile: "uilayout.contact",
    name: "UI Layouts",
    repo: "ui-layouts/uilayouts",
    base: "apps/ui-layout",
    match: /^registry\/components\/button\/btn-[^/]+\.tsx$/,
    css: "app/globals.css",
    skipUtilities: true,
  },
  {
    author: "edwinvakayil",
    name: "Edwin Vakayil",
    repo: "edwinvakayil/iconiq",
    match: /^import-examples\/[^/]+\.tsx$/,
    css: "app/globals.css",
    skipUtilities: true,
    generated: [
      {
        slug: "button",
        source: "registry/button.tsx",
        code: 'import {Button} from "@/registry/button";export default function Demo(){return <div className="flex flex-wrap gap-3"><Button>Get started</Button><Button variant="outline">Outline</Button><Button variant="secondary">Secondary</Button></div>}',
      },
      {
        slug: "base-button",
        source: "registry/b-button.tsx",
        code: 'import {Button} from "@/registry/b-button";export default function Demo(){return <div className="flex flex-wrap gap-3"><Button>Continue</Button><Button variant="outline">Outline</Button><Button loading>Saving</Button></div>}',
      },
      {
        slug: "flux-button",
        source: "registry/flux-button.tsx",
        code: 'import {FluxButton} from "@/registry/flux-button";export default function Demo(){return <FluxButton idleLabel="Save changes" loadingLabel="Saving" successLabel="Saved" onAction={()=>new Promise(resolve=>setTimeout(resolve,900))}/>}',
      },
      {
        slug: "radial-button",
        source: "registry/radial-button.tsx",
        code: 'import {RadialButton} from "@/registry/radial-button";export default function Demo(){return <RadialButton>Hover me</RadialButton>}',
      },
      {
        slug: "button-group",
        source: "registry/button-group.tsx",
        code: 'import {Button,ButtonGroup} from "@/registry/button-group";export default function Demo(){return <ButtonGroup><Button>Previous</Button><Button>Next</Button></ButtonGroup>}',
      },
    ],
  },
  {
    author: "clevision",
    name: "Clevision",
    repo: "shadcnstudio/shadcn-studio",
    base: "src",
    match:
      /^components\/shadcn-studio\/button(?:-group)?\/button(?:-group)?-\d+\.tsx$/,
    css: "app/globals.css",
    skipUtilities: true,
  },
  {
    author: "cnippet-dev",
    name: "Cnippet",
    repo: "cnippet-dev/ui-cnippet",
    base: "apps/v2",
    match: /^registry\/default\/variants\/v-button-\d+\.tsx$/,
    css: "app/globals.css",
    skipUtilities: true,
  },
  {
    author: "codehagen",
    profile: "Codehagen",
    name: "Prism UI",
    repo: "codehagen/prismui",
    base: "src",
    match:
      /^registry\/example\/(?:action-button|button-group|enhanced-button)-(?:basic|demo)\.tsx$/,
    css: "app/globals.css",
    skipUtilities: true,
  },
  {
    author: "kokonutd",
    name: "Kokonut UI",
    repo: "kokonut-labs/kokonutui",
    match: /^import-examples\/[^/]+\.tsx$/,
    css: "app/globals.css",
    skipUtilities: true,
    docsDemos: "content/docs/buttons",
  },
  {
    author: "ekmas",
    name: "Samuel Breznjak",
    repo: "ekmas/neobrutalism-components",
    base: "src",
    match: /^examples\/ui\/button(?:-group)?\/[^/]+\.tsx$/,
    css: "styling/globals.css",
    skipUtilities: true,
  },
  {
    author: "radiumcoders",
    name: "jay sharma",
    repo: "radiumcoders/Evil-Buttons",
    match: /^import-examples\/[^/]+\.tsx$/,
    css: "app/globals.css",
    skipUtilities: true,
    docsDemos: "content/docs",
    docsCodeBlocks: true,
  },
  {
    author: "purnavu-12",
    name: "purnavu-12",
    repo: "Purnavu-12/BuildWithMe-UI",
    base: "src",
    match: /^registry\/designs\/[^/]*button\/react\.tsx$/,
    css: "app/globals.css",
    skipUtilities: true,
    styling: "css",
  },
  {
    author: "kevingirelli",
    name: "kevingirelli",
    repo: "KevinGirelli/corsair-ui",
    match: /^import-examples\/[^/]+\.tsx$/,
    generated: [
      {
        slug: "dash-button",
        source: "registry/default/ui/dash-button.tsx",
        code: 'import {DashButton} from "@/registry/default/ui/dash-button";export default function Demo(){return <DashButton>Plot a course</DashButton>}',
      },
    ],
  },
  {
    author: "bundui",
    name: "Bundui",
    repo: "bundui/components",
    match:
      /^components\/examples\/(?:(?:magnetic|floating)-button|ripple-effect\/button|button\/\d+)\.tsx$/,
    css: "app/globals.css",
    skipUtilities: true,
  },
  {
    author: "skyleen77",
    name: "Elliot Sutton",
    repo: "imskyleen/animate-ui",
    match:
      /^apps\/v1\/apps\/www\/registry\/demo\/components\/buttons\/[^/]+\/index\.tsx$/,
    exclude: /github-stars/,
    excludeReason:
      "Live repository statistics require an external request; no local-only demo supplied",
    css: "apps/v1/apps/www/app/globals.css",
    skipUtilities: true,
    rewrites: {
      "@/": "@/apps/v1/apps/www/",
      "@workspace/ui/": "@/apps/v1/packages/ui/src/",
    },
    themeProvider: true,
  },
  {
    author: "saurabh-2607",
    name: "Saurabh Sharma",
    repo: "Saurabh-2607/GreatUI",
    match:
      /^components\/site\/previews\/(?:Button|AceternityButton|MinimalButtons)Preview\.tsx$/,
    css: "app/globals.css",
    skipUtilities: true,
  },
  {
    author: "badtzx0",
    name: "badtz",
    repo: "badtzx0/badtz-ui",
    match: /^registry\/new-york-v4\/examples\/[^/]*button-demo\.tsx$/,
    css: "styles/globals.css",
    skipUtilities: true,
    themeProvider: true,
  },
  {
    author: "starc007",
    name: "Saurabh",
    repo: "starc007/ui-components",
    match:
      /^components\/previews\/motion\/(?:button-[^/]+|(?:expanding-arrow|hold-action|slide-action)-button)\.preview\.tsx$/,
    css: "app/globals.css",
  },
  {
    author: "ddoemonn",
    name: "Özer",
    repo: "ddoemonn/interior",
    match:
      /^lib\/demos\/(?:copy-button|loading-button|press-depth|like-burst|ripple|hold-to-confirm)-demo\.tsx$/,
    css: "app/globals.css",
  },
  {
    author: "lucasbassetti",
    name: "Lucas Bassetti",
    repo: "LucasBassetti/godui",
    match: /^import-examples\/[^/]+\.tsx$/,
    css: "packages/components/theme/light.css",
    cssAdditional: [
      "packages/components/theme/dark.css",
      "packages/components/styles.css",
      "packages/lab/styles.css",
    ],
    cssSourceFiles: [
      "packages/components/theme/light.css",
      "packages/components/theme/dark.css",
      "packages/components/styles.css",
      "packages/lab/styles.css",
    ],
    demoStyles: ["packages/components/styles.css", "packages/lab/styles.css"],
    generated: [
      ...["jelly", "magic", "magnetic", "shimmer"].map((name) => ({
        slug: name + "-button",
        source: `packages/lab/src/${name}-button/${name}-button.tsx`,
        code: `import {${name[0].toUpperCase() + name.slice(1)}Button as Button} from "@/packages/lab/src/${name}-button/${name}-button";export default function Demo(){return <Button>Get started</Button>}`,
      })),
      {
        slug: "hold-confirm-button",
        source: "packages/lab/src/hold-confirm-button/hold-confirm-button.tsx",
        code: 'import {HoldConfirmButton} from "@/packages/lab/src/hold-confirm-button/hold-confirm-button";export default function Demo(){return <HoldConfirmButton onConfirm={()=>{}}>Hold to confirm</HoldConfirmButton>}',
      },
      {
        slug: "slide-confirm-button",
        source:
          "packages/lab/src/slide-confirm-button/slide-confirm-button.tsx",
        code: 'import {SlideConfirmButton} from "@/packages/lab/src/slide-confirm-button/slide-confirm-button";export default function Demo(){return <SlideConfirmButton label="Slide to confirm" confirmedLabel="Confirmed" onConfirm={()=>{}}/>}',
      },
      {
        slug: "progress-fold-button",
        source:
          "packages/lab/src/progress-fold-button/progress-fold-button.tsx",
        code: 'import {useState} from "react";import {ProgressFoldButton} from "@/packages/lab/src/progress-fold-button/progress-fold-button";export default function Demo(){const[status,setStatus]=useState<"idle"|"loading">("idle");return <ProgressFoldButton status={status} onClick={()=>{setStatus("loading");setTimeout(()=>setStatus("idle"),1400)}}>Save changes</ProgressFoldButton>}',
      },
      {
        slug: "multi-button",
        source: "packages/lab/src/multi-button/multi-button.tsx",
        code: 'import {MultiButton} from "@/packages/lab/src/multi-button/multi-button";import {Copy,Download,Share2} from "lucide-react";export default function Demo(){return <MultiButton items={[{id:"copy",label:"Copy",icon:Copy,onClick:()=>{}},{id:"download",label:"Download",icon:Download,onClick:()=>{}},{id:"share",label:"Share",icon:Share2,onClick:()=>{}}]}/>}',
      },
    ],
  },
  {
    author: "bidyut10",
    name: "Bidyut",
    repo: "bidyut10/opensourceui",
    match: /^import-examples\/[^/]+\.tsx$/,
    css: "app/globals.css",
    catalogueDemos: "lib/showcase/showcase.tsx",
  },
  {
    author: "johnmamanao",
    name: "John Mamanao",
    repo: "johnmamanao/nacre-ui",
    match: /^import-examples\/[^/]+\.tsx$/,
    css: "app/globals.css",
    styling: "css",
    generated: [
      ...["GemSmoke", "LiquidMetal", "Lustre", "Magnetic"].map((name) => {
        const slug =
          name.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase() + "-button";
        return {
          slug,
          source: `components/ui/${slug}.tsx`,
          code: `import {${name}Button} from "@/components/ui/${slug}";export default function Demo(){return <${name}Button/>}`,
        };
      }),
      ...[
        "Like",
        "Copy",
        "Send",
        "Save",
        "Mute",
        "Download",
        "Theme",
        "Refresh",
        "Bookmark",
        "Lock",
        "Play",
        "Filter",
      ].map((name) => ({
        slug: name.toLowerCase() + "-button",
        source: "components/ui/micro-buttons.tsx",
        code: `import {${name}Button} from "@/components/ui/micro-buttons";export default function Demo(){return <${name}Button/>}`,
      })),
    ],
  },
].filter((c) => !only || c.author === only);
const out = path.resolve("public/imported-buttons");
const existing = JSON.parse(
  await fs.readFile(path.join(out, "index.json"), "utf8"),
);
const previous = new Map(existing.map((b) => [b.id, b]));
const require = createRequire(path.join(process.cwd(), "package.json"));
const projectPackage = require("./package.json");
const reports = [];
const addedAt = { seconds: Math.floor(Date.now() / 1000) };
async function list(dir, prefix = "") {
  const result = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if ([".git", "node_modules", ".next", "public"].includes(entry.name))
      continue;
    const name = prefix + entry.name;
    if (entry.isDirectory())
      result.push(...(await list(path.join(dir, entry.name), name + "/")));
    else if (/\.(tsx?|jsx?|css)$/.test(name)) result.push(name);
  }
  return result;
}
function exportsOf(source) {
  if (/export\s+default\b/.test(source)) return ["default"];
  return [
    ...source.matchAll(
      /export\s+(?:async\s+)?(?:function|const)\s+([A-Z]\w*)/g,
    ),
  ].map((m) => m[1]);
}
const tokens = [
  "background",
  "foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "border",
  "input",
  "ring",
  "destructive",
  "destructive-foreground",
  "popover",
  "popover-foreground",
  "success",
  "success-foreground",
];
const foundation = `:root{--background:#fff;--foreground:#111;--primary:#171717;--primary-foreground:#fff;--secondary:#eee;--secondary-foreground:#171717;--muted:#eee;--muted-foreground:#666;--accent:#eee;--accent-foreground:#171717;--border:#ddd;--input:#ddd;--ring:#777;--destructive:#dc2626;--destructive-foreground:#fff;--popover:#fff;--popover-foreground:#111;--success:#15803d;--success-foreground:#fff;--radius:.625rem;--hairline:1px}.dark{--background:#090909;--foreground:#fafafa;--primary:#fafafa;--primary-foreground:#171717;--secondary:#262626;--secondary-foreground:#fafafa;--muted:#262626;--muted-foreground:#a3a3a3;--accent:#262626;--accent-foreground:#fafafa;--border:#333;--input:#333;--popover:#171717;--popover-foreground:#fafafa}`;
async function themeCss(root, config) {
  let original = "";
  if (config.css)
    original = await fs
      .readFile(path.join(root, config.css), "utf8")
      .catch(() => "");
  for (const file of config.cssAdditional || [])
    original += await fs.readFile(path.join(root, file), "utf8");
  const ast = postcss.parse(original);
  const kept = ast.nodes
    .filter(
      (node) =>
        (node.type === "rule" &&
          /^(?::root|\.dark)(?:\s|,|$)/.test(node.selector)) ||
        (node.type === "atrule" &&
          (config.buttonStyles || config.skipUtilities
            ? ["theme", "keyframes"]
            : ["theme", "keyframes", "utility"]
          ).includes(node.name)),
    )
    .map(String)
    .join("\n");
  const hsl = /--background:\s*\d+[\s]+\d+%/.test(kept);
  let buttonStyles = "";
  if (config.buttonStyles) {
    const styles = postcss.parse(
      await fs.readFile(path.join(root, config.buttonStyles), "utf8"),
    );
    styles.walkRules((rule) => {
      if (rule.selector.startsWith(".cn-button"))
        buttonStyles += rule.toString() + "\n";
    });
  }
  return (
    foundation +
    `@theme inline{${tokens.map((n) => `--color-${n}:${hsl ? `hsl(var(--${n}))` : `var(--${n})`};`).join("")}--radius-sm:calc(var(--radius) - 4px);--radius-md:calc(var(--radius) - 2px);--radius-lg:var(--radius);--radius-xl:calc(var(--radius) + 4px);}` +
    kept +
    buttonStyles
  );
}
const nextAdapter =
  'import React from "react";export default function Link({children,href,...props}){return <a href={typeof href==="string"?href:"#"} {...props}>{children}</a>}';
for (const config of configs) {
  const checkout = path.join(
    parent,
    "animating-buttons-upstream-" + config.repo.split("/")[1],
  );
  const root = path.join(checkout, config.base || "");
  const report = {
    author: config.author,
    upstream: config.repo,
    candidates: 0,
    imported: 0,
    skipped: [],
    errors: [],
    ids: [],
  };
  reports.push(report);
  try {
    const revision = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: checkout,
      encoding: "utf8",
    }).trim();
    report.revision = revision;
    if (config.catalogueDemos) {
      config.generated = [];
      const source = await fs.readFile(
        path.join(root, config.catalogueDemos),
        "utf8",
      );
      const tree = ts.createSourceFile(
        config.catalogueDemos,
        source,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX,
      );
      const imports = tree.statements.filter(ts.isImportDeclaration);
      function visit(node) {
        if (
          ts.isCallExpression(node) &&
          ts.isIdentifier(node.expression) &&
          node.expression.text === "c"
        ) {
          const [slug, preview, file] = node.arguments;
          if (
            slug &&
            file &&
            ts.isStringLiteral(slug) &&
            ts.isStringLiteral(file) &&
            /^components\/buttons\/[^/]*button\.tsx$/.test(file.text)
          ) {
            const jsx = preview.getText(tree);
            const usedImports = imports.flatMap((statement) => {
              const bindings = statement.importClause?.namedBindings;
              if (!bindings || !ts.isNamedImports(bindings)) return [];
              const used = bindings.elements.filter((item) =>
                new RegExp(`\\b${item.name.text}\\b`).test(jsx),
              );
              return used.length
                ? [
                    `import {${used.map((item) => item.getText(tree)).join(",")}} from ${statement.moduleSpecifier.getText(tree)};`,
                  ]
                : [];
            });
            config.generated.push({
              slug: slug.text,
              source: file.text,
              code:
                usedImports.join("\n") +
                `\nexport default function Demo(){return (${jsx});}`,
            });
          }
        }
        ts.forEachChild(node, visit);
      }
      visit(tree);
    }
    if (config.docsDemos) {
      config.generated = [];
      const directory = path.join(root, config.docsDemos);
      for (const file of (await fs.readdir(directory)).filter((name) =>
        name.endsWith(config.docsCodeBlocks ? ".mdx" : "button.mdx"),
      )) {
        const content = await fs.readFile(path.join(directory, file), "utf8");
        if (config.docsCodeBlocks) {
          const blocks = [...content.matchAll(/```tsx\s*\n([\s\S]*?)```/g)];
          let code = blocks
            .map((m) => m[1])
            .find(
              (code) =>
                /from ["']@\/components\/evil-buttons\//.test(code) &&
                exportsOf(code).length,
            );
          if (code && file === "command-button.mdx") {
            const preview = content.match(
              /<PreviewCard\b[^>]*>([\s\S]*?)<\/PreviewCard>/,
            )?.[1];
            if (preview)
              code =
                'import {CommandButton} from "@/components/evil-buttons/command-button"; export default function Demo(){return <>' +
                preview +
                "</>}";
          }
          if (code) {
            const source = code.match(/from ["']@\/([^"']+)["']/)?.[1];
            config.generated.push({
              slug: file.slice(0, -4),
              source: source + ".tsx",
              code,
            });
          }
          continue;
        }
        const preview = content.match(
          /<Preview\b[^>]*>([\s\S]*?)<\/Preview>/,
        )?.[1];
        if (!preview) continue;
        const imports = [...content.matchAll(/^import .+$/gm)]
          .map((m) => m[0])
          .join("\n");
        const slug = file.slice(0, -4);
        config.generated.push({
          slug,
          source: `components/kokonutui/${slug}.tsx`,
          code: `${imports}\nexport default function ImportedDemo(){return <>${preview}</>}`,
        });
      }
    }
    for (const example of config.generated || []) {
      await fs.mkdir(path.join(root, "import-examples"), { recursive: true });
      await fs.writeFile(
        path.join(root, "import-examples", example.slug + ".tsx"),
        example.code,
      );
    }
    const candidates = (await list(root))
      .filter((p) => config.match.test(p))
      .sort();
    if (!candidates.length)
      throw new Error("No public button demos found in this checkout");
    let license;
    for (const file of ["LICENSE", "LICENSE.md", "LICENSE.txt"]) {
      license = await fs
        .readFile(path.join(checkout, file), "utf8")
        .catch(() => undefined);
      if (license) break;
    }
    const licenseFile = license ? `${config.author}-LICENSE.txt` : undefined;
    if (licenseFile) {
      await fs.writeFile(path.join(out, licenseFile), license);
      await fs.writeFile(path.join("licenses", licenseFile), license);
    }
    const theme = await themeCss(root, config);
    for (const demo of candidates) {
      if (config.exclude?.test(demo)) {
        report.skipped.push({
          demo,
          reason:
            config.excludeReason ||
            "A content or gesture widget without a button control",
        });
        continue;
      }
      const demoSource = await fs.readFile(path.join(root, demo), "utf8");
      if (
        /<(?:form|input|textarea|(?:Input|Textarea|Dialog|Card|Select|Popover)\w*|Command(?!Button\b)\w*)\b/.test(
          demoSource,
        ) ||
        /(?:fetch\s*\(|window\.location\s*=|signIn\s*\()/.test(demoSource)
      ) {
        report.skipped.push({
          demo,
          reason: "Contains a form, non-button example, or external action",
        });
        continue;
      }
      const exportNames = exportsOf(demoSource);
      for (const exported of exportNames) {
        report.candidates++;
        const slug = demo
          .replace(/^.*\/(?:example|examples|particles|demo)\//, "")
          .replace(/\.tsx$/, "")
          .replaceAll("/", "-")
          .replace(/-demo$/, "")
          .replace(/^components-shadcn-space-/, "");
        const suffix =
          exported === "default" || exportNames.length === 1
            ? ""
            : "-" + exported.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
        const style = config.styles
          ? demo.match(/^registry\/([^/]+)\//)?.[1] + "-"
          : "";
        const id = `21st-${config.author}-${style}${slug}${suffix}`;
        try {
          const files = {};
          const dependencies = { react: "^19", "react-dom": "^19" };
          const extraCss = [];
          const entry = `import React from "react";import {createRoot} from "react-dom/client";import ${exported === "default" ? "Demo" : `{${exported} as Demo}`} from "./${demo}";${config.themeProvider ? 'import {ThemeProvider} from "next-themes";' : ""}createRoot(document.getElementById("root")).render(${config.themeProvider ? '<ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}><Demo/></ThemeProvider>' : "<Demo/>"});`;
          async function locate(name, importer) {
            const paths = name.startsWith("@/")
              ? [
                  path.join(root, name.slice(2)),
                  ...(config.aliases || []).map((prefix) =>
                    path.join(root, prefix, name.slice(2)),
                  ),
                ]
              : [path.resolve(importer ? path.dirname(importer) : root, name)];
            for (const p of paths)
              for (const suffix of [
                "",
                ".tsx",
                ".ts",
                ".jsx",
                ".js",
                "/index.tsx",
                "/index.ts",
              ]) {
                const full = p + suffix;
                if (!full.startsWith(checkout + path.sep)) continue;
                if ((await fs.stat(full).catch(() => undefined))?.isFile())
                  return full;
              }
          }
          const bundle = await build({
            stdin: {
              contents: entry,
              resolveDir: root,
              sourcefile: "preview-entry.tsx",
              loader: "tsx",
            },
            bundle: true,
            write: false,
            outdir: path.join(parent, "animating-buttons-preview-output"),
            minify: true,
            platform: "browser",
            format: "iife",
            jsx: "automatic",
            logLevel: "silent",
            define: {
              "process.env.NODE_ENV": '"production"',
              "process.env": "{}",
            },
            plugins: [
              {
                name: "public-upstream-sources",
                setup(b) {
                  b.onResolve({ filter: /.*/ }, async (args) => {
                    if (args.pluginData?.nativePackageResolution) return;
                    if (args.path === "next/link") {
                      dependencies.next = "^16";
                      return { path: "next/link", namespace: "adapter" };
                    }
                    if (
                      (args.path.startsWith(".") &&
                        (args.namespace !== "file" ||
                          args.importer.endsWith("preview-entry.tsx"))) ||
                      args.path.startsWith("@/")
                    ) {
                      const resolved = await locate(args.path, args.importer);
                      if (!resolved)
                        throw new Error(`Missing local source: ${args.path}`);
                      return { path: resolved, namespace: "upstream" };
                    }
                    if (
                      args.namespace === "upstream" ||
                      args.importer.endsWith("preview-entry.tsx") ||
                      args.namespace === "adapter"
                    ) {
                      if (args.path.startsWith(".")) return;
                      const name = args.path.startsWith("@")
                        ? args.path.split("/").slice(0, 2).join("/")
                        : args.path.split("/")[0];
                      const actual = args.path.startsWith("framer-motion")
                        ? args.path.replace("framer-motion", "motion/react")
                        : args.path;
                      let version =
                        projectPackage.dependencies?.[name] ||
                        projectPackage.devDependencies?.[name] ||
                        "*";
                      try {
                        version = "^" + require(name + "/package.json").version;
                      } catch {
                        if (name === "framer-motion") version = "^12";
                      }
                      dependencies[name] = version;
                      return b.resolve(actual, {
                        resolveDir: process.cwd(),
                        kind: args.kind,
                        pluginData: { nativePackageResolution: true },
                      });
                    }
                  });
                  b.onLoad(
                    { filter: /.*/, namespace: "adapter" },
                    ({ path: name }) => ({
                      contents:
                        name === "cn"
                          ? 'export {clsx as cn} from "clsx"'
                          : nextAdapter,
                      loader: "tsx",
                      resolveDir: process.cwd(),
                    }),
                  );
                  b.onLoad(
                    { filter: /.*/, namespace: "upstream" },
                    async ({ path: full }) => {
                      let content = await fs.readFile(full, "utf8");
                      const brands = {
                        DribbbleIcon: "RiDribbbleLine",
                        FacebookIcon: "RiFacebookLine",
                        InstagramIcon: "RiInstagramLine",
                        LinkedinIcon: "RiLinkedinLine",
                        TwitchIcon: "RiTwitchLine",
                      };
                      content = content.replace(
                        /import\s*\{([^}]+)\}\s*from\s*["']lucide-react["'];?/g,
                        (statement, names) => {
                          const keep = [],
                            moved = [];
                          for (const raw of names
                            .split(",")
                            .map((n) => n.trim())
                            .filter(Boolean)) {
                            const [name, alias] = raw.split(/\s+as\s+/);
                            if (brands[name])
                              moved.push(`${brands[name]} as ${alias || name}`);
                            else keep.push(raw);
                          }
                          return (
                            (keep.length
                              ? `import {${keep.join(",")}} from "lucide-react";`
                              : "") +
                            (moved.length
                              ? `\nimport {${moved.join(",")}} from "@remixicon/react";`
                              : "")
                          );
                        },
                      );
                      if (
                        config.author === "uilayout-contact" &&
                        /btn-creative-(?:right|top)\.tsx$/.test(full)
                      ) {
                        content = content
                          .replace(
                            /<div(\s+className=['"]group relative cursor-pointer)/,
                            '<button type="button"$1',
                          )
                          .replaceAll("<div", "<span")
                          .replaceAll("</div>", "</span>");
                        const end = content.lastIndexOf("</span>");
                        content =
                          content.slice(0, end) +
                          "</button>" +
                          content.slice(end + 7);
                      }
                      if (
                        config.author === "sean0205" &&
                        content.includes("<IconPlaceholder")
                      ) {
                        const icons = new Set();
                        content = content.replace(
                          /<IconPlaceholder\b([\s\S]*?)\/>/g,
                          (markup, attrs) => {
                            const icon = attrs.match(
                              /\blucide=["'](\w+)["']/,
                            )?.[1];
                            if (!icon) return markup;
                            icons.add(icon);
                            return `<Imported${icon} ${attrs.replace(/\b(?:lucide|tabler|hugeicons|phosphor|remixicon)=["'][^"']*["']/g, "")} />`;
                          },
                        );
                        if (!content.includes("<IconPlaceholder")) {
                          content = content.replace(
                            /import\s*\{\s*IconPlaceholder\s*\}\s*from\s*["'][^"']+["'];?/g,
                            "",
                          );
                          content +=
                            "\nimport {" +
                            [...icons]
                              .filter((icon) => icon !== "GithubIcon")
                              .map((icon) => `${icon} as Imported${icon}`)
                              .join(",") +
                            '} from "lucide-react";\n';
                          if (icons.has("GithubIcon"))
                            content +=
                              'import {RiGithubLine as ImportedGithubIcon} from "@remixicon/react";\n';
                        }
                      }
                      for (const [from, to] of Object.entries(
                        config.rewrites || {},
                      ))
                        content = from.endsWith("/")
                          ? content
                              .replaceAll(`"${from}`, `"${to}`)
                              .replaceAll(`'${from}`, `'${to}`)
                          : content
                              .replaceAll(`"${from}"`, `"${to}"`)
                              .replaceAll(`'${from}'`, `'${to}'`);
                      const name = path.relative(root, full);
                      if (name.startsWith(".."))
                        throw new Error(
                          "Source outside the configured source root",
                        );
                      files[name] = content;
                      if (full.endsWith(".css")) {
                        if (full.endsWith(".module.css"))
                          return {
                            contents: content,
                            loader: "local-css",
                            resolveDir: path.dirname(full),
                          };
                        extraCss.push(content);
                        return { contents: "", loader: "js" };
                      }
                      return {
                        contents: content,
                        loader: full.endsWith(".tsx")
                          ? "tsx"
                          : full.endsWith(".ts")
                            ? "ts"
                            : "jsx",
                        resolveDir: process.cwd(),
                      };
                    },
                  );
                },
              },
            ],
          });
          if (!Object.keys(files).length)
            throw new Error("No original source collected");
          for (const output of bundle.outputFiles.filter((file) =>
            file.path.endsWith(".css"),
          ))
            extraCss.push(output.text);
          for (const file of config.cssSourceFiles || [])
            files[file] = await fs.readFile(path.join(root, file), "utf8");
          // Keep the demo first in the file chooser; all collected imports remain available.
          const ordered = {
            [demo]: files[demo],
            ...files,
            "demo.tsx": `${(config.demoStyles || []).map((file) => `import "@/${file}";`).join("\n")}\nexport { ${exported} as default } from "@/${demo.replace(/\.tsx$/, "")}";`,
          };
          for (const [name, source] of Object.entries(ordered)) {
            if (name.endsWith(".css")) continue;
            const parsed = ts.createSourceFile(
              name,
              source,
              ts.ScriptTarget.Latest,
              true,
              ts.ScriptKind.TSX,
            );
            for (const statement of parsed.statements) {
              if (
                !(
                  ts.isImportDeclaration(statement) ||
                  ts.isExportDeclaration(statement)
                ) ||
                !statement.moduleSpecifier ||
                !ts.isStringLiteral(statement.moduleSpecifier)
              )
                continue;
              const specifier = statement.moduleSpecifier.text;
              if (specifier.startsWith(".") || specifier.startsWith("@/"))
                continue;
              const dependency = specifier.startsWith("@")
                ? specifier.split("/").slice(0, 2).join("/")
                : specifier.split("/")[0];
              dependencies[dependency] ||=
                projectPackage.dependencies?.[dependency] ||
                projectPackage.devDependencies?.[dependency] ||
                "*";
            }
          }
          const compiler = await compile(
            '@import "tailwindcss";@custom-variant dark (&:where(.dark, .dark *));' +
              theme +
              extraCss.join("\n"),
            { base: process.cwd(), onDependency() {} },
          );
          const scanner = new Scanner({ sources: [] });
          const compiledCss = compiler.build(
            scanner.scanFiles(
              Object.entries(ordered).map(([p, content]) => ({
                content,
                extension: p.endsWith(".tsx") ? "tsx" : "ts",
              })),
            ),
          );
          let title = (
            exported === "default" || exported === "Pattern"
              ? (["index", "react"].includes(path.basename(demo, ".tsx"))
                  ? path.basename(path.dirname(demo))
                  : path.basename(demo, ".tsx")
                ).replace(/-demo$/, "")
              : exported
          )
            .replace(/([a-z])([A-Z])/g, "$1 $2")
            .replace(/[-_]/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());
          const registry = JSON.parse(
            await fs
              .readFile(
                path.join(
                  config.base === "src" ? checkout : root,
                  "public/r",
                  path.basename(demo, ".tsx") + ".json",
                ),
                "utf8",
              )
              .catch(() => "{}"),
          );
          title = registry.title || title;
          if (config.parentDemoTitle)
            title =
              `${path.basename(path.dirname(demo))}${path.basename(demo, ".tsx").replace(/^demo/, "")}`
                .replaceAll("-", " ")
                .replace(/\b\w/g, (c) => c.toUpperCase());
          title = demoSource.match(/^\s*\/\/\s*title:\s*(.+)$/m)?.[1] || title;
          if (/^\d+$/.test(title)) title = `Button ${title}`;
          const meta = JSON.parse(
            await fs
              .readFile(
                path.join(root, path.dirname(demo), "meta.json"),
                "utf8",
              )
              .catch(() => "[]"),
          );
          if (Array.isArray(meta))
            title =
              meta.find((item) => item.name === path.basename(demo, ".tsx"))
                ?.title || title;
          const button = {
            id,
            title,
            githubUsername: config.profile || config.author,
            displayName: config.name,
            html: '<div id="root"></div>',
            css: "",
            js: bundle.outputFiles[0].text,
            compiledCss,
            styling: config.styling || "tailwind",
            categories: ["hover", "animated"],
            status: "approved",
            likeCounter: 0,
            addedAt: previous.get(id)?.addedAt || addedAt,
            source: {
              provider: "21st",
              authorName: config.name,
              authorUrl: `https://github.com/${config.repo}`,
              componentUrl: `https://github.com/${config.repo}/blob/${revision}/${config.base ? config.base + "/" : ""}${config.generated?.find((example) => demo === `import-examples/${example.slug}.tsx`)?.source || demo}`,
              license: license
                ? /MIT License|The MIT License/.test(license)
                  ? "MIT"
                  : "See included license"
                : "Not specified in source repository",
              licenseFile,
              version: createHash("sha256")
                .update(bundle.outputFiles[0].text + compiledCss)
                .digest("hex")
                .slice(0, 12),
            },
            reactSource: { files: ordered, dependencies },
          };
          await fs.writeFile(
            path.join(out, id + ".json"),
            JSON.stringify(button),
          );
          const { reactSource, ...summary } = button;
          void reactSource;
          previous.set(id, {
            ...summary,
            html: "",
            css: "",
            js: "",
            compiledCss: "",
          });
          report.imported++;
          report.ids.push(id);
        } catch (error) {
          report.errors.push({
            demo,
            exported,
            error: (
              error.errors?.map((e) => e.text).join("; ") || error.message
            ).slice(0, 700),
          });
        }
      }
    }
    if (report.imported) {
      const kept = new Set(report.ids);
      for (const [id, button] of previous) {
        if (
          id.startsWith(`21st-${config.author}-`) &&
          button.source?.authorUrl === `https://github.com/${config.repo}` &&
          !kept.has(id)
        ) {
          previous.delete(id);
          await fs.unlink(path.join(out, id + ".json")).catch(() => {});
        }
      }
    }
  } catch (error) {
    report.errors.push({ error: error.message });
  }
  console.log(JSON.stringify({ ...report, ids: undefined }));
}
await fs.writeFile(
  path.join(out, "index.json"),
  JSON.stringify(
    [...previous.values()].sort((a, b) => a.id.localeCompare(b.id)),
  ),
);
const reportFile = path.join(out, "report-react-upstreams.json");
const oldReport = only
  ? JSON.parse(await fs.readFile(reportFile, "utf8").catch(() => "[]")).filter(
      (r) => r.author !== only,
    )
  : [];
await fs.writeFile(
  reportFile,
  JSON.stringify([...oldReport, ...reports], null, 2) + "\n",
);
