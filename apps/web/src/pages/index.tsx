import { useMemo, useEffect, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { CoverageTable } from '../components/CoverageTable';
import { JobStatus } from '../components/JobStatus';
import {
  listRepositories,
  getRepositoryCoverage,
  type Repository,
  type CoverageResponse,
} from '../lib/api';

type DemoJob = {
  id: string;
  repositoryId: string;
  targetFilePath: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  requestedByUserId: string;
  createdAt: string;
  pullRequestUrl?: string;
};

export default function Home() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  
  const [repos, setRepos] = useState<Repository[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [reposError, setReposError] = useState<string | null>(null);
  
  const [selectedRepoId, setSelectedRepoId] = useState<string>('');
  const [coverage, setCoverage] = useState<CoverageResponse | null>(null);
  const [isLoadingCoverage, setIsLoadingCoverage] = useState(false);
  const [coverageError, setCoverageError] = useState<string | null>(null);
  
  const [job, setJob] = useState<DemoJob | undefined>(undefined);
  
  const selectedRepo = useMemo(
    () => repos.find((repo) => repo.id === selectedRepoId),
    [repos, selectedRepoId]
  );

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/auth');
    }
  }, [user, isAuthLoading, router]);

  // Fetch repositories on mount
  useEffect(() => {
    if (!user) return;

    const fetchRepos = async () => {
      setIsLoadingRepos(true);
      setReposError(null);
      try {
        const fetchedRepos = await listRepositories();
        setRepos(fetchedRepos);
        if (fetchedRepos.length > 0 && !selectedRepoId) {
          setSelectedRepoId(fetchedRepos[0].id);
        }
      } catch (error: any) {
        setReposError(error.message || 'Failed to load repositories');
      } finally {
        setIsLoadingRepos(false);
      }
    };

    fetchRepos();
  }, [user]);

  // Fetch coverage when repo selection changes
  useEffect(() => {
    if (!selectedRepoId) return;

    const fetchCoverage = async () => {
      setIsLoadingCoverage(true);
      setCoverageError(null);
      setCoverage(null);
      try {
        const coverageData = await getRepositoryCoverage(selectedRepoId);
        setCoverage(coverageData);
      } catch (error: any) {
        setCoverageError(error.message || 'Failed to load coverage data');
      } finally {
        setIsLoadingCoverage(false);
      }
    };

    fetchCoverage();
  }, [selectedRepoId]);

  // Show loading while checking auth
  if (isAuthLoading) {
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

  // Don't render if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div
        style={{
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
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
        {isLoadingRepos ? (
          <p>Loading repositories...</p>
        ) : reposError ? (
          <p style={{ color: '#c33' }}>Error: {reposError}</p>
        ) : repos.length === 0 ? (
          <p style={{ color: '#666' }}>
            No repositories found. Make sure you have installed the GitHub App on your repositories.
          </p>
        ) : (
          <select
            id="repo-select"
            value={selectedRepoId}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              setSelectedRepoId(event.target.value)
            }
            style={{ padding: '0.4rem', minWidth: '240px' }}
          >
            {repos.map((repo) => (
              <option key={repo.id} value={repo.id}>
                {repo.owner}/{repo.name} (default: {repo.defaultBranch})
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedRepoId && (
        <>
          {isLoadingCoverage ? (
            <p style={{ marginTop: '1rem' }}>Loading coverage data...</p>
          ) : coverageError ? (
            <div
              style={{
                marginTop: '1rem',
                padding: '1rem',
                backgroundColor: '#fee',
                border: '1px solid #fcc',
                borderRadius: '4px',
              }}
            >
              <p style={{ color: '#c33', margin: 0 }}>Error: {coverageError}</p>
            </div>
          ) : coverage ? (
            <>
              <p style={{ marginTop: '1rem' }}>
                Showing coverage for{' '}
                <strong>
                  {selectedRepo?.owner}/{selectedRepo?.name}
                </strong>{' '}
                — files below {coverage.thresholdPct}% are highlighted.
              </p>
              <CoverageTable
                files={coverage.files}
                thresholdPct={coverage.thresholdPct}
              />
              <div style={{ marginTop: '1rem' }}>
                <button
                  onClick={() =>
                    setJob({
                      id: `job-${Date.now()}`,
                      repositoryId: selectedRepoId,
                      targetFilePath:
                        coverage.files.find((f) => f.isBelowThreshold)
                          ?.filePath ?? 'src/utils.ts',
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
            <p style={{ marginTop: '1rem', color: '#666' }}>
              No coverage data available for this repository yet.
            </p>
          )}
        </>
      )}
    </main>
  );
}
