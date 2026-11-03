import { test } from "node:test";
import assert from "node:assert/strict";
import { loadTs } from "./load-ts.mjs";
const { sponsorshipCheckout } = await loadTs("lib/sponsor-checkout.ts");
const { SPONSOR_PLANS, sponsorshipSelection } = await loadTs("lib/sponsors.ts");
process.env.SPONSOR_CHECKOUT_MODE = "test";
function form(plan = "gold-monthly") {
  const data = new FormData();
  for (const [key, value] of Object.entries({
    plan,
    brand: "Fixture product",
    website: "https://example.com",
    logo: "https://example.com/logo.svg",
    terms: "accepted",
  }))
    data.set(key, value);
  return data;
}
test("all six purchase choices map to the correct tier and billing", () => {
  for (const plan of SPONSOR_PLANS)
    for (const billing of ["monthly", "lifetime"]) {
      assert.equal(
        sponsorshipSelection(`${plan.id}-${billing}`).plan[billing],
        plan[billing],
      );
      const url = new URL(sponsorshipCheckout(form(`${plan.id}-${billing}`)));
      assert.equal(url.host, "test.checkout.dodopayments.com");
      assert.equal(url.searchParams.get("metadata_tier"), plan.id);
      assert.equal(url.searchParams.get("metadata_billing"), billing);
    }
});
test("checkout ignores client prices, requests USD and fixes quantity", () => {
  const data = form();
  data.set("price", "1");
  data.set("quantity", "999");
  const url = new URL(sponsorshipCheckout(data));
  assert.equal(url.searchParams.get("quantity"), "1");
  assert.equal(url.searchParams.get("paymentCurrency"), "USD");
  assert.equal(url.searchParams.has("price"), false);
});
test("public brand details are encoded as order metadata and never HTML", () => {
  const data = form();
  data.set("brand", "A & B");
  const url = new URL(sponsorshipCheckout(data));
  assert.equal(url.searchParams.get("metadata_brand"), "A & B");
  assert.equal(
    url.searchParams.get("redirect_url"),
    "https://getbuttons.tech/sponsors/complete",
  );
});
test("invalid plans, private URLs and missing acceptance cannot open checkout", () => {
  for (const [key, value] of [
    ["plan", "gold-free"],
    ["website", "javascript:alert(1)"],
    ["website", "https://127.0.0.1/path"],
    ["brand", "<script>"],
    ["terms", ""],
  ]) {
    const data = form();
    data.set(key, value);
    assert.throws(() => sponsorshipCheckout(data));
  }
});
test("live mode uses verified live products and rejects sandbox IDs", () => {
  const previous = process.env.SPONSOR_CHECKOUT_MODE;
  process.env.SPONSOR_CHECKOUT_MODE = "live";
  try {
    const url = new URL(sponsorshipCheckout(form()));
    assert.equal(url.hostname, "checkout.dodopayments.com");
    assert.match(url.pathname, /pdt_0NqrLOFttkTuAZzZfd6N1/);
    process.env.SPONSOR_GOLD_MONTHLY_PRODUCT_ID = "pdt_0NqrJW4Db708rYSy16kQK";
    assert.throws(() => sponsorshipCheckout(form()), /not configured/);
  } finally {
    delete process.env.SPONSOR_GOLD_MONTHLY_PRODUCT_ID;
    if (previous === undefined) delete process.env.SPONSOR_CHECKOUT_MODE;
    else process.env.SPONSOR_CHECKOUT_MODE = previous;
  }
});
