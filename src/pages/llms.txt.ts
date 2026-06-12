import type { APIRoute } from 'astro';

const BODY = `# Founder Atlas

> A relocation & support portal for founders: the best places in the world to build and the
> startup support waiting there — residencies, hacker houses, startup campuses, accelerators,
> incubators and talent investors. The way university portals help academics choose where to go,
> Founder Atlas helps founders search programs and (soon) whole country startup ecosystems.

This site is a static, agent-friendly directory. AI agents should prefer the JSON API below
over scraping the HTML views.

## MVP scope & positioning

Founder Atlas is in a focused MVP: depth and trust over global completeness. The curated
launch set targets ~100–200 high-trust records across a few ecosystems (Finland/Nordics,
Estonia, EU/Europe-wide, UK, US/global-remote) and 6–8 actively-populated program categories:
founder residencies, hacker/founder houses, accelerators, pre-accelerators, founder
fellowships, government grants / non-dilutive, startup visas / soft-landing, and co-founder
matching / online founder communities. The full schema and taxonomy represent the long-term
landscape, but only values flagged \`mvp:true\` are in active MVP scope. Records NOT yet curated
still appear in the full dataset; the curated slice is exposed separately (see below).

## Freshness & provenance

- Every record carries a \`lastVerified\` date and a \`verificationStatus\`
  (\`verified\` | \`needs-review\` | \`unverified\`). A record older than ~90 days is treated as stale.
- "A program exists" is NOT "applications are open". Application status is computed from
  time-aware application windows when available, falling back to the legacy recruiting \`status\`.
  Resolved status is one of \`open\` | \`upcoming\` | \`closed\` | \`unknown\` — shown honestly, never hidden.
- Provenance is first-class: sources carry a \`kind\` (official | press | aggregator | …) and a
  \`trust\` level (\`trusted\` | \`reported\` | \`unverified\` | \`sample\`). Placeholder data is marked
  \`sample\` and must never be presented as fact.
- Status and visa/relocation details change frequently — always confirm on the official program site.

## Machine-readable data (preferred for agents)

Legacy, stable contracts (output shape will not change):

- [Unified program API](/api/programs.json): All programs in one file. Each entry is tagged
  with \`dataset\` (residential | traditional). Includes \`meta\`, \`schema\`, \`count\`, and \`facets\`
  (distinct types, countries and statuses with counts). Served with CORS \`Access-Control-Allow-Origin: *\`.
- [Countries API](/api/countries.json): machine-readable country ecosystem profiles (see below).

New, agent-oriented exports (additive; richer, may evolve):

- [Normalized programs](/api/programs.normalized.json): every program with canonical taxonomy IDs
  (\`canonicalType\`, \`supportModes\`, \`canonicalStages\`, \`costFundingModel\`), a resolved
  \`applicationStatus\` (window-aware), a \`freshness\` summary, and a \`provenance\`/trust summary.
  Prefer this when you want structured, normalized data.
- [Curated MVP programs](/api/programs.mvp.json): only the curated, launch-ready (\`mvp:true\`)
  records — the vetted slice. May be empty until records are tagged; treat an empty list as
  "no curated records yet", not an error.
- [Program-type taxonomy](/api/program-types.json): the full canonical taxonomy (program types
  and the supporting dimensions) with IDs, labels, MVP flags and descriptions.
- [Founder-needs schema](/api/founder-needs-schema.json): the machine-readable \`FounderNeedsProfile\`
  shape consumed by the deterministic matching engine. Every field is optional; enum fields use
  canonical taxonomy IDs.
- [Update report](/api/update-report.json): offline-computed freshness / source-inventory /
  MVP-readiness summary across the dataset (report-only; no network probing at build time).

JSON Schema documents (Draft 2020-12):

- [Program schema](/schemas/program.schema.json)
- [Founder-needs schema](/schemas/founder-needs.schema.json)
- [Update-report schema](/schemas/program-update.schema.json)

## Program schema

Core fields (always present): \`name\`, \`type\`, \`dataset\`, \`city\`, \`country\`, \`lat\`, \`lng\`, \`focus\`,
\`operator\`, \`stage\`, \`status\`, \`status_detail\`, \`domain\`, \`url\`, \`highlight\`.

Founder fields (optional; absent/"unknown" until verified & filled): \`format\`, \`stageFit[]\`,
\`founderFit[]\`, \`sectorFocus[]\`, \`applicationDeadline\`, \`nextCohortStart\`, \`durationWeeksMin/Max\`,
\`cohortSize\`, \`fundingAmount\`, \`equityTaken\`, \`cost\`, \`provides*\` booleans (Housing/Workspace/
Funding/Mentorship/InvestorAccess/DemoDay/VisaSupport), \`applyUrl\`, \`sourceUrls[]\`, \`lastVerified\`,
\`verificationStatus\`, \`tags[]\`, \`notes\`. See \`schema\` in the API for descriptions.

\`status\` enum: \`rolling\` (always open) | \`open\` (cohort window open) | \`closing-soon\` |
\`opening-soon\` | \`running\` (cohort in session) | \`closed\` (check next cycle).

## Dashboard — navigable by URL (best for agents)

The [Dashboard](/dashboard) renders the full directory as a semantic, sortable table with
schema.org JSON-LD per program. Drive it entirely by query params (filters compose with AND):

- \`dataset\` = \`all\` | \`residential\` | \`traditional\`
- \`q\` = free-text match over name, city, country, focus, operator, type
- \`type\` = exact program type (see \`facets.type\` in the API)
- \`country\` = exact country (see \`facets.country\`)
- \`status\` = one of the status enum values
- \`focus\` = free-text match within the focus field
- \`sort\` = column to sort by (\`name\`, \`type\`, \`country\`, \`status\`, ...)

Example: \`/dashboard?dataset=all&country=USA&status=open\` opens pre-filtered to open US programs.
Any filter state is reflected back into the URL, so a dashboard URL is a shareable deep link.

## Country ecosystem profiles

Going one level up from individual programs: profiles of national startup ecosystems for founders
considering relocation — summary, visa/residency routes, key organizations and links.

- [Countries API](/api/countries.json): machine-readable profiles. Each country joins back to the
  program data via the shared \`name\` field, and carries a \`programCount\`. Served with CORS.
- [Countries index](/countries) and per-country pages at \`/country/<slug>\` (e.g. \`/country/usa\`).
  Each country page also carries schema.org \`Country\` JSON-LD.

This dataset is intentionally small for now and growing; it is designed to move to an updatable
cloud database without changing the API shape.

## Human views

Every page shares one header: brand · a Globe / List view toggle · Countries · About.

- [Globe](/): 3D globe — the desktop entry point (small screens redirect to the list). Programs
  panel, dense-city minimaps and the status legend are toggleable overlays.
- [List](/explore): searchable, filterable card list with a program detail drawer.
- [Map](/map): 2D interactive Leaflet map of the same data (also powers the globe's city minimaps).
- [About](/about): what Founder Atlas is + a guide to the program types.

Each program also has a dedicated profile page at \`/programs/<slug>\` (slug = lowercased name,
non-alphanumerics → hyphens), with schema.org \`EducationalOccupationalProgram\` JSON-LD.

The /explore page accepts the same query params as the dashboard (\`q\`, \`type\`, \`country\`, \`status\`,
\`focus\`, plus \`format\` (living model), \`stage\`, \`sector\`, \`housing\`), e.g. \`/explore?q=residency&country=USA\`.
`;

export const GET: APIRoute = () =>
  new Response(BODY, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
