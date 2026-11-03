# Sponsorship operations

The `/sponsors` page sells digital brand placement through Dodo Payments hosted checkout. Prices are USD base prices before applicable tax. Dodo can offer local-currency payment and displays the final amount before purchase.

| Tier    | Monthly | Project lifetime | Placement                                                           |
| ------- | ------: | ---------------: | ------------------------------------------------------------------- |
| Silver  |     $19 |        $199 once | Sponsors page and named README credit                               |
| Gold    |     $49 |        $499 once | Larger sponsors-page logo, homepage logo, linked README logo        |
| Diamond |     $99 |        $999 once | Largest sponsors-page logo, prominent homepage and README placement |

Monthly products renew until canceled, with a configured maximum subscription term of twenty years. Cancellation ends future renewals; approved placement lasts through the paid period. Lifetime means the lifetime of this project. The terms describe brand review, rejection/refund handling, and the absence of traffic or ranking guarantees.

## Checkout configuration

`lib/sponsor-checkout.ts` contains verified live and sandbox product IDs. Checkout defaults to live. Set the server environment variable `SPONSOR_CHECKOUT_MODE=test` to use sandbox products and the sandbox banner. Optional `SPONSOR_{SILVER|GOLD|DIAMOND}_{MONTHLY|LIFETIME}_PRODUCT_ID` overrides must belong to the selected environment. The helper rejects known sandbox IDs in live mode.

The six live products are:

| Plan             | Product ID                  |
| ---------------- | --------------------------- |
| Silver monthly   | `pdt_0NqrLO93JqXNO1A2yv4uI` |
| Silver lifetime  | `pdt_0NqrLOCUNYzS5iznbORhy` |
| Gold monthly     | `pdt_0NqrLOFttkTuAZzZfd6N1` |
| Gold lifetime    | `pdt_0NqrLOIuTl27nnr2ZCRDH` |
| Diamond monthly  | `pdt_0NqrLOLmmOEqf0p9JG346` |
| Diamond lifetime | `pdt_0NqrLOQbDIiTMG5UkLcpE` |

The payment-first flow uses Dodo Checkout Sessions. Enable it by applying the database migration and setting a Cloudflare Worker secret for the selected Dodo environment.

```sh
npx wrangler d1 migrations apply getbuttons-sponsor-orders --remote
npx wrangler secret put DODO_PAYMENTS_API_KEY --name getbuttons
```

Keep the key out of source control and build variables. With no key, the existing hosted checkout remains available and collects brand details before payment.

With a key, buyers choose their plan and accept terms, then pay on Dodo. The same browser can return to `/sponsors/complete` for 30 days. The app reads the stored session from Dodo before showing the form and again before saving. The URL status is ignored. Brand name, website and optional logo are stored in D1 only after a successful payment, and still require manual approval.

View submitted live orders from the private D1 console with:

```sql
SELECT plan, payment_id, brand, website, logo, submitted_at
FROM sponsor_orders
WHERE mode = 'live' AND submitted_at IS NOT NULL
ORDER BY submitted_at DESC;
```

If the buyer loses the browser cookie, verify the Dodo receipt privately and collect their brand details through the established support contact. Sandbox submissions are excluded from live review.

## Publish a paid sponsor

Fulfillment currently requires a maintainer review; there is no webhook that automatically publishes sponsors.

1. In Dodo, verify the payment succeeded and matches an Animating Buttons product, expected amount, tier, and billing period. For recurring plans verify the subscription status and actual paid-through date. Treat metadata as untrusted buyer input and confirm product identity independently.
2. Review the destination website, brand rights, and logo. Contact the purchaser through the order details if anything needs correction. Follow the sponsorship terms for rejected or unfulfilled orders and process any refund through Dodo.
3. Add the approved brand to `ACTIVE_SPONSORS` in `lib/sponsors.ts`. Use a reviewed HTTPS destination and optional logo. For monthly placements set `paidThrough` to the verified ISO timestamp; lifetime entries do not need an expiry.
4. Add the promised tier-specific credit/logo to the README Sponsors section. The sponsor wall automatically includes Gold and Diamond brands on the homepage, and all tiers on the sponsors page. Website links are labeled with `rel="sponsored"`.
5. Deploy the reviewed placement. After each successful renewal update `paidThrough` and deploy. The server filters expired monthly website placements; remove expired README credits manually. Canceling a subscription must not remove an already-paid placement early. Refunds, disputes, and brand violations require a maintainer decision under the terms.

Keep this review process staffed before promoting sponsorship sales. The app intentionally begins with no claimed sponsors. Customer payment details remain with Dodo Payments.
