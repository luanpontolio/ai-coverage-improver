export type CoverageFormat = 'lcov' | 'json';

export interface CoverageFileMetric {
  filePath: string;
  coveragePct: number;
  isBelowThreshold: boolean;
}

export interface CoverageParseInput {
  content: string;
  format: CoverageFormat;
  thresholdPct?: number;
}

export interface CoverageParseResult {
  files: CoverageFileMetric[];
  thresholdPct: number;
  format: CoverageFormat;
}

const isTypeScriptFile = (filePath: string) => filePath.endsWith('.ts') || filePath.endsWith('.tsx');

const round = (value: number) => Math.round(value * 100) / 100;

const pushMetric = (
  collection: CoverageFileMetric[],
  filePath: string,
  coveragePct: number,
  thresholdPct: number,
) => {
  if (!isTypeScriptFile(filePath)) {
    return;
  }
  collection.push({
    filePath,
    coveragePct: round(coveragePct),
    isBelowThreshold: coveragePct < thresholdPct,
  });
};

export const parseCoverageContent = ({
  content,
  format,
  thresholdPct = 80,
}: CoverageParseInput): CoverageParseResult => {
  if (format === 'lcov') {
    return parseLcov(content, thresholdPct);
  }
  return parseCoverageJson(content, thresholdPct);
};

export const parseLcov = (content: string, thresholdPct: number): CoverageParseResult => {
  const files: CoverageFileMetric[] = [];
  let currentFile = '';
  let linesFound = 0;
  let linesHit = 0;

  const flush = () => {
    if (!currentFile || linesFound === 0) return;
    const pct = (linesHit / linesFound) * 100;
    pushMetric(files, currentFile, pct, thresholdPct);
    currentFile = '';
    linesFound = 0;
    linesHit = 0;
  };

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.startsWith('SF:')) {
      flush();
      currentFile = line.substring(3);
    } else if (line.startsWith('LF:')) {
      linesFound = Number(line.substring(3)) || 0;
    } else if (line.startsWith('LH:')) {
      linesHit = Number(line.substring(3)) || 0;
    } else if (line === 'end_of_record') {
      flush();
    }
  }
  flush();

  return { files, thresholdPct, format: 'lcov' };
};

export const parseCoverageJson = (content: string, thresholdPct: number): CoverageParseResult => {
  const files: CoverageFileMetric[] = [];
  const payload = JSON.parse(content) as Record<string, any>;

  for (const [filePath, metrics] of Object.entries(payload)) {
    if (!metrics || typeof metrics !== 'object') continue;
    const lines = metrics.lines ?? metrics;
    const pct =
      typeof lines?.pct === 'number'
        ? lines.pct
        : typeof lines?.covered === 'number' && typeof lines?.total === 'number'
          ? (lines.covered / Math.max(lines.total, 1)) * 100
          : undefined;
    if (typeof pct !== 'number' || Number.isNaN(pct)) continue;
    pushMetric(files, filePath, pct, thresholdPct);
  }

  return { files, thresholdPct, format: 'json' };
};

