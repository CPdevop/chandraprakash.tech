# Chandraprakash Jha — Portfolio Site

A static, single-page portfolio built with plain HTML/CSS/JS (no build step, no framework, no external dependencies).

## Files

```
index.html        Page content and structure
css/styles.css     Design system + all styling/animation
js/main.js         Nav toggle, scroll reveal, counters
assets/            Put your photo and OG image here
```

## Before you publish, one thing left to fill in

| Placeholder | Location | What to do |
|---|---|---|
| `assets/profile.jpg` | `index.html` (hero) | Add your professional photo at `assets/profile.jpg`. Until it exists, the hero shows a clean fallback (initials + animated network) so the page still looks intentional. A portrait-oriented photo (4:5), well-lit, with a plain background works best with the frame. |
| `assets/og-image.jpg` | `index.html` `<head>` | Optional: add a 1200x630 social preview image. Page works fine without it. |
| `assets/favicon.svg` / `.ico` | `index.html` `<head>` | Optional: the site currently ships a small inline SVG favicon (a node/graph mark) so nothing is missing. Swap for your own if you'd like. |

Everything else is filled in: email (`hello@chandraprakash.tech`), LinkedIn, and phone are already live in the contact section. The Technical Expertise cards list a suggested, common data engineering toolset (SQL, Python, Airflow, dbt, Spark, Kafka, and similar) — edit those directly in `index.html` to match the tools you've actually used.

## Editing content

- All copy lives in `index.html`, organized by `<section>` with clear id names (`#home`, `#what-i-do`, `#experience`, `#problems`, `#approach`, `#skills`, `#contact`).
- Colors, spacing, and type scale are CSS variables at the top of `css/styles.css` (`:root`) — change the palette there instead of hunting through individual rules.
- Animations respect `prefers-reduced-motion` automatically.

## Deploying

This is a static site — any static host works. A few options:

- **Netlify / Vercel**: drag-and-drop the folder, or connect the repo. No build command needed.
- **GitHub Pages**: push to a repo, enable Pages on the branch/root.
- **Cloudflare Pages**: same as above, no build step.

No `npm install`, no bundler, no server-side code required.

## Local preview

Just open `index.html` in a browser, or serve it locally:

```bash
npx serve .
# or
python -m http.server 8000
```
