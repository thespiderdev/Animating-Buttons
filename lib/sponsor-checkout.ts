import "server-only";
import { sponsorshipSelection } from "./sponsors";
import { SITE_URL } from "./site";
const TEST_PRODUCTS: Record<string, string> = {
  "silver-monthly": "pdt_0NqrJVx5cQICnBA3ltcYG",
  "silver-lifetime": "pdt_0NqrJVzvery4PowjY2aPk",
  "gold-monthly": "pdt_0NqrJW4Db708rYSy16kQK",
  "gold-lifetime": "pdt_0NqrJW5WPG11ZuxCGJKyS",
  "diamond-monthly": "pdt_0NqrJW8KBfVz99Q6HUEkN",
  "diamond-lifetime": "pdt_0NqrJW9mqlv3MyC2su7fn",
};
const LIVE_PRODUCTS: Record<string, string> = {
  "silver-monthly": "pdt_0NqrLO93JqXNO1A2yv4uI",
  "silver-lifetime": "pdt_0NqrLOCUNYzS5iznbORhy",
  "gold-monthly": "pdt_0NqrLOFttkTuAZzZfd6N1",
  "gold-lifetime": "pdt_0NqrLOIuTl27nnr2ZCRDH",
  "diamond-monthly": "pdt_0NqrLOLmmOEqf0p9JG346",
  "diamond-lifetime": "pdt_0NqrLOQbDIiTMG5UkLcpE",
};
export const sponsorCheckoutMode = () =>
  process.env.SPONSOR_CHECKOUT_MODE === "test" ? "test" : "live";
export function sponsorshipCheckout(form: FormData) {
  const value = String(form.get("plan") || "");
  const selection = sponsorshipSelection(value);
  if (!selection)
    throw new Error("Choose a sponsorship tier and billing option.");
  const brand = String(form.get("brand") || "").trim();
  if (brand.length < 2 || brand.length > 80 || /[<>\u0000-\u001f]/.test(brand))
    throw new Error("Use a brand name of 2 to 80 characters.");
  function publicUrl(value: FormDataEntryValue | null, required: boolean) {
    if (!value && !required) return "";
    if (typeof value !== "string" || value.length > 500)
      throw new Error("Use a public HTTPS website or logo URL.");
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      throw new Error("Use a complete HTTPS website or logo URL.");
    }
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      !url.hostname.includes(".") ||
      /(^localhost$|\.local$|\.internal$|^127\.|^10\.|^192\.168\.|^169\.254\.|^172\.(1[6-9]|2\d|3[01])\.)/i.test(
        url.hostname,
      )
    )
      throw new Error("Use a public HTTPS website or logo URL.");
    return url.toString();
  }
  const website = publicUrl(form.get("website"), true);
  const logo = publicUrl(form.get("logo"), false);
  if (form.get("terms") !== "accepted")
    throw new Error("Read and accept the sponsorship terms before continuing.");
  const mode = sponsorCheckoutMode();
  const configured =
    process.env[
      `SPONSOR_${selection.tier.toUpperCase()}_${selection.billing.toUpperCase()}_PRODUCT_ID`
    ];
  // Sandbox IDs must never be sent to the live checkout host.
  const product =
    configured ||
    (mode === "test" ? TEST_PRODUCTS[value] : LIVE_PRODUCTS[value]);
  if (
    !product ||
    !/^pdt_[A-Za-z0-9]+$/.test(product) ||
    (mode === "live" && Object.values(TEST_PRODUCTS).includes(product))
  )
    throw new Error(
      "This live checkout is not configured yet. Contact the maintainer to arrange your placement.",
    );
  const checkout = new URL(
    `https://${mode === "test" ? "test.checkout" : "checkout"}.dodopayments.com/buy/${product}`,
  );
  checkout.searchParams.set("quantity", "1");
  checkout.searchParams.set("paymentCurrency", "USD");
  checkout.searchParams.set("redirect_url", `${SITE_URL}/sponsors/complete`);
  for (const [key, value] of Object.entries({
    project: "animating-buttons",
    tier: selection.tier,
    billing: selection.billing,
    brand,
    website,
    logo,
  }))
    if (value) checkout.searchParams.set(`metadata_${key}`, value);
  return checkout.toString();
}
