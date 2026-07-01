import type { APIRoute } from 'astro';

const BODY = `# 0rbital — Orbital for builder environments

> Find your orbit. Launch what’s next. The right environment changes your trajectory.
> Compare founder residencies, hacker houses, startup campuses, and co-living programs
> where builders gather momentum for their next launch.

This site is a static, agent-friendly map. AI agents should prefer the JSON API below
over scraping the HTML views.

## Scope & positioning

0rbital is focused on builder environments: founder residencies, hacker houses, startup campuses, and co-living programs where early-stage builders, founders, researchers, hackers, and creative technologists live, work, and build around serious peers. It is NOT a broad accelerator, grant, visa, or generic builder-environment database; those categories may still appear in legacy schema/taxonomy values for back-compat. The MVP keeps depth and trust
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

\`status\` enum: \`open\` (applications open — rolling or a cohort window) |
\`coming-soon\` (announced, not launched yet) | \`running\` (cohort in session) | \`closed\`.

## Dashboard — navigable by URL (best for agents)

The [Dashboard](/dashboard) renders the full map as a semantic, sortable table with
schema.org JSON-LD per program. Drive it entirely by query params (filters compose with AND):

- \`q\` = free-text match over name, city, country, focus, operator, type
- \`model\` = living/working axis: \`co-living\` | \`co-working\` | \`both\`
- \`country\` = exact country (repeatable for OR; see \`facets.country\`)
- \`status\` = one of the status enum values
- \`sort\` = column to sort by (\`name\`, \`type\`, \`canonicalType\`, \`city\`, \`country\`, \`status\`, \`focus\`, \`stage\`), with \`dir=-1\` to reverse

Example: \`/dashboard?model=co-living&country=USA&status=open\` opens pre-filtered to open US co-living houses.
Any filter state is reflected back into the URL, so a dashboard URL is a shareable deep link.
To filter by program type/category, query the [JSON API](/api/programs.json) (\`facets.canonicalType\`) directly.

## Country ecosystem profiles

Going one level up from individual programs: profiles of national startup ecosystems for founders
considering relocation — summary, visa/residency routes, key organizations and links.

- [Countries API](/api/countries.json): machine-readable profiles. Each country joins back to the
  program data via the shared \`name\` field, and carries a \`programCount\`. Served with CORS. This
  is the canonical country surface; the human-facing country pages are not in production yet.

This dataset is intentionally small for now and growing; it is designed to move to an updatable
cloud database without changing the API shape.

## Human views

Every page shares one header: brand · a Globe / List view toggle · Countries · About.

- [Globe](/): 3D globe — the entry point on every device. Programs panel, dense-city minimaps and
  the status legend are toggleable overlays; where WebGL is unavailable it falls back to a list-view link.
- [Explore](/explore): searchable, filterable card list with a program detail drawer.
- [Find your orbit](/find-your-orbit): guided matching; \`/find-support\` remains compatible.
- [Map](/map): 2D interactive Leaflet map of the same data (also powers the globe's city minimaps).
- [About](/about): what 0rbital is + a guide to builder environment types.

Each program also has a dedicated profile page at \`/programs/<slug>\` (slug = lowercased name,
non-alphanumerics → hyphens), with schema.org \`EducationalOccupationalProgram\` JSON-LD.

The /explore page accepts the same filter query params as the dashboard (\`q\`, \`model\`, \`country\`,
\`status\`), e.g. \`/explore?model=co-living&country=USA\`.
`;

export const GET: APIRoute = () =>
  new Response(BODY, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
