# 0rbital Rebrand Workflow

## Goal

Complete a careful product rebrand and copy alignment from the current Orbital / Founder Atlas / founder-orbital naming into the new 0rbital brand system.

This is a codebase-wide implementation task. Be thorough, but do not redesign the whole app or change the product architecture.

## Locked brand system

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

Primary category:
Builder environments

Main included program types:

* founder residencies
* hacker houses
* startup campuses
* co-living programs
* builder environments

Audience:

* early-stage builders
* founders
* researchers
* hackers
* creative technologists
* people still forming the idea, project, company, or research direction

Brand metaphor:
The right environment changes your trajectory. These places are orbits, launchpads, and gravity fields for early work.

## Naming rules

Use “0rbital” for:

* logo/wordmark
* nav brand
* hero brand
* footer brand
* public product mark
* domain-facing copy

Use “Orbital” for:

* pronunciation
* explanatory copy where readability matters
* SEO metadata together with 0rbital
* accessibility labels where “0rbital” alone may be confusing

Use this as the canonical long title:
0rbital — Orbital for builder environments

Do not replace every occurrence of “Orbital” blindly. Some should remain as “Orbital” for readability, SEO, and accessibility.

Do not use:

* Founder Atlas
* founder-atlas
* founder-atlas.vercel.app
* Founder Orbital
* founder-orbital as public brand
* generic “startup support” as the main category
* generic “find support” as primary navigation copy

Keep the GitHub repo target as:
jcobrew/orbital

Do not rename the GitHub repository.
Do not change Vercel settings.
Do not change DNS.
Do not merge the PR automatically.

## Required UX and copy changes

### Homepage

Use this hierarchy or a very close equivalent:

0rbital

Find your orbit. Launch what’s next.

The right environment changes your trajectory. Compare founder residencies, hacker houses, startup campuses, and co-living programs where builders gather momentum for their next launch.

Primary CTA:
Find your orbit

Secondary CTA:
Explore programs

### Explore page

Use heading:
Explore builder environments

Use description only if supported by actual filters.

If filters include location, duration, housing, funding, application status, and fit, use:
Browse founder residencies, hacker houses, startup campuses, and co-living programs by location, duration, housing, funding, application status, and fit.

If filters are more limited, do not overpromise. Use:
Browse founder residencies, hacker houses, startup campuses, and co-living programs by location, model, and application status.

### Guided matching page

Visible feature name should become:
Find your orbit

If the route is currently `/find-support`, keep the route working.

If reasonable, add `/find-your-orbit` as a canonical route and redirect `/find-support` to it.

If that creates too much risk, keep `/find-support` internally but update all visible labels to “Find your orbit.”

Guided matching copy:
Answer a few questions about your stage, goals, location preferences, and constraints. We’ll suggest builder environments that may fit where you are now.

Matching result language:

* Possible orbits
* Best-fit environments
* Why this might fit
* Potential tradeoffs

Avoid claiming the matching result is definitive.

### Saved page

Heading:
Your shortlist

Description:
Save programs, compare tradeoffs, and track where you might apply next.

If a comparison table exists, align its copy with:
Compare your saved orbits

### Submit page

Heading:
Add a builder environment

Description:
Know a founder residency, hacker house, startup campus, or co-living program we should include? Submit it for review.

### Dashboard/admin

Frame it as:
Data quality dashboard

Description:
Track freshness, verification status, missing fields, and programs that need review.

## Metadata and SEO requirements

Important pages should include both:

* 0rbital
* Orbital

Also include searchable category terms:

* founder residencies
* hacker houses
* builder environments
* startup campuses
* co-living programs
* early-stage builders

Recommended metadata:

Homepage title:
0rbital — Orbital for builder environments

Homepage meta description:
Find your orbit. Launch what’s next. Compare founder residencies, hacker houses, startup campuses, and co-living programs where builders gather momentum.

Explore title:
Explore builder environments — 0rbital

Find-your-orbit title:
Find your orbit — 0rbital

Submit title:
Submit a builder environment — 0rbital

## Files and areas to audit

Search the entire repo for these terms and fix them carefully:

* Founder Atlas
* founder-atlas
* founder-atlas.vercel.app
* Founder Orbital
* founder-orbital
* jcobrew/founder-atlas
* find support
* startup support
* Orbital
* orbital

Likely files to inspect:

* README.md
* package.json
* astro.config.*
* src/layouts/*
* src/pages/index.astro
* src/pages/explore.astro
* src/pages/find-support.astro
* src/pages/saved.astro
* src/pages/submit.astro
* src/pages/dashboard.astro
* src/pages/countries.astro
* src/components/*
* src/components/find-support/*
* src/lib/submit.ts
* public/llms.txt
* docs/*
* tests/*
* any constants/config files

## Submit flow requirement

Find and fix any stale GitHub issue creation links.

`src/lib/submit.ts` or equivalent should create issues in:
jcobrew/orbital

Not:
jcobrew/founder-atlas

Make issue titles and body copy use “builder environment” and “0rbital” where appropriate.

## Route requirements

Do not break these:

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

## API requirements

Do not change public API response shapes unless tests show the existing shape is broken.

Do not rename data fields unless absolutely necessary.

This is a brand, copy, metadata, submit-flow, and reliability pass, not a data model rewrite.

## Implementation loop

Follow this loop:

1. Inspect

   * Read README, package scripts, routes, layouts, and submit flow.
   * Identify actual filters and matching features before editing copy.
   * Search stale naming terms.

2. Plan

   * Write a concise implementation plan before editing.
   * List the main files expected to change.

3. Edit

   * Make copy, metadata, and name changes.
   * Fix stale issue links.
   * Add `/find-your-orbit` route or redirect only if low-risk.
   * Keep existing behavior stable.

4. Verify
   Run available checks. Start with:

   * npm run build
   * npm test
   * npx astro check

   If package scripts differ, inspect package.json and use the equivalent commands.

5. Repair
   If checks fail because of these changes, fix them.
   Repeat build/test/check until green or until a failure is clearly unrelated or pre-existing.
   Do not stop after the first failure.

6. Audit
   Run repo-wide searches for:

   * Founder Atlas
   * founder-atlas
   * founder-atlas.vercel.app
   * Founder Orbital
   * founder-orbital
   * jcobrew/founder-atlas

   For remaining matches, either remove them or document why they remain.

7. Report
   Produce a final summary with:

   * files changed
   * naming references fixed
   * routes checked
   * commands run and results
   * remaining risks
   * manual steps required from the user

## Acceptance criteria

The task is complete only if:

* Public-facing brand is 0rbital.
* Spoken/readable name Orbital is still present where helpful for SEO/accessibility.
* Main tagline is “Find your orbit. Launch what’s next.”
* Primary explanatory line is present on the homepage or equivalent primary marketing surface.
* “Find support” is no longer the visible primary feature name.
* “Find your orbit” is the visible guided matching feature name.
* Submit flow points to `jcobrew/orbital`, not `jcobrew/founder-atlas`.
* No stale Founder Atlas / founder-atlas / founder-orbital references remain unless explicitly documented as legacy.
* Existing routes still build.
* API shapes remain stable.
* Build/test/type/astro checks pass, or failures are clearly documented as pre-existing/unrelated.

## Out of scope

Do not perform a huge visual redesign.
Do not add a backend.
Do not broaden the product into a generic accelerator/grant/visa database.
Do not rename the GitHub repo.
Do not change Vercel project settings.
Do not change DNS records.
Do not merge the PR automatically.
