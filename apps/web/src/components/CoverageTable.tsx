type CoverageRow = {
  filePath: string;
  coveragePct: number;
  isBelowThreshold: boolean;
};

type Props = {
  files: CoverageRow[];
  thresholdPct: number;
};

export function CoverageTable({ files, thresholdPct }: Props) {
  if (!files.length) {
    return <p>No coverage data available for this repository.</p>;
  }

  return (
    <table style={{ borderCollapse: 'collapse', width: '100%', marginTop: '1rem' }}>
      <thead>
        <tr>
          <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>File</th>
          <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>Coverage</th>
          <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>Status</th>
        </tr>
      </thead>
      <tbody>
        {files.map((file) => (
          <tr
            key={file.filePath}
            style={{
              backgroundColor: file.isBelowThreshold ? '#ffecec' : 'transparent',
              color: file.isBelowThreshold ? '#c00' : 'inherit',
            }}
          >
            <td style={{ padding: '8px 4px' }}>{file.filePath}</td>
            <td style={{ padding: '8px 4px' }}>{file.coveragePct.toFixed(1)}%</td>
            <td style={{ padding: '8px 4px' }}>
              {file.isBelowThreshold ? `Below ${thresholdPct}%` : 'OK'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

