# Task prompt — generate 0rbital co-living program data

> Paste this whole file to the agent under test, along with `TAXONOMY.md`,
> `SCHEMA.md`, and `example-record.json` from this kit. The agent's job is to
> produce a JSON file of co-living founder programs that passes `validate.py`.
> This is a **standalone** adaptation of the repo's `founder-atlas-refresh`
> skill: there is no repo to edit and no PR to open — you output a JSON file.

## What you are building

0rbital is a curated, public map of **co-living founder programs** — founder
residencies and hacker/founder houses where builders **live and build together
for a fixed term**. You are producing new/updated records for its dataset.

## Scope — co-living ONLY (read twice)

A program belongs in the dataset **only if** it is a live-in / residential cohort:

- `canonicalType: "founder-residency"` — a live-in / relocation cohort you move
  into for a fixed term, **or**
- `canonicalType: "hacker-house"` — a shared house / coliving organized around a
  builder scene, **or**
- any program with `format: "live-in"`.

**Out of scope — do NOT include** (even famous ones): accelerators, pre-accelerators,
founder fellowships, government grants, startup visas, co-founder matching / online
communities, startup campuses, incubators, studios, pure co-working, one-off
retreats/hackathons, and generic/nomad co-living open to anyone. The test is
"a **selective founder cohort that lives together** for a fixed term" — not "has a
building" and not "is a good program." If you're unsure whether something is
co-living, **leave it out and note it** rather than guessing it in.

## Your process

1. **Confirm co-living**, then pick `canonicalType` (`founder-residency` or
   `hacker-house`; see `TAXONOMY.md`).
2. **Research each program from primary sources** — its own site (about / apply /
   FAQ / pricing) and its LinkedIn/X. Prefer the program's own site over
   aggregators. Never invent facts.
3. **Fill the record** per `SCHEMA.md`. Required keys must all be present. Then
   **actively collect the founder-facing fields the UI renders** — do not leave
   them blank out of laziness:
   - `providesHousing` (**almost always `true` for co-living — set it every time**),
     `providesWorkspace`, `format`, `cost` (rent/fee), `cohortSize`,
     `durationWeeksMin`/`durationWeeksMax`, `stageFit`, `founderFit`, `sectorFocus`,
     and `fundingAmount`/`equityTaken` when the program invests.
   - Only leave a field unset if you genuinely could not find it in a primary
     source. "I didn't look" is not a valid reason for a blank field.
4. **Provenance is mandatory** on every record: `sourceUrls` (≥1, primary source
   preferred), `lastVerified` (today's ISO date), `verificationStatus`.
5. **Do NOT add `applicationDeadline`** — it's volatile and the UI doesn't render
   it. Put timing context in `status_detail` instead.
6. **Flag, don't guess.** Anything you couldn't verify, a program you suspect is
   out of scope, an ambiguous type, or a possible duplicate → list it under
   `_notes` in the output (see below), never silently in a record.

## Output format

Write a single JSON file, `output.json`, shaped exactly like this:

```json
{
  "programs": [ /* one object per co-living program, per SCHEMA.md */ ],
  "_notes": [ "free-text flags: uncertain items, suspected out-of-scope, dupes" ]
}
```

`_notes` is a scratch field for your flags — the validator ignores it and it is
stripped before import. Every object in `programs` must pass `validate.py`.

## How you'll be judged

Run `python3 validate.py output.json`. Success = **0 errors**. Then a human checks:
were the programs real and in-scope, were facts sourced, and how many of the
founder-facing UI fields you actually populated (a record with everything
`Unknown` is a poor result even if it validates).
