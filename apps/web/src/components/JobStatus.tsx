type Job = {
  id: string;
  repositoryId: string;
  status: 'queued' | 'cloning' | 'cloned' | 'analyzing' | 'analyzed' | 'processing' | 'succeeded' | 'failed' | 'partial_success';
  requestedByUserId: string;
  createdAt: string;
  startedAt?: string;
  clonedAt?: string;
  clonePath?: string;
  analyzedAt?: string;
  targetFilesCount?: number;
  processingStartedAt?: string;
  filesProcessed?: number;
  filesSucceeded?: number;
  filesFailed?: number;
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
  cloning: '#0066cc',
  cloned: '#17a2b8',
  analyzing: '#0066cc',
  analyzed: '#17a2b8',
  processing: '#0066cc',
  succeeded: '#28a745',
  partial_success: '#ffc107',
  failed: '#dc3545',
};

const STATUS_ICONS: Record<Job['status'], string> = {
  queued: '⏳',
  cloning: '🔄',
  cloned: '✅',
  analyzing: '🔍',
  analyzed: '📋',
  processing: '🤖',
  succeeded: '✅',
  partial_success: '⚠️',
  failed: '❌',
};

const STATUS_LABELS: Record<Job['status'], string> = {
  queued: 'Queued',
  cloning: 'Cloning Repository',
  cloned: 'Repository Cloned',
  analyzing: 'Analyzing Coverage',
  analyzed: 'Files Identified',
  processing: 'Generating Tests',
  succeeded: 'All Tests Generated',
  partial_success: 'Partially Completed',
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
        {onRefresh && !['succeeded', 'failed', 'partial_success'].includes(job.status) && (
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
          <strong>Repository:</strong> {job.repositoryId}
        </div>
        {job.clonePath && (
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Clone Path:</strong>{' '}
            <code style={{ backgroundColor: '#eee', padding: '0.2rem 0.4rem', borderRadius: '3px', fontSize: '0.85em' }}>
              {job.clonePath}
            </code>
          </div>
        )}
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
        {job.clonedAt && (
          <div style={{ marginBottom: '0.3rem' }}>
            <strong>Cloned:</strong> {formatDate(job.clonedAt)}
          </div>
        )}
        {job.analyzedAt && (
          <div style={{ marginBottom: '0.3rem' }}>
            <strong>Analyzed:</strong> {formatDate(job.analyzedAt)}
          </div>
        )}
        {job.processingStartedAt && (
          <div style={{ marginBottom: '0.3rem' }}>
            <strong>Processing Started:</strong> {formatDate(job.processingStartedAt)}
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

      {/* Success: Tests Generated */}
      {job.status === 'succeeded' && (
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
            ✅ All Tests Generated Successfully!
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            Generated {job.filesSucceeded} test file{job.filesSucceeded !== 1 ? 's' : ''} for files below coverage threshold.
          </div>
          <div style={{ fontSize: '0.85em', color: '#666' }}>
            Test files have been saved in the cloned repository: <code style={{ backgroundColor: '#c3e6cb', padding: '0.2rem 0.4rem', borderRadius: '3px' }}>{job.clonePath}</code>
          </div>
        </div>
      )}

      {/* Partial Success */}
      {job.status === 'partial_success' && (
        <div
          style={{
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeeba',
            borderRadius: '6px',
          }}
        >
          <div style={{ marginBottom: '0.5rem', fontWeight: 'bold', color: '#856404' }}>
            ⚠️ Partially Completed
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            Generated {job.filesSucceeded} of {job.targetFilesCount} test files successfully.
          </div>
          {job.filesFailed && job.filesFailed > 0 && (
            <div style={{ marginBottom: '0.5rem', color: '#856404' }}>
              {job.filesFailed} file{job.filesFailed !== 1 ? 's' : ''} failed to generate.
            </div>
          )}
          <div style={{ fontSize: '0.85em', color: '#666' }}>
            Successful test files saved in: <code style={{ backgroundColor: '#ffeeba', padding: '0.2rem 0.4rem', borderRadius: '3px' }}>{job.clonePath}</code>
          </div>
        </div>
      )}

      {/* Cloning: Progress */}
      {job.status === 'cloning' && (
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
            🔄 Cloning Repository...
          </div>
          <div style={{ fontSize: '0.9em' }}>
            Downloading repository files to prepare for test generation.
          </div>
        </div>
      )}

      {/* Cloned: Ready */}
      {job.status === 'cloned' && (
        <div
          style={{
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: '#d1ecf1',
            border: '1px solid #bee5eb',
            borderRadius: '6px',
          }}
        >
          <div style={{ fontWeight: 'bold', color: '#0c5460', marginBottom: '0.5rem' }}>
            ✅ Repository Cloned
          </div>
          <div style={{ fontSize: '0.9em' }}>
            Repository successfully cloned. Ready for coverage analysis.
          </div>
        </div>
      )}

      {/* Analyzing */}
      {job.status === 'analyzing' && (
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
            🔍 Analyzing Coverage...
          </div>
          <div style={{ fontSize: '0.9em' }}>
            Identifying files below coverage threshold.
          </div>
        </div>
      )}

      {/* Analyzed */}
      {job.status === 'analyzed' && (
        <div
          style={{
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: '#d1ecf1',
            border: '1px solid #bee5eb',
            borderRadius: '6px',
          }}
        >
          <div style={{ fontWeight: 'bold', color: '#0c5460', marginBottom: '0.5rem' }}>
            📋 Files Identified
          </div>
          <div style={{ fontSize: '0.9em' }}>
            Found {job.targetFilesCount} file{job.targetFilesCount !== 1 ? 's' : ''} below coverage threshold. Ready to generate tests.
          </div>
        </div>
      )}

      {/* Processing */}
      {job.status === 'processing' && (
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
            🤖 Generating Tests...
          </div>
          <div style={{ fontSize: '0.9em', marginBottom: '0.5rem' }}>
            Processing {job.filesProcessed || 0} of {job.targetFilesCount} files
          </div>
          {/* Progress Bar */}
          <div style={{ 
            width: '100%', 
            backgroundColor: '#e9ecef', 
            borderRadius: '4px', 
            height: '20px',
            marginBottom: '0.5rem',
            overflow: 'hidden'
          }}>
            <div style={{ 
              width: `${((job.filesProcessed || 0) / (job.targetFilesCount || 1)) * 100}%`,
              backgroundColor: '#0066cc',
              height: '100%',
              transition: 'width 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '0.75em',
              fontWeight: 'bold'
            }}>
              {Math.round(((job.filesProcessed || 0) / (job.targetFilesCount || 1)) * 100)}%
            </div>
          </div>
          <div style={{ fontSize: '0.85em', color: '#004085' }}>
            ✅ {job.filesSucceeded || 0} succeeded
            {job.filesFailed && job.filesFailed > 0 && (
              <> • ❌ {job.filesFailed} failed</>
            )}
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

