# Review Queue — Proposed Program Updates (Stream 8)

This directory is a **staging area** for proposed changes to the Orbital
program datasets. It sits **beside** the existing prefilled-GitHub-issue
submission flow (`/submit` → `src/lib/submit.ts`) — it does **not** replace it.
Issues are how a human or agent *suggests* a change; this queue is how a
maintainer *stages and reviews* one as structured, validated data before any of
it is allowed to touch the live JSON.

## The golden rule

> **No unreviewed change is ever applied.** `scripts/apply-updates.ts` reads
> **only** `approved/`. `pending/` and `rejected/` are ignored entirely.

And applying is **dry-run by default** — the script prints the diff it *would*
make and writes nothing unless you pass `--apply`. It is always offline; it
never opens a PR and never commits.

## Lifecycle

```
            propose                 review                 apply (manual)
 founder/  ─────────▶  pending/  ─────────────▶  approved/  ───────────────▶  live JSON
  agent                   │                          │        (--apply only)   + audit-log.jsonl
                          └────────▶ rejected/  ◀─────┘
                              (declined; kept for the record)
```

| Dir | Meaning | Read by `apply-updates`? |
| --- | --- | --- |
| `pending/` | A captured proposal, untouched by automation. Awaiting a maintainer's source check. | **No** |
| `approved/` | A maintainer reviewed it, confirmed sources, and moved it here. | **Yes** (re-validated first) |
| `rejected/` | Declined. Kept for the audit trail; never applied. | **No** |
| `audit-log.jsonl` | Append-only record of every change actually applied (`--apply`). | written, not applied |

A reviewer moves a file between directories (and updates its `status` field)
by hand or via the `0rbital-data-review` skill. There is **no auto-approval**.

## Proposal format

Each proposal is one JSON file matching the `ProposedProgramUpdate` model
(`src/lib/reviewQueue/types.ts`). Key fields:

- `target`: either `{ "kind": "new", "dataset": "residential"|"traditional" }`
  to create a program, or `{ "kind": "update", "name": "…" }` /
  `{ "kind": "update", "slug": "…" }` to change an existing one (matched by
  `programSlug(name)`).
- `changes`: the proposed field values (a subset of the `Program` schema).
- `sources`: array of `{ url, title?, retrievedAt? }`. **Required** whenever a
  sensitive field changes (see below).
- `submitter`, `submittedAt`, `status`, optional `rationale` / `reviewNote`.

See `pending/2026-06-12-hf0-deadline.json` and
`approved/2026-06-11-ycombinator-verify.json` for worked examples.

## Sensitive fields (a source is required)

A proposal that changes any of these is **invalid without at least one source
URL**, and `apply-updates` will skip it:

> deadline · application status · equity · funding amount · eligibility · visa
> support · cost · location · program status

(Concretely: `applicationDeadline`, `status`, `status_detail`, `equityTaken`,
`fundingAmount`, `cost`, `providesVisaSupport`, `country`, `city`, `eligibility`.)

## Applying approved updates

```bash
# Dry-run (default): show exactly what would change. Writes nothing.
npm run apply-updates

# Actually write the approved changes + append the audit trail.
npm run apply-updates -- --apply

# Machine-readable plan.
npm run apply-updates -- --json
```

Every approved proposal is **re-validated** at apply time. Anything that fails
(bad taxonomy id, missing source on a sensitive change, malformed shape) is
**skipped**, never applied.
