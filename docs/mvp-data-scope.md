# Orbital — MVP Data Scope

This document defines the **MVP data scope** for Orbital: which existing records are
curated, launch-ready MVP records, the controlled vocabulary used to tag them, the current
tagging counts, and the seed-expansion plan to reach the 100–200-record target.

It is the companion to [`program-data-quality.md`](./program-data-quality.md) (the per-record
field/quality standard) and builds on the canonical taxonomy in
[`program-taxonomy.md`](./program-taxonomy.md) / [`src/data/taxonomy.ts`](../src/data/taxonomy.ts).

> **Thesis.** The MVP is judged by *usefulness, not database size*. We want **100–200 curated,
> high-trust records** across **3–5 ecosystems** and **6–8 program types** — not a global import
> of every builder-environment program. Quality and freshness beat completeness.

---

## 1. What "in MVP scope" means

A record is tagged **`mvp: true`** only when it is **both**:

1. **An MVP canonical program type** — its `canonicalType` (set explicitly, or derived
   from legacy `type` via [`normalizeProgram.ts`](../src/lib/normalizeProgram.ts) as a
   fallback) is one of the **8 MVP categories** flagged `mvp: true` in the taxonomy:
   `founder-residency`, `hacker-house`, `accelerator`, `pre-accelerator`,
   `founder-fellowship`, `government-grant`, `startup-visa`, `cofounder-matching`; **and**
2. **In an MVP ecosystem** — its `country` maps to one of the 5 controlled ecosystems below.

Records that fail either test are **left untagged** (no `mvp` key, or `mvp` absent/false) and
carry no `ecosystem`. This is deliberately conservative: a future, out-of-region, or
out-of-type record stays fully representable and rendered, but is not claimed as launch-ready.

The `mvp` and `ecosystem` keys are set on in-scope records in the unified dataset
`src/data/programs-data.json`. A record is tagged by its `canonicalType` + `country`, not by
which file it lives in (there is only one file).

### Why type *and* region, conservatively

Several records are an MVP type but outside the 5 ecosystems (e.g. accelerators in India,
Singapore, Brazil, Africa), and several are in an MVP region but a non-MVP type (e.g.
`startup-campus` Station F, `pop-up-village` Edge Esmeralda, `deep-tech-program` Conception X).
Tagging requires *both*, so these are excluded — keeping the MVP set tight and trustworthy.

---

## 2. In-scope ecosystems (3–5)

The MVP focuses on **5 ecosystems**, matching §3 of the implementation plan
(Finland/Nordics, Estonia, EU-wide/Europe-wide, UK, US/global-remote).

### Controlled `ecosystem` vocabulary

`ecosystem` is a **single string** from this closed set (kebab-case machine IDs):

| `ecosystem` value | Covers | Notes |
| --- | --- | --- |
| `finland-nordics` | Finland, Sweden, Norway, Denmark, Iceland | The Nordic cluster; Finland is the anchor. |
| `estonia` | Estonia | Called out separately (e-Residency / startup-visa hub). |
| `europe-wide` | Other European countries: France, Germany, Switzerland, Netherlands, Austria, Spain, Ireland, Portugal, Belgium | Continental Europe **excluding** the UK, the Nordics, and Estonia. |
| `uk` | United Kingdom | Separated from `europe-wide` (distinct legal/visa ecosystem, London density). |
| `us-global-remote` | USA, plus global-remote / online-first programs anchored in the US | The default home for US-based and online founder communities. |

**Country → ecosystem map** used for tagging (anything not listed is **out of MVP scope** and
left untagged):

```
finland-nordics : Finland, Sweden, Norway, Denmark, Iceland
estonia         : Estonia
uk              : UK
us-global-remote: USA
europe-wide     : France, Germany, Switzerland, Netherlands, Austria, Spain,
                  Ireland, Portugal, Belgium
```

Records in **out-of-scope countries** — India, Singapore, UAE, Australia, Canada, Mexico,
Argentina, Colombia, Indonesia, Malaysia, Vietnam, Brazil, Chile, China, South Korea, Japan,
Qatar, Egypt, Ghana, South Africa, Nigeria, Kenya, Rwanda — are intentionally **not tagged**,
even when they are an MVP type. They remain in the datasets and on the map; they are simply not
part of the curated MVP launch set.

> **Judgment call — networked/multi-city programs.** Programs that operate as a global network
> (Antler, EF, The Residency, Forge) are tagged by the **primary country of the specific
> record**, not the parent brand. So `Antler ONE (Berlin)` → `europe-wide` and
> `Entrepreneur First (London)` → `uk` are tagged, while `Antler (Singapore)`,
> `Antler India`, and `The Residency — Bangalore` are not. This keeps each row's ecosystem tag
> truthful to its location.

---

## 3. In-scope canonical program types (6–8)

All **8** MVP canonical types are in scope. In the *current* data only the subset below actually
occurs after tagging; the others (`government-grant`, `startup-visa`, and `pre-accelerator`
beyond its two records) are in-scope but under-populated and are **expansion priorities** (§5).

| Canonical type | In MVP scope? | Present in current tagged data? |
| --- | --- | --- |
| `founder-residency` | yes | yes |
| `hacker-house` | yes | yes |
| `accelerator` | yes | yes |
| `pre-accelerator` | yes | yes (2) |
| `founder-fellowship` | yes | yes (2) |
| `cofounder-matching` | yes | yes (2) |
| `government-grant` | yes | **not yet** — expansion priority |
| `startup-visa` | yes | **not yet** — expansion priority |

---

## 4. Current tagging summary

Of the **123 records** in the unified `src/data/programs-data.json`, **67** are `mvp: true`.

### Per ecosystem

| `ecosystem` | Tagged `mvp: true` |
| --- | --- |
| `us-global-remote` | **46** |
| `europe-wide` | **10** |
| `uk` | **6** |
| `finland-nordics` | **4** |
| `estonia` | **1** |
| **Total** | **67** |

### Per canonical type

| Canonical type | Tagged `mvp: true` |
| --- | --- |
| `accelerator` | **26** |
| `hacker-house` | **21** |
| `founder-residency` | **14** |
| `founder-fellowship` | **2** |
| `cofounder-matching` | **2** |
| `pre-accelerator` | **2** |
| **Total** | **67** |

> **Distribution note.** The current tagged set is heavily skewed to `us-global-remote` (46/67)
> and to `accelerator` + `hacker-house` + `founder-residency` (61/67). It is also light on the
> European ecosystems and missing `government-grant` and `startup-visa` entirely. The seed plan
> below corrects this imbalance.

---

## 5. Seed-expansion plan (reach 100–200, no global import)

We are at **67** curated records; the target is **100–200**. The gap is ~35–135 records. We
**do not** bulk-import or scrape a global directory. Instead we add curated, sourced records
that close the distribution gaps above, prioritizing under-served ecosystems and the two empty
MVP types. Each addition follows [`program-data-quality.md`](./program-data-quality.md) and the
draft-PR discipline of the `0rbital-data-review` skill.

### Priority gaps (add these first)

1. **`startup-visa` / soft-landing (currently 0).** Estonia Startup Visa, UK Global
   Talent / Innovator Founder visa, France French Tech Visa / La French Tech, Germany / EU
   founder-visa routes. Strengthens `estonia`, `uk`, `europe-wide`.
2. **`government-grant` / non-dilutive (currently 0).** Business Finland (Finland),
   Innovate UK / SMART grants (UK), Bpifrance & EU EIC Accelerator grant track (europe-wide),
   Vinnova (Sweden), Enterprise Estonia. Strengthens `finland-nordics`, `uk`, `europe-wide`,
   `estonia`.
3. **`finland-nordics` depth (currently 4).** Maria 01, xEdu, Kiuas, Slush-adjacent programs,
   Antler Stockholm/Oslo, Norrsken (Stockholm) accelerator tracks, NordicNinja-backed programs.
4. **`estonia` depth (currently 1).** Startup Wise Guys (already tagged), Tehnopol, Latitude59
   programs, Estonian founder communities and the startup-visa above.
5. **`europe-wide` / `uk` accelerator & fellowship depth.** Reinforce with well-known,
   verifiable European cohorts and founder fellowships (e.g. EF cohorts, Entrepreneur First
   Europe, Seedcamp-adjacent, Station F resident programs already in-data as future).
6. **`cofounder-matching` / online community depth (currently 2).** On Deck, YC Co-Founder
   Matching, Antler co-founder tracks, CoFoundersLab, EU-based founder communities.

### Sourcing rules

- **Curated, not scraped.** Add records by hand from primary sources (program site/X), with at
  least one `sourceUrls` entry and a `lastVerified` date — same bar as the existing 7
  fully-verified records.
- **Stay within the 5 ecosystems and 8 types.** A great program outside the controlled
  vocabulary is *out of MVP scope* until the scope is formally widened — flag it, don't tag it.
- **Set the `canonicalType` first** (see the `0rbital-data-review` skill): every record goes
  in the one unified `src/data/programs-data.json`, classified by its `canonicalType`. Live-in /
  relocation programs are `founder-residency` (or `hacker-house`) with `format: "live-in"` +
  `housing` in `supportModes` — not a separate file.
- **No global completeness.** We are explicitly *not* covering every country or every program
  type. Out-of-scope categories (`tech-transfer`, `corporate-accelerator`, `venture-debt`,
  meetups, angel networks, etc.) stay out.

### Target distribution (rough, for ~120–150 records)

| ecosystem | now | target |
| --- | --- | --- |
| `us-global-remote` | 46 | ~50 (hold; already deep) |
| `europe-wide` | 10 | ~25 |
| `uk` | 6 | ~20 |
| `finland-nordics` | 4 | ~20 |
| `estonia` | 1 | ~10 |

This rebalances toward Europe/Nordics/Estonia and fills `startup-visa` + `government-grant`,
landing comfortably inside the 100–200 band while staying curated and high-trust.

---

## 6. Launch-ready ("MVP-ready") definition — pointer

A record being tagged `mvp: true` means it is **in MVP scope**. Whether a tagged record is
**launch-ready** (passes the per-record completeness/freshness bar) is a separate check defined
in [`program-data-quality.md`](./program-data-quality.md). Stream 7's
`scripts/check-mvp-readiness.ts` implements that spec — this stream only *defines* it. The MVP
set should not be considered launch-ready until those records meet the data-quality checklist
(notably `sourceUrls` + `lastVerified`, currently present on only 7 of the 67 tagged records).
