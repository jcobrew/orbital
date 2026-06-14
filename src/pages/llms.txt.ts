import type { APIRoute } from 'astro';

const BODY = `# Orbital — find where founders gather

> Orbital maps the residencies, hacker houses and co-living programs where founders live and
> build together — the places with enough gravity to pull people across the world. Not a general
> directory of accelerators, incubators, fellowships, grants or visas: a focused, live map of the
> founder co-living landscape (e.g. HF0, FR8, The Residency, Arrayah).

This site is a static, agent-friendly map. AI agents should prefer the JSON API below
over scraping the HTML views.

## Scope & positioning

Orbital is focused on one thing: founder residencies, hacker houses and co-living programs —
where founders live and build together. It is NOT a broad directory of accelerators, incubators,
fellowships, grants or visas; those categories may still appear in the underlying schema/taxonomy
for back-compat, but the curated focus is co-living programs only. The MVP keeps depth and trust
over global completeness: a high-trust set of residency / hacker-house / co-living records across
a handful of ecosystems (Finland/Nordics, Estonia, EU/Europe-wide, UK, US/global-remote). The
full schema and taxonomy still represent the wider landscape, but only values flagged \`mvp:true\`
are in active curated scope. Records NOT yet curated still appear in the full dataset; the curated
slice is exposed separately (see below).

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

- [Unified program API](/api/programs.json): All programs in one file, categorized by
  \`canonicalType\` (the primary axis). Each entry also carries a deprecated, derived
  \`dataset\` (residential | traditional) for back-compat only. Includes \`meta\`, \`schema\`,
  \`count\`, and \`facets\` (\`canonicalType\`, \`country\`, \`status\` counts, plus a derived
  \`dataset\` facet). Served with CORS \`Access-Control-Allow-Origin: *\`.
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

Core fields (always present): \`name\`, \`type\` (human label), \`canonicalType\` (primary
categorical axis), \`city\`, \`country\`, \`lat\`, \`lng\`, \`focus\`, \`operator\`, \`stage\`,
\`status\`, \`status_detail\`, \`domain\`, \`url\`, \`highlight\`. \`dataset\` (residential |
traditional) is also present but deprecated/derived — prefer \`canonicalType\`.

Founder fields (optional; absent/"unknown" until verified & filled): \`format\`, \`stageFit[]\`,
\`founderFit[]\`, \`sectorFocus[]\`, \`applicationDeadline\`, \`nextCohortStart\`, \`durationWeeksMin/Max\`,
\`cohortSize\`, \`fundingAmount\`, \`equityTaken\`, \`cost\`, \`provides*\` booleans (Housing/Workspace/
Funding/Mentorship/InvestorAccess/DemoDay/VisaSupport), \`applyUrl\`, \`sourceUrls[]\`, \`lastVerified\`,
\`verificationStatus\`, \`tags[]\`, \`notes\`. See \`schema\` in the API for descriptions.

\`status\` enum: \`rolling\` (always open) | \`open\` (cohort window open) | \`closing-soon\` |
\`opening-soon\` | \`running\` (cohort in session) | \`closed\` (check next cycle).

## Dashboard — navigable by URL (best for agents)

The [Dashboard](/dashboard) renders the full map as a semantic, sortable table with
schema.org JSON-LD per program. Drive it entirely by query params (filters compose with AND):

- \`type\` = canonical program-type ID (the primary axis; see \`facets.canonicalType\` in the API)
- \`q\` = free-text match over name, city, country, focus, operator, type
- \`country\` = exact country (see \`facets.country\`)
- \`status\` = one of the status enum values
- \`focus\` = free-text match within the focus field
- \`sort\` = column to sort by (\`name\`, \`type\`, \`country\`, \`status\`, ...)

Example: \`/dashboard?type=accelerator&country=USA&status=open\` opens pre-filtered to open US accelerators.
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
- [About](/about): what Orbital is + a guide to the co-living program types.

Each program also has a dedicated profile page at \`/programs/<slug>\` (slug = lowercased name,
non-alphanumerics → hyphens), with schema.org \`EducationalOccupationalProgram\` JSON-LD.

The /explore page accepts the same query params as the dashboard (\`q\`, \`type\`, \`country\`, \`status\`,
\`focus\`, plus \`format\` (living model), \`stage\`, \`sector\`, \`housing\`), e.g. \`/explore?q=residency&country=USA\`.
`;

export const GET: APIRoute = () =>
  new Response(BODY, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
