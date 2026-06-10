import type { APIRoute } from 'astro';

const BODY = `# Founder Atlas

> A relocation & support portal for founders: the best places in the world to build and the
> startup support waiting there — residencies, hacker houses, startup campuses, accelerators,
> incubators and talent investors. The way university portals help academics choose where to go,
> Founder Atlas helps founders search programs and (soon) whole country startup ecosystems.

This site is a static, agent-friendly directory. AI agents should prefer the JSON API below
over scraping the HTML views.

## Machine-readable data (preferred for agents)

- [Unified program API](/api/programs.json): All programs in one file. Each entry is tagged
  with \`dataset\` (residential | traditional). Includes \`meta\`, \`schema\`, \`count\`, and \`facets\`
  (distinct types, countries and statuses with counts). Served with CORS \`Access-Control-Allow-Origin: *\`.

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

Every page shares one header: brand · a Globe / Map / List view toggle · Countries · About.

- [Globe](/): 3D globe — the desktop entry point (small screens redirect to the list).
- [List](/explore): searchable, filterable card list with a program detail drawer.
- [Map](/map): 2D interactive Leaflet map of the same data.
- [About](/about): what Founder Atlas is + a guide to the program types.

The /explore page accepts the same query params as the dashboard (\`q\`, \`type\`, \`country\`, \`status\`,
\`focus\`, plus \`format\`, \`stage\`, \`sector\`, \`housing\`), e.g. \`/explore?q=residency&country=USA\`.
`;

export const GET: APIRoute = () =>
  new Response(BODY, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
