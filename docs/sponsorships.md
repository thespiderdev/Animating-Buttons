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

The application does not need a Dodo API key at runtime. The server validates the selected plan, brand name, public HTTPS website/logo URLs, and terms acceptance, then redirects to the matching hosted product with quantity one. Prices come from the Dodo product, never a client-submitted amount. Order metadata carries `project`, `tier`, `billing`, `brand`, `website`, and optional `logo` values. These brand details are intended for review and eventual public display.

The completion page is informational. Visiting it, changing query parameters, or editing checkout metadata never activates a placement or proves payment.

## Publish a paid sponsor

Fulfillment currently requires a maintainer review; there is no webhook that automatically publishes sponsors.

1. In Dodo, verify the payment succeeded and matches an Animating Buttons product, expected amount, tier, and billing period. For recurring plans verify the subscription status and actual paid-through date. Treat metadata as untrusted buyer input and confirm product identity independently.
2. Review the destination website, brand rights, and logo. Contact the purchaser through the order details if anything needs correction. Follow the sponsorship terms for rejected or unfulfilled orders and process any refund through Dodo.
3. Add the approved brand to `ACTIVE_SPONSORS` in `lib/sponsors.ts`. Use a reviewed HTTPS destination and optional logo. For monthly placements set `paidThrough` to the verified ISO timestamp; lifetime entries do not need an expiry.
4. Add the promised tier-specific credit/logo to the README Sponsors section. The sponsor wall automatically includes Gold and Diamond brands on the homepage, and all tiers on the sponsors page. Website links are labeled with `rel="sponsored"`.
5. Deploy the reviewed placement. After each successful renewal update `paidThrough` and deploy. The server filters expired monthly website placements; remove expired README credits manually. Canceling a subscription must not remove an already-paid placement early. Refunds, disputes, and brand violations require a maintainer decision under the terms.

Keep this review process staffed before promoting sponsorship sales. The app intentionally begins with no claimed sponsors. Customer payment details remain with Dodo Payments.
