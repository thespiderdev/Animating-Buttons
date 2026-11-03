import { test } from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "./load-ts.mjs";

const { openSponsorOrder, sponsorOrderStatus, submitSponsorOrder } =
  await loadTs("lib/sponsor-orders.ts");

test("only the verified checkout for this browser can submit brand details once", async (t) => {
  const context = Symbol.for("__cloudflare-context__");
  const previous = globalThis[context];
  const previousKey = process.env.DODO_PAYMENTS_API_KEY;
  const previousMode = process.env.SPONSOR_CHECKOUT_MODE;
  const orders = new Map();
  let writes = 0;
  let status = "processing";
  let sessionId = "cks_fixture";

  process.env.DODO_PAYMENTS_API_KEY = "fixture-key";
  process.env.SPONSOR_CHECKOUT_MODE = "test";
  t.after(() => {
    globalThis[context] = previous;
    for (const [key, value] of [
      ["DODO_PAYMENTS_API_KEY", previousKey],
      ["SPONSOR_CHECKOUT_MODE", previousMode],
    ]) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  globalThis[context] = {
    env: {
      SPONSOR_ORDERS: {
        prepare: (sql) => ({
          bind: (...args) => ({
            first: async () => orders.get(args[0]) ?? null,
            run: async () => {
              if (sql.startsWith("INSERT")) {
                const [hash, session_id, plan, mode] = args;
                orders.set(hash, {
                  session_id,
                  plan,
                  mode,
                  submitted_at: null,
                });
              } else {
                const order = orders.get(args[4]);
                if (order && !order.submitted_at) {
                  order.submitted_at = "fixture-time";
                  writes++;
                }
              }
              return { meta: { changes: 1 } };
            },
          }),
        }),
      },
    },
  };

  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(new URL(url).host, "test.dodopayments.com");
    if (options.method === "POST") {
      const body = JSON.parse(options.body);
      assert.equal(body.product_cart[0].quantity, 1);
      assert.equal(body.metadata.brand, undefined);
      return Response.json({
        session_id: "cks_fixture",
        checkout_url:
          "https://test.checkout.dodopayments.com/session/cks_fixture",
      });
    }
    assert.match(url, /\/checkouts\/cks_fixture$/);
    return Response.json({
      id: sessionId,
      payment_id: "pay_fixture",
      payment_status: status,
    });
  });

  const plan = new FormData();
  plan.set("plan", "gold-monthly");
  plan.set("terms", "accepted");
  const { claim, url } = await openSponsorOrder(plan);
  assert.match(claim, /^[a-f0-9]{64}$/);
  assert.ok(!orders.has(claim));
  assert.equal(new URL(url).host, "test.checkout.dodopayments.com");
  assert.equal((await sponsorOrderStatus("a".repeat(64))).state, "missing");
  assert.equal((await sponsorOrderStatus(claim)).state, "pending");
  const details = new FormData();
  details.set("brand", "Test brand");
  details.set("website", "https://example.com");
  details.set("rights", "confirmed");
  await assert.rejects(submitSponsorOrder(claim, details), /not been verified/);
  status = "succeeded";
  sessionId = "cks_other";
  await assert.rejects(submitSponsorOrder(claim, details), /not been verified/);
  sessionId = "cks_fixture";
  assert.equal((await sponsorOrderStatus(claim)).state, "paid");
  await submitSponsorOrder(claim, details);
  await submitSponsorOrder(claim, details);
  assert.equal(writes, 1);
  assert.equal((await sponsorOrderStatus(claim)).state, "submitted");
});
