# devdemello.com Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a premium, Apple-grade personal-brand website for Guilherme de Mello (Senior iOS Engineer) — Astro static site, deployed to GitHub Pages at devdemello.com.

**Architecture:** Astro static-output site. Plain CSS with custom-property design tokens (no Tailwind). Near-zero JS: vanilla TS for theme, scroll reveals, and the hero scrub. Markdown content collection for the blog. Native CSS scroll-driven animations for the signature hero; `IntersectionObserver` reveals elsewhere. Auto-deploy via GitHub Actions.

**Tech Stack:** Astro (latest), TypeScript, plain CSS, Shiki (built-in), Google Fonts (Instrument Serif / Inter / JetBrains Mono), GitHub Pages + Actions.

## Global Constraints

- **Full design reference:** `plan.md` (project root, gitignored) is the source of truth for all exact values — copy from it; do not invent.
- **Colors:** accent `#F05138`; accent-soft `#FF8A5B`; accent-ink `#C2371F`. Dark: bg `#0B0B0C`, surface `#141416`, surface-2 `#1C1C1E`, text `#F5F5F7`, muted `#A1A1A6`, dim `#8A8A8E`, border `rgba(255,255,255,.10)`. Light: bg `#FFFFFF`, surface `#F5F5F7`, surface-2 `#ECECEE`, text `#1D1D1F`, muted `#515154`, dim `#86868B`, border `rgba(0,0,0,.10)`.
- **Fonts:** Instrument Serif (display headlines, italic for accent word), Inter (body/UI), JetBrains Mono (labels/code/dates).
- **Theme:** system-aware via `prefers-color-scheme` + manual toggle persisted to `localStorage` key `theme`; no-FOUC inline `<head>` script.
- **Motion:** every animation must respect `@media (prefers-reduced-motion: reduce)`. Easing tokens: `--ease-out: cubic-bezier(0.22,1,0.36,1)`, `--ease-in-out: cubic-bezier(0.65,0,0.35,1)`.
- **Deploy:** GitHub Pages via Actions; custom domain `devdemello.com`; `public/CNAME` = `devdemello.com`.
- **Verification model:** each task's "test" gate = `npm run build` succeeds with no errors AND the relevant page renders correctly in `npm run dev` (visual check). No unit-test framework for this presentational site.
- **Commits:** frequent, conventional-commit style, one per task minimum.

---

## File Structure

| File | Responsibility |
|---|---|
| `astro.config.mjs` | Astro config: `site: 'https://devdemello.com'`, Shiki dual theme. |
| `src/styles/tokens.css` | All design tokens (color/type/spacing/easing) for both themes. |
| `src/styles/global.css` | Resets, base element styles, typography, utility classes. |
| `src/styles/syntax.css` | Code-block + hero syntax colors. |
| `src/layouts/BaseLayout.astro` | `<head>`, fonts, no-FOUC theme script, Nav, Footer, page `<slot>`. |
| `src/layouts/BlogPostLayout.astro` | Blog post chrome: progress bar, prose width, meta. |
| `src/components/Nav.astro` | Sticky nav + links + ThemeToggle. |
| `src/components/ThemeToggle.astro` | Light/dark toggle button. |
| `src/components/Footer.astro` | Footer with monogram + links. |
| `src/components/Hero.astro` | Signature sticky-pin scrub hero. |
| `src/components/Reveal.astro` | Scroll-reveal wrapper (adds `.reveal`). |
| `src/components/StackStrip.astro` `WorkCard.astro` `StatBand.astro` `WritingTeaser.astro` `ContactLinks.astro` `Timeline.astro` `SpeakingList.astro` `TagFilter.astro` | Section/content components. |
| `src/scripts/theme.ts` `reveal.ts` `nav.ts` `smooth-scroll.ts` `hero-tilt.ts` | Client behaviors. |
| `src/pages/index.astro` `about.astro` `contact.astro` `404.astro` | Pages. |
| `src/pages/blog/index.astro` `blog/[...slug].astro` | Blog index + post route. |
| `src/content/config.ts` + `src/content/blog/*.md` | Blog collection schema + posts. |
| `public/CNAME` `public/favicon.svg` `public/cv/` `public/images/` | Static assets. |
| `.github/workflows/deploy.yml` | CI/CD to GitHub Pages. |

---

## Task 1: Scaffold Astro project

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `src/pages/index.astro`, `.nvmrc`

**Interfaces:**
- Produces: a runnable Astro dev server; `src/pages/index.astro` placeholder.

- [ ] **Step 1: Initialize Astro (empty template, TypeScript)** in the existing repo directory.

```bash
npm create astro@latest -- --template minimal --typescript strict --no-install --no-git --yes .
```
If the directory-not-empty prompt blocks, scaffold into a temp dir and move files in, preserving existing `.git`, `.gitignore`, `plan.md`, `docs/`, `.claude/`.

- [ ] **Step 2: Install dependencies**

```bash
npm install
```

- [ ] **Step 3: Set `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://devdemello.com',
  markdown: {
    shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' } },
  },
});
```

- [ ] **Step 4: Pin Node version** — create `.nvmrc` with `lts/*` (CI uses Node 20+).

- [ ] **Step 5: Verify build + dev**

Run: `npm run build` → Expected: completes, `dist/index.html` exists.
Run: `npm run dev` → open `http://localhost:4321` → Expected: placeholder page renders.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "chore: scaffold Astro project"
```

---

## Task 2: Design tokens + global styles + fonts

**Files:**
- Create: `src/styles/tokens.css`, `src/styles/global.css`, `src/styles/syntax.css`

**Interfaces:**
- Produces: CSS custom properties consumed by every component; classes `.container`, `.section`, `.eyebrow`, `.serif`, `.mono`, `.btn`, `.btn-solid`, `.btn-ghost`, `.accent`.

- [ ] **Step 1: Write `tokens.css`** with `:root` (light defaults) and `:root[data-theme="dark"]` blocks containing every color token from Global Constraints, plus type scale (`--fs-display: clamp(2.5rem,6vw,4.5rem)`, `--fs-h2: clamp(1.9rem,4vw,3rem)`, `--fs-h3:1.25rem`, `--fs-body:1.0625rem`, `--fs-small:.8125rem`, `--fs-mono-label:.6875rem`), spacing scale, radii (`--r-card:14px`, `--r-frame:18px`, `--r-pill:999px`), and easing/duration tokens. Accent tokens shared (outside theme blocks).

- [ ] **Step 2: Write `global.css`** — modern reset, `font-family` defaults (Inter body), `.serif` (Instrument Serif), `.mono` (JetBrains Mono), heading sizes from tokens, `body { background: var(--bg); color: var(--text); }`, `.container { max-width:1100px; margin-inline:auto; padding-inline:clamp(1.25rem,5vw,2rem); }`, `.section { padding-block: clamp(3rem,8vw,6rem); }`, `.eyebrow` (mono uppercase + `--text-dim`), `.accent { color: var(--accent); }`, button styles (`.btn`, `.btn-solid`, `.btn-ghost`) with hover `translateY(-2px)`, and a `prefers-reduced-motion` block disabling transitions/animations globally.

- [ ] **Step 3: Write `syntax.css`** with the six syntax colors as variables for hero use, and overrides so Shiki blocks blend with `--surface`.

- [ ] **Step 4: Verify** — temporarily import all three in `index.astro` via a test layout; `npm run dev`; confirm fonts load and a sample `<h1 class="serif">` + `.btn-solid` render with correct colors in both themes (toggle OS appearance).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: design tokens, global styles, fonts"
```

---

## Task 3: BaseLayout + Nav + ThemeToggle + Footer (theme system)

**Files:**
- Create: `src/layouts/BaseLayout.astro`, `src/components/Nav.astro`, `src/components/ThemeToggle.astro`, `src/components/Footer.astro`, `src/scripts/theme.ts`, `src/scripts/nav.ts`, `public/favicon.svg`

**Interfaces:**
- Consumes: styles from Task 2.
- Produces: `<BaseLayout title description>` wrapping all pages; `data-theme` attribute on `<html>`; nav with `.scrolled` behavior.

- [ ] **Step 1: No-FOUC theme script** — in `BaseLayout.astro` `<head>`, inline (runs before paint):

```html
<script is:inline>
  const t = localStorage.getItem('theme')
    || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.dataset.theme = t;
</script>
```

- [ ] **Step 2: `BaseLayout.astro`** — `<html lang="en">`, `<head>` with meta (title/description props, viewport, og placeholders, favicon link, Google Fonts preconnect + stylesheet for the three families, import the three CSS files), `<body>` with `<Nav />`, `<slot />`, `<Footer />`.

- [ ] **Step 3: `ThemeToggle.astro` + `theme.ts`** — button (sun/moon SVG) that flips `document.documentElement.dataset.theme`, writes `localStorage.theme`. `theme.ts` wires the click.

- [ ] **Step 4: `Nav.astro` + `nav.ts`** — sticky top nav: `GM.` monogram (orange period) left; links Work/About/Blog/Contact; ThemeToggle right. `nav.ts` toggles `.scrolled` (blur + bg) past `scrollY > 60`, `{ passive: true }`. Mobile: hamburger toggling a menu.

- [ ] **Step 5: `Footer.astro`** — monogram, short tagline, links (LinkedIn/GitHub/GemTechLabs placeholders), © line.

- [ ] **Step 6: `favicon.svg`** — minimal `GM.` monogram SVG with orange dot.

- [ ] **Step 7: Wire `index.astro` to use `BaseLayout`. Verify** — `npm run dev`: nav sticky + blurs on scroll, theme toggle flips and persists across reload, no theme flash on load. `npm run build` passes.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: base layout, nav, theme toggle, footer"
```

---

## Task 4: Scroll-reveal system + smooth scroll

**Files:**
- Create: `src/components/Reveal.astro`, `src/scripts/reveal.ts`, `src/scripts/smooth-scroll.ts`

**Interfaces:**
- Produces: `<Reveal>` wrapper adding `.reveal`; `reveal.ts` observer adding `.visible` with stagger; consumed by all section components.

- [ ] **Step 1: `Reveal.astro`** — renders a wrapper element with class `reveal` around its `<slot />`; optional `as` prop for element tag.

- [ ] **Step 2: CSS** (add to `global.css`): `.reveal{opacity:0;transform:translateY(40px);transition:opacity var(--dur-reveal) var(--ease-out),transform var(--dur-reveal) var(--ease-out);} .reveal.visible{opacity:1;transform:none;}` + reduced-motion: `.reveal{opacity:1;transform:none;transition:none;}`.

- [ ] **Step 3: `reveal.ts`**

```ts
const obs = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    const sibs = [...(e.target.parentElement?.querySelectorAll('.reveal') ?? [])];
    (e.target as HTMLElement).style.transitionDelay = `${sibs.indexOf(e.target) * 0.1}s`;
    e.target.classList.add('visible');
    obs.unobserve(e.target);
  }
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach((el) => obs.observe(el));
```

- [ ] **Step 4: `smooth-scroll.ts`** — intercept `a[href^="#"]`, `scrollTo` target top minus 80px offset, `behavior:'smooth'`.

- [ ] **Step 5: Verify** — wrap a few test blocks on `index.astro` in `<Reveal>`; scroll → they fade/slide up with stagger; reduced-motion shows them instantly.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: scroll-reveal system + smooth scroll"
```

---

## Task 5: Signature hero (sticky-pin scrub)

**Files:**
- Create: `src/components/Hero.astro`, `src/scripts/hero-tilt.ts`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: tokens, syntax colors.
- Produces: `<Hero />` — the pinned scroll moment.

- [ ] **Step 1: Markup** — port the validated structure from `.superpowers/brainstorm/.../pinned-scrub.html`: a `.hero-track` (~200vh) containing a `position:sticky; top:0` `.hero-pin` with left text column (eyebrow, serif headline with italic orange "*inevitable.*", lead, CTAs, scroll hint) and right `.stage` holding the `FoodScore.swift` code card and the floating iPhone (ring `87`, three nutrient bars).

- [ ] **Step 2: Scroll-driven CSS** — code card: `animation: codeOut linear both; animation-timeline: scroll(nearest); animation-range: 2% 50%;` (fade+scale+blur out). Phone: `phoneIn` over `38% 72%` (fade+scale in). Glow + device pulse: separate time-based infinite keyframes (`~3.2s`). Include `@supports not (animation-timeline: scroll())` fallback (static formed app) and `prefers-reduced-motion` (skip to formed app, stop pulses).

- [ ] **Step 3: `hero-tilt.ts`** — on pointer move over `.stage`, apply small `rotateX/rotateY` transform to the phone toward cursor; disabled on touch (`matchMedia('(pointer:coarse)')`) and reduced-motion.

- [ ] **Step 4: Mobile** — media query: collapse the 200vh pin to a normal-height hero; trigger a one-shot code→app morph via `IntersectionObserver` instead of scrub.

- [ ] **Step 5: Verify** — `npm run dev`: scrolling pins the hero, scrubs code→pulsing app, then releases; cursor tilts the phone; reduced-motion + narrow viewport behave per spec. `npm run build` passes.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: signature sticky-pin scrub hero"
```

---

## Task 6: Home remaining sections

**Files:**
- Create: `src/components/StackStrip.astro`, `WorkCard.astro`, `StatBand.astro`, `WritingTeaser.astro`, `ContactLinks.astro`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `<Reveal>`, tokens, blog collection (for WritingTeaser — may stub until Task 8, then wire real `getCollection('blog')`).
- Produces: `<ContactLinks />` reused by Contact page (Task 10).

- [ ] **Step 1: `StackStrip.astro`** — mono strip of tech keywords (Swift/SwiftUI/Concurrency/Combine/Clean Arch/Claude API/Foundation Models/CI/CD), accent on Swift + Claude API.

- [ ] **Step 2: `WorkCard.astro`** — props `{title, blurb, meta, href, image?}`; image placeholder if none. Use on index for FoodLens (+ App Store href), Jornada, Slope Verification @ EIDA, and a "View all →" card.

- [ ] **Step 3: `StatBand.astro`** — 4 stats: `6+` years, `99%+` crash-free, `WWDC25`, `iOSDevUK` (Sept 2026), serif numbers, accent highlights.

- [ ] **Step 4: `WritingTeaser.astro`** — shows latest 3 posts (title/excerpt/date) linking to /blog; reads `getCollection('blog')` sorted by `pubDate` desc (stub array until Task 8).

- [ ] **Step 5: `ContactLinks.astro`** — link rows (LinkedIn, GitHub `guilhermemello07`, GemTechLabs — placeholders) with hover-slide + orange `→`, and the **Download CV** primary button → `/cv/GuilhermeMello-CV.pdf`.

- [ ] **Step 6: Assemble `index.astro`** — Hero, then sections 2–6 each wrapped in `<Reveal>` with eyebrow labels, in order.

- [ ] **Step 7: Verify** — full homepage scrolls with reveals; all links present; build passes.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: homepage sections (stack, work, stats, writing, contact)"
```

---

## Task 7: About page

**Files:**
- Create: `src/pages/about.astro`, `src/components/Timeline.astro`, `src/components/SpeakingList.astro`

**Interfaces:**
- Consumes: `<BaseLayout>`, `<Reveal>`, tokens. Content from `plan.md` §8 (CV).

- [ ] **Step 1: `Timeline.astro`** — vertical timeline, orange node markers; props `items: {when, role, org, place, note}[]`. Populate: MM Trade (2020–21), Cabo Frio City Hall (2021–23), GEM TechLabs (2022–present), EIDA Solutions Dublin (2024–present).

- [ ] **Step 2: `SpeakingList.astro`** — upcoming highlighted (iOSDevUK, Sept 2026), WWDC25 invitation, community talks.

- [ ] **Step 3: `about.astro`** — intro (monogram/abstract visual placeholder + name + positioning paragraph), `<Timeline>`, `<SpeakingList>`, highlight chips (WWDC25, iOSDevUK speaker, B.Sc. CS ATU expected 2027, Hacking with Swift+ 4y). Each block in `<Reveal>`. (Book intentionally omitted.)

- [ ] **Step 4: Verify** — `/about` renders, timeline + speaking + chips correct, reveals work, both themes OK, build passes.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: about page with timeline and speaking"
```

---

## Task 8: Blog content collection + index + tag filter

**Files:**
- Create: `src/content/config.ts`, `src/components/TagFilter.astro`, `src/pages/blog/index.astro`, `src/content/blog/hello.md` (sample, `draft:false`)
- Modify: `src/components/WritingTeaser.astro` (wire real collection)

**Interfaces:**
- Produces: `blog` collection with schema `{title, description, pubDate, tags[], draft}`; consumed by index, post route, and WritingTeaser.

- [ ] **Step 1: `content/config.ts`** — define `blog` collection with zod schema (fields above; `draft` default false).

- [ ] **Step 2: Sample post** `hello.md` with valid frontmatter + a heading, paragraph, and a Swift code block (to exercise Shiki). This is replaced by Guilherme's real 1–2 posts before launch.

- [ ] **Step 3: `blog/index.astro`** — `getCollection('blog', ({data}) => !data.draft)`, sort by `pubDate` desc; render heading, `<TagFilter>`, and list rows (date · title · excerpt) each in `<Reveal>`.

- [ ] **Step 4: `TagFilter.astro`** — derive unique tags; render All + tag pills; client TS filters visible rows by `data-tags` (no reload). Reduced-motion safe.

- [ ] **Step 5: Wire `WritingTeaser`** to the real collection (latest 3).

- [ ] **Step 6: Verify** — `/blog` lists the sample post, tag filter shows/hides rows, homepage WritingTeaser shows it; build passes.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: blog collection, index, tag filter"
```

---

## Task 9: Blog post layout (reading view)

**Files:**
- Create: `src/layouts/BlogPostLayout.astro`, `src/pages/blog/[...slug].astro`, `src/scripts/progress.ts`

**Interfaces:**
- Consumes: `blog` collection, Shiki (config from Task 1).
- Produces: rendered post pages at `/blog/<slug>`.

- [ ] **Step 1: `[...slug].astro`** — `getStaticPaths` from `getCollection('blog')`; render `entry.render()` body inside `BlogPostLayout`, passing frontmatter + computed read-time (words/200).

- [ ] **Step 2: `BlogPostLayout.astro`** — top orange **scroll-progress bar**, meta line (tag · read-time · formatted date), `.prose` container (max-width 720px, generous line-height), Shiki code-block styling via `syntax.css`, back-to-blog link.

- [ ] **Step 3: `progress.ts`** — update progress-bar width from scroll position; `{passive:true}`; reduced-motion still updates width (no smoothing needed).

- [ ] **Step 4: Verify** — open the sample post: progress bar tracks scroll, code block highlighted in both themes, read-time shown, prose comfortable; build passes.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: blog post reading layout with progress bar"
```

---

## Task 10: Contact page

**Files:**
- Create: `src/pages/contact.astro`

**Interfaces:**
- Consumes: `<ContactLinks />` (Task 6), `<BaseLayout>`, `<Reveal>`.

- [ ] **Step 1: `contact.astro`** — centered editorial headline ("Building something native?"), lead line ("Open to senior iOS roles, freelance, and speaking."), `<ContactLinks />` (LinkedIn, GitHub, GemTechLabs, Download CV). No form, no email.

- [ ] **Step 2: Verify** — `/contact` renders; Download CV links to `/cv/GuilhermeMello-CV.pdf` (add a placeholder PDF in `public/cv/` so the link resolves); both themes OK; build passes.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: contact page"
```

---

## Task 11: SEO, meta, favicon, OG, 404

**Files:**
- Modify: `src/layouts/BaseLayout.astro`
- Create: `src/pages/404.astro`, `public/images/og.png` (placeholder)

**Interfaces:**
- Consumes: `site` from config.

- [ ] **Step 1: Meta** — in `BaseLayout`, add canonical URL, Open Graph + Twitter card tags (title/description/image `/images/og.png`), `theme-color`, and per-page `title`/`description` props already threaded.

- [ ] **Step 2: `404.astro`** — on-brand "Not found" page (serif headline, link home) using `BaseLayout`.

- [ ] **Step 3: Verify** — view-source shows correct meta on home/about/blog/post; `/nonexistent` renders 404 in dev preview of `dist`; build passes.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: SEO meta, OG tags, 404 page"
```

---

## Task 12: Deployment to GitHub Pages + custom domain

**Files:**
- Create: `.github/workflows/deploy.yml`, `public/CNAME`

**Interfaces:**
- Consumes: built `dist/`.

- [ ] **Step 1: `public/CNAME`** — single line `devdemello.com`.

- [ ] **Step 2: `deploy.yml`** — official Astro Pages workflow: trigger on push to `main`; jobs use `withastro/action@v3` then `actions/deploy-pages@v4`; set `permissions: { contents: read, pages: write, id-token: write }` and `concurrency`.

```yaml
name: Deploy to GitHub Pages
on:
  push: { branches: [main] }
  workflow_dispatch:
permissions: { contents: read, pages: write, id-token: write }
concurrency: { group: pages, cancel-in-progress: false }
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: withastro/action@v3
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: { name: github-pages, url: '${{ steps.deployment.outputs.page_url }}' }
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 3: Repo settings (manual, document for user)** — GitHub repo → Settings → Pages → Source = **GitHub Actions**. After first deploy, set custom domain `devdemello.com` and enable **Enforce HTTPS**.

- [ ] **Step 4: DNS (manual, document for user)** — at registrar: apex A records `185.199.108.153/109.153/110.153/111.153` (+ AAAA), `www` CNAME → `guilhermemello07.github.io`.

- [ ] **Step 5: Verify** — push to `main`; Actions run green; site live at the Pages URL, then `devdemello.com` after DNS propagation.

- [ ] **Step 6: Commit** (workflow + CNAME committed as part of the push above).

---

## Self-Review

**Spec coverage (against `plan.md`):**
- §2 stack → Task 1. §3 tokens/type/monogram → Tasks 2,3. §4 theming → Task 3. §5.1 Home → Tasks 5,6. §5.2 About → Task 7. §5.3 Blog → Tasks 8,9. §5.4 Contact → Tasks 6,10. §6 structure/schema → Tasks 1,8. §7 animation (hero/reveals/nav/micro) → Tasks 4,5, plus nav in 3. §9 deploy → Task 12. §10 out-of-scope respected (no form/CMS/book/testimonials/now/analytics). §11 open items handled via placeholders (CV PDF in Task 10, URLs in Tasks 3/6, posts in Task 8). ✅ No gaps.
- **Placeholder scan:** content placeholders (URLs, CV PDF, real posts) are explicit deliverables in §11, not plan gaps; all code steps contain real code. ✅
- **Type consistency:** `getCollection('blog')` schema fields consistent across Tasks 6/8/9; `<ContactLinks />` defined in Task 6, reused in Task 10; `Reveal`/`.reveal`/`.visible` consistent across Tasks 4–10. ✅

---

*Plan complete.*
