# AGENTS.md

## Product identity

The product is **0rbital**, pronounced **Orbital**.

0rbital helps early-stage builders, founders, researchers, hackers, and creative technologists compare **co-living founder programs** — places where builders live and build together for a fixed term.

The main included categories are:

* founder residencies (live-in / relocation cohorts)
* hacker / founder houses (coliving organized around a builder scene)

That is the whole scope: **co-living only.** Every record is a residential cohort
(`canonicalType` `founder-residency` or `hacker-house`, or `format: live-in`). The old
broader "builder-environment" set (accelerators, fellowships, government grants, startup
visas, co-founder matching, startup campuses, incubators, studios) was **removed** when
0rbital narrowed to co-living — do not re-add it.

The product should not drift into a generic startup-support, accelerator, grant, visa, or non-residential builder-environment database.

## Brand system

Visual product name:
0rbital

Spoken/readable name:
Orbital

Main tagline:
Find your orbit. Launch what’s next.

Primary explanatory line:
The right environment changes your trajectory. Compare founder residencies, hacker houses, startup campuses, and co-living programs where builders gather momentum for their next launch.

Canonical title:
0rbital — Orbital for builder environments

SEO title:
0rbital — Founder residencies, hacker houses, and builder environments

Core product description:
0rbital helps early-stage builders, founders, and researchers compare the places where people live, work, and build around serious peers.

## Naming rules

Use “0rbital” for:

* logo/wordmark
* nav brand
* hero brand
* footer brand
* public product mark
* domain-facing copy

Use “Orbital” for:

* readability
* SEO
* accessibility
* explanatory copy
* screen reader labels where “0rbital” alone may be confusing

Do not use:

* Founder Atlas
* founder-atlas
* founder-atlas.vercel.app
* Founder Orbital
* founder-orbital
* jcobrew/founder-atlas
* generic “startup support” as the main category
* “find support” as the primary visible feature name

## Engineering rules

Do not rename the GitHub repository unless explicitly requested.

Keep the repo target as:
jcobrew/orbital

Do not change Vercel settings.
Do not change DNS.
Do not merge pull requests automatically.
Do not broaden the product into a generic accelerator, grant, visa, or startup-support database.

Do not break existing routes:

* /
* /explore
* /find-support
* /saved
* /submit
* /dashboard
* /countries
* /api/programs.json
* /api/countries.json
* /llms.txt

If adding `/find-your-orbit`, keep `/find-support` working as a redirect or compatible route.

Do not change public API response shapes unless absolutely necessary.

Prefer small, focused changes.

Before reporting completion, run the available checks. Start with:

* npm run build
* npm test
* npx astro check

If scripts differ, inspect package.json and use the equivalent commands.

## Review priorities

Flag as high priority:

* stale public brand references
* submit flow pointing to the wrong repo
* broken routes
* metadata missing 0rbital or Orbital
* copy that promises filters/features not implemented
* API shape changes
* build/test/type failures
* public copy drifting into generic startup support
