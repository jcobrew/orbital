# Orbital — MVP-Scoped Implementation Plan & Orchestration Handoff

> **Purpose of this document.** Convert the current working Orbital directory into a narrow,
> high-signal **MVP** — a "founder-support compass" that proves the core experience (*founder
> describes situation → gets a small set of relevant, trustworthy, explained matches*) — while
> keeping the schema future-ready for the full landscape taxonomy. It is split into ten
> independent **handoff streams**, each pasteable into its own coding-agent session.
>
> **This is not** a plan to build a complete global database of every founder-support program.
> Optimize for a trustworthy, useful matching experience that can later grow into the full map.

---

## Context

Orbital is a working, fully-static Astro site that maps ~123 founder-support programs on a
globe/list/map and exposes them via `/api/programs.json`, `/api/countries.json`, and `/llms.txt`.
The data already carries a rich optional schema (`Program` interface in `src/data/programs.ts`),
provenance fields (`lastVerified`, `verificationStatus`, `sourceUrls`), and a draft-PR-gated update
skill (`founder-atlas-refresh`).

The MVP thesis: *a founder can describe their situation and quickly discover a small set of
relevant, trustworthy support options better than they could through Google, Twitter/X, F6S, or
generic accelerator lists.* The MVP is judged by **usefulness, not database size**.

Positioning: **"A guided discovery tool for early-stage founders looking for the right accelerator,
residency, fellowship, grant, visa, or founder community."** — not "a complete map of every
startup-support program in the world."

---

## Grounding facts (current repo audit)

- **Stack:** Astro 5.18 (no adapter → static output), React 19 islands, Tailwind v4 (theme in
  `src/styles/global.css`), nanostores, Vercel (`vercel.json`: cleanUrls + CORS on `*.json`/`llms.txt`).
  Node 20+/22, npm, TypeScript strict, path alias `@/* → src/*`.
- **Data source of truth:** the single unified `src/data/programs-data.json` (~123 programs;
  the old `residential` + `traditional` two-file split is retired). Typed in
  `src/data/programs.ts` → `PROGRAMS[]`, `FACETS`, `TYPES`, `COUNTRIES`, `API_SCHEMA`.
- **Programs are categorized by `canonicalType`** (`src/data/taxonomy.ts`); the free-text
  `type` is now a display label only.
  `ProgramFormat`, `StageFit`, `FounderFit`, `VerificationStatus` enums already exist in
  `src/data/programs.ts`. Provenance fields already exist; there is **no** `ApplicationWindow` /
  `SourceRecord` model yet.
- **"Matching" today** = keyword presets (`src/data/triggers.ts`) feeding the substring/array filter
  `passes()` in `src/lib/filter.ts`. No scoring, explanations, or disqualifiers.
- **Surfaces:** human pages (`/`, `/explore`, `/map`, `/dashboard`, `/about`, `/countries`,
  `/country/[slug]`, `/cities/[slug]`, `/programs/[slug]`, `/submit`, `/saved`); machine surfaces
  (`/api/programs.json`, `/api/countries.json`, `/llms.txt`) + schema.org JSON-LD on dashboard/program/country.
- **Submission flow:** `/submit` → `src/components/SubmitForm.tsx` → `src/lib/submit.ts` builds a
  prefilled GitHub issue URL (no backend). Data lands via the `founder-atlas-refresh` skill (draft PR).
- **Gaps:** no `docs/`, no `scripts/`, no tests, no canonical taxonomy module, no `/find-support`
  guided flow, no normalized/MVP/typed exports, no review-queue structure, no freshness scripts.
- **Domain docs:** the literal `founder-support-landscape.md` is absent; root files
  `startup-support-programs-knowledge-base.md` + `traditional-startup-programs-knowledge-base.md`
  are the de-facto landscape docs and should seed `docs/program-taxonomy.md`.

---

## 1. Current repo architecture summary

Static Astro 5 + React islands, Tailwind v4, nanostores, Vercel static deploy. One unified JSON
dataset typed by `src/data/programs.ts` and consumed by every page plus the JSON/`llms.txt` surfaces.
No backend, DB, auth, or tests. Contribution = prefilled GitHub issue → human verify → draft-PR data
edit via `founder-atlas-refresh`.

## 2. Current product/data gap analysis

- **Strengths to preserve:** rich optional `Program` schema; provenance fields; faceted URL-stateful
  filtering; agent-facing JSON + `llms.txt`; draft-PR data discipline.
- **Gaps vs MVP thesis:**
  1. Program `type` is free-text, not canonical → can't reliably mark MVP vs future categories.
  2. No guided intake / deterministic matching with explanations.
  3. No explicit application-window vs program-identity separation.
  4. Provenance exists per-record but not as first-class source/trust objects or freshness reporting.
  5. No MVP-scope tagging to distinguish curated launch-ready records from the rest.
  6. No tests/docs to make multi-agent work safe.

## 3. MVP scope recommendation

- **Records:** 100–200 curated, high-trust. Quality/freshness over completeness.
- **Ecosystems (3–5):** Finland/Nordics, Estonia, EU-wide/Europe-wide, UK, US/global-remote.
- **Program categories (6–8), actively populated:** founder residencies; hacker/founder houses;
  accelerators; pre-accelerators; founder fellowships; government grants / non-dilutive; startup
  visas / soft-landing; co-founder matching / online founder communities.
- **Experience:** two paths — *"I know what I need"* (faceted search, mostly present) and *"Help me
  figure out what I need"* (new 6–8 question guided flow → deterministic, explained matches).

### Guided intake questions (Path 2)
1. What stage are you at? 2. Solo or in a team? 3. What do you need most right now? 4. Funding,
community, workspace, co-founder discovery, visa help, customers, mentorship, or structure? 5.
Willing to relocate? 6. Which regions? 7. Apply now / next 3 months / this year / exploring? 8.
Prefer equity-free options?

### Required MVP program fields
Program name · type · URL · country/remote · city (if physical) · ecosystem · stage focus · support
modes · application status · application URL (if available) · deadline/intake notes (if available) ·
equity/cost/funding terms (if available) · eligibility notes · source URL · last verified date ·
verification status.

**Optional:** cohort size · acceptance rate · notable alumni · discovery channels · long ecosystem
analysis · full sector taxonomy · historical cohorts · deep alumni metadata. *Standard: smaller
dataset, higher trust.*

## 4. What to explicitly exclude from MVP

Global country coverage; populating every non-MVP type (tech-transfer offices, meetups, angel
networks, scout programs, venture debt, research parks, corporate innovation labs, diaspora networks,
hackathons globally); a backend/DB; auth; LLM-based recommender; auto-scrape→auto-publish; removing
legacy fields before migration completes; breaking map/list/program pages; hiding missing/stale data;
treating "program exists" as "applications open"; inventing data without source URLs; spending the
milestone on admin infrastructure.

## 5. Recommended phased roadmap

1. **Phase 0 — Audit & contracts** (Stream 1; Stream 10 starts early): document architecture, set
   implementation boundaries, stand up test/CI scaffolding.
2. **Phase 1 — Structure first** (Streams 2, 4): canonical backward-compatible taxonomy + schema;
   `ApplicationWindow`/`SourceRecord`/trust models; normalization helpers.
3. **Phase 2 — Curated data** (Stream 3): tag in-scope records, define MVP data standard, plan the
   100–200 seed set. No global import.
4. **Phase 3 — Matching** (Stream 5): `FounderNeedsProfile` → deterministic `ProgramMatch` with
   reasons, cautions, disqualifiers, freshness penalties. Build against mock normalized data first.
5. **Phase 4 — Discovery UI** (Stream 6): `/find-support` guided + direct flow on top of the engine.
6. **Phase 5 — Maintainability & surfaces** (Streams 7, 9): freshness/report scripts; normalized +
   MVP + typed exports; improved `llms.txt`.
7. **Phase 6 — Controlled updates** (Stream 8): proposed-update queue + apply-approved-only script.
8. **Continuous:** Stream 10 (tests/docs) tracks every other stream.

**Build principle:** structure first → matching → freshness → automation. Do not start with scraping,
a backend, or a giant global import.

## 6. Parallel coding-agent handoffs

Ten streams, full detail in the [Handoff Streams](#required-parallel-handoff-streams) section. Each
is independently pasteable and scoped to non-overlapping files where possible.

## 7. Branch naming recommendations

`feat/repo-architecture-audit` · `feat/mvp-taxonomy-schema` · `feat/mvp-program-data-scope` ·
`feat/program-windows-provenance` · `feat/founder-needs-matching` · `feat/founder-discovery-ui` ·
`feat/program-update-pipeline` · `feat/review-queue-foundation` · `feat/agent-api-exports` ·
`feat/tests-docs-data-contracts`.

## 8. Dependency graph

```
Stream 1 (audit) ──┬─> Stream 2 (taxonomy/schema) ──┬─> Stream 4 (windows/provenance)
                   │                                 ├─> Stream 5 (matching, mock data ok)
                   │                                 ├─> Stream 9 (exports follow normalized schema)
                   │                                 └─> Stream 8 (review queue; wait for schema basics)
                   ├─> Stream 3 (data scope; needs canonical type IDs from S2 to tag)
                   └─> Stream 7 (freshness; parallel w/ schema)
Stream 5 ─> Stream 6 (UI; can start on mocked match output)
Stream 10 (tests/docs) starts early, tracks all.
```

Safest order: **1 → 2 → (3, 4, 5, 7 parallel) → 6 → 9 → 8**, with **10 throughout**.

## 9. File ownership map (reduce merge conflicts)

| Stream | Owns (create/content-edit) |
| --- | --- |
| **S2 schema/taxonomy** | `src/data/taxonomy.ts`, `src/data/schema.ts`, `src/lib/normalizeProgram.ts`. **Only stream that edits the `Program` type / `src/data/programs.ts` (additively).** |
| **S4 windows/provenance** | `src/data/applicationWindows.ts`, `src/data/sources.ts`, new `src/lib/status*` helpers (additive; coordinate with `src/lib/status.ts`). |
| **S5 matching** | `src/lib/matching/*` (new dir). |
| **S6 UI** | `src/pages/find-support.astro`, new `src/components/find-support/*`. Does **not** edit existing globe/map/list components. |
| **S7 freshness** | `scripts/*freshness*`, `scripts/check-source-urls.ts`, `scripts/generate-update-report.ts`, `scripts/check-mvp-readiness.ts`; npm scripts. |
| **S8 review queue** | `data/review-queue/*`, `scripts/apply-updates.ts`. |
| **S9 exports** | new routes under `src/pages/api/*`, `public/schemas/*`; sole owner of `src/pages/llms.txt.ts`. |
| **S10 tests/docs** | `docs/*`, `examples/*`, `tests/*`, `vitest.config.ts`, CI workflow. |

**Shared, edit-with-care:** `src/data/programs.ts` (S2 owns; others import only); `package.json`
scripts (append-only; S7/S10 coordinate); the two `*-programs-data.json` files (S3 owns content edits).
**Rule:** prefer additive modules; avoid two agents touching the same existing UI component.

## 10. First MVP milestone definition

> Orbital has a curated MVP-ready founder-support discovery system covering ~100–200
> high-quality records across the selected ecosystems and program types, with normalized taxonomy,
> backward-compatible schema, basic provenance/freshness status, deterministic founder-needs
> matching, a guided discovery UI, and machine-readable exports — while still building and deploying
> as a static site.

## 11. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Scope explosion | Cap at 100–200 records, 3–5 ecosystems, 6–8 types; enforce via `check-mvp-readiness`. |
| Stale/misleading data | Require source URL, last-verified, application status; show unknowns honestly. |
| Matching feels fake on a small set | Explainable reasons + support-type guidance even when few exact matches. |
| Too much schema before value | Backward-compatible schema; MVP-required fields minimal; new canonical fields optional first. |
| Agents overwrite each other | Branch + file-ownership boundaries; additive modules. |
| Automated collection pollutes quality | Review queue + apply-approved-only before any automation. |

## 12. Acceptance criteria for the MVP milestone

Repo still builds (`astro build`); current public pages still work; schema can represent the full
future taxonomy; populated MVP is explicitly limited + curated (MVP flag on records); records can
show source + last-verified + application status; founders can complete the guided intake flow
without login; system returns explainable matches; machine-readable exports exist (legacy stable,
plus normalized/MVP/typed); data validation/freshness checks exist; the plan is split across the ten
streams below.

---

## Required Parallel Handoff Streams

> Each stream is self-contained: **Focus · Background · Inspect · Create/Modify · Tasks ·
> Dependencies · Acceptance · Risks · What not to do yet.** The "Grounding facts" above apply to all.

### Stream 1 — Repo Audit & MVP Architecture Map · `feat/repo-architecture-audit`
- **Focus:** Understand and document before changing anything; set safe boundaries.
- **Background:** No `docs/` exists yet; the repo is a static Astro site with its program dataset
  (since unified into one `src/data/programs-data.json`) and agent-facing JSON/`llms.txt` surfaces.
- **Inspect:** `package.json`, `astro.config.mjs`, `tsconfig.json`, `vercel.json`, `src/pages/**`,
  `src/data/*`, `src/lib/*`, `src/components/*`, `src/pages/api/*`, `src/pages/llms.txt.ts`, `README.md`.
- **Create/modify:** `docs/architecture.md` (architecture summary, key-file map, current data model,
  route map, risk list, "do-not-break" stable surfaces, suggested implementation boundaries).
- **Tasks:** map framework/build/PM/deploy/routing; catalog data files + schema; document filter/search
  behavior, program/list/map/dashboard pages, JSON/`llms.txt` surfaces, submission flow; produce the map.
- **Dependencies:** none (gate for most others).
- **Acceptance:** future agents know where to safely add code; existing behavior documented; plan
  avoids unnecessary rewrites.
- **Risks:** doc drifts from code → keep it a map, not a spec.
- **Not yet:** no code/schema/data changes.

### Stream 2 — MVP Taxonomy & Backward-Compatible Schema · `feat/mvp-taxonomy-schema`
- **Focus:** Canonical model that represents the full landscape taxonomy but only requires MVP fields now.
- **Background:** `type` is free-text today; canonicalizing it is what unlocks MVP-vs-future tagging.
  `ProgramFormat`/`StageFit`/`FounderFit`/`VerificationStatus` enums already exist.
- **Inspect:** `src/data/programs.ts` (Program interface + enums), `src/data/programTypes.ts`,
  `src/lib/status.ts`, `src/lib/living.ts`, both `*-programs-data.json`, root knowledge-base MD files.
- **Create/modify:** `src/data/taxonomy.ts` (canonical IDs: programType, supportMode, founderStage,
  intakeMethod, intakeFrequency, costFundingModel — each flagged `mvp: true|false`),
  `src/data/schema.ts`, `src/lib/normalizeProgram.ts` (map legacy free-text `type`/`stage`/`format` →
  canonical IDs with validation warnings for unmapped values), `docs/data-model.md`,
  `docs/program-taxonomy.md`. Extend `Program` **additively** (new canonical fields optional).
- **Tasks:** define the full taxonomy with MVP flags; add normalization helpers + validation warnings;
  keep legacy fields working; do not require new fields yet.
- **Dependencies:** Stream 1.
- **Acceptance:** site still builds; existing data still renders; full taxonomy representable; MVP
  categories clearly marked; legacy fields still work; new canonical fields optional at first.
- **Risks:** over-normalizing breaks render → keep normalization non-destructive (derive, don't replace).
- **Not yet:** don't delete legacy fields; don't force-migrate data records.

### Stream 3 — MVP Program Data Standard & Seed Dataset Plan · `feat/mvp-program-data-scope`
- **Focus:** How the first 100–200 curated records are structured + maintained (no global import).
- **Background:** ~123 records exist; many are out of MVP ecosystem/type scope. This stream curates,
  it does not bulk-import.
- **Inspect:** both `*-programs-data.json`, `src/data/programs.ts`, `founder-atlas-refresh` SKILL.md.
- **Create/modify:** `docs/mvp-data-scope.md`, `docs/program-data-quality.md`, optional
  `scripts/check-mvp-readiness.ts` (reports MVP-readiness per record), a data-quality checklist. Tag
  in-scope records (e.g. additive `mvp: true` + `ecosystem`) — coordinate field name with Stream 2.
- **Tasks:** audit current records; identify which fit MVP scope; tag by MVP ecosystem + MVP type;
  define required vs optional MVP fields; write the 100–200 seed expansion plan; **do not** collect
  all global data.
- **Data quality rules (every MVP program):** name · type · URL · location/remote · stage focus ·
  support modes · application status or "unknown" · source URL · last verified date · eligibility
  notes if applicable.
- **Dependencies:** Stream 1; needs canonical type IDs from Stream 2 to tag reliably.
- **Acceptance:** clear MVP-vs-future record distinction; clear "launch-ready" definition; no
  global-completeness expectation.
- **Risks:** scope creep into bulk import → enforce caps in `check-mvp-readiness`.
- **Not yet:** no scraping; no mass data entry.

### Stream 4 — Application Windows, Deadlines & Provenance · `feat/program-windows-provenance`
- **Focus:** Separate stable program identity from changing application data. *A program existing is
  not the same as applications being open.*
- **Background:** Records carry a single `status` + `lastVerified`/`sourceUrls`; there is no window or
  source object model.
- **Inspect:** `src/data/programs.ts` (status/`lastVerified`/`sourceUrls`), `src/lib/status.ts`,
  `src/components/StatusBadge.tsx`, `src/pages/programs/[slug].astro`.
- **Create/modify:** `ApplicationWindow`, `SourceRecord`, `VerificationStatus`, `TrustStatus` models
  (new `src/data/applicationWindows.ts`, `src/data/sources.ts`); helpers for current application
  status (open/upcoming/closed/unknown); stale-data badges/computed status (additive helpers, not a
  rewrite of `src/lib/status.ts`); sample window/source data for a few MVP-relevant programs.
- **Tasks:** model windows + sources + trust; compute current status; render stale badges; add samples.
- **Dependencies:** Stream 2 (schema basics).
- **Acceptance:** program pages show open/upcoming/closed/unknown; programs without window data still
  render; provenance attachable; last-verified visible/in exports; MVP records more trustworthy than
  directory entries.
- **Risks:** double source-of-truth with existing `status` → windows derive/override; document precedence.
- **Not yet:** don't break existing `status` rendering; don't require windows on every record.

### Stream 5 — Founder Needs & Deterministic Matching Engine · `feat/founder-needs-matching`
- **Focus:** Core MVP intelligence — match founders to relevant support, **no LLM**.
- **Background:** Today matching is keyword presets in `src/data/triggers.ts` + `passes()`. Replace
  with a structured, explainable scorer.
- **Inspect:** `src/data/triggers.ts`, `src/lib/filter.ts`, `src/data/programs.ts`, taxonomy from Stream 2.
- **Create/modify:** `src/lib/matching/*` — `FounderNeedsProfile`, `ProgramMatch`, deterministic
  scoring (hard disqualifiers + soft ranking), explanation strings, freshness/closed/unverified
  penalties, prefer-MVP-records bias. Evolve `triggers.ts` toward structured matching (keep presets working).
- **Founder fields:** stage, location, willingness to relocate, preferred regions, sector, team status,
  funding need, equity tolerance, support needs, visa need, urgency.
- **Match output:** programId · score · positive reasons · caution reasons · hard disqualifiers · next step.
- **Tasks:** build scorer + explanations; testable pure functions; can run on mock normalized data first.
- **Dependencies:** Stream 2 (can mock); ideally Stream 4 for freshness penalties.
- **Acceptance:** matching works without LLM; every result has reasons; logic testable;
  closed/stale/unverified never silently recommended; works on a small curated MVP set.
- **Risks:** opaque scoring → keep weights explicit + documented in `docs/founder-matching.md`.
- **Not yet:** no LLM recommender; don't depend on a backend.

### Stream 6 — Founder Discovery UI · `feat/founder-discovery-ui`
- **Focus:** Founder-facing guided + direct discovery flow. *User should feel helped even with only
  100–200 programs — relevance, not volume.*
- **Background:** `/explore` already does faceted search; the guided path is new.
- **Inspect:** `src/pages/explore.astro`, `src/components/FilterSidebar.tsx`,
  `src/components/FounderTriggers.tsx`, `src/components/ProgramCard.tsx`,
  `src/components/ProgramDetailDrawer.tsx`, `src/stores/filters.ts`, matching API from Stream 5.
- **Create/modify:** `src/pages/find-support.astro`; new intake components under
  `src/components/find-support/*` (6–8 question flow); ranked match cards showing why-matched,
  blockers, application status, freshness; shareable URL state. Reuse `ProgramCard`/`StatusBadge` read-only.
- **Tasks:** build intake → wire to engine → render explained results; support both direct search and
  guided discovery.
- **Dependencies:** Stream 5 (can start on mocked match output).
- **Acceptance:** founder completes flow without login; results explainable; missing data handled
  gracefully; existing list/map/globe views still work.
- **Risks:** editing shared components causes conflicts → new components only; import existing read-only.
- **Not yet:** don't over-polish UI before the data model/engine stabilize; no auth/saved-account features.

### Stream 7 — Freshness & Update Pipeline · `feat/program-update-pipeline`
- **Focus:** Maintainability without pretending automation is solved. Reports only — never auto-publish.
- **Background:** No `scripts/` dir exists; data is refreshed manually via the `founder-atlas-refresh` skill.
- **Inspect:** `src/data/programs.ts`, both data JSONs, `package.json` scripts, `founder-atlas-refresh` SKILL.md.
- **Create/modify:** `scripts/check-program-freshness.ts`, `scripts/check-source-urls.ts`,
  `scripts/generate-update-report.ts`, `scripts/check-mvp-readiness.ts`; npm scripts; `docs/update-pipeline.md`.
- **Tasks:** stale-record detection, source-URL health (optional/offline-safe), report generation;
  safe-by-default scripts.
- **Dependencies:** parallel with Stream 2 (uses provenance fields).
- **Acceptance:** local report generated; flags stale programs, missing source URLs, broken links,
  upcoming deadlines, missing verification dates, MVP-readiness gaps; safe by default; future
  Actions/Cron possible.
- **Risks:** network flakiness in URL checks → make them opt-in/offline-safe.
- **Not yet:** no auto-commit of data; no scraping into production.

### Stream 8 — Review Queue for Proposed Updates · `feat/review-queue-foundation`
- **Focus:** Stage user/agent/manual updates without blindly changing data.
- **Background:** Current submission flow builds a prefilled GitHub issue (`src/lib/submit.ts`); keep
  it working. This adds a structured queue layer.
- **Inspect:** `src/lib/submit.ts`, `src/components/SubmitForm.tsx`, data JSONs, `founder-atlas-refresh` SKILL.md.
- **Create/modify:** `ProposedProgramUpdate` model; `data/review-queue/*` (pending/approved/rejected);
  validation for proposed changes; `scripts/apply-updates.ts` (apply approved only); audit trail.
- **Sensitive fields requiring sources:** deadline · application status · equity · funding amount ·
  eligibility · visa support · cost · location · program status.
- **Tasks:** store proposals; validate; apply approved; ignore pending/rejected; require sources for
  sensitive changes.
- **Dependencies:** Stream 2 schema basics stable.
- **Acceptance:** proposals storable; approved applyable; pending/rejected ignored; audit trail; no
  unreviewed automated changes applied.
- **Risks:** divergence from data schema → validate against Stream 2 schema/taxonomy.
- **Not yet:** no auto-approval; don't replace the issue flow.

### Stream 9 — Public API, Static Exports & Agent Surfaces · `feat/agent-api-exports`
- **Focus:** Make Orbital consumable by users, agents, and tools without scraping HTML.
- **Background:** `/api/programs.json`, `/api/countries.json`, `/llms.txt` already exist — keep them stable.
- **Inspect:** `src/pages/api/programs.json.ts`, `src/pages/api/countries.json.ts`,
  `src/pages/llms.txt.ts`, `src/data/programs.ts`, taxonomy from Stream 2.
- **Create/modify (additive; keep legacy exports stable):** `/api/programs.normalized.json`,
  `/api/programs.mvp.json`, `/api/program-types.json`, `/api/founder-needs-schema.json`,
  `/api/update-report.json`; `public/schemas/program.schema.json`,
  `.../founder-needs.schema.json`, `.../program-update.schema.json`; improve `/llms.txt` with MVP
  scope + freshness/provenance metadata.
- **Tasks:** audit existing surfaces; add normalized/MVP/typed exports + schemas; embed freshness/provenance.
- **Dependencies:** follows Stream 2 normalized schema (and Streams 4/5/7 for richer metadata).
- **Acceptance:** agents consume structured data without scraping; legacy exports stable; normalized
  exports include canonical types/support-modes/status/freshness/source; MVP exports distinguish
  curated launch-ready from future/unverified.
- **Risks:** breaking `/api/programs.json` consumers → only add, never change existing shape.
- **Not yet:** no breaking changes to existing endpoints.

### Stream 10 — Tests, Validation & Documentation · `feat/tests-docs-data-contracts`
- **Focus:** Make future agent work safe; start early, track all streams.
- **Background:** Zero test infra today; no `docs/`.
- **Inspect:** everything additive.
- **Create/modify:** add Vitest (`vitest.config.ts`, test script); tests for taxonomy, normalization,
  matching, freshness, application windows, review-queue validation; `docs/` set
  (`data-model.md`, `program-taxonomy.md`, `mvp-data-scope.md`, `update-pipeline.md`,
  `founder-matching.md`, `contributing-program-data.md`); `examples/*` JSON matching schemas; CI workflow.
- **Tasks:** stand up test runner + first tests early (taxonomy/normalization), expand as streams land;
  write docs; add CI.
- **Dependencies:** can begin immediately; deepens per stream.
- **Acceptance:** invalid taxonomy IDs caught; example files match schemas; `astro build` passes;
  tests cover core matching/freshness; docs clear for future agents.
- **Risks:** test infra choices conflict with build → use Vitest + keep separate from Astro build.
- **Not yet:** don't gate the milestone on 100% coverage.

---

## Global "Do Not Do Yet"

Cover all countries; populate every program type; replace the app with a backend; require auth; add an
LLM recommender before deterministic matching exists; auto-scrape→auto-publish; remove legacy fields
before migration completes; break map/list/program pages; hide missing/stale data; conflate "program
exists" with "applications open"; invent program data without source URLs; make DB migration a launch
blocker; over-optimize UI before the data model is stable.
