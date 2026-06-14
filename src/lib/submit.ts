// Builds a prefilled GitHub "new issue" URL from the submit form. Nothing is
// sent automatically — the form just hands the founder a composed issue to
// review and submit, which the maintainers triage (and turn into a data PR via
// the founder-atlas-refresh skill). Zero backend.

const REPO = 'jcobrew/founder-atlas';

export interface SubmitFields {
  mode: 'new' | 'update';
  name: string;
  type?: string;
  websiteUrl?: string;
  applyUrl?: string;
  city?: string;
  country?: string;
  livingModel?: string;
  stage?: string;
  sector?: string;
  status?: string;
  deadline?: string;
  funding?: string;
  equity?: string;
  housing?: string;
  duration?: string;
  notes?: string;
  sourceUrl?: string;
  submitter?: string;
  affiliated?: boolean;
}

const ROWS: [keyof SubmitFields, string][] = [
  ['type', 'Type'],
  ['websiteUrl', 'Website'],
  ['applyUrl', 'Application URL'],
  ['city', 'City'],
  ['country', 'Country'],
  ['livingModel', 'Living model'],
  ['stage', 'Stage fit'],
  ['sector', 'Sector focus'],
  ['status', 'Application status'],
  ['deadline', 'Deadline'],
  ['funding', 'Funding'],
  ['equity', 'Equity'],
  ['housing', 'Housing'],
  ['duration', 'Duration'],
  ['sourceUrl', 'Source URL(s)'],
];

export function buildIssueBody(f: SubmitFields): string {
  const lines: string[] = [];
  lines.push(f.mode === 'update' ? `**Update to an existing program**` : `**New program submission**`);
  lines.push('');
  for (const [key, label] of ROWS) {
    const v = f[key];
    if (v) lines.push(`- **${label}:** ${v}`);
  }
  if (f.notes) lines.push('', '**Notes**', '', f.notes);
  lines.push('', '---');
  lines.push(`- Submitted by: ${f.submitter || '(not provided)'}`);
  lines.push(`- Affiliated with this program: ${f.affiliated ? 'Yes' : 'No'}`);
  lines.push('', '_Submitted via the Orbital /submit form. Please verify against primary sources before merging._');
  return lines.join('\n');
}

export function buildIssueUrl(f: SubmitFields): string {
  const title = (f.mode === 'update' ? '[Update] ' : '[New program] ') + (f.name || 'Untitled');
  const label = f.mode === 'update' ? 'data-update' : 'program-submission';
  const params = new URLSearchParams({ title, body: buildIssueBody(f), labels: label });
  return `https://github.com/${REPO}/issues/new?${params.toString()}`;
}
