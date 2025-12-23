import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { completeGithubAuth } from '../lib/api';

export default function CallbackPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const { code, state } = router.query;

      if (!code || !state) {
        // Wait for query params to be available
        return;
      }

      try {
        const response = await completeGithubAuth(
          code as string,
          state as string
        );

        // Update auth context with user
        setUser(response.user);

        // Redirect to home page
        router.push('/');
      } catch (err: any) {
        setError(err.message || 'Authentication failed');
      }
    };

    if (router.isReady) {
      handleCallback();
    }
  }, [router, router.isReady, router.query, setUser]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      {error ? (
        <div>
          <h1 style={{ color: '#c33', marginBottom: '1rem' }}>
            Authentication Failed
          </h1>
          <p style={{ marginBottom: '2rem' }}>{error}</p>
          <button
            onClick={() => router.push('/auth')}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              color: '#fff',
              backgroundColor: '#24292e',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        </div>
      ) : (
        <div>
          <h1 style={{ marginBottom: '1rem' }}>Completing authentication...</h1>
          <p style={{ color: '#666' }}>Please wait while we sign you in.</p>
        </div>
      )}
    </div>
  );
}

