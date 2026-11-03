import { NextRequest } from "next/server";
import { CATEGORIES, type ButtonCode } from "./button-tools";
import { validateButton } from "./button-validation";
import { compileButtonTailwind } from "./tailwind";

export class ApiError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
const logins = new Map<string, { login: string; expires: number }>();
export async function authenticate(request: NextRequest) {
  const token = request.headers
    .get("authorization")
    ?.match(/^Bearer (.+)$/)?.[1];
  if (!token) throw new ApiError("Sign in with GitHub to continue.", 401);
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: token }),
      cache: "no-store",
    },
  );
  const account = (await response.json()).users?.[0];
  const provider = account?.providerUserInfo?.find(
    (item: { providerId: string }) => item.providerId === "github.com",
  );
  if (!response.ok || !account || account.disabled || !provider?.rawId)
    throw new ApiError("Your session expired. Sign in with GitHub again.", 401);
  const known = logins.get(provider.rawId);
  let login = known && known.expires > Date.now() ? known.login : "";
  if (!login) {
    const github = await fetch(
      `https://api.github.com/user/${encodeURIComponent(provider.rawId)}`,
      { headers: { Accept: "application/vnd.github+json" }, cache: "no-store" },
    );
    const profile = await github.json();
    if (!github.ok || !profile.login)
      throw new ApiError(
        "Could not verify your GitHub account. Try again shortly.",
        503,
      );
    login = profile.login;
    if (logins.size > 500) logins.clear();
    logins.set(provider.rawId, { login, expires: Date.now() + 300_000 });
  }
  const admins = (process.env.NEXT_PUBLIC_ADMIN_USERS || "")
    .split(",")
    .map((name) => name.trim().toLowerCase());
  return {
    token,
    uid: account.localId as string,
    login,
    displayName: account.displayName || login,
    admin: admins.includes(login.toLowerCase()),
  };
}
export type Session = Awaited<ReturnType<typeof authenticate>>;
const root = () =>
  `https://firestore.googleapis.com/v1/projects/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/databases/(default)/documents/buttons`;
type Field = {
  stringValue?: string;
  integerValue?: string;
  booleanValue?: boolean;
  timestampValue?: string;
  arrayValue?: { values?: Field[] };
  mapValue?: { fields?: Record<string, Field> };
};
function encode(value: unknown): Field {
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "number") return { integerValue: String(value) };
  if (typeof value === "boolean") return { booleanValue: value };
  if (Array.isArray(value))
    return { arrayValue: { values: value.map(encode) } };
  return {
    mapValue: {
      fields: Object.fromEntries(
        Object.entries(value as object).map(([key, item]) => [
          key,
          encode(item),
        ]),
      ),
    },
  };
}
function decode(field: Field): unknown {
  if (field.stringValue !== undefined) return field.stringValue;
  if (field.integerValue !== undefined) return Number(field.integerValue);
  if (field.booleanValue !== undefined) return field.booleanValue;
  if (field.arrayValue) return (field.arrayValue.values || []).map(decode);
  if (field.mapValue)
    return Object.fromEntries(
      Object.entries(field.mapValue.fields || {}).map(([key, item]) => [
        key,
        decode(item),
      ]),
    );
  return field.timestampValue;
}
export async function readButton(
  id: string,
  session: Session,
): Promise<Record<string, unknown>> {
  if (!/^[\w-]{1,128}$/.test(id)) throw new ApiError("Invalid button ID.");
  const response = await fetch(`${root()}/${id}`, {
    headers: { Authorization: `Bearer ${session.token}` },
    cache: "no-store",
  });
  if (!response.ok)
    throw new ApiError(
      response.status === 404
        ? "This button could not be found."
        : "Your account cannot access this button.",
      response.status === 404 ? 404 : 403,
    );
  const data = await response.json();
  return Object.fromEntries(
    Object.entries(data.fields || {}).map(([key, item]) => [
      key,
      decode(item as Field),
    ]),
  );
}
export async function writeButton(
  values: Record<string, unknown>,
  session: Session,
  id?: string,
) {
  const fields = Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, encode(value)]),
  );
  fields.updatedAt = { timestampValue: new Date().toISOString() };
  if (!id) fields.createdAt = fields.updatedAt;
  const mask = new URLSearchParams();
  if (id)
    for (const key of Object.keys(fields))
      mask.append("updateMask.fieldPaths", key);
  const response = await fetch(id ? `${root()}/${id}?${mask}` : root(), {
    method: id ? "PATCH" : "POST",
    headers: {
      Authorization: `Bearer ${session.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields }),
    cache: "no-store",
  });
  const result = await response.json();
  if (!response.ok)
    throw new ApiError(
      "Firebase could not save this button. Check your account permissions and try again.",
      response.status === 403 ? 403 : 502,
    );
  return result.name.split("/").pop() as string;
}
export async function checkedCode(data: Record<string, unknown>) {
  if (
    ![data.html, data.css, data.js].every((value) => typeof value === "string")
  )
    throw new ApiError("HTML, CSS and JavaScript must be text.");
  const code: ButtonCode = {
    html: data.html as string,
    css: data.css as string,
    js: data.js as string,
    styling: data.styling === "tailwind" ? "tailwind" : "css",
  };
  const validation = validateButton(code);
  if (!validation.valid) throw new ApiError(validation.errors.join(" "));
  const compiledCss =
    code.styling === "tailwind"
      ? await compileButtonTailwind(code.html, code.js)
      : "";
  return { ...code, compiledCss, validationVersion: 1 };
}
export async function readPayload(request: NextRequest) {
  const raw = await request.text();
  if (raw.length > 310_000)
    throw new ApiError("This submission is too large.", 413);
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new Error();
    return value as Record<string, unknown>;
  } catch {
    throw new ApiError("Invalid submission data.");
  }
}
export function validCategories(value: unknown) {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(value.filter((id) => CATEGORIES.some((item) => item.id === id))),
  ].slice(0, 4);
}
export function apiFailure(error: unknown) {
  return Response.json(
    {
      error:
        error instanceof ApiError
          ? error.message
          : "The request could not be completed. Please try again.",
    },
    { status: error instanceof ApiError ? error.status : 500 },
  );
}
