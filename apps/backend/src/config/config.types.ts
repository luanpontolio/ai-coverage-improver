/**
 * Configuration Types
 * 
 * Centralized configuration interfaces for type-safe access to environment variables.
 * All configuration should be accessed through AppConfigService, never directly via process.env.
 */

export interface GitHubConfig {
  /** GitHub App ID */
  appId: string;
  /** GitHub OAuth Client ID */
  clientId: string;
  /** GitHub OAuth Client Secret */
  clientSecret: string;
  /** GitHub Personal Access Token (for API access) */
  token: string;
}

export interface DatabaseConfig {
  /** Database connection URL */
  url: string;
}

export interface SessionConfig {
  /** Secret key for session encryption */
  secret: string;
}

export interface CoverageConfig {
  /** Path to coverage file in repository (e.g., 'coverage/lcov.info') */
  sourcePath: string;
  /** Coverage threshold percentage (0-100) */
  thresholdPct: number;
}

export interface LLMConfig {
  /** LLM API base URL (OpenAI-compatible endpoint) */
  apiBase: string;
  /** LLM API key */
  apiKey: string;
  /** LLM model name */
  model: string;
  /** Maximum tokens for completion */
  maxTokens: number;
  /** Temperature for generation (0-1) */
  temperature: number;
}

export interface ServerConfig {
  /** Web application URL (for CORS and OAuth callbacks) */
  webAppUrl: string;
  /** Backend API port */
  port: number;
  /** Node environment (development, production, test) */
  nodeEnv: string;
}

/**
 * Complete application configuration
 */
export interface AppConfig {
  github: GitHubConfig;
  database: DatabaseConfig;
  session: SessionConfig;
  coverage: CoverageConfig;
  llm: LLMConfig;
  server: ServerConfig;
}
