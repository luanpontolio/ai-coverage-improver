type Job = {
  id: string;
  targetFilePath: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  pullRequestUrl?: string;
  failureMessage?: string;
};

type Props = {
  job?: Job;
};

export function JobStatus({ job }: Props) {
  if (!job) return <p>No job requested yet.</p>;

  return (
    <div style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '6px', marginTop: '1rem' }}>
      <div>
        <strong>File:</strong> {job.targetFilePath}
      </div>
      <div>
        <strong>Status:</strong> {job.status}
      </div>
      {job.pullRequestUrl && (
        <div>
          <strong>PR:</strong> <a href={job.pullRequestUrl}>{job.pullRequestUrl}</a>
        </div>
      )}
      {job.status === 'failed' && job.failureMessage && (
        <div style={{ color: '#c00' }}>
          <strong>Error:</strong> {job.failureMessage}
        </div>
      )}
    </div>
  );
}

