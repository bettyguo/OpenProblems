# Security Policy

## Supported versions

This project is in active pre-1.0 development; only the `main` branch is supported. There is no formal release channel yet (see [README](./README.md#status) for the phase ledger). When a versioned release ships, this section will be updated to enumerate supported version ranges.

## Reporting a vulnerability

**Please do not open a public GitHub issue for security findings.** Use one of the private channels below.

- **GitHub Security Advisories** (preferred): open a [private security advisory](https://github.com/jacobwucs/OpenProblems/security/advisories/new) on this repository.
- **Email**: [`jacobwucs@gmail.com`](mailto:jacobwucs@gmail.com) with `[LOP-SECURITY]` in the subject line.

When reporting, please include:

1. A clear description of the vulnerability and the affected surface (which markdown helper, which auth flow, which route).
2. A minimal reproduction — ideally a unit test or a curl request.
3. Your assessment of impact (information disclosure / privilege escalation / DOS / XSS / etc.).
4. Any constraints on disclosure timing.

We will acknowledge receipt within **5 business days** and aim to ship a fix or a documented mitigation within **30 days** for high-severity issues, or **90 days** for medium / low.

## Scope

Surfaces of particular concern, in order of priority:

### 1. Markdown rendering & XSS

Per [ADR-0018](./docs/adr/0018-markdown-sanitization.md), the project renders four user-facing markdown surfaces server-side: `bio`, `reviewNotes`, `rationale`, `actionRationale`. Each surface is passed through `unified` → `remark-parse` → `remark-gfm` → `remark-rehype` → `rehype-sanitize` (allow-list mode) → `rehype-stringify`. The output is the only thing that crosses the `dangerouslySetInnerHTML` boundary.

**In scope**: any payload that produces unsanitized HTML, `javascript:`-URI links, `onerror=` / `onload=` attributes, dangerous `data:` URIs, or unescaped `<script>` content in any of the four surfaces. Test files under `lib/markdown/*.test.ts` contain the live XSS-payload corpus; please reference test names in your report.

**Out of scope**: payloads in plain-text fields that are never rendered as HTML (`displayName`, `email`, search inputs); these are rendered with React text-escaping, so HTML injection there is not exploitable.

### 2. Authentication & session

[ADR-0012](./docs/adr/0012-nextauth-v5.md) + [ADR-0020](./docs/adr/0020-multi-provider-oauth.md): NextAuth v5 with multi-provider OAuth (GitHub + Google) over Drizzle adapter + DB sessions. The `verificationToken` table is the bottleneck against unauthenticated mailflow spam.

**In scope**: session-token leak, CSRF on `POST` route handlers, OAuth `state` reuse, verification-token replay, unauthenticated access to `/curator/*` routes (env-var gated via `LOP_CURATOR_LOGINS`).

### 3. Content moderation & user input

[ADR-0024](./docs/adr/0024-content-moderation.md): four surfaces (bio · avatar · rating-challenge · subscribe) flow through the framework-only `ContentModerator` interface. The default `NoopModerator` lets everything pass; production deployments will swap in a concrete provider (ADR-0025 TBD).

**In scope**: bypassing the moderation hook entirely (e.g., a path that writes to one of the four surfaces without invoking the moderator); surface-level differences (e.g., bio being moderated but rating-challenge prose not). Concrete-provider bypasses are out of scope until ADR-0025 ships.

### 4. EXIF stripping & avatar upload

[ADR-0019](./docs/adr/0019-exif-strip.md): user-uploaded avatars are passed through `sharp` server-side for EXIF stripping + auto-rotation. The Vercel Blob `imageOverride` URL is the only thing that should reach the public — never the upload buffer.

**In scope**: EXIF survival after strip, server-side path traversal on the upload form, orphan-blob accumulation that's not reachable through `pnpm cleanup-orphan-blobs`.

### 5. Rating-action immutability

[ADR-0005](./docs/adr/0005-rating-action-immutability.md) is the brand-defining invariant: every rating change ships as a net-new YAML file under `content/problems/*/ratings/`. A pre-commit hook blocks modify / delete / rename / copy on existing files.

**In scope**: any commit that ships a non-net-new rating action — including history rewrites via `git filter-branch`, `git rebase -i`, or `--amend` — that bypasses the hook. **Out of scope**: ratings that have not been committed yet (the hook fires on commit, by design).

## Out of scope

- **Hosting / DNS / Vercel-account compromise** — that's an operational concern for the deployer, not the codebase.
- **Third-party services** (GitHub OAuth, Google OAuth, Resend, Turso, Vercel Blob, Anthropic API) — please report directly to the vendor.
- **Denial-of-service via expensive content** — the project is file-first; CI catches malformed content. If you find a way to make `pnpm build` take forever, that's a CI-cost concern but not a security issue.
- **Vulnerable transitive dependencies surfaced by `npm audit`** — please open a regular issue with the advisory ID; we triage these as routine dependency bumps unless they're exploitable in our specific usage.

## Disclosure policy

We follow **coordinated disclosure**: once a fix is in `main` and a CHANGELOG entry has shipped under the relevant Phase / Unit, the reporter is credited (with permission) in the CHANGELOG and in the GitHub Security Advisory. We are happy to embargo for a reasonable period if the reporter needs time to publish a write-up.

Thank you for helping keep LLM OpenProblems trustworthy.
