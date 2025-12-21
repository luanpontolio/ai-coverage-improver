import { useMemo, useState, ChangeEvent } from 'react';
import { CoverageTable } from '../components/CoverageTable';
import { JobStatus } from '../components/JobStatus';

type Repo = { id: string; owner: string; name: string; defaultBranch: string };

const repos: Repo[] = [
  { id: 'demo-repo', owner: 'octo-org', name: 'coverage-demo', defaultBranch: 'main' },
  { id: 'demo-repo-json', owner: 'octo-org', name: 'coverage-json', defaultBranch: 'main' },
];

const coverageByRepo = {
  'demo-repo': {
    thresholdPct: 80,
    files: [
      { filePath: 'src/index.ts', coveragePct: 80, isBelowThreshold: false },
      { filePath: 'src/utils.ts', coveragePct: 60, isBelowThreshold: true },
    ],
  },
  'demo-repo-json': {
    thresholdPct: 80,
    files: [
      { filePath: 'src/lib/a.ts', coveragePct: 72, isBelowThreshold: true },
      { filePath: 'src/lib/b.tsx', coveragePct: 90, isBelowThreshold: false },
    ],
  },
};

export default function Home() {
  const [selectedRepoId, setSelectedRepoId] = useState<string>(repos[0]?.id ?? '');
  const [job, setJob] = useState<{ id: string; targetFilePath: string; status: 'queued' | 'succeeded' } | undefined>();
  const coverage = useMemo(() => coverageByRepo[selectedRepoId as keyof typeof coverageByRepo], [selectedRepoId]);
  const selectedRepo = useMemo(() => repos.find((repo) => repo.id === selectedRepoId), [selectedRepoId]);

  return (
    <main>
      <h1>TypeScript Coverage</h1>
      <p>Select a repository to view low-coverage TypeScript files.</p>

      <label htmlFor="repo-select">Repository</label>
      <div style={{ margin: '0.5rem 0' }}>
        <select
          id="repo-select"
          value={selectedRepoId}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => setSelectedRepoId(event.target.value)}
          style={{ padding: '0.4rem', minWidth: '240px' }}
        >
          {repos.map((repo) => (
            <option key={repo.id} value={repo.id}>
              {repo.owner}/{repo.name} (default: {repo.defaultBranch})
            </option>
          ))}
        </select>
      </div>

      {coverage ? (
        <>
          <p>
            Showing coverage for <strong>{selectedRepo?.owner}/{selectedRepo?.name}</strong> — files below{' '}
            {coverage.thresholdPct}% are highlighted.
          </p>
          <CoverageTable files={coverage.files} thresholdPct={coverage.thresholdPct} />
          <div style={{ marginTop: '1rem' }}>
            <button
              onClick={() =>
                setJob({
                  id: `job-${Date.now()}`,
                  targetFilePath: coverage.files.find((f) => f.isBelowThreshold)?.filePath ?? 'src/utils.ts',
                  status: 'succeeded',
                })
              }
            >
              Request improvement (demo)
            </button>
          </div>
          <JobStatus
            job={
              job && {
                ...job,
                pullRequestUrl: 'https://github.com/demo/demo-repo/pull/1',
              }
            }
          />
        </>
      ) : (
        <p>No coverage data for the selected repository yet.</p>
      )}
    </main>
  );
}

