import { parse } from "@babel/parser";
import { transform } from "sucrase";
import { compileButtonTailwind } from "./tailwind";
import { validateButton } from "./button-validation";
import type { ButtonItem } from "./community";
import type { ButtonCode } from "./button-tools";

const dependencies: Record<string, string> = {
  react: "^19.2.4",
  "react-dom": "^19.2.4",
  "motion/react": "^12.40.0",
};

const allowedElements = new Set([
  "button",
  "div",
  "span",
  "svg",
  "path",
  "g",
  "circle",
  "rect",
  "line",
  "polyline",
  "polygon",
  "ellipse",
  "title",
  "defs",
  "linearGradient",
  "radialGradient",
  "stop",
  "mask",
  "clipPath",
]);

type AstNode = { type?: string; [key: string]: unknown };

function verifySource(ast: AstNode) {
  const stack: unknown[] = [ast];
  let button = false;
  while (stack.length) {
    const value = stack.pop();
    if (!value || typeof value !== "object") continue;
    const node = value as AstNode;
    if (
      node.type === "ImportExpression" ||
      node.type === "Import" ||
      node.type === "TSImportEqualsDeclaration" ||
      node.type === "ExportAllDeclaration" ||
      (node.type === "ExportNamedDeclaration" && node.source)
    ) {
      throw new Error("Use static imports from React or Motion.");
    }
    if (node.type === "ImportDeclaration" && node.importKind !== "type") {
      const name = (node.source as { value: string }).value;
      if (!["react", "motion/react"].includes(name))
        throw new Error(
          "Use imports from react or motion/react in the preview.",
        );
    }
    if (node.type === "JSXOpeningElement") {
      const name = node.name as {
        type: string;
        name?: string;
        property?: { name?: string };
      };
      const tag = name.name || name.property?.name || "";
      if (tag === "button") button = true;
      if (/^[a-z]/.test(tag) && !allowedElements.has(tag))
        throw new Error(
          "Submit a button or a small button group. Remove page layouts and other controls.",
        );
    }
    if (
      node.type === "JSXAttribute" &&
      (node.name as { name?: string }).name === "dangerouslySetInnerHTML"
    ) {
      throw new Error("Use JSX for the button markup.");
    }
    for (const [key, child] of Object.entries(node)) {
      if (key !== "loc" && key !== "tokens") stack.push(child);
    }
  }
  if (!button)
    throw new Error(
      "Include a native button or motion.button in your component.",
    );
}

export async function prepareReactButton(
  input: unknown,
  css: unknown,
  styling: ButtonCode["styling"],
) {
  const source = input as Partial<
    NonNullable<ButtonItem["reactSource"]>
  > | null;
  const framework = source?.framework;
  const files = Object.entries(source?.files || {}).filter(
    ([name]) => name !== "style.css",
  );
  const [name, code] = files[0] || [];
  if (
    (framework !== "react" && framework !== "nextjs") ||
    files.length !== 1 ||
    !/^Button\.(jsx|tsx)$/.test(name || "") ||
    typeof code !== "string" ||
    !code.trim() ||
    typeof css !== "string" ||
    new TextEncoder().encode(code).length > 30_000 ||
    new TextEncoder().encode(css).length > 20_000
  ) {
    throw new Error(
      "Provide one JSX or TSX component under 30 KB and optional CSS under 20 KB.",
    );
  }
  const validation = validateButton({
    html: "<button>Preview</button>",
    css,
    js: "",
    styling,
  });
  if (!validation.valid) throw new Error(validation.errors.join(" "));
  const typescript = name.endsWith(".tsx");
  const parsed = parse(code, {
    sourceType: "module",
    plugins: typescript ? ["jsx", "typescript"] : ["jsx"],
  });
  if (
    !parsed.program.body.some(
      (node) => node.type === "ExportDefaultDeclaration",
    )
  ) {
    throw new Error("Export your button component as the default export.");
  }
  verifySource(parsed.program as unknown as AstNode);
  const transformed = transform(code, {
    transforms: typescript
      ? ["typescript", "jsx", "imports"]
      : ["jsx", "imports"],
    jsxRuntime: "automatic",
    production: true,
    filePath: name,
  }).code;
  const compiledCss =
    styling === "tailwind" ? await compileButtonTailwind("", code) : "";
  return {
    html: '<div id="button-preview"></div><p id="preview-status" role="status"></p>',
    css,
    compiledCss,
    js: `renderButton(function(module,exports,require){\n${transformed}\n});`,
    styling,
    validationVersion: 1,
    reactSource: {
      framework,
      files: { [name]: code, ...(css ? { "style.css": css } : {}) },
      dependencies: {
        react: dependencies.react,
        "react-dom": dependencies["react-dom"],
        ...(parsed.program.body.some(
          (node) =>
            node.type === "ImportDeclaration" &&
            node.source.value === "motion/react",
        )
          ? { motion: dependencies["motion/react"] }
          : {}),
      },
    },
  };
}
