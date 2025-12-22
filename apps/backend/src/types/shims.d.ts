declare module '@nestjs/common' {
  export interface INestApplication {
    init(): Promise<this>;
    getHttpServer(): any;
    close(): Promise<void>;
    use(...args: any[]): this;
  }
  export type ExecutionContext = any;
  export interface CanActivate {
    canActivate(context: ExecutionContext): boolean | Promise<boolean>;
  }
  export interface OnModuleInit {
    onModuleInit(): Promise<void> | void;
  }
  export interface OnModuleDestroy {
    onModuleDestroy(): Promise<void> | void;
  }
  export function Module(metadata: any): ClassDecorator;
  export function Controller(path?: string): ClassDecorator;
  export function Get(path?: string): MethodDecorator;
  export function Post(path?: string): MethodDecorator;
  export function Param(param?: string): ParameterDecorator;
  export function Query(param?: string): ParameterDecorator;
  export function Body(): ParameterDecorator;
  export function Res(): ParameterDecorator;
  export function Req(): ParameterDecorator;
  export function Injectable(): ClassDecorator;
  export class NotFoundException extends Error {
    constructor(message?: string);
  }
  export class BadRequestException extends Error {
    constructor(message?: string);
  }
  export class UnauthorizedException extends Error {
    constructor(message?: string);
  }
  export class Logger {
    static log(message?: any, ...optionalParams: any[]): void;
  }
}

declare module '@nestjs/core' {
  export const NestFactory: any;
}

declare module '@nestjs/testing' {
  import { INestApplication } from '@nestjs/common';
  export interface TestingModule {
    createNestApplication(): INestApplication;
  }
  export interface TestingModuleBuilder {
    overrideProvider(token: any): {
      useValue(value: any): TestingModuleBuilder;
      useFactory(factory: (...args: any[]) => any): TestingModuleBuilder;
      useClass(metatype: any): TestingModuleBuilder;
    };
    overrideModule(module: any): {
      useModule(module: any): TestingModuleBuilder;
    };
    overrideGuard(guard: any): {
      useValue(value: any): TestingModuleBuilder;
      useClass(metatype: any): TestingModuleBuilder;
    };
    overrideInterceptor(interceptor: any): {
      useValue(value: any): TestingModuleBuilder;
      useClass(metatype: any): TestingModuleBuilder;
    };
    compile(): Promise<TestingModule>;
  }
  export const Test: {
    createTestingModule(options: any): TestingModuleBuilder;
  };
}

declare module 'bullmq';
declare module 'supertest';

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

