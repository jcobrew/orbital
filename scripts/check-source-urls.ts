#!/usr/bin/env -S npx tsx
/**
 * Stream 7 — Source-URL health check (report-only, OPT-IN network, offline-safe).
 *
 * Safe by default: with no flags it performs NO network calls. It only
 * inventories which programs have / are missing `sourceUrls` and (when network
 * is enabled) probes whether each URL is reachable. It NEVER modifies data and
 * NEVER fails the build — network errors and offline conditions degrade to a
 * "skipped"/"unreachable" status in the report.
 *
 * Run:
 *   npx tsx scripts/check-source-urls.ts                 # offline: inventory only
 *   npx tsx scripts/check-source-urls.ts --check         # opt-in: probe URLs over the network
 *   npx tsx scripts/check-source-urls.ts --check --json  # machine-readable
 *   npx tsx scripts/check-source-urls.ts --timeout=8000  # per-request timeout (ms)
 */

import { PROGRAMS, type Program } from '../src/data/programs';

export type UrlStatus = 'ok' | 'broken' | 'unreachable' | 'skipped';

export interface UrlCheckResult {
  url: string;
  program: string;
  status: UrlStatus;
  httpStatus?: number;
  error?: string;
}

export interface SourceUrlSummary {
  networkEnabled: boolean;
  total: number;
  withSources: number;
  missingSources: number;
  /** Program names with no `sourceUrls`. */
  missingSourcePrograms: string[];
  uniqueUrls: number;
  checked: number;
  ok: number;
  broken: number;
  unreachable: number;
  skipped: number;
  results: UrlCheckResult[];
}

/** Collect the (programName, url) pairs to consider, de-duplicating URLs. */
export function collectSourceUrls(
  programs: ReadonlyArray<Program> = PROGRAMS,
): { pairs: Array<{ program: string; url: string }>; missingSourcePrograms: string[] } {
  const pairs: Array<{ program: string; url: string }> = [];
  const missingSourcePrograms: string[] = [];
  const seen = new Set<string>();

  for (const p of programs) {
    const urls = (p.sourceUrls ?? []).filter((u) => typeof u === 'string' && u.trim() !== '');
    if (urls.length === 0) {
      missingSourcePrograms.push(p.name);
      continue;
    }
    for (const url of urls) {
      const key = url.trim();
      if (seen.has(key)) continue;
      seen.add(key);
      pairs.push({ program: p.name, url: key });
    }
  }
  return { pairs, missingSourcePrograms };
}

/** Probe a single URL. Offline-safe: any network failure → 'unreachable'. */
export async function probeUrl(
  url: string,
  program: string,
  timeoutMs: number,
): Promise<UrlCheckResult> {
  // Basic shape validation first (no network).
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { url, program, status: 'broken', error: 'invalid-url' };
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { url, program, status: 'broken', error: `unsupported-protocol:${parsed.protocol}` };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    // HEAD first; many hosts reject HEAD, so fall back to a ranged GET.
    let res = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
    });
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: { Range: 'bytes=0-0' },
      });
    }
    const httpStatus = res.status;
    const status: UrlStatus = httpStatus >= 200 && httpStatus < 400 ? 'ok' : 'broken';
    return { url, program, status, httpStatus };
  } catch (err) {
    // Offline / DNS / timeout / connection-refused all land here. Never throw.
    const message = err instanceof Error ? err.message : String(err);
    return { url, program, status: 'unreachable', error: message };
  } finally {
    clearTimeout(timer);
  }
}

export interface CheckOptions {
  network?: boolean;
  timeoutMs?: number;
  concurrency?: number;
}

/** Build the source-URL summary. With `network: false` (default) nothing is probed. */
export async function summarizeSourceUrls(
  programs: ReadonlyArray<Program> = PROGRAMS,
  opts: CheckOptions = {},
): Promise<SourceUrlSummary> {
  const network = opts.network ?? false;
  const timeoutMs = opts.timeoutMs ?? 8000;
  const concurrency = Math.max(1, opts.concurrency ?? 6);

  const { pairs, missingSourcePrograms } = collectSourceUrls(programs);
  const withSources = programs.length - missingSourcePrograms.length;

  let results: UrlCheckResult[];
  if (!network) {
    results = pairs.map((p) => ({ url: p.url, program: p.program, status: 'skipped' as const }));
  } else {
    results = [];
    // Simple bounded-concurrency worker pool.
    let cursor = 0;
    const workers = Array.from({ length: Math.min(concurrency, pairs.length) }, async () => {
      while (cursor < pairs.length) {
        const idx = cursor++;
        const { program, url } = pairs[idx];
        results.push(await probeUrl(url, program, timeoutMs));
      }
    });
    await Promise.all(workers);
  }

  return {
    networkEnabled: network,
    total: programs.length,
    withSources,
    missingSources: missingSourcePrograms.length,
    missingSourcePrograms,
    uniqueUrls: pairs.length,
    checked: network ? results.length : 0,
    ok: results.filter((r) => r.status === 'ok').length,
    broken: results.filter((r) => r.status === 'broken').length,
    unreachable: results.filter((r) => r.status === 'unreachable').length,
    skipped: results.filter((r) => r.status === 'skipped').length,
    results,
  };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(argv: string[]): { network: boolean; json: boolean; timeoutMs: number } {
  let network = false;
  let json = false;
  let timeoutMs = 8000;
  for (const arg of argv) {
    if (arg === '--check' || arg === '--network') network = true;
    else if (arg === '--json') json = true;
    else if (arg.startsWith('--timeout=')) {
      const n = Number(arg.slice('--timeout='.length));
      if (Number.isFinite(n) && n > 0) timeoutMs = Math.floor(n);
    }
  }
  return { network, json, timeoutMs };
}

function renderText(summary: SourceUrlSummary): string {
  const lines: string[] = [];
  lines.push('Source-URL health report');
  lines.push(`  network: ${summary.networkEnabled ? 'ENABLED (opt-in)' : 'disabled (offline-safe default)'}`);
  lines.push('');
  lines.push(
    `  programs ${summary.total} | with-sources ${summary.withSources} | ` +
      `missing-sources ${summary.missingSources} | unique-urls ${summary.uniqueUrls}`,
  );
  if (summary.networkEnabled) {
    lines.push(
      `  checked ${summary.checked} | ok ${summary.ok} | broken ${summary.broken} | ` +
        `unreachable ${summary.unreachable}`,
    );
    const bad = summary.results.filter((r) => r.status === 'broken' || r.status === 'unreachable');
    if (bad.length) {
      lines.push('');
      lines.push('  Problem URLs:');
      for (const r of bad) {
        const code = r.httpStatus ? ` http=${r.httpStatus}` : r.error ? ` (${r.error})` : '';
        lines.push(`    [${r.status}]${code} ${r.url} — ${r.program}`);
      }
    }
  } else {
    lines.push('  (pass --check to probe URLs over the network)');
  }

  if (summary.missingSourcePrograms.length) {
    lines.push('');
    lines.push('  Programs missing sourceUrls:');
    for (const name of summary.missingSourcePrograms) lines.push(`    - ${name}`);
  }
  return lines.join('\n');
}

function isMain(): boolean {
  return Boolean(process.argv[1] && import.meta.url === `file://${process.argv[1]}`);
}

if (isMain()) {
  const { network, json, timeoutMs } = parseArgs(process.argv.slice(2));
  summarizeSourceUrls(PROGRAMS, { network, timeoutMs })
    .then((summary) => {
      if (json) console.log(JSON.stringify(summary, null, 2));
      else console.log(renderText(summary));
      process.exit(0); // Report-only: never fail the build.
    })
    .catch((err) => {
      // Even an unexpected error must not fail the build — degrade gracefully.
      console.error('check-source-urls: degraded (non-fatal):', err instanceof Error ? err.message : err);
      process.exit(0);
    });
}
