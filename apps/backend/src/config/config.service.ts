import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AppConfig,
  GitHubConfig,
  DatabaseConfig,
  SessionConfig,
  CoverageConfig,
  LLMConfig,
  ServerConfig
} from './config.types';

/**
 * Application Configuration Service
 *
 * Provides type-safe access to configuration values.
 * Wraps NestJS ConfigService with domain-specific interfaces.
 *
 * Usage:
 * ```typescript
 * constructor(private readonly config: AppConfigService) {}
 *
 * const apiKey = this.config.github.clientId;
 * ```
 */
@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Get complete application configuration
   */
  get all(): AppConfig {
    return {
      github: this.github,
      database: this.database,
      session: this.session,
      coverage: this.coverage,
      llm: this.llm,
      server: this.server,
    };
  }

  /**
   * GitHub configuration
   */
  get github(): GitHubConfig {
    return {
      appId: this.getOrThrow('GITHUB_APP_ID'),
      clientId: this.getOrThrow('GITHUB_CLIENT_ID'),
      clientSecret: this.getOrThrow('GITHUB_CLIENT_SECRET'),
      token: this.getOrThrow('GITHUB_TOKEN'),
    };
  }

  /**
   * Database configuration
   */
  get database(): DatabaseConfig {
    return {
      url: this.getOrThrow('DATABASE_URL'),
    };
  }

  /**
   * Session configuration
   */
  get session(): SessionConfig {
    return {
      secret: this.getOrThrow('SESSION_SECRET'),
    };
  }

  /**
   * Coverage configuration
   */
  get coverage(): CoverageConfig {
    return {
      sourcePath: this.get('COVERAGE_SOURCE_PATH', 'coverage/lcov.info'),
      thresholdPct: parseFloat(this.get('COVERAGE_THRESHOLD_PCT', '80')),
    };
  }

  /**
   * LLM configuration
   */
  get llm(): LLMConfig {
    return {
      apiBase: this.get('LLM_API_BASE', 'https://api.groq.com/openai/v1'),
      apiKey: this.getOrThrow('LLM_API_KEY'),
      model: this.get('LLM_MODEL', 'llama-3.3-70b-versatile'),
      maxTokens: parseInt(this.get('LLM_MAX_TOKENS', '4000')),
      temperature: parseFloat(this.get('LLM_TEMPERATURE', '0.2')),
    };
  }

  /**
   * Server configuration
   */
  get server(): ServerConfig {
    return {
      webAppUrl: this.get('WEB_APP_URL', 'http://localhost:3001'),
      port: parseInt(this.get('PORT', '3000')),
      nodeEnv: this.get('NODE_ENV', 'development'),
    };
  }

  /**
   * Check if running in production
   */
  get isProduction(): boolean {
    return this.server.nodeEnv === 'production';
  }

  /**
   * Check if running in development
   */
  get isDevelopment(): boolean {
    return this.server.nodeEnv === 'development';
  }

  /**
   * Check if running in test
   */
  get isTest(): boolean {
    return this.server.nodeEnv === 'test';
  }

  /**
   * Get configuration value with default
   */
  private get(key: string, defaultValue: string): string {
    return this.configService.get<string>(key, defaultValue);
  }

  /**
   * Get configuration value or throw if missing
   */
  private getOrThrow(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) {
      throw new Error(
        `Missing required environment variable: ${key}\n` +
        `Please check your .env file or environment configuration.`
      );
    }
    return value;
  }

  /**
   * Validate configuration at startup
   */
  validate(): void {
    try {
      // Trigger validation by accessing all required configs
      this.github;
      this.database;
      this.session;
      this.llm;
      console.log('✅ Configuration validated successfully');
    } catch (error) {
      console.error('❌ Configuration validation failed:', error);
      throw error;
    }
  }
}
