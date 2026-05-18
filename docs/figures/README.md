# Figures

Hand-drawn SVG diagrams for the LLM OpenProblems README and PR previews. Each figure is authored to render crisply on GitHub light + dark mode at the embedded width, with **no overlapping text, boxes, or arrows** — the layout grid is explicit in the comments at the top of each file.

| #    | File                                                 | Purpose                                                                                                     | Used in                                    |
| ---- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| Hero | [`hero-banner.svg`](./hero-banner.svg)               | One-glance product positioning: the rating-agency metaphor + 5 dimensions + KPI strip                       | `README.md` top                            |
| 1    | [`architecture.svg`](./architecture.svg)             | The 5-layer system: Client UI → App Router → `lib/` → Storage → External                                    | `README.md` § Architecture                 |
| 2    | [`data-model.svg`](./data-model.svg)                 | Three first-class entities (Problem / Paper / Author+Institution) + the immutable RatingAction ledger       | `README.md` § Data model                   |
| 3    | [`markdown-framework.svg`](./markdown-framework.svg) | The 4×3 surface×consumer matrix at Phase 44 full activation (12 / 12 triples), and where Phase 45 DOI joins | `README.md` § Markdown extension framework |
| 4    | [`rating-dimensions.svg`](./rating-dimensions.svg)   | The 5 rating dimensions with their scales (S/A/B/C/D/E, 0–100, 0–5 stars)                                   | `README.md` § Rating methodology           |
| 5    | [`phase-ledger.svg`](./phase-ledger.svg)             | All 45 phases on one timeline, banded by thematic cluster, with ADR markers + KPI strip                     | `README.md` § Status                       |
| 6    | [`reader-personas.svg`](./reader-personas.svg)       | The three reader personas the IA must serve on every page                                                   | `README.md` § Vision                       |
| 7    | [`workflow.svg`](./workflow.svg)                     | The 5-step THINK → DESIGN → CODE → ITERATE → COMMIT rhythm + pre-commit chain                               | `README.md` § Workflow                     |

## Design rules

These are the constraints every figure here follows. If you add a new figure, follow them:

1. **No overlapping elements.** Every text node fits inside its container; every arrow head lands cleanly with ≥ 4 px from the next element. Use the visible grid origins (`transform="translate(...)"`) as the layout contract.
2. **One palette per role.** Foundation = blue (`#1d4ed8`), editorial = emerald, intelligence = violet, bilingual = cyan, auth = amber, operations = red, email = purple, moderation = teal, markdown framework = pink. Amber `#f59e0b` is reserved for _the rating agency_ accent — use it sparingly.
3. **Inline styles only.** No external CSS, no external fonts. GitHub strips `<script>` and most `<style>`; we set every visual property as an attribute. `font-family` cascades from the root `<svg>` element.
4. **Mono for "data".** Variable-width font (system UI) for prose; mono (`ui-monospace`) for file paths, env-var names, and stat labels.
5. **One-line title.** Every figure has a `<title>` element so screen readers / GitHub hover tooltips work.
6. **viewBox, not width/height.** All figures use `viewBox` so they scale into whatever column width Markdown gives them.
7. **Generous gutters.** Top/left gutters ≥ 36 px; inter-box gaps ≥ 12 px; column-headers sit ≥ 14 px above the row of cards.

## Re-rendering

These are static SVGs — no build step. To preview locally:

```bash
# any modern browser will open them directly
open docs/figures/hero-banner.svg
```

GitHub renders them inline in Markdown via standard `![alt](path)` syntax — no extra config required.

## Live gallery (GitHub Pages-ready)

[`gallery.html`](./gallery.html) is a self-contained static page that bundles all 8 figures with a sticky navigator, light/dark-mode-aware CSS, and accessible markup. It has zero dependencies and can be deployed to GitHub Pages directly from the `docs/` directory:

1. **Settings → Pages → Source**: `main` branch, `/docs` folder. Save.
2. The gallery is live at `https://<owner>.github.io/<repo>/figures/gallery.html`.

For a local preview, open the file directly — `file:///…/docs/figures/gallery.html` renders identically.
