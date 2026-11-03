# Cloudflare deployment

Production runs at [getbuttons.tech](https://getbuttons.tech) on the `getbuttons` Cloudflare Worker. OpenNext serves the application, and Workers Assets serves the imported catalogue.

## Local preview

```sh
npm ci
npm run build:cloudflare
npm run preview:cloudflare
```

Check the homepage, the catalogue, an imported button, and the Sponsors page. The Tailwind workshop uses the same compiler in Next.js and Workers.

## Automatic deploys

Connect `thespiderdev/Animating-Buttons` to the `getbuttons` Worker in Workers Builds. Set the production branch to `main`, the build command to `npm run build:cloudflare`, and the deploy command to `npm run deploy:cloudflare`. Use Node.js 22.

Set the `NEXT_PUBLIC_FIREBASE_*` and `NEXT_PUBLIC_ADMIN_USERS` values from [.env.example](../.env.example) in the build environment. Next.js embeds these public settings at build time. Set server-only options such as `SPONSOR_CHECKOUT_MODE` on the Worker. The build removes copied dotenv files from the Worker artifact.

Authorize `getbuttons.tech` in Firebase Authentication and apply the D1 migration for the lifetime views counter as described in [the analytics guide](seo.md#verify-and-launch).
