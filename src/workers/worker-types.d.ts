// Lightweight type hints for the Worker runtime in TypeScript.
declare module 'agents' {
  export class Agent { protected env: any; protected state: any; protected name: string; setState(s: any): void; getState(): any; schedule(...args: any[]): void; }
  export function unstable_callable(): any;
}
