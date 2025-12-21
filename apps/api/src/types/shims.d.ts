declare module '@nestjs/common' {
  export interface INestApplication {
    init(): Promise<this>;
    getHttpServer(): any;
    close(): Promise<void>;
  }
  export type ExecutionContext = any;
  export interface CanActivate {
    canActivate(context: ExecutionContext): boolean | Promise<boolean>;
  }
  export function Module(metadata: any): ClassDecorator;
  export function Controller(path?: string): ClassDecorator;
  export function Get(path?: string): MethodDecorator;
  export function Post(path?: string): MethodDecorator;
  export function Param(param?: string): ParameterDecorator;
  export function Query(param?: string): ParameterDecorator;
  export function Res(): ParameterDecorator;
  export function Injectable(): ClassDecorator;
  export class NotFoundException extends Error {
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
  export const Test: {
    createTestingModule(options: any): {
      compile(): Promise<TestingModule>;
    };
  };
}

declare module 'bullmq';
declare module 'supertest';

