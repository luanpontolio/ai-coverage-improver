declare module 'react' {
  export type ChangeEvent<T = any> = { target: any };
  export function useState<T = any>(initial: T): [T, (value: T) => void];
  export function useMemo<T>(factory: () => T, deps: any[]): T;
}

declare module 'react/jsx-runtime' {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

