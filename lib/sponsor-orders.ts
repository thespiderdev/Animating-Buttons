import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { SITE_URL } from "./site";
import { sponsorBrandDetails, sponsorProduct } from "./sponsor-checkout";

export const sponsorClaimCookie = "getbuttons_sponsor_checkout";
export const sponsorClaimMaxAge = 60 * 60 * 24 * 30;
type Mode = "live" | "test";
type Order = {
  session_id: string;
  plan: string;
  mode: Mode;
  submitted_at: string | null;
};
type Statement = {
  bind(...values: string[]): Statement;
  first<T>(): Promise<T | null>;
  run(): Promise<{ meta: { changes: number } }>;
};
type OrdersDatabase = { prepare(sql: string): Statement };

export function paymentFirstEnabled() {
  return Boolean(process.env.DODO_PAYMENTS_API_KEY);
}

async function database() {
  const { env } = await getCloudflareContext({ async: true });
  const db = (env as { SPONSOR_ORDERS?: OrdersDatabase }).SPONSOR_ORDERS;
  if (!db) throw new Error("Sponsor checkout is temporarily unavailable.");
  return db;
}

async function dodo(mode: Mode, path: string, body?: object) {
  const key = process.env.DODO_PAYMENTS_API_KEY;
  if (!key) throw new Error("Sponsor checkout is temporarily unavailable.");
  const response = await fetch(`https://${mode}.dodopayments.com${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${key}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok)
    throw new Error(
      "Dodo Payments is temporarily unavailable. Please try again.",
    );
  return response.json();
}

async function hashClaim(claim: string) {
  return Buffer.from(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(claim)),
  ).toString("hex");
}

export async function openSponsorOrder(form: FormData) {
  const { value, selection, mode, product } = sponsorProduct(form);
  const db = await database();
  const claim = Buffer.from(
    crypto.getRandomValues(new Uint8Array(32)),
  ).toString("hex");
  const session = await dodo(mode, "/checkouts", {
    product_cart: [{ product_id: product, quantity: 1 }],
    billing_currency: "USD",
    return_url: `${SITE_URL}/sponsors/complete`,
    metadata: {
      project: "animating-buttons",
      tier: selection.tier,
      billing: selection.billing,
    },
  });
  const url = new URL(session.checkout_url);
  const expectedHost =
    mode === "live"
      ? "checkout.dodopayments.com"
      : "test.checkout.dodopayments.com";
  if (
    url.protocol !== "https:" ||
    url.host !== expectedHost ||
    url.username ||
    url.password ||
    typeof session.session_id !== "string" ||
    !/^[\w-]{1,128}$/.test(session.session_id)
  )
    throw new Error(
      "Dodo returned an invalid checkout session. Please try again.",
    );

  await db
    .prepare(
      "INSERT INTO sponsor_orders (claim_hash, session_id, plan, mode) VALUES (?, ?, ?, ?)",
    )
    .bind(await hashClaim(claim), session.session_id, value, mode)
    .run();
  return { url: url.toString(), claim };
}

async function readOrder(claim: string | undefined) {
  if (!claim || !/^[a-f0-9]{64}$/.test(claim)) return null;
  const db = await database();
  const hash = await hashClaim(claim);
  const order = await db
    .prepare(
      "SELECT session_id, plan, mode, submitted_at FROM sponsor_orders WHERE claim_hash = ?",
    )
    .bind(hash)
    .first<Order>();
  return order ? { db, hash, order } : null;
}

async function paymentStatus(order: Order) {
  const session = await dodo(
    order.mode,
    `/checkouts/${encodeURIComponent(order.session_id)}`,
  );
  const paid =
    session.id === order.session_id &&
    session.payment_status === "succeeded" &&
    typeof session.payment_id === "string" &&
    /^pay_[\w-]+$/.test(session.payment_id);
  return {
    state: paid
      ? ("paid" as const)
      : ["failed", "cancelled", "canceled"].includes(session.payment_status)
        ? ("failed" as const)
        : ("pending" as const),
    paymentId: paid ? (session.payment_id as string) : null,
  };
}

export async function sponsorOrderStatus(claim: string | undefined) {
  try {
    const result = await readOrder(claim);
    if (!result) return { state: "missing" as const };
    const { order } = result;
    if (order.submitted_at)
      return { state: "submitted" as const, mode: order.mode };
    return { state: (await paymentStatus(order)).state, mode: order.mode };
  } catch {
    return { state: "unavailable" as const };
  }
}

export async function submitSponsorOrder(
  claim: string | undefined,
  form: FormData,
) {
  const result = await readOrder(claim);
  if (!result)
    throw new Error("Open this form in the browser you used to pay.");
  const { db, hash, order } = result;
  if (order.submitted_at) return;
  const { paymentId } = await paymentStatus(order);
  if (!paymentId) throw new Error("Payment has not been verified yet.");
  if (form.get("rights") !== "confirmed")
    throw new Error("Confirm you have rights to share these brand assets.");
  const { brand, website, logo } = sponsorBrandDetails(form);
  await db
    .prepare(
      "UPDATE sponsor_orders SET payment_id = ?, brand = ?, website = ?, logo = ?, submitted_at = CURRENT_TIMESTAMP WHERE claim_hash = ? AND submitted_at IS NULL",
    )
    .bind(paymentId, brand, website, logo, hash)
    .run();
}
