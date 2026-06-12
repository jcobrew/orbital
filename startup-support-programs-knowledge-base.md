# Founder Residencies, Hacker Houses & Startup Campuses — Base Knowledge

*Compiled June 1, 2026.*

> **⚠️ Legacy source material — not the operating model.** This file is preserved
> research from when Founder Atlas split programs into a "residential" vs "traditional"
> binary across two datasets. **That split is retired.** There is now **one unified
> dataset** (`src/data/programs-data.json`) and programs are classified by their
> **`canonicalType`** plus `supportModes` / `format` / `mvp` / `ecosystem`, defined in
> [`src/data/taxonomy.ts`](src/data/taxonomy.ts) and documented in
> [`docs/program-taxonomy.md`](docs/program-taxonomy.md) — which **supersede** anything
> here. The categories described below (residencies, hacker houses, fellowships,
> talent investors, pop-up villages) now map onto canonical types like
> `founder-residency`, `hacker-house`, `founder-fellowship`, `cofounder-matching`, and
> `pop-up-village`; the "live-in / move-in" quality is captured by `format: "live-in"`
> + `housing` in `supportModes`, **not** by a separate file. Read this for the landscape
> narrative and operator notes — but use the canonical taxonomy for any data work.

---

## 1. What this category is

There is a layer of the startup world that sits **below** the traditional accelerator — earlier, more physical, and more about *people* than *companies*. It supports founders at the stage when there is often no company yet: no product, sometimes no co-founder, sometimes not even an idea. The industry shorthand for this stage is **"-1 to 0"** (getting *to* the starting line), as opposed to the classic accelerator's **"0 to 1"** (building the first product).

A useful analogy: if a university is where you go to *learn*, and an accelerator (like Y Combinator) is a *bootcamp* that drills an existing company toward a demo day, then this category is more like an **artists' residency or a monastery** — a place you physically move into, surrounded by other obsessed people, where the point is to focus completely and let a company emerge. HF0, one of the best-known, is literally nicknamed "the Monastery of Code."

The category clusters into a few overlapping models:

| Model | What it physically is | Core promise | Archetype |
|---|---|---|---|
| **Startup campus** | A large, owned/leased building with labs, desks, studios | "Come build here, we'll fund you" | Founders, Inc. |
| **Live-in residency** | A house/mansion you sleep and work in for a fixed cohort | "We remove all of life's friction so you can focus" | HF0, The Residency |
| **Hacker house** | A shared house organized around a tech scene | "Live with your peers, absorb the network" | AGI House, STAK, Foundry |
| **Founder fellowship** | Membership + capital, with offices but not always housing | "We back you before you have an idea" | South Park Commons, Afore FIR |
| **Talent investor / day-zero VC** | Co-founder matching + first cheque | "We'll help you find a co-founder and a company" | Entrepreneur First, Antler |
| **Pop-up village** | A temporary town that exists for weeks | "Live in a community of builders, then go home" | Edge Esmeralda |

These are not crisp boundaries — Founders, Inc. is a campus *and* a fund; AGI House is a hacker house *and* runs a venture fund; Neo is a residency *and* an accelerator. The map and database treat each as a single pin tagged with its primary `type`.

> **Technical note — why "talent investing" matters.** Entrepreneur First and Antler invented a genuinely new financial instrument: they invest in *individuals* before a company exists, then help two strangers become co-founders. For your project this is significant because it pushes the support model upstream of everything else — there is no company to evaluate, so selection is purely about people. That makes these programs the most extreme version of the "residency thesis": the bet is entirely on the person and the environment, not the product.

---

## 2. Why the model exists (the underlying logic)

Three forces explain why so many of these appeared, especially since ~2021:

1. **Capital is abundant; focus and environment are scarce.** Once a $125K–$500K first cheque became commoditized (YC standardized it), the way to differentiate as an investor was no longer *money* but *environment* — a building, a peer group, a vibe. Programs compete on real estate and community, not just term sheets.

2. **The "founder-market fit" problem.** Many talented technical people (often from Google, Meta, OpenAI, top universities) want to start a company but don't have an idea yet. Traditional accelerators can't help them because there's nothing to accelerate. South Park Commons and Afore's Founder-in-Residence exist precisely to support this "before zero" person.

3. **The AI wave.** Since 2023, a huge share of new houses are explicitly **AI-focused** (AGI House, Conviction Embed, Build Club, Pluto, AI2 Incubator). Compute credits — free access to expensive GPUs and model APIs — have become a core currency these programs hand out, sometimes worth more than the cash.

> **Analogy for the credits point:** if cash is the flour, **compute credits are the oven.** An AI founder with $250K but no GPU access can't bake anything; programs increasingly win by handing over the oven (Azure/AWS/GCP/Anthropic/OpenAI credits often worth $0.5M–$5M).

---

## 3. The geography

The category is heavily concentrated but genuinely global:

- **San Francisco Bay Area** is the gravitational center — Founders Inc, HF0, AGI House (SF + Hillsborough), Foundry, Accelr8, STAK (Oakland), FoundHer House, Neo, Afore, Conviction, plus SF chapters of The Residency, EF and SPC. The 2026 twist (per the SF Standard) is a "gold rush" for **luxury mansions** as houses compete for grand buildings.
- **New York** — South Park Commons NYC, Betaworks, The Residency (Homebrew).
- **London / Europe** — Entrepreneur First (London HQ), The Residency (Londinium, Berlin, Vienna), HackerHouse.world (Bordeaux/Berlin/Venice/Rome/Dublin/London), Pluto (Zurich/Paris), FR8 (Espoo), The Hacker Building (Amsterdam).
- **India** — Bangalore is the hub: SPC Bangalore, The Residency Bangalore, Labsmart, EF Bangalore.
- **Asia-Pacific** — Antler (Singapore HQ + 30 cities), Build Club (Sydney), Bali Hacker House.
- **Latin America** — Casa Bernarda (Mérida), AbadiaDev (Buenos Aires), Hacker Paradise (Medellín).

The interactive map visualizes exactly this spread, color-coded by recruiting status.

---

## 4. How they make money / what they take

Three broad economic models, which is the single most useful lens for comparing them:

- **Equity programs** (most live-in residencies and campuses): they give cash + housing/space and take **5–12% equity**. Examples: HF0 (~5%), Founders Inc (4–7%), SPC (7% for $400K + more later), Antler (10–12%), EF (8–10%).
- **No-equity / community programs:** On Deck (pay-what-you-can), Edge Esmeralda (you pay to attend), Greentown Labs (membership), many corporate "founders hub" credit programs. The deal is *access*, not ownership.
- **Pure hacker houses / co-livings:** you mostly **pay rent**; the "support" is the network and the address, not capital (Foundry, STAK, Startup Embassy, Casa Bernarda, Hacker Paradise).

> **For thesis framing:** the equity vs. rent vs. free axis maps neatly onto a *power* question — who is dependent on whom. In equity residencies the program is an investor and the founder is a portfolio asset; in rent-based houses the founder is the customer. That difference shapes incentives, selectivity, and the felt experience of "support."

---

## 5. Selection, cohort rhythm, and recruiting status

Most programs run on one of two rhythms, which matters a lot if you're tracking *when to apply*:

- **Cohort-based:** fixed start dates, a few times a year, hard application deadlines (SPC: Spring & Fall; a16z Speedrun: SR006/SR007; YC: two batches; EF Bridge: annual). These have *closed* windows you have to wait for.
- **Rolling:** apply anytime (Founders Inc, HF0, The Residency, AGI House, Antler/EF by location, Z Fellows, On Deck). Lower-friction but still highly selective.

**Recruiting snapshot as of June 1, 2026** (always verify on each site — this moves weekly):
- *Currently running a cohort:* Edge Esmeralda (May 30–Jun 27).
- *Open / rolling:* Founders Inc, HF0, AGI House, The Residency, Foundry, Accelr8, Neo, Afore FIR, Conviction Embed, Z Fellows, On Deck, Build Club, EF & Antler (by location).
- *Closing soon:* Techstars (Jun 10 deadline for a key program).
- *Opening soon:* South Park Commons (Fall 2026 apps open this summer).
- *Closed for now:* Y Combinator S26 (late apps considered), a16z Speedrun SR007 (closed May 17), Sequoia Arc (portfolio only), EF The Bridge (2026 closed).

---

## 6. Who runs them (named operators)

Knowing the operator matters because these programs are often extensions of one person's taste and network:

- **HF0** — Dave Fontenot (with Emily Liu)
- **AGI House SF** — Jeremy Nixon (ex-Google Brain); **AGI House Hillsborough** — Rocky Yu (the two have been in a legal dispute over the name)
- **South Park Commons** — Ruchi Sanghvi & Aditya Agarwal (early Facebook/Dropbox)
- **Build Club** — Annie Liao (out of Aura Ventures, Sydney)
- **Edge Esmeralda / Edge City** — Devon Zuegel
- **Neo** — Ali Partovi
- **Z Fellows** — Cory Levy
- **Entrepreneur First** — Matt Clifford & Alice Bentinck
- **Antler** — Magnus Grimeland
- **Conviction (Embed)** — Sarah Guo
- **Betaworks** — John Borthwick

For several pure hacker houses (STAK, FoundHer House, Casa Bernarda, etc.) the individual operators aren't consistently published; the database marks those with the house/brand name and leaves leadership blank rather than guessing.

---

## 7. Tensions and open questions (useful for analysis)

- **Zoning and neighbors.** As houses move into mansions, cities are pushing back — Hillsborough is drafting a zoning amendment against AGI House over noise/traffic/commercial use. The model has a real-estate-law fragility.
- **Brand disputes.** The two AGI Houses suing each other shows how loosely these "brands" are held.
- **Is it support or extraction?** The most selective equity programs (<0.4% acceptance at Speedrun) look less like *support* and more like *elite talent acquisition* dressed as community.
- **Durability.** Pop-up villages (Edge Esmeralda) and some houses are explicitly temporary or experimental; buildspace/Pioneer-style programs have closed. The category churns fast.
- **The "-1 to 0" measurement problem.** Because these support people before companies exist, success is genuinely hard to measure — which is exactly why a residency-model thesis is interesting.

---

## 8. How this maps onto the current data

> **Historical note.** This section originally described two separate companion files
> (a "residential" JSON database + a standalone HTML map). Both are gone. The programs
> covered here now live in the **single unified dataset** `src/data/programs-data.json`
> alongside every other program, and are rendered by the live Astro site (globe / list /
> dashboard / map), not a hand-built HTML file.

To add or edit a program covered by this research, follow the
[`founder-atlas-refresh`](.claude/skills/founder-atlas-refresh/SKILL.md) skill: set its
**`canonicalType`** (e.g. `founder-residency`, `hacker-house`, `founder-fellowship`),
its `supportModes`, its `format` (`live-in` for move-in residencies), and provenance
(`sourceUrls` + `lastVerified` + `verificationStatus`). See
[`docs/data-model.md`](docs/data-model.md) for the full field reference.

---

## Update log — June 2, 2026 (adjacent & emerging programs added)

A second research pass (web + social) expanded the database from 46 to **59 programs across 18 countries**. New entries:

- **Forge** (forgeresidency.com) — an India-born "residency for the obsessed," EST 2026, founded by *Adi / adihuman ai*. Runs short live-in cohorts across **Mumbai → Bangalore → Bali → Dubai**, explicitly for the "-1 to 0" phase, with a monthly hackathon ("the Void") that hands one builder a no-application "black ticket." Its founders are already backed by YC, EF and SPC. Added as three city pins (Bangalore live, Bali open, Dubai soon).
- **Arrayah** (arrayah.city) — the program you called "Araya." An Australian **hacker-house network** by *Akshat Agarwal*: 9-resident homes with coworking + hardware labs (Billabong in Drummoyne, Banksia in Sydney), plus a 14-day residency. Melbourne and Brisbane houses are launching soon.
- **Network School** (ns.com) — *Balaji Srinivasan's* coliving "startup society" in **Forest City, Johor, Malaysia** (a hotel turned campus near Singapore). Broader than a founder residency — it's the "Network State" made physical — but it houses and supports builders, so it fits as an adjacent model. Expansions planned for Miami, Dubai and Tokyo.
- **The Foundery** (thefoundery.in) — a high-profile Indian **90-day residential "co-founder factory"** from *Nikhil Kamath (Zerodha)* and *Kishore Biyani (Future Group)*; builders keep up to 25% equity and can get up to ~₹4 crore seed.
- **Founders House** (Stockholm + Helsinki) — a Nordic, **equity-free** residents model by *Elis Hodzic & Bror Nordström*; 24/7 space and community at no cost (your "Sweden" lead — it launched in Stockholm in 2025 and reached Helsinki in early 2026).
- **The Residency — Vienna** — the Austrian house in The Residency network that was missing from the first map (Bangalore was already included).
- **London Founder House** (londonfounderhouse.com) — *Haz Hubble's* (Pally) London hacker house for "the most obsessed founders," famous for asking residents to have raised ~$500k.
- **Threshold (UK)** — flagged on your tip as an upcoming UK program. As of June 2026 there is essentially **no public/indexed information** (the only "Threshold" with a web presence is an unrelated VC firm). It's on the map as a clearly-labelled *unverified, opening-soon placeholder* — confirm location, operator and terms before relying on it.

**The Residency — full house network (added).** Pulled from their official homes page, The Residency runs far more houses than first mapped — especially in the US. Now reflected: **San Francisco** has *SF Parc* (generalist), *The Inventors Residency* (12-week inventors), *SF2* (hardware/deep tech — robots, BCIs, backyard rockets), *Odyssey* (purpose-driven founders), and *Biopunk* (a community biolab); plus *Arcadia* (Berkeley, their 14-bedroom flagship from a former YC office) and *Homebrew* (NYC). Internationally: *v2* (Vancouver), *Aurea* (Berlin deep tech), *Vienna* (AI & biotech penthouse), *Bangalore* (HSR Layout), and the affiliated *The Founding Co.* (Hyderabad). That's the full network as listed in June 2026.

**Curation pass — residential/co-living only.** The database and maps were tightened to programs with a genuine **residential, co-living, or relocation** component. Removed (they brand as residencies/programs but have no live-in or relocation element — they're traditional accelerators, talent investors, or office-only incubators): *Antler, Entrepreneur First & EF The Bridge, Y Combinator, a16z Speedrun, Sequoia Arc, Techstars, Betaworks Camp, Conviction Embed, Afore Founder-in-Residence, On Deck, Z Fellows, AI2 Incubator, HAX, Greentown Labs, The Hacker Building.* These still matter as *context* (Section 1's typology and Section 4's economics keep them), but they're no longer on the map. Added in their place — genuinely residential finds: *Focal Founder Residency* (Miami; relocation required, 6 days/wk at The LAB Miami), *Frontier Tower / BerlinHouse* (a 16-floor SF "vertical village" with co-living floors over themed labs), *Hive Coliving* (50-bed SoMa founder house), and *Launch House* (the LA mansion that popularized the live-in residency; included for reference though its live-in model has since wound down). Net total is now **53 programs across 17 countries**.

> **Reminder to act:** the two genuinely time-sensitive items here are **Threshold** (needs you to supply the source/handle you saw it on so I can verify and de-flag it) and **Forge Dubai / Arrayah Melbourne & Brisbane** (marked "opening soon" — worth a calendar nudge if you want to catch their first cohorts). Tell me the Threshold source and I'll chase it down.

---

## Sources

- [Founders, Inc. — campus](https://f.inc/campus) · [about/fund](https://f.inc/about) · [apply](https://f.inc/apply)
- [South Park Commons — Founder Fellowship](https://www.southparkcommons.com/founder-fellowship/) · [Spring 2026 cohort](https://blog.southparkcommons.com/p/spc-founder-fellowship-spring-2026)
- [HF0 Residency](https://www.hf0.com/) · [Archbishop's Mansion profile](https://alamosquare.org/2023/06/the-archbishops-mansion-the-hacker-hotel-incubating-the-a-i-revolution/)
- [AGI House](https://agihouse.ai/) · [SF Standard — mansions gold rush](https://sfstandard.com/2026/03/17/move-garages-startups-now-hatching-luxury-mansions/)
- [The Residency](https://www.livetheresidency.com/) · [residencies/houses](https://www.livetheresidency.com/residencies) · [Bangalore](https://www.residencyblr.com/)
- [Foundry Coliving](https://foundry.today/) · [Accelr8](https://joinaccelr8.com/) · [SF Standard — hacker house](https://sfstandard.com/2023/01/23/inside-sfs-most-competitive-hacker-house-where-workers-eat-sleep-and-breathe-tech/)
- [Techloy — 17 best hacker houses worldwide](https://www.techloy.com/17-of-the-best-hacker-houses-for-tech-talents-and-founders-around-the-world/)
- [Build Club](https://buildclub.ai/) · [SmartCompany on Build Club](https://www.smartcompany.com.au/startupsmart/ai-builder-club-free-residency-program-australia/)
- [Edge Esmeralda 2026](https://www.edgeesmeralda.com/) · [Edge City](https://www.edgecity.live/)
- [Neo Residency](https://neo.com/residency) · [TechCrunch on Neo](https://techcrunch.com/2026/02/19/ali-partovis-neo-looks-to-upend-the-accelerator-model-with-low-dilution-terms/)
- [Entrepreneur First](https://www.joinef.com/) · [Antler](https://www.antler.co/) · [Z Fellows](https://www.zfellows.com/)
- [a16z Speedrun](https://speedrun.a16z.com/) · [Y Combinator](https://www.ycombinator.com/apply) · [Sequoia Arc](https://www.sequoiacap.com/arc/)
- [cleverhack — 2026 founder programs master list](https://cleverhack.com/2026-ai-startup-founder-resources)
- [Forge — Founder Residency](https://www.forgeresidency.com/)
- [Arrayah hacker houses (Australia)](https://arrayah.city/) · [Capital Brief — inside Australia's hacker house experiment](https://www.capitalbrief.com/article/beer-pong-tarot-cards-and-robot-arms-inside-australias-hacker-house-experiment-27820983-6b28-4fb4-a26b-999f7f4018be/)
- [Network School](https://ns.com/) · [Bloomberg — Network School in Forest City](https://www.bloomberg.com/news/articles/2025-08-28/srinivasan-builds-crypto-techno-utopia-network-school-in-malaysia-s-forest-city)
- [The Foundery](https://www.thefoundery.in/) · [Entrepreneur India — Kamath & Biyani launch The Foundery](https://india.entrepreneur.com/news-and-trends/nikhil-kamath-and-kishore-biyani-launch-residential-startup/501173)
- [Founders House — Stockholm & Helsinki (Basepoint)](https://basepoint.vc/stories/founders-house-stockholm-and-helsinki-hubs)
- [London Founder House](https://www.londonfounderhouse.com/) · [Sifted — inside London's founder house](https://sifted.eu/articles/founder-house-london-startups)
