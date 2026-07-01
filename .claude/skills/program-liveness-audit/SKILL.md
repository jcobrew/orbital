---
name: program-liveness-audit
description: >-
  Audit whether the founder programs ALREADY listed on Orbital are still alive and
  active. Use when asked to liveness-check, health-check, re-verify, prune dead/
  dormant programs, or find stale entries in the Orbital dataset. Visits each
  program's social media (LinkedIn + X first) and site, classifies it
  active/moved/dormant/defunct with dated evidence, and proposes changes by opening
  a GitHub issue through the site's /submit channel. This is NOT the discovery skill
  — it does not look for programs missing from the list (that's founder-atlas-refresh).
---

# Orbital — program liveness audit

You are health-checking the programs **already on Orbital** to catch ones that have
quietly died, gone dormant, moved, or rebranded. The output is a **GitHub issue**
proposing changes — the same public channel the site's `/submit` form uses — so this
skill works for any agent visiting the live site, with or without repo write access.

**Scope — read this twice:**

- ✅ IN scope: "is this listed program still real and active?", dead/dormant detection,
  moved/renamed domains, stale `status`/links on existing entries.
- ❌ OUT of scope: finding *new* programs that should be added, taxonomy changes,
  field enrichment. Discovery/additions belong to the **`founder-atlas-refresh`** skill.
  If you notice a missing program, note it for that skill — don't add it here.

## Where the data is

Enumerate every program from the agent-friendly endpoint (no scraping needed):

- `https://0rbital.app/api/programs.json` → `programs[]`, each with
  `name`, `operator`, `url`, `domain`, `city`, `country`, `status`, `lastVerified`.
- Working in the repo instead? Read `src/data/programs-data.json`.

## The liveness test (run per program, in this priority order)

Freshness on Orbital is about **recent human activity**, not whether a homepage loads.
Weight the signals accordingly:

1. **Social media — PRIMARY signal.** Check the program's **LinkedIn company page**
   and **X/Twitter** handle, and the **people who run it** (founder/operator named in
   `operator`). Look for posts, cohort announcements, or event activity in the **last
   ~90 days**. Active socials ⇒ the program is alive, *even if its old website is down*.
   - LinkedIn is often the best signal for residencies/hacker houses (cohort recaps,
     "applications open", new-location posts). Check it first.
2. **Official site.** Does `url`/`domain` resolve? Is there a recent cohort date, an
   open application, or a current-year copyright? A roving program's site may advertise
   the *next* city.
3. **Recent web / news / event listings.** Luma event pages, press, founder posts.
   Aggregators and listicles are last-resort and never count as the program's own URL.

### Hard-won caveats (do not skip)

- **A dead domain is NOT proof of a dead program.** Programs move domains. Before
  declaring anything defunct, search for a **new/renamed domain** and check socials.
  *(Real example: Pluto's `pluto.community` stopped resolving, but the program is alive
  at `joinpluto.io` with an active LinkedIn — removing it was wrong.)*
- **Roving / pop-up residencies legitimately end a location and continue.** "The Munich
  cohort ended" or "this house wrapped" ≠ closure. Look for the *next* cohort/city.
  (Pluto; The Residency's themed houses behave this way.)
- **Aggregator / listicle / `google.com/search?...` URLs are not valid program URLs.**
  If an entry's `url` is one of these, propose a direct-link fix even if it's active.
- **Don't fabricate recency.** Never write "last posted N days ago" unless you actually
  saw the dated post. Cite the specific post/source URL you used.

## Also flag — out-of-scope entries (surface these even if "active")

Orbital maps places where founders **live together in a cohort / residency**. While
auditing, watch for listed entries that were never that, and flag them for removal
with a one-line reason — being "alive" doesn't make them in-scope:

- **Generic / nomad co-living** — pay-by-the-month housing open to "students,
  professionals, digital nomads," not a selective founder cohort (e.g. Hive Coliving,
  HackerHouse.world). Co-living ≠ a founder program.
- **One-time events / pop-up retreats** — a single dated event (a weekend hackathon, a
  5-day retreat) that isn't a recurring program (e.g. Bali Hacker House / The Collective).
- **Pure co-working / clubs** — desks + events, no live-in (e.g. SHACK15).
- **Online community / course** — no physical residency.

Distinguish from a roving residency (Pluto) — that *is* a cohort program that changes
city; keep it. The test is "selective founder cohort that lives together," not "has a
building." When unsure, flag rather than assert.

## Classification

For each program, assign one verdict with **dated evidence + source URLs**:

| Verdict | Criteria | Proposed change |
| --- | --- | --- |
| **Active** | Social or site activity within ~90 days, or a confirmed recent/upcoming cohort. | None (optionally bump `lastVerified`). |
| **Moved / renamed** | Program is alive but the domain/handle changed, or `url` is an aggregator. | Update `url` + `domain` (and `name` if rebranded). Do **not** remove. |
| **Dormant** | No activity anywhere (site **and** socials) for ~3–6 months; site stale. | Flag for removal — judgment call, list the evidence. |
| **Defunct** | Domain dead **and** socials silent/gone for 6+ months, or an explicit shutdown/"for sale" domain. | Propose removal. |

When site and socials disagree, **socials win** for liveness (a stale site with an
active LinkedIn is Active/Moved, not Dormant).

## Process

1. **Pull the program list** from `/api/programs.json` (or the JSON file).
2. **Check open issues first** (`https://github.com/jcobrew/orbital/issues`) so you
   don't refile a liveness audit that's already pending.
3. **Audit each program** with the test above. Keep a working table:
   `name | verdict | last-activity (date) | evidence URL(s) | proposed change`.
   Prioritise socials; spend your verification budget on the *uncertain* ones (the
   obviously-active, well-known houses need only a quick confirmation).
4. **Group the findings** into: Remove (defunct), Remove? (dormant — flagged),
   Update link/domain (moved/aggregator), Update status, Active (no change).
5. **File ONE GitHub issue** with the results (see Output). Don't edit the dataset
   directly — this skill proposes via issue; a maintainer (or `founder-atlas-refresh`)
   applies changes in a reviewed PR.

## Output: a GitHub issue (the /submit channel)

Submit through the same path as the website's **Submit / update** form
(`src/lib/submit.ts` → a prefilled GitHub issue on the Orbital repo, label
`data-update`). Two ways, depending on the agent's access:

- **With `gh` / GitHub API:** open an issue on `jcobrew/orbital`, label `data-update`.
- **Browser/no-write agent:** open the prefilled URL the form builds:
  `https://github.com/jcobrew/orbital/issues/new?labels=data-update&title=...&body=...`
  (URL-encode title/body).

**Title:** `[Liveness audit] <YYYY-MM-DD> — <N> proposed changes`

**Body template:**

```
Liveness audit of the listed programs (social-first: LinkedIn + X, then site).
Method: checked each program's LinkedIn/X + people who run it, then official site,
then recent news. Dates = most recent activity I could verify.

### Remove — defunct (<n>)
- <Program> — domain dead (<url>) AND no social activity since <date>. Evidence: <links>.

### Remove? — dormant, please confirm (<n>)
- <Program> — site loads but no posts/cohorts since <date>. Evidence: <links>.

### Update link / domain (<n>)
- <Program> — moved <old> → <new> (still active, last post <date>). Evidence: <links>.
- <Program> — `url` is an aggregator/search link; direct site is <url>.

### Update status (<n>)
- <Program> — status should be <status> (cohort <opened/closed> <date>). Evidence: <link>.

### Active — no change (<n>)
- <Program> — confirmed active, last activity <date> (<link>).

Notes: dead domain ≠ dead program; roving programs that ended a single
location are still active. Flagged items are judgment calls for a human.
```

Keep it evidence-dense and honest: every Remove/Update line needs a dated source.
Put anything you couldn't verify under "Remove? — dormant, please confirm", never
silently into a removal.

## Cadence

Good as a periodic (e.g. monthly) unattended run, or on request. Because output is an
issue (not a direct commit), it's safe to run often — a maintainer gates the changes.
Re-checking the same programs is fine; just don't duplicate an already-open audit issue.
