declare module 'bullmq';
declare module 'supertest';

// Express session extensions
declare module 'express-session' {
  interface SessionData {
    user?: {
      id: string;
      login: string;
      installationId?: string;
    };
    accessToken?: string;
    oauthState?: string;
    returnTo?: string;
  }
}

declare module '@prisma/client' {
  export interface PrismaClientOptions {
    datasources?: {
      db?: {
        url?: string;
      };
    };
  }

  export interface Delegate<T> {
    findMany(args?: any): Promise<T[]>;
    findUnique(args: any): Promise<T | null>;
    findFirst(args?: any): Promise<T | null>;
    create(args: any): Promise<T>;
    update(args: any): Promise<T>;
    delete(args: any): Promise<T>;
    deleteMany(args?: any): Promise<{ count: number }>;
    upsert(args: any): Promise<T>;
    count(args?: any): Promise<number>;
  }

  export class PrismaClient {
    constructor(options?: PrismaClientOptions);
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
    improvementJob: Delegate<any>;
    coverageSnapshot: Delegate<any>;
    coverageFileMetric: Delegate<any>;
    githubInstallation: Delegate<any>;
    repository: Delegate<any>;
    aIExecution: Delegate<any>;
  }
}

