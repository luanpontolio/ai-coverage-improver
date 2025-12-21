type Job = {
  id: string;
  repositoryId: string;
  targetFilePath: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  requestedByUserId: string;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  pullRequestUrl?: string;
  pullRequestNumber?: number;
  failureCode?: string;
  failureMessage?: string;
};

type Props = {
  job?: Job;
  onRefresh?: () => void;
};

const STATUS_COLORS: Record<Job['status'], string> = {
  queued: '#888',
  running: '#0066cc',
  succeeded: '#28a745',
  failed: '#dc3545',
};

const STATUS_ICONS: Record<Job['status'], string> = {
  queued: '⏳',
  running: '🔄',
  succeeded: '✅',
  failed: '❌',
};

const STATUS_LABELS: Record<Job['status'], string> = {
  queued: 'Queued',
  running: 'Running',
  succeeded: 'Succeeded',
  failed: 'Failed',
};

/**
 * JobStatus component displays the status of an improvement job
 * Shows job details, progress, PR link, and error messages
 */
export function JobStatus({ job, onRefresh }: Props) {
  if (!job) {
    return (
      <div style={{ padding: '1rem', color: '#666' }}>
        <p>No improvement job has been requested for this file yet.</p>
        <p style={{ fontSize: '0.9em', marginTop: '0.5rem' }}>
          Click "Request Improvement" to generate test coverage for low-coverage files.
        </p>
      </div>
    );
  }

  const statusColor = STATUS_COLORS[job.status];
  const statusIcon = STATUS_ICONS[job.status];
  const statusLabel = STATUS_LABELS[job.status];

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const getDuration = () => {
    if (!job.startedAt) return null;
    const start = new Date(job.startedAt).getTime();
    const end = job.finishedAt ? new Date(job.finishedAt).getTime() : Date.now();
    const durationMs = end - start;
    const seconds = Math.floor(durationMs / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  return (
    <div
      style={{
        border: '1px solid #ddd',
        padding: '1.5rem',
        borderRadius: '8px',
        marginTop: '1rem',
        backgroundColor: '#f9f9f9',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.2em' }}>
          {statusIcon} Improvement Job
        </h3>
        {onRefresh && (job.status === 'queued' || job.status === 'running') && (
          <button
            onClick={onRefresh}
            style={{
              padding: '0.4rem 0.8rem',
              fontSize: '0.9em',
              cursor: 'pointer',
              border: '1px solid #0066cc',
              borderRadius: '4px',
              backgroundColor: 'white',
            }}
          >
            🔄 Refresh
          </button>
        )}
      </div>

      {/* Status Badge */}
      <div style={{ marginBottom: '1rem' }}>
        <span
          style={{
            display: 'inline-block',
            padding: '0.3rem 0.8rem',
            borderRadius: '12px',
            backgroundColor: statusColor,
            color: 'white',
            fontSize: '0.9em',
            fontWeight: 'bold',
          }}
        >
          {statusLabel}
        </span>
      </div>

      {/* Job Details */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ marginBottom: '0.5rem' }}>
          <strong>File:</strong>{' '}
          <code style={{ backgroundColor: '#eee', padding: '0.2rem 0.4rem', borderRadius: '3px' }}>
            {job.targetFilePath}
          </code>
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <strong>Repository:</strong> {job.repositoryId}
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <strong>Job ID:</strong>{' '}
          <code style={{ fontSize: '0.85em', color: '#666' }}>{job.id}</code>
        </div>
      </div>

      {/* Timeline */}
      <div style={{ marginBottom: '1rem', fontSize: '0.9em' }}>
        <div style={{ marginBottom: '0.3rem' }}>
          <strong>Created:</strong> {formatDate(job.createdAt)}
        </div>
        {job.startedAt && (
          <div style={{ marginBottom: '0.3rem' }}>
            <strong>Started:</strong> {formatDate(job.startedAt)}
          </div>
        )}
        {job.finishedAt && (
          <div style={{ marginBottom: '0.3rem' }}>
            <strong>Finished:</strong> {formatDate(job.finishedAt)}
          </div>
        )}
        {getDuration() && (
          <div style={{ marginBottom: '0.3rem' }}>
            <strong>Duration:</strong> {getDuration()}
          </div>
        )}
      </div>

      {/* Success: PR Link */}
      {job.status === 'succeeded' && job.pullRequestUrl && (
        <div
          style={{
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: '#d4edda',
            border: '1px solid #c3e6cb',
            borderRadius: '6px',
          }}
        >
          <div style={{ marginBottom: '0.5rem', fontWeight: 'bold', color: '#155724' }}>
            ✅ Tests Generated Successfully!
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            A pull request has been created with test coverage improvements.
          </div>
          <a
            href={job.pullRequestUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '0.5rem 1rem',
              backgroundColor: '#28a745',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
              fontWeight: 'bold',
            }}
          >
            View Pull Request #{job.pullRequestNumber}
          </a>
          <div style={{ marginTop: '0.5rem', fontSize: '0.85em', color: '#666' }}>
            Review the generated tests and merge when satisfied.
          </div>
        </div>
      )}

      {/* Running: Progress */}
      {job.status === 'running' && (
        <div
          style={{
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: '#cce5ff',
            border: '1px solid #b8daff',
            borderRadius: '6px',
          }}
        >
          <div style={{ fontWeight: 'bold', color: '#004085', marginBottom: '0.5rem' }}>
            🔄 Processing...
          </div>
          <div style={{ fontSize: '0.9em' }}>
            Analyzing file, generating tests, and creating pull request.
            This may take a few minutes.
          </div>
        </div>
      )}

      {/* Queued: Waiting */}
      {job.status === 'queued' && (
        <div
          style={{
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeeba',
            borderRadius: '6px',
          }}
        >
          <div style={{ fontWeight: 'bold', color: '#856404', marginBottom: '0.5rem' }}>
            ⏳ Queued
          </div>
          <div style={{ fontSize: '0.9em' }}>
            Your job is in the queue and will start processing soon.
          </div>
        </div>
      )}

      {/* Failed: Error Details */}
      {job.status === 'failed' && (
        <div
          style={{
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '6px',
          }}
        >
          <div style={{ fontWeight: 'bold', color: '#721c24', marginBottom: '0.5rem' }}>
            ❌ Job Failed
          </div>
          {job.failureCode && (
            <div style={{ marginBottom: '0.5rem', fontSize: '0.9em' }}>
              <strong>Error Code:</strong>{' '}
              <code style={{ backgroundColor: '#f5c6cb', padding: '0.2rem 0.4rem', borderRadius: '3px' }}>
                {job.failureCode}
              </code>
            </div>
          )}
          {job.failureMessage && (
            <div style={{ fontSize: '0.9em', color: '#721c24' }}>
              <strong>Details:</strong> {job.failureMessage}
            </div>
          )}
          <div style={{ marginTop: '0.5rem', fontSize: '0.85em', color: '#666' }}>
            You can try requesting a new improvement job after addressing the issue.
          </div>
        </div>
      )}
    </div>
  );
}

