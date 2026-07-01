#!/usr/bin/env python3
"""
Validator for the 0rbital co-living data test-kit.

Usage:
    python3 validate.py output.json

Accepts either a full object {"programs": [...], "_notes": [...]} or a bare
[...] array of program records. Prints per-record ERRORs (must fix) and
WARNINGs (quality), a UI-field coverage summary, then exits non-zero if any
ERROR was found. Mirrors the required-keys + enum rules in src/data/taxonomy.ts
and the co-living scope of the founder-atlas-refresh skill.
"""
import json
import re
import sys

# ---- Controlled vocabularies (from src/data/taxonomy.ts + src/lib/living.ts) ----
CANONICAL_TYPES_ALL = {
    "founder-residency", "hacker-house", "accelerator", "pre-accelerator",
    "founder-fellowship", "government-grant", "startup-visa", "cofounder-matching",
    "incubator", "startup-studio", "corporate-accelerator", "university-program",
    "tech-transfer", "deep-tech-program", "startup-campus", "venture-debt",
    "pop-up-village", "ecosystem-support", "other",
}
CANONICAL_TYPES_COLIVING = {"founder-residency", "hacker-house"}
SUPPORT_MODES = {
    "funding", "housing", "workspace", "mentorship", "investor-access", "demo-day",
    "visa-support", "community", "co-founder-matching", "structure", "customers",
    "compute-credits", "lab-access", "legal-admin",
}
FORMATS = {"live-in", "relocation", "hybrid", "in-person", "remote", "unknown"}
STATUSES = {"rolling", "open", "closing-soon", "opening-soon", "running", "closed"}
VERIF = {"verified", "needs-review", "unverified"}
STAGE_FIT = {
    "pre-idea", "idea", "pre-product", "mvp", "pre-seed", "seed", "series-a-plus",
    "repeat-founder", "student", "researcher", "unknown",
}
FOUNDER_FIT = {
    "first-time-founder", "solo-founder", "technical-builder", "domain-expert",
    "repeat-founder", "student-founder", "researcher", "international-founder",
    "relocating-founder", "fundraising-soon", "needs-focus", "needs-community",
    "needs-customers", "needs-capital",
}
INTAKE_METHOD = {"rolling", "cohort-application", "open-call", "invitation", "membership", "unknown"}
INTAKE_FREQ = {"rolling", "annual", "biannual", "quarterly", "ad-hoc", "unknown"}
COST_MODEL = {"equity", "equity-free-grant", "stipend", "fee", "free", "venture-debt", "mixed", "unknown"}

REQUIRED_STR = ["name", "type", "canonicalType", "url", "city", "country",
                "status", "lastVerified", "verificationStatus"]
REQUIRED_LIST = ["supportModes", "sourceUrls"]
REQUIRED_NUM = ["lat", "lng"]
UI_FIELDS = ["providesHousing", "providesWorkspace", "format", "cost", "cohortSize",
             "durationWeeksMin", "durationWeeksMax", "stageFit", "founderFit",
             "sectorFocus", "fundingAmount", "equityTaken"]

ISO = re.compile(r"^\d{4}-\d{2}-\d{2}$")
AGG = re.compile(r"google\.com/search|/search\?|bing\.com/search", re.I)


def is_nonempty_str(v):
    return isinstance(v, str) and v.strip() != ""


def check_enum_list(rec, key, allowed, errors, name):
    v = rec.get(key)
    if v is None:
        return
    if not isinstance(v, list):
        errors.append(f"{name}: `{key}` must be an array")
        return
    bad = [x for x in v if x not in allowed]
    if bad:
        errors.append(f"{name}: `{key}` has invalid value(s): {bad}")


def validate_record(rec, seen_names, seen_domains):
    errors, warnings = [], []
    name = rec.get("name") if is_nonempty_str(rec.get("name")) else "(unnamed)"

    for k in REQUIRED_STR:
        if not is_nonempty_str(rec.get(k)):
            errors.append(f"{name}: missing/empty required string `{k}`")
    for k in REQUIRED_LIST:
        v = rec.get(k)
        if not isinstance(v, list) or len(v) == 0:
            errors.append(f"{name}: `{k}` must be a non-empty array")
    for k in REQUIRED_NUM:
        if not isinstance(rec.get(k), (int, float)) or isinstance(rec.get(k), bool):
            errors.append(f"{name}: `{k}` must be a number")

    # Enums
    ct = rec.get("canonicalType")
    if ct is not None:
        if ct not in CANONICAL_TYPES_ALL:
            errors.append(f"{name}: `canonicalType` '{ct}' is not a known taxonomy ID")
        elif ct not in CANONICAL_TYPES_COLIVING and rec.get("format") != "live-in":
            errors.append(
                f"{name}: `canonicalType` '{ct}' is OUT OF SCOPE — co-living kit accepts "
                f"only {sorted(CANONICAL_TYPES_COLIVING)} (or any record with format 'live-in')")
    if rec.get("status") is not None and rec["status"] not in STATUSES:
        errors.append(f"{name}: `status` '{rec['status']}' not in {sorted(STATUSES)}")
    if rec.get("verificationStatus") is not None and rec["verificationStatus"] not in VERIF:
        errors.append(f"{name}: `verificationStatus` must be one of {sorted(VERIF)}")
    if rec.get("format") is not None and rec["format"] not in FORMATS:
        errors.append(f"{name}: `format` '{rec['format']}' not in {sorted(FORMATS)}")
    check_enum_list(rec, "supportModes", SUPPORT_MODES, errors, name)
    check_enum_list(rec, "stageFit", STAGE_FIT, errors, name)
    check_enum_list(rec, "founderFit", FOUNDER_FIT, errors, name)
    for k, allowed in [("intakeMethod", INTAKE_METHOD), ("intakeFrequency", INTAKE_FREQ),
                       ("costFundingModel", COST_MODEL)]:
        if rec.get(k) is not None and rec[k] not in allowed:
            errors.append(f"{name}: `{k}` '{rec[k]}' not in {sorted(allowed)}")

    # Dates / provenance / links
    for k in ("lastVerified", "nextCohortStart"):
        if is_nonempty_str(rec.get(k)) and not ISO.match(rec[k]):
            errors.append(f"{name}: `{k}` must be ISO YYYY-MM-DD, got '{rec[k]}'")
    if is_nonempty_str(rec.get("url")) and AGG.search(rec["url"]):
        errors.append(f"{name}: `url` looks like an aggregator/search link, not a program site")
    if "applicationDeadline" in rec:
        warnings.append(f"{name}: `applicationDeadline` is retired — drop it, use `status_detail`")

    # Scope + quality warnings
    sm = rec.get("supportModes") or []
    if isinstance(sm, list) and "housing" not in sm and rec.get("format") != "live-in":
        warnings.append(f"{name}: no `housing` in supportModes and format != live-in — is this really co-living?")
    if rec.get("providesHousing") is not True:
        warnings.append(f"{name}: `providesHousing` is not true — co-living records should set it")
    filled_ui = [f for f in UI_FIELDS if rec.get(f) not in (None, "", [])]
    if len(filled_ui) < 4:
        warnings.append(f"{name}: only {len(filled_ui)}/{len(UI_FIELDS)} UI fields filled — chase more from the site")

    # Dedup
    key = (rec.get("name") or "").strip().lower()
    if key and key in seen_names:
        errors.append(f"{name}: duplicate `name`")
    seen_names.add(key)
    dom = (rec.get("domain") or "").strip().lower()
    if dom and dom in seen_domains:
        errors.append(f"{name}: duplicate `domain` '{dom}'")
    if dom:
        seen_domains.add(dom)

    return errors, warnings, filled_ui


def main():
    if len(sys.argv) != 2:
        print("usage: python3 validate.py <output.json>")
        sys.exit(2)
    try:
        data = json.load(open(sys.argv[1], encoding="utf-8"))
    except Exception as e:
        print(f"ERROR: could not parse JSON — {e}")
        sys.exit(1)

    progs = data["programs"] if isinstance(data, dict) and "programs" in data else data
    if not isinstance(progs, list):
        print("ERROR: expected a `programs` array (or a bare array of records)")
        sys.exit(1)

    all_errors, all_warnings = [], []
    seen_names, seen_domains = set(), set()
    coverage = []
    for rec in progs:
        if not isinstance(rec, dict):
            all_errors.append("a record is not a JSON object")
            continue
        e, w, filled = validate_record(rec, seen_names, seen_domains)
        all_errors += e
        all_warnings += w
        coverage.append(len(filled))

    print(f"Validated {len(progs)} record(s).\n")
    if all_errors:
        print(f"ERRORS ({len(all_errors)}):")
        for m in all_errors:
            print(f"  ✗ {m}")
        print()
    if all_warnings:
        print(f"WARNINGS ({len(all_warnings)}):")
        for m in all_warnings:
            print(f"  ! {m}")
        print()
    if coverage:
        avg = sum(coverage) / len(coverage)
        print(f"UI-field coverage: avg {avg:.1f}/{len(UI_FIELDS)} fields per record "
              f"(min {min(coverage)}, max {max(coverage)}).")

    if all_errors:
        print(f"\nRESULT: FAIL — {len(all_errors)} error(s).")
        sys.exit(1)
    print(f"\nRESULT: PASS — 0 errors, {len(all_warnings)} warning(s).")
    sys.exit(0)


if __name__ == "__main__":
    main()
