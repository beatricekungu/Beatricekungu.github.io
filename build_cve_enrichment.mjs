import fs from 'node:fs/promises';
import { SpreadsheetFile, Workbook } from '@oai/artifact-tool';

const root = 'C:/Users/Bkung/OneDrive/Documents/GitHub/Beatricekungu.github.io';
const rawText = await fs.readFile(`${root}/outputs/cve_enrichment_raw.json`, 'utf8');
const raw = JSON.parse(rawText.replace(/^\uFEFF/, ''));
const outDir = `${root}/outputs/cve_enrichment`;
const outPath = `${outDir}/CVE_Enrichment.xlsx`;

function pickCvssMetric(metrics = {}) {
  for (const key of ['cvssMetricV31', 'cvssMetricV30', 'cvssMetricV2']) {
    const candidates = metrics[key] || [];
    const primary = candidates.find((m) => m.type === 'Primary') || candidates[0];
    if (primary?.cvssData) return { key, metric: primary };
  }
  return { key: 'Unavailable', metric: null };
}

function suggestedTier(score, epss, attackVector, privilegesRequired) {
  if (score >= 9 || (epss >= 0.7 && attackVector === 'NETWORK' && privilegesRequired === 'NONE')) return 'Emergency';
  if (score >= 7 || epss >= 0.5) return 'Urgent';
  return 'High';
}

const epssByCve = new Map((raw.epss || []).map((r) => [r.cve, r]));
const nvdByCve = new Map((raw.nvd || []).map((r) => [r.cve?.id, r.cve]));
const cveIds = [...new Set((raw.nvd || []).map((r) => r.cve?.id).filter(Boolean))].sort();

const headers = [
  'CVE ID', 'CVSS Version', 'CVSS Base Score', 'CVSS Severity',
  'Attack Vector', 'Attack Complexity', 'Privileges Required', 'User Interaction', 'Scope',
  'Confidentiality Impact', 'Integrity Impact', 'Availability Impact',
  'EPSS Score', 'EPSS Percentile', 'EPSS Score Date', 'Suggested Risk Tier', 'Source'
];

const rows = cveIds.map((id) => {
  const cve = nvdByCve.get(id);
  const { key, metric } = pickCvssMetric(cve?.metrics);
  const data = metric?.cvssData || {};
  const epss = epssByCve.get(id) || {};
  const score = Number(data.baseScore ?? 0);
  const epssScore = Number(epss.epss ?? 0);
  return [
    id,
    key === 'cvssMetricV31' ? 'CVSS v3.1' : key === 'cvssMetricV30' ? 'CVSS v3.0' : key === 'cvssMetricV2' ? 'CVSS v2.0' : 'Unavailable',
    Number.isFinite(score) && score > 0 ? score : null,
    data.baseSeverity || metric?.baseSeverity || 'Unavailable',
    data.attackVector || 'Unavailable',
    data.attackComplexity || 'Unavailable',
    data.privilegesRequired || 'Unavailable',
    data.userInteraction || 'Unavailable',
    data.scope || 'Unavailable',
    data.confidentialityImpact || 'Unavailable',
    data.integrityImpact || 'Unavailable',
    data.availabilityImpact || 'Unavailable',
    Number.isFinite(epssScore) && epssScore > 0 ? epssScore : null,
    epss.percentile ? Number(epss.percentile) : null,
    epss.date || '',
    suggestedTier(score, epssScore, data.attackVector, data.privilegesRequired),
    'NVD CVE API + FIRST EPSS API'
  ];
});

const wb = Workbook.create();
const guide = wb.worksheets.add('Read Me');
const dataSheet = wb.worksheets.add('CVE Enrichment');
guide.showGridLines = false;
dataSheet.showGridLines = false;

guide.getRange('A1:B1').merge();
guide.getRange('A1').values = [['CVE Enrichment — Power BI Import Guide']];
guide.getRange('A1:H1').format = { fill: '#0B1220', font: { bold: true, color: '#00E5FF', size: 16 }, horizontalAlignment: 'left', verticalAlignment: 'center' };
guide.getRange('A1:H1').format.rowHeight = 30;
guide.getRange('A3:B9').values = [
  ['Purpose', 'Enriches your supplied CISA KEV CVE IDs with NVD CVSS metrics and FIRST EPSS data.'],
  ['Match key', 'CVE ID — merge this field with CISA_KEV[CVE ID] in Power Query.'],
  ['CISA CVEs supplied', raw.sourceCveCount],
  ['NVD records matched', (raw.nvd || []).length],
  ['EPSS records matched', (raw.epss || []).length],
  ['Snapshot generated (UTC)', `Snapshot: ${raw.generatedAt.slice(0, 10)} UTC`],
  ['Suggested Risk Tier', 'Portfolio-friendly triage suggestion. KEV confirmation remains the baseline risk signal.']
];
guide.getRange('A3:A9').format = { fill: '#17233A', font: { bold: true, color: '#C9D6EA' } };
guide.getRange('B3:B9').format = { fill: '#0E1625', font: { color: '#D7E1EF' }, wrapText: true };
guide.getRange('A3:B9').format.borders = { preset: 'outside', style: 'thin', color: '#263B59' };
guide.getRange('A11:B11').merge();
guide.getRange('A11').values = [['Power BI merge steps']];
guide.getRange('A11:H11').format = { fill: '#17233A', font: { bold: true, color: '#00E5FF' } };
guide.getRange('A12:B16').merge(true);
guide.getRange('A12:A16').values = [
  ['1. Get data → Excel → select this workbook → import “CVE Enrichment”.'],
  ['2. Select Transform data → select CISA_KEV → Home → Merge Queries.'],
  ['3. Select CVE Enrichment as the second table; select CVE ID in both tables.'],
  ['4. Use Left Outer join; expand the new columns you want to analyze.'],
  ['5. Keep CISA_KEV as your primary table; this file is enrichment only.']
];
guide.getRange('A12:B16').format = { fill: '#0E1625', font: { color: '#D7E1EF' }, wrapText: true };
guide.getRange('A18:B20').values = [
  ['NVD source', 'https://services.nvd.nist.gov/rest/json/cves/2.0'],
  ['FIRST EPSS source', 'https://api.first.org/data/v1/epss'],
  ['CISA source file', 'known_exploited_vulnerabilities.csv (user supplied)']
];
guide.getRange('A18:A20').format = { fill: '#17233A', font: { bold: true, color: '#C9D6EA' } };
guide.getRange('B18:B20').format = { fill: '#0E1625', font: { color: '#8FB7E8' } };
guide.getRange('A3:B20').format.wrapText = true;
guide.getRange('A:A').format.columnWidth = 24;
guide.getRange('B:B').format.columnWidth = 86;
guide.getRange('A1:H20').format.verticalAlignment = 'center';
guide.getRange('A3:B20').format.rowHeight = 26;
guide.getRange('A12:B16').format.rowHeight = 30;

dataSheet.getRangeByIndexes(0, 0, 1, headers.length).values = [headers];
dataSheet.getRangeByIndexes(1, 0, rows.length, headers.length).values = rows;
const dataEnd = rows.length + 1;
const dataRange = dataSheet.getRange(`A1:Q${dataEnd}`);
const headerRange = dataSheet.getRange('A1:Q1');
headerRange.format = { fill: '#0B1220', font: { bold: true, color: '#00E5FF' }, horizontalAlignment: 'center', verticalAlignment: 'center', wrapText: true };
headerRange.format.rowHeight = 30;
dataSheet.getRange(`A2:Q${dataEnd}`).format = { font: { color: '#1F2937' }, verticalAlignment: 'center' };
dataSheet.getRange(`C2:C${dataEnd}`).format.numberFormat = '0.0';
dataSheet.getRange(`M2:N${dataEnd}`).format.numberFormat = '0.000%';
dataSheet.getRange(`O2:O${dataEnd}`).format.numberFormat = 'yyyy-mm-dd';
dataSheet.getRange(`A1:Q${dataEnd}`).format.borders = { preset: 'outside', style: 'thin', color: '#C9D6EA' };
dataSheet.getRange(`P2:P${dataEnd}`).conditionalFormats.add('containsText', { text: 'Emergency', format: { fill: '#FDE2E7', font: { color: '#B4233B', bold: true } } });
dataSheet.getRange(`P2:P${dataEnd}`).conditionalFormats.add('containsText', { text: 'Urgent', format: { fill: '#FEF3C7', font: { color: '#B45309', bold: true } } });
dataSheet.getRange(`P2:P${dataEnd}`).conditionalFormats.add('containsText', { text: 'High', format: { fill: '#E0F2FE', font: { color: '#0369A1', bold: true } } });
dataSheet.getRange('A:A').format.columnWidth = 18;
dataSheet.getRange('B:B').format.columnWidth = 13;
dataSheet.getRange('C:D').format.columnWidth = 15;
dataSheet.getRange('E:L').format.columnWidth = 18;
dataSheet.getRange('M:N').format.columnWidth = 14;
dataSheet.getRange('O:O').format.columnWidth = 14;
dataSheet.getRange('P:P').format.columnWidth = 20;
dataSheet.getRange('Q:Q').format.columnWidth = 31;
dataSheet.freezePanes.freezeRows(1);
const table = dataSheet.tables.add(`A1:Q${dataEnd}`, true, 'CVEEnrichmentTable');
table.style = 'TableStyleMedium2';

const inspection = await wb.inspect({ kind: 'table', range: `CVE Enrichment!A1:Q8`, include: 'values,formulas', tableMaxRows: 8, tableMaxCols: 17 });
console.log(inspection.ndjson);
const errors = await wb.inspect({ kind: 'match', searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A', options: { useRegex: true, maxResults: 50 }, summary: 'formula error scan' });
console.log(errors.ndjson);
const preview = await wb.render({ sheetName: 'Read Me', range: 'A1:B20', scale: 1.2, format: 'png' });
await fs.mkdir(outDir, { recursive: true });
await fs.writeFile(`${outDir}/CVE_Enrichment_preview.png`, new Uint8Array(await preview.arrayBuffer()));
const output = await SpreadsheetFile.exportXlsx(wb);
await output.save(outPath);
console.log(JSON.stringify({ outPath, rows: rows.length, nvd: (raw.nvd || []).length, epss: (raw.epss || []).length }));
