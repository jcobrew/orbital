#!/usr/bin/env -S npx tsx
/**
 * Stream 8 — Apply approved proposed updates (DRY-RUN by default, offline).
 *
 * Reads ONLY the proposals in `data/review-queue/approved/`. `pending/` and
 * `rejected/` are never read and never applied. Each approved proposal is
 * re-validated (taxonomy + sensitive-field-source rule) before it can change
 * anything — a proposal that fails validation is skipped, never applied.
 *
 * Safety posture (matches the MVP plan):
 *   - DRY-RUN by default: prints the diff it WOULD make and writes nothing.
 *   - `--apply` is the ONLY thing that writes to the JSON datasets, and it also
 *     appends an audit record to `data/review-queue/audit-log.jsonl`.
 *   - Always offline. Never opens a PR, never commits.
 *
 * Run:
 *   npx tsx scripts/apply-updates.ts            # dry-run: show what would change
 *   npx tsx scripts/apply-updates.ts --apply    # actually write + audit
 *   npx tsx scripts/apply-updates.ts --json      # machine-readable plan
 */

import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PROGRAMS, programSlug, type Program } from '../src/data/programs';
import {
  validateProposal,
  computeDiff,
  applyChanges,
  findTargetProgram,
  targetDataset,
  type ProposedProgramUpdate,
  type AuditEntry,
  type FieldChange,
  type TargetDataset,
} from '../src/lib/reviewQueue';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const QUEUE_DIR = join(REPO_ROOT, 'data', 'review-queue');
const APPROVED_DIR = join(QUEUE_DIR, 'approved');
const AUDIT_LOG = join(QUEUE_DIR, 'audit-log.jsonl');

// Single unified source file. The legacy residential/traditional split was
// removed; both `TargetDataset` values now resolve to the same file. The
// `targetDataset()` classification is retained only for the audit trail.
const UNIFIED_FILE = join(REPO_ROOT, 'src', 'data', 'programs-data.json');
const DATASET_FILES: Record<TargetDataset, string> = {
  residential: UNIFIED_FILE,
  traditional: UNIFIED_FILE,
};

interface SourceFile {
  meta?: Record<string, unknown>;
  programs: Array<Record<string, unknown>>;
}

interface PlanItem {
  proposalId: string;
  file: string;
  status: 'apply' | 'skip-invalid' | 'skip-not-approved' | 'no-op';
  action?: 'created' | 'updated';
  dataset?: TargetDataset;
  programName?: string;
  diff?: FieldChange[];
  issues?: string[];
}

/** Read every `*.json` proposal in `approved/`. */
function loadApproved(): Array<{ file: string; proposal: ProposedProgramUpdate }> {
  if (!existsSync(APPROVED_DIR)) return [];
  return readdirSync(APPROVED_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => {
      const path = join(APPROVED_DIR, f);
      const proposal = JSON.parse(readFileSync(path, 'utf8')) as ProposedProgramUpdate;
      return { file: f, proposal };
    });
}

/** Build the plan: for each approved proposal, what (if anything) would change. */
export function buildPlan(
  proposals: Array<{ file: string; proposal: ProposedProgramUpdate }>,
  programs: ReadonlyArray<Program>,
): PlanItem[] {
  const plan: PlanItem[] = [];
  for (const { file, proposal } of proposals) {
    // Defence in depth: approved/ is the only dir we read, but never trust a
    // file whose own status field says otherwise.
    if (proposal.status !== 'approved') {
      plan.push({ proposalId: proposal.id ?? file, file, status: 'skip-not-approved', issues: [`status is "${proposal.status}", not "approved"`] });
      continue;
    }

    const result = validateProposal(proposal);
    if (!result.valid) {
      plan.push({
        proposalId: proposal.id,
        file,
        status: 'skip-invalid',
        issues: result.issues.map((i) => `${i.field ? i.field + ': ' : ''}${i.message}`),
      });
      continue;
    }

    const existing = findTargetProgram(proposal, programs);
    const action: 'created' | 'updated' = proposal.target.kind === 'new' || !existing ? 'created' : 'updated';
    const diff = computeDiff(proposal.changes, existing);
    const dataset = targetDataset(proposal, existing);

    if (diff.length === 0) {
      plan.push({ proposalId: proposal.id, file, status: 'no-op', action, dataset, programName: resolveName(proposal, existing), diff });
      continue;
    }

    plan.push({
      proposalId: proposal.id,
      file,
      status: 'apply',
      action,
      dataset,
      programName: resolveName(proposal, existing),
      diff,
    });
  }
  return plan;
}

function resolveName(proposal: ProposedProgramUpdate, existing: Program | undefined): string {
  return (proposal.changes.name as string) ?? existing?.name ?? proposal.id;
}

/** Write the applied changes to the dataset files + append audit entries. */
function applyPlan(
  plan: PlanItem[],
  proposals: Array<{ file: string; proposal: ProposedProgramUpdate }>,
): AuditEntry[] {
  const byId = new Map(proposals.map((p) => [p.proposal.id, p.proposal]));
  // Lazily load + mutate each physical file once, then write back. Keyed by file
  // path so the (now single) unified file is never loaded twice even when
  // proposals classify to both `residential` and `traditional`.
  const loaded = new Map<string, SourceFile>();
  const audit: AuditEntry[] = [];

  for (const item of plan) {
    if (item.status !== 'apply' || !item.dataset) continue;
    const proposal = byId.get(item.proposalId)!;
    const dataset = item.dataset;
    const path = DATASET_FILES[dataset];
    if (!loaded.has(path)) {
      loaded.set(path, JSON.parse(readFileSync(path, 'utf8')) as SourceFile);
    }
    const file = loaded.get(path)!;

    if (item.action === 'created') {
      file.programs.push({ ...applyChanges(proposal.changes, undefined) });
    } else {
      const slug = proposal.target.kind === 'update'
        ? (proposal.target.slug ?? (proposal.target.name ? programSlug(proposal.target.name) : undefined))
        : undefined;
      const idx = file.programs.findIndex((p) => programSlug(String(p.name)) === slug);
      if (idx === -1) {
        // The target vanished between plan + apply; skip rather than corrupt.
        continue;
      }
      file.programs[idx] = applyChanges(proposal.changes, file.programs[idx] as Partial<Program>);
    }

    audit.push({
      appliedAt: new Date().toISOString(),
      proposalId: proposal.id,
      target: proposal.target,
      submitter: proposal.submitter,
      diff: item.diff ?? [],
      action: item.action!,
      dataset,
      programName: item.programName ?? proposal.id,
    });
  }

  // Persist mutated dataset files (preserve 2-space JSON + trailing newline).
  for (const [path, file] of loaded) {
    writeFileSync(path, JSON.stringify(file, null, 2) + '\n', 'utf8');
  }

  // Append the audit trail (JSONL — one entry per line).
  if (audit.length) {
    if (!existsSync(QUEUE_DIR)) mkdirSync(QUEUE_DIR, { recursive: true });
    appendFileSync(AUDIT_LOG, audit.map((e) => JSON.stringify(e)).join('\n') + '\n', 'utf8');
  }

  return audit;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function renderText(plan: PlanItem[], apply: boolean): string {
  const lines: string[] = [];
  lines.push(apply ? 'Apply approved proposed updates (APPLYING)' : 'Apply approved proposed updates (DRY-RUN — no files changed)');
  lines.push('');

  const toApply = plan.filter((p) => p.status === 'apply');
  const invalid = plan.filter((p) => p.status === 'skip-invalid' || p.status === 'skip-not-approved');
  const noop = plan.filter((p) => p.status === 'no-op');

  lines.push(`  approved proposals: ${plan.length} | would-apply: ${toApply.length} | skipped: ${invalid.length} | no-op: ${noop.length}`);
  lines.push('');

  for (const item of plan) {
    if (item.status === 'apply') {
      lines.push(`  [${item.action}] ${item.programName} (${item.dataset})  ← ${item.proposalId}`);
      for (const d of item.diff ?? []) {
        lines.push(`      ${d.field}: ${fmt(d.before)} → ${fmt(d.after)}`);
      }
    } else if (item.status === 'no-op') {
      lines.push(`  [no-op] ${item.programName} — proposal matches current data (${item.proposalId})`);
    } else {
      lines.push(`  [SKIP] ${item.proposalId} (${item.file}) — ${item.status}`);
      for (const msg of item.issues ?? []) lines.push(`      • ${msg}`);
    }
  }

  lines.push('');
  if (apply) {
    lines.push('  Wrote changes to the dataset JSON + appended data/review-queue/audit-log.jsonl.');
  } else {
    lines.push('  Dry-run only. Re-run with --apply to write these changes. No PR is opened; nothing is committed.');
  }
  return lines.join('\n');
}

function fmt(v: unknown): string {
  if (v === undefined) return '(unset)';
  if (typeof v === 'string') return JSON.stringify(v);
  return JSON.stringify(v);
}

function isMain(): boolean {
  return Boolean(process.argv[1] && import.meta.url === `file://${process.argv[1]}`);
}

if (isMain()) {
  const argv = process.argv.slice(2);
  const apply = argv.includes('--apply');
  const json = argv.includes('--json');

  const proposals = loadApproved();
  const plan = buildPlan(proposals, PROGRAMS);

  let audit: AuditEntry[] = [];
  if (apply) {
    audit = applyPlan(plan, proposals);
  }

  if (json) {
    console.log(JSON.stringify({ apply, plan, applied: audit }, null, 2));
  } else {
    console.log(renderText(plan, apply));
  }
  // Safe-by-default: exit 0 (this is a reporting/apply tool, not a gate).
  process.exit(0);
}
