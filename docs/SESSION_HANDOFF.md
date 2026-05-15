# Session handoff — LLM OpenProblems, Phase 1 mid-stream

> Paste the **entire fenced block below** into a fresh Claude Code session opened at `c:\opensource\OpenProblems`. The new session will read the constitution + auto-memory + recent CHANGELOG and resume from the next unit (Unit 1.9 — Search palette).

```
You're picking up a multi-month project at the working directory `c:\opensource\OpenProblems`. Read MASTER_PROMPT.md end-to-end first — it's the project constitution. Then read these in order:

1. The auto-memory entries (loaded automatically) — `project_llm_openproblems.md` and `feedback_unit_rhythm.md` cover what this project is and how the user wants you to work.
2. The last ~140 lines of `CHANGELOG.md` — every Phase 0 + Phase 1 unit landed so far is documented there with file paths and rationale.
3. `OPEN_QUESTIONS.md` — Q1, Q4, Q5, Q12, Q13 are decided; everything else is open.
4. `git log --oneline -22` — commit history.
5. The most recent `docs/thinking/1.*-*.md` for context on the Phase 1 cadence.

## Where we are

Phase 0 (Foundation) is fully committed — 13 units, the last at `62eb8eb`. Phase 1 (Core MVP) is 10 unit commits in:

  1.0 license / brand / accent             — 8e288ac   done
  1.1 Velite content pipeline (ADR-0002)   — a1edf22   done   ★ critical-path
  1.2 dark-mode toggle (persisted)         — e5c0252   done
  1.3 methodology v1.0.0 + MDX pipeline    — 270021f   done
  1.4 first seed problem (hallucination-   — 0bc0600   done   ★ critical-path
      reduction): YAML + 3 MDX + rating
  1.5 RatingRadar v1                       — c6cb9f5   done   ★ critical-path
  1.6 problem detail /problems/[slug]      — 6f377b4   done   ★ critical-path
      (10-block §9 layout)
  1.7 domain hub pages (3 routes)          — 1ae967a   done
  1.8 problems index w/ filter + sort      — 24be582   done
  1.9 search palette (Fuse.js + Cmd/⌃-K)   — NEXT
  1.10 landing page v1                     — pending
  1.11 author 5–9 more seed problems §16   — pending
  1.12 Phase 1 acceptance gate             — pending

## Unit 1.9 — Search palette (next)

§13 Phase 1 says: "Search via Fuse.js — Cmd/Ctrl+K palette". §5.6 specifies Fuse.js over a pre-built JSON index (problems + papers + authors), client-side, ~100 KB gz acceptable for 500 records.

In Phase 1 we only have problems (papers + authors arrive in Phase 2). The palette searches `problems` by title, subtitle, tags, domain title, subdomain title. Walk:

  1. Write the THINK doc at `docs/thinking/1.9-search-palette.md` covering:
     - Inputs (§5.6, §13 deliverable, existing `IndexedProblem` shape).
     - Constraints (client-side; ⌘K / ⌃K keyboard; ESC to close; arrow-key
       nav; mounted via Provider so every page can open it).
     - Alternatives (Fuse.js — chosen — vs cmdk/kbar; cmdk has nicer UX
       primitives but Fuse.js is in the master prompt; combine them:
       cmdk for keyboard + UI, Fuse for ranking).
     - Edge cases (empty index; SSR — palette renders nothing pre-mount;
       palette open state survives navigation; Cmd-K on Mac vs Ctrl-K on
       PC; screen-reader announcement).
  2. `pnpm add fuse.js cmdk` (cmdk is the de-facto command-palette
     primitive in shadcn/ui's ecosystem).
  3. `lib/search/build-index.ts` — exported `searchIndex` derived from
     Velite's `problems` (and ready to extend with papers + authors in
     Phase 2). Each record: `{ kind: "problem", slug, title, subtitle?,
     tags, domainTitle, subdomainTitle, status, href }`.
  4. `components/search-palette/index.tsx` — client component:
     - `cmdk` <Command.Dialog> opened by `useEffect` keyboard listener
       on `(e.metaKey || e.ctrlKey) && e.key === 'k'`.
     - Fuse instance memoised with keys `["title", "subtitle", "tags",
       "domainTitle", "subdomainTitle"]`, weights favoring title.
     - Renders top ~8 results; arrow-key nav handled by cmdk.
     - Enter or click navigates via `next/navigation`'s `useRouter`.
     - Show keyboard hint `⌘K` next to a search icon trigger button
       that's also clickable (place that trigger in the future global
       header — for now, on the home page near the dark-mode toggle).
  5. `components/search-palette/provider.tsx` — wraps children so the
     palette is mounted once at the app root.
  6. Wire in `app/layout.tsx` alongside `<ThemeProvider>`.
  7. Smoke: `pnpm typecheck && pnpm build && pnpm test && pnpm
     validate-content`. Confirm route bundle on `/` doesn't blow past
     the 180 kB problem-detail budget — Fuse.js is ~9 KB gz; cmdk is
     ~6 KB gz.
  8. Append a Unit 1.9 entry to `CHANGELOG.md` below the Unit 1.8
     entry; commit `chore(phase-1): unit 1.9 — Fuse.js search palette
     (⌘K / ⌃K)` with the Co-Authored-By trailer.

## Remaining Phase 1 units after 1.9

  1.10 — Landing page v1: hero, "Recently rated" carousel (problems
         sorted by rating-action date desc, top 3–5), by-domain tile
         grid, methodology link. The dark-mode toggle should move into
         a shared header at this point. /domains tile-grid already
         exists from 1.1/1.7; the landing page reuses it as a section.
  1.11 — Author seed problems 2–10 from MASTER_PROMPT §16. Each gets
         the same folder shape Unit 1.4 set: `problem.yaml` + 3 MDX +
         one initial rating-action YAML. Hit the §13 Phase 1 floor
         of "6–10 fully authored problems". Numbers are TODO(curate)
         (§15.6 "never invent leaderboard numbers").
  1.12 — Phase 1 acceptance gate: Lighthouse perf/a11y/SEO ≥ 95 on
         /, /problems/[any-slug], /domains/[any]; Playwright smoke
         (landing → domain → subdomain → problem → leaderboard);
         visual-regression baselines for the RatingRadar Storybook
         stories captured into the Playwright snapshots.

## Working rhythm (feedback memory)

  - One unit at a time: THINK doc → implementation → smoke gates →
    CHANGELOG → commit. Don't batch.
  - Do NOT pause for sign-off, even on critical-path units. Pick the
    most defensible default and flag the tradeoff in the summary.
  - The user / IDE linter actively co-edits the same files. If a
    Write call fails "File has been modified since read", re-Read and
    either accept the user's version or merge. Trust their refactors.
    prettier-plugin-tailwindcss reorders Tailwind classes; ESLint may
    rewrite imports. Do not revert.
  - After every commit, proceed to the next unit without asking.

## Known wrinkles to remember

  - Velite 0.3.x + Zod 4 incompat (Q31): Velite calls
    schema._parse(...); Zod 4 renamed that internal. Schemas are
    duplicated in velite.config.ts using Velite's bundled `s` factory.
    lib/schemas/*.ts (Zod 4) remains source of truth.
    scripts/validate-content.ts cross-validates.
  - exactOptionalPropertyTypes: true in tsconfig. `field?: T` cannot
    receive `undefined` — either omit the key or use `field: T |
    undefined`.
  - pnpm-workspace.yaml has esbuild + sharp + unrs-resolver allowed.
    New deps with postinstall need `pnpm approve-builds --all`.
  - `@vitejs/plugin-react` is required for JSX in .test.tsx files
    (Unit 1.5 added it to the default vitest project).
  - Path aliases: `@/*` for project source; `#site/content` for
    Velite outputs (`.velite/`).
  - This is Windows. Use the Bash tool for git commands and PowerShell
    for `pnpm` and `node_modules\.bin\*.cmd`. pnpm itself was
    installed via `npm i -g pnpm` (corepack needed admin).
  - 68 vitest tests across 13 files green at last check. Storybook-
    vitest project depends on Playwright chromium (installed via
    `pnpm exec playwright install chromium`).
  - Brand accent: deep cyan in the HKU green register, OKLCH hue 170°.
    Chart-2 (saturation) was nudged to hue 140° to keep ≥30°
    separation. Both in app/globals.css. Don't change them.
  - Pre-commit hooks: lint-staged + ADR-0005 immutability check
    (blocks M/D/R on `content/problems/*/ratings/*.yaml`) + pnpm test.
    Don't `--no-verify`.

## Resolved open questions (don't re-ask)

  Q1  Brand                = LLM OpenProblems
  Q4  License              = Apache-2.0 (code) + CC-BY-4.0 (content)
  Q5  Accent               = deep cyan, HKU green register, hue 170°
  Q12 Package manager      = pnpm
  Q13 Master prompt name   = MASTER_PROMPT.md

## First action

Start Unit 1.9. Write `docs/thinking/1.9-search-palette.md`, install
fuse.js + cmdk, build the index loader, build the palette + provider,
wire them in `app/layout.tsx`, run the smoke gates, append to
CHANGELOG, commit.

Then continue with Unit 1.10 without asking.
```
