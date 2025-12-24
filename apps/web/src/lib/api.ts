/**
 * API utilities for calling the backend service directly
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface ApiError {
  message: string;
  statusCode?: number;
}

export interface User {
  id: string;
  login: string;
  installationId?: string;
}

export interface StartAuthResponse {
  redirectUrl: string;
}

export interface AuthCallbackResponse {
  status: string;
  user: User;
}

/**
 * Makes a request to the backend API
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: 'include', // Important: send cookies for session
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error: ApiError = {
      message: `API request failed: ${response.statusText}`,
      statusCode: response.status,
    };
    throw error;
  }

  return response.json();
}

/**
 * Start GitHub OAuth flow
 */
export async function startGithubAuth(): Promise<StartAuthResponse> {
  return apiRequest<StartAuthResponse>('/auth/github/start', {
    method: 'POST',
  });
}

/**
 * Complete GitHub OAuth flow
 */
export async function completeGithubAuth(
  code: string,
  state: string
): Promise<AuthCallbackResponse> {
  return apiRequest<AuthCallbackResponse>(
    `/auth/github/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`
  );
}

/**
 * Get current user session (if any)
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    // TODO: Implement a /auth/me endpoint on backend
    // For now, return null and rely on session
    return null;
  } catch (error) {
    return null;
  }
}

// Repository types
export interface Repository {
  id: string;
  owner: string;
  name: string;
  defaultBranch: string;
}

export interface RepositoriesResponse {
  repos: Repository[];
}

// Coverage types
export interface CoverageFile {
  filePath: string;
  coveragePct: number;
  isBelowThreshold: boolean;
}

export interface CoverageResponse {
  repoId: string;
  ref: string;
  coverageSourcePath: string;
  thresholdPct: number;
  files: CoverageFile[];
}

/**
 * List repositories from installation
 */
export async function listRepositories(): Promise<Repository[]> {
  const response = await apiRequest<RepositoriesResponse>('/repos');
  return response.repos;
}

/**
 * Get coverage data for a repository
 */
export async function getRepositoryCoverage(
  repoId: string
): Promise<CoverageResponse> {
  return apiRequest<CoverageResponse>(`/repos/${repoId}/coverage`);
}

