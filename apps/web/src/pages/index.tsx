import { useMemo, useEffect, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { CoverageTable } from '../components/CoverageTable';
import { JobStatus } from '../components/JobStatus';
import {
  listRepositories,
  getRepositoryCoverage,
  requestImprovement,
  getJobStatus,
  type Repository,
  type CoverageResponse,
  type ImprovementJob,
} from '../lib/api';

export default function Home() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading, logout } = useAuth();

  const [repos, setRepos] = useState<Repository[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [reposError, setReposError] = useState<string | null>(null);

  const [selectedRepoId, setSelectedRepoId] = useState<string>('');
  const [coverage, setCoverage] = useState<CoverageResponse | null>(null);
  const [isLoadingCoverage, setIsLoadingCoverage] = useState(false);
  const [coverageError, setCoverageError] = useState<string | null>(null);

  const [job, setJob] = useState<ImprovementJob | undefined>(undefined);
  const [isRequestingJob, setIsRequestingJob] = useState(false);
  const [jobError, setJobError] = useState<string | null>(null);

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
      setJob(undefined); // Clear job when changing repos
      setJobError(null);
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

  // Polling para atualizar status do job
  useEffect(() => {
    if (!job || !selectedRepoId) return;
    
    // Não fazer polling se o job já terminou
    if (job.status === 'succeeded' || job.status === 'failed') {
      return;
    }

    // Fazer polling a cada 2 segundos
    const intervalId = setInterval(async () => {
      try {
        const updatedJob = await getJobStatus(selectedRepoId, job.id);
        setJob(updatedJob);
        
        // Parar polling se o job terminou
        if (updatedJob.status === 'succeeded' || updatedJob.status === 'failed') {
          clearInterval(intervalId);
        }
      } catch (error) {
        console.error('Failed to fetch job status:', error);
        // Não atualizar o estado de erro para não incomodar o usuário
      }
    }, 2000); // Poll a cada 2 segundos

    return () => clearInterval(intervalId);
  }, [job, selectedRepoId]);

  // Função para refresh manual
  const handleRefreshJobStatus = async () => {
    if (!job || !selectedRepoId) return;
    
    try {
      const updatedJob = await getJobStatus(selectedRepoId, job.id);
      setJob(updatedJob);
    } catch (error) {
      console.error('Failed to refresh job status:', error);
    }
  };

  // Handle request improvement
  const handleRequestImprovement = async () => {
    if (!user || !selectedRepoId || !coverage) return;

    // Check if there are files below threshold
    if (!coverage.files.some(f => f.isBelowThreshold)) {
      setJobError('No files below threshold found');
      return;
    }

    setIsRequestingJob(true);
    setJobError(null);

    try {
      const response = await requestImprovement(selectedRepoId);
      
      setJob(response.job);
      
      if (response.reused) {
        console.log('Reusing existing job:', response.job.id);
      } else {
        console.log('Created new job:', response.job.id);
      }
    } catch (error: any) {
      setJobError(error.message || 'Failed to request improvement');
      console.error('Failed to request improvement:', error);
    } finally {
      setIsRequestingJob(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

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
          onClick={handleLogout}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.9rem',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e: any) => {
            e.currentTarget.style.backgroundColor = '#c82333';
          }}
          onMouseLeave={(e: any) => {
            e.currentTarget.style.backgroundColor = '#dc3545';
          }}
        >
          Logout
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
                  onClick={handleRequestImprovement}
                  disabled={isRequestingJob || !coverage.files.some(f => f.isBelowThreshold)}
                  style={{
                    padding: '0.6rem 1.2rem',
                    fontSize: '1rem',
                    backgroundColor: isRequestingJob ? '#ccc' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: isRequestingJob ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  {isRequestingJob ? 'Requesting...' : 'Request Improvement'}
                </button>
                {!coverage.files.some(f => f.isBelowThreshold) && (
                  <p style={{ color: '#666', fontSize: '0.9em', marginTop: '0.5rem' }}>
                    All files meet the coverage threshold!
                  </p>
                )}
                {jobError && (
                  <div
                    style={{
                      marginTop: '0.5rem',
                      padding: '0.5rem',
                      backgroundColor: '#fee',
                      border: '1px solid #fcc',
                      borderRadius: '4px',
                      color: '#c33',
                    }}
                  >
                    Error: {jobError}
                  </div>
                )}
              </div>
              <JobStatus job={job} onRefresh={handleRefreshJobStatus} />
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
