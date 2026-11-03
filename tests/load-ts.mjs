import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import ts from "typescript";
export function tsUrl(path) {
  let { outputText } = ts.transpileModule(
    readFileSync(path, "utf8").replace(/import ['"]server-only['"];?/, ""),
    {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
    },
  );
  outputText = outputText.replace(/from ["']([^"']+)["']/g, (_, name) => {
    if (name === "next/cache")
      return 'from "data:text/javascript,export const revalidateTag = () => undefined"';
    if (name.startsWith("node:")) return `from ${JSON.stringify(name)}`;
    if (name.endsWith(".json")) {
      const jsonPath = name.startsWith("@/")
        ? resolve(name.slice(2))
        : resolve(dirname(path), name);
      return `from ${JSON.stringify(`data:text/javascript;base64,${Buffer.from(`export default ${readFileSync(jsonPath, "utf8")}`).toString("base64")}`)}`;
    }
    if (name.startsWith("@/"))
      return `from ${JSON.stringify(tsUrl(resolve(`${name.slice(2)}.ts`)))}`;
    return `from ${JSON.stringify(name.startsWith(".") ? tsUrl(resolve(dirname(path), `${name}.ts`)) : import.meta.resolve(name))}`;
  });
  return `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`;
}
export const loadTs = (path) => import(tsUrl(resolve(path)));
