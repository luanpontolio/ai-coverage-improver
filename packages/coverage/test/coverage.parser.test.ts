import { parseCoverageContent } from '../src/parser';

describe('coverage parser', () => {
  it('parses LCOV and filters to TypeScript files', () => {
    const lcov = `
TN:
SF:/repo/src/index.ts
LF:10
LH:8
end_of_record
SF:/repo/src/ignore.js
LF:5
LH:5
end_of_record
`;

    const result = parseCoverageContent({ content: lcov, format: 'lcov', thresholdPct: 80 });
    expect(result.files).toHaveLength(1);
    expect(result.files[0]).toMatchObject({
      filePath: '/repo/src/index.ts',
      coveragePct: 80,
      isBelowThreshold: false,
    });
  });

  it('parses JSON coverage and marks files below threshold', () => {
    const json = JSON.stringify({
      '/repo/src/a.ts': { lines: { pct: 50 } },
      '/repo/src/b.tsx': { lines: { covered: 9, total: 10 } },
      '/repo/src/c.js': { lines: { pct: 10 } },
    });

    const result = parseCoverageContent({ content: json, format: 'json', thresholdPct: 80 });
    expect(result.files).toHaveLength(2);
    const below = result.files.find((f) => f.filePath.endsWith('a.ts'));
    const above = result.files.find((f) => f.filePath.endsWith('b.tsx'));
    expect(below?.isBelowThreshold).toBe(true);
    expect(above?.isBelowThreshold).toBe(false);
  });
});

