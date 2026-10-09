# ronimichaeli.com

Personal site of **Roni Michaeli** — AI-native full-stack developer.

## Stack

- [Astro 5](https://astro.build) — static output, View Transitions between pages, content collections
- React islands only where needed (the ⌘K command menu, animated with Motion)
- Tailwind CSS v4 with design tokens in `src/styles/global.css`
- GSAP + ScrollTrigger and Lenis for scroll-driven effects; an interactive 0/1 binary field that reacts to the cursor and touch
- Self-hosted variable fonts (Inter, Space Grotesk, JetBrains Mono) — no third-party requests

## Working on it

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # static site in dist/
npm run check     # type-check .astro / .ts files
```

## Adding a project

Create `src/content/projects/<slug>.mdx` with the frontmatter used by the other files
(title, tagline, summary, year, order, category, stack, cover, …) and put its images in
`src/assets/projects/<slug>/`. The schema in `src/content.config.ts` validates every field,
and the project automatically appears on the home page (if `featured: true`), on `/projects`,
in the command menu and in the sitemap.

## Deploys

- Push to `main` → `.github/workflows/deploy.yml` builds and publishes to GitHub Pages
  (custom domain in `public/CNAME`).
- Push to any other branch → `.github/workflows/preview.yml` builds it, runs an axe-core
  accessibility scan, takes screenshots and publishes the results to the `ci-preview` branch.

## Accessibility & privacy

Built to WCAG 2.2 AA / IS 5568, with a reduce-motion switch, full keyboard support and no
tracking. See `/accessibility` and `/privacy` on the live site.
