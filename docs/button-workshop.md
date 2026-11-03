# Button workshop

The collection stays focused on individual buttons and small groups of up to six controls. Full document wrappers are supported for older snippets, but new submissions cannot contain pages, navigation, forms, headings, separate copy, embeds, external script tags or external stylesheet links. Validation is structural guidance; moderators still judge whether an interaction belongs in the collection.

## Authoring and preview

Use the HTML, CSS and JavaScript tabs in the Monaco editor. Pick CSS or Tailwind CSS v4. Tailwind utilities are scanned from HTML and JavaScript and compiled by the app server; use complete class names in conditional JavaScript. Custom CSS is appended after the compiled stylesheet. The CSS tab accepts plain CSS, not Tailwind directives such as `@apply`, configuration, plugins or imports. All six starter templates include an interactive or visual button example.

Preview tools change background, viewport width, zoom, disabled state and motion. Wide viewports scroll inside the panel. Restart resets the interaction. Preview overrides and diagnostic scripts are excluded from downloads and copied HTML.

The accessibility quick check inspects rendered controls for accessible names, keyboard reachability, small targets and solid-color text contrast. Complex fills and effects need manual review. Test Tab, Enter, Space, focus appearance and reduced motion yourself. The reduced-motion toggle simulates a motion-free state through overrides; it does not prove the author's code supports the operating-system preference.

## Drafts and collections

Editor changes autosave after a short pause to localStorage. Save draft or Command/Control + S saves immediately. Reopening the same editor offers Restore draft. Choosing another starter or Reset code offers the previous code through Restore draft while the editor stays open. Autosave then tracks your latest editor content. Drafts are specific to the new editor, a button ID, or a remix source.

Use Save to bookmark a button to Favorites. The Saved page creates named collections, adds favorite buttons to them, removes memberships, and imports or exports JSON backups. Imports merge existing entries and memberships. Collections and drafts belong to this browser and origin, without account sync. Clearing browser data removes them. Export collection backups before switching devices or origins.

## Submission API

`POST /api/buttons` accepts a Firebase ID token as a Bearer token and HTML, CSS, JavaScript, styling mode, title and categories. For updates, send the button `id`; for a new remix, send `remixId`. The server verifies the Firebase account and linked GitHub user, checks ownership or administrator status, validates the snippet and compiles Tailwind again. Client-supplied creator names, compiled CSS, moderation status and remix credit are not trusted. New submissions and owner edits enter `pending`; administrators can retain an existing status while editing.

`POST /api/buttons/[id]/review` requires a verified administrator. Approval repeats validation and Tailwind compilation; rejection does not require valid source. `POST /api/buttons/validate` and `POST /api/tailwind` provide editor feedback without saving data.

The API uses the caller's token with the Firestore REST API, so existing Firestore security rules remain in force. It does not use privileged service-account credentials or deploy rules. Other existing SDK operations, such as likes, profiles and deletion, still use the Firebase client. Application validation is not a database-level restriction against clients calling Firestore directly; enforce write access in the deployed rules. Existing approved records are not migrated or retroactively rejected.

The server resolves a linked GitHub numeric ID through GitHub's public API and caches it briefly. Firebase or GitHub unavailability, including GitHub rate limiting, is reported as a retryable save error.

## Downloads and remixes

Downloads include HTML, CSS, JavaScript and a README with creator/source credit. Tailwind utilities are compiled into `style.css`, so the exported example does not need a browser CDN runtime. Copy HTML produces a self-contained document. Remixes start in a separate editor and retain an immutable source button/creator reference when saved, including that credit in downloaded ZIPs.

## Verification

Run `npm test`, `npm run typecheck`, `npm run lint` and `npm run build`. Tests cover legacy preview construction, compiled styles, starter validation, rejected layouts, categories, Tailwind compilation and collection imports. Use a Firebase emulator or disposable development Firebase project to test authenticated saves, owner edits and administrator approval. Do not create test submissions in the production collection.
