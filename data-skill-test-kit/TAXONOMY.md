# Controlled vocabularies (co-living kit)

These are the exact machine IDs the dataset uses, extracted from
`src/data/taxonomy.ts` + `src/lib/living.ts`. Use IDs **verbatim** (kebab-case).
`validate.py` enforces every set below.

## `canonicalType` — pick one

**In scope (use these):**

| id | when |
| --- | --- |
| `founder-residency` | Live-in / relocation cohort built around focus; you move into a house/campus for a fixed term (HF0, The Residency, Neo). |
| `hacker-house` | Shared house / coliving organized around a tech scene; value is builder density, often pay-rent (AGI House, STAK, Foundry). |

Any other `canonicalType` is **out of scope** for this kit unless the record is
also `format: "live-in"`. The full taxonomy also defines (do **not** use here):
`accelerator, pre-accelerator, founder-fellowship, government-grant, startup-visa,
cofounder-matching, incubator, startup-studio, corporate-accelerator,
university-program, tech-transfer, deep-tech-program, startup-campus, venture-debt,
pop-up-village, ecosystem-support, other`.

## `supportModes` — array; include what the program provides

`funding`, `housing`, `workspace`, `mentorship`, `investor-access`, `demo-day`,
`visa-support`, `community`, `co-founder-matching`, `structure`, `customers`,
`compute-credits`, `lab-access`, `legal-admin`.

> A co-living record should almost always include **`housing`**.

## `format` — pick one (living model)

`live-in`, `relocation`, `hybrid`, `in-person`, `remote`, `unknown`.
(`live-in` / `relocation` express the residential quality. Don't leave a
co-living record on `unknown`.)

## `status` — pick one

`rolling`, `open`, `closing-soon`, `opening-soon`, `running`, `closed`.

## `verificationStatus` — pick one

`verified` (confirmed against a primary source within ~90 days), `needs-review`,
`unverified`.

## `stageFit` — array (subset)

`pre-idea`, `idea`, `pre-product`, `mvp`, `pre-seed`, `seed`, `series-a-plus`,
`repeat-founder`, `student`, `researcher`, `unknown`.

## `founderFit` — array (subset)

`first-time-founder`, `solo-founder`, `technical-builder`, `domain-expert`,
`repeat-founder`, `student-founder`, `researcher`, `international-founder`,
`relocating-founder`, `fundraising-soon`, `needs-focus`, `needs-community`,
`needs-customers`, `needs-capital`.

## Optional canonical IDs

- `intakeMethod`: `rolling`, `cohort-application`, `open-call`, `invitation`,
  `membership`, `unknown`.
- `intakeFrequency`: `rolling`, `annual`, `biannual`, `quarterly`, `ad-hoc`,
  `unknown`.
- `costFundingModel`: `equity`, `equity-free-grant`, `stipend`, `fee`, `free`,
  `venture-debt`, `mixed`, `unknown`.
