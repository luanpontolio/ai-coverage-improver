import { useMemo, useEffect, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
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
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [selectedRepoId, setSelectedRepoId] = useState<string>(repos[0]?.id ?? '');
  type DemoJob = {
    id: string;
    repositoryId: string;
    targetFilePath: string;
    status: 'queued' | 'running' | 'succeeded' | 'failed';
    requestedByUserId: string;
    createdAt: string;
    pullRequestUrl?: string;
  };
  const [job, setJob] = useState<DemoJob | undefined>(undefined);
  const coverage = useMemo(() => coverageByRepo[selectedRepoId as keyof typeof coverageByRepo], [selectedRepoId]);
  const selectedRepo = useMemo(() => repos.find((repo) => repo.id === selectedRepoId), [selectedRepoId]);

  useEffect(() => {
    // Redirect to auth page if not authenticated
    if (!isLoading && !user) {
      router.push('/auth');
    }
  }, [user, isLoading, router]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <p>Loading...</p>
      </div>
    );
  }

  // Don't render content if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>TypeScript Coverage</h1>
          <p style={{ color: '#666', margin: 0 }}>
            Signed in as <strong>{user.login}</strong>
          </p>
        </div>
        <button
          onClick={() => {
            // TODO: Implement logout
            window.location.href = '/auth';
          }}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.9rem',
            color: '#666',
            backgroundColor: '#f5f5f5',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Sign Out
        </button>
      </div>

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
                  repositoryId: selectedRepoId,
                  targetFilePath: coverage.files.find((f) => f.isBelowThreshold)?.filePath ?? 'src/utils.ts',
                  status: 'succeeded',
                  requestedByUserId: user.id,
                  createdAt: new Date().toISOString(),
                  pullRequestUrl: 'https://github.com/demo/demo-repo/pull/1',
                })
              }
            >
              Request improvement (demo)
            </button>
          </div>
          <JobStatus job={job} />
        </>
      ) : (
        <p>No coverage data for the selected repository yet.</p>
      )}
    </main>
  );
}

