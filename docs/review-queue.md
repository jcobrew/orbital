# Review Queue for Proposed Updates (Stream 8)

A structured, file-based queue that **stages** user / agent / manual updates to
the program datasets without blindly changing data. It is the controlled-update
layer of the MVP: collection is allowed to be messy, but **nothing reaches the
live data until a human approves it**, and even then only via an explicit,
auditable, dry-run-first apply step.

This layer is **additive**. The existing `/submit` → prefilled-GitHub-issue flow
(`src/lib/submit.ts`, `src/components/SubmitForm.tsx`) is untouched and still
works exactly as before; the queue is a parallel way to capture a change as
typed, validated data.

## Pieces

| Piece | Path | Role |
| --- | --- | --- |
| `ProposedProgramUpdate` model | `src/lib/reviewQueue/types.ts` | The on-disk proposal shape + the `SENSITIVE_FIELDS` list + audit/diff types. |
| Validation | `src/lib/reviewQueue/validate.ts` | Validates shape, Stream-2 taxonomy IDs, and the sensitive-field-source rule. |
| Queue helpers | `src/lib/reviewQueue/index.ts` | Target matching, diffing, and non-destructive merge — all pure, no writes. |
| Queue data | `data/review-queue/{pending,approved,rejected}/` + `audit-log.jsonl` | The staged proposals + audit trail (see that dir's `README.md`). |
| Apply script | `scripts/apply-updates.ts` (`npm run apply-updates`) | Dry-run by default; `--apply` writes approved-only changes + audit. |

## The model

`ProposedProgramUpdate` (`src/lib/reviewQueue/types.ts`):

```ts
{
  schemaVersion: 1,
  id: string,                       // stable id, used in filename + audit log
  target:
    | { kind: 'new', dataset: 'residential' | 'traditional' }
    | { kind: 'update', slug?: string, name?: string },
  changes: Partial<Program>,        // proposed field values
  sources: { url, title?, retrievedAt? }[],
  submitter: string,                // email / handle / "agent:<name>"
  submittedAt: string,              // ISO timestamp
  status: 'pending' | 'approved' | 'rejected',
  rationale?: string,
  reviewNote?: string,
}
```

An `update` proposal is matched to a live program via `programSlug(name)` so it
stays robust to record ordering.

> **Note.** The `target.dataset: 'residential' | 'traditional'` discriminant above
> reflects the legacy two-file model. With the unified single dataset, a `new` proposal
> is just a new record in `src/data/programs-data.json` classified by its `canonicalType`;
> `dataset` is a derived back-compat value only. This snippet will simplify once the
> `refactor/unify-canonical-taxonomy` change lands.

## Validation rules

`validateProposal(proposal)` returns `{ valid, issues }`. A proposal is rejected
(clear, field-level messages) when:

1. **Malformed shape** — missing `id`/`submitter`/`submittedAt`, bad `status`,
   no `changes`, an `update` with no slug/name, a `new` with no dataset/name,
   an unsupported `schemaVersion`, or a source with a non-URL.
2. **Invalid taxonomy** — a changed canonical/enum field carries an unknown ID.
   Validated against Stream 2's `src/data/taxonomy.ts`:
   - `canonicalType` ∈ `programType` IDs
   - `supportModes` ⊆ `supportMode` IDs, `stageFit` ⊆ `founderStage` IDs
   - `intakeMethod`, `intakeFrequency`, `costFundingModel` against their sets
   - `format`, `verificationStatus`, `status` against their allowed values
   - date-ish fields (`applicationDeadline`, `nextCohortStart`, `lastVerified`)
     must parse as dates.
3. **Missing source on a sensitive change** — see below.

Free-text fields (`name`, `focus`, `notes`, `highlight`, …) are intentionally
unconstrained; legacy free-text `type` is allowed (it is canonicalized at read
time by `normalizeProgram`), it just may not be empty.

## Sensitive fields require a source

Per the MVP plan, changing any of these fields **requires at least one source
URL** on the proposal, or validation fails with `missing-source`:

> deadline · application status · equity · funding amount · eligibility · visa
> support · cost · location · program status

→ `applicationDeadline`, `status`, `status_detail`, `equityTaken`,
`fundingAmount`, `cost`, `providesVisaSupport`, `country`, `city`, `eligibility`
(`SENSITIVE_FIELDS` in `types.ts`).

## The apply script — safe by default

`scripts/apply-updates.ts` (`npm run apply-updates`):

1. Reads **only** `data/review-queue/approved/`. `pending/` and `rejected/` are
   never read. As defence in depth, a file in `approved/` whose own `status`
   field is not `approved` is skipped.
2. **Re-validates** every approved proposal. Invalid ones are **skipped**, never
   applied.
3. Computes the field-level diff against the live JSON (`PROGRAMS`).
4. **Dry-run by default:** prints the diff it *would* make and writes nothing.
5. With `--apply`: writes the merged record back to the correct dataset JSON
   and **appends an audit entry** to `data/review-queue/audit-log.jsonl`.

It is **always offline** and **never opens a PR or commits** — applying to the
live site still goes through the `0rbital-data-review` draft-PR discipline.

```bash
npm run apply-updates            # dry-run diff (default, writes nothing)
npm run apply-updates -- --apply # write approved changes + audit trail
npm run apply-updates -- --json  # machine-readable plan
```

## Audit trail

Each applied change appends one JSON line to `data/review-queue/audit-log.jsonl`:

```jsonc
{ "appliedAt": "…", "proposalId": "…", "action": "updated",
  "dataset": "traditional", "programName": "Y Combinator",
  "submitter": "agent:…", "target": { … }, "diff": [ { "field": …, "before": …, "after": … } ] }
```

## What this is NOT

- No auto-approval — a human moves files into `approved/`.
- No automatic application — `--apply` is an explicit, manual step.
- No network, no PRs, no commits from the script.
- It does **not** replace the GitHub-issue submission flow.
