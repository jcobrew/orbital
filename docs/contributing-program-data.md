# Contributing Program Data

Founder Atlas is a curated, human-verified directory. All data changes go through a
lightweight review cycle before reaching the live site. There is no backend or
auto-publish path — quality and trust are maintained by keeping humans in the loop.

## How to suggest a new program or an update

### Option 1 — Submit via the site (recommended for most contributors)

1. Go to [/submit](https://founder-atlas.vercel.app/submit) on the live site.
2. Fill in the form. The more fields you complete, the easier verification is.
   Required: **program name**, **website URL**, **source URL** (where you found
   the information), and **country/location**.
3. Click **Submit** — the form builds a prefilled GitHub issue URL and opens it
   in your browser. Review the pre-filled text, then submit the issue.
4. A maintainer will triage the issue, verify the information against the source
   URL, and open a draft data PR via the `founder-atlas-refresh` skill.

### Option 2 — Open a GitHub issue manually

Go to [github.com/jcobrew/founder-atlas/issues](https://github.com/jcobrew/founder-atlas/issues)
and open a new issue with the label **program-data**. Use the same field list as the
submit form (name, type, URL, city, country, stage, status, source URL).

### Option 3 — Submit a pull request (for maintainers / trusted contributors)

Data lives in two JSON files:

| File | Contents |
|---|---|
| `src/data/startup-programs-data.json` | Residential programs (hacker houses, residencies, startup campuses, co-living) |
| `src/data/traditional-programs-data.json` | Traditional programs (accelerators, fellowships, grants, visas, online communities) |

Each file has a top-level `programs` array. Add your entry there, following the
existing shape. Required fields per MVP standard:

- `name` — official program name
- `type` — program category (e.g. "Accelerator", "Residency", "Fellowship")
- `url` — canonical website or application URL
- `city` — city, or `"Remote"` / `"Global"` if fully remote
- `country` — country name (e.g. `"Finland"`, `"USA"`)
- `lat` / `lng` — coordinates (for the map)
- `stage` — founder stage (e.g. `"Pre-seed / very early"`)
- `status` — one of: `rolling` | `open` | `closing-soon` | `opening-soon` | `running` | `closed`
- `status_detail` — a short human-readable description of the current status
- `operator` — the organization running the program
- `focus` — short comma-separated list of focus areas
- `domain` — website domain only (e.g. `"example.com"`)
- `sourceUrls` — array of URLs used to verify this entry
- `lastVerified` — ISO date string (e.g. `"2026-06-01"`)
- `verificationStatus` — one of: `"verified"` | `"needs-review"` | `"unverified"`

All other fields (funding, equity, deadlines, cohort size, etc.) are optional but
improve the matching experience — include them if you have reliable sources.

### Pull request checklist

- [ ] Entry added to the correct JSON file (residential vs traditional)
- [ ] All required fields present and non-empty
- [ ] `sourceUrls` includes at least one public URL confirming the data
- [ ] `lastVerified` set to today's date
- [ ] `verificationStatus` set appropriately (`"verified"` only if you have
      confirmed the data against the source within the last 90 days)
- [ ] Coordinates are plausible (check with a map)
- [ ] `astro build` passes locally (`npm run build`)
- [ ] `npm test` passes locally

## Data quality standards

Founder Atlas favors **accuracy over completeness**. When in doubt:

- Use `"unknown"` or omit optional fields rather than guessing.
- Set `verificationStatus: "needs-review"` if you are unsure.
- Never invent program data — always link a public source.
- For application status specifically: a program existing does not mean
  applications are open. Use `status: "closed"` or leave `status_detail` blank
  rather than suggesting an open window that isn't.

## How the review + publish cycle works

```
Founder submits issue / PR
        │
        ▼
Maintainer verifies against source URLs
        │
        ▼
founder-atlas-refresh skill runs:
  - reads the issue or PR description
  - researches the program via web search
  - edits the JSON data files
  - opens a DRAFT pull request for human review
        │
        ▼
Maintainer reviews the draft PR, adjusts if needed, merges
        │
        ▼
Vercel auto-deploys the updated static site
```

The `founder-atlas-refresh` skill is a Claude Code skill (`.claude/skills/`) that
handles the research, verification, and draft-PR steps. It never auto-merges.

## What not to submit

- Bulk imports from scraped sources without per-entry source URLs
- Programs outside the MVP scope (see `docs/mvp-implementation-plan.md` §3)
- Duplicate entries (search first)
- Application deadlines or status changes without a current source URL

## Questions?

Open a GitHub issue or reach out via the contact on the live site.
