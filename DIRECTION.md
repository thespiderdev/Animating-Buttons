# Animating Buttons

## Product
A community collection of animated buttons. Visitors explore live previews, customize HTML/CSS/JavaScript, and copy or download code. Signed-in creators submit and manage contributions; administrators review submissions.

## Stack
Next.js App Router, React, TypeScript, Tailwind CSS, Motion, Firebase Authentication, Firestore, and Monaco Editor.

## Brand
Royal blue #4169E1 and black #000000, with #3155C6 hover and #91ACFF small text accents. The primary logo is a flat, gently tilted blue button face with oval eyes and a smile. The same face becomes a vector or 3D mascot by adding limbs and expression. Brand source and exports live in public/brand and scripts/generate-brand.mjs.

## Content
Only community buttons belong in the public collection. Navigation, metadata, footers, About, Privacy, Terms, and README use the Animating Buttons identity. About explains the project and introduces the button buddy. Privacy describes implemented data flows. Terms describes browsing, code reuse, submissions, moderation, conduct, and previews.

## Routes
Home, /buttons, /show/[id], /add, /user/[userId], /leaderboard, /admin, /about, /privacy, /terms. /components and /explore redirect to /buttons.

## Preservation
Reuse the existing buttons and users Firestore collections. Test reads and local edits without changing production records. Preserve sandboxed previews, GitHub sign-in, likes, editing, downloads, profiles, bio editing, review status, and moderation. Keep environment files out of Git.
